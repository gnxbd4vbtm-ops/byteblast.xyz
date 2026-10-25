import asyncio
import json
import logging
import shutil
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.config import Settings
from app.models import JobRequest, JobStage, JobView, OutputKind
from app.services.ffmpeg import Action, StreamInfo, build_ffmpeg_command, decide_processing
from app.services.security import sanitize_filename
from app.services.ytdlp import MediaError, download

logger = logging.getLogger(__name__)


@dataclass
class Job:
    id: str
    request: JobRequest
    directory: Path
    created_at: float = field(default_factory=time.time)
    stage: JobStage = JobStage.QUEUED
    detail: str = "Waiting for capacity"
    progress: dict[str, Any] = field(default_factory=dict)
    file: Path | None = None
    filename: str | None = None
    task: asyncio.Task[None] | None = None
    version: int = 0
    condition: asyncio.Condition = field(default_factory=asyncio.Condition)


class CapacityError(RuntimeError):
    pass


class JobManager:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.jobs: dict[str, Job] = {}
        self.download_slots = asyncio.Semaphore(settings.max_concurrent_downloads)
        self.transcode_slots = asyncio.Semaphore(settings.max_concurrent_transcodes)
        self._active = 0
        self._lock = asyncio.Lock()
        self._cleanup_task: asyncio.Task[None] | None = None

    async def start(self) -> None:
        self.settings.temp_root.mkdir(mode=0o700, parents=True, exist_ok=True)
        self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def stop(self) -> None:
        if self._cleanup_task:
            self._cleanup_task.cancel()
        tasks = [j.task for j in self.jobs.values() if j.task and not j.task.done()]
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        for job_id in list(self.jobs):
            await self.cleanup(job_id)

    async def create(self, request: JobRequest) -> Job:
        async with self._lock:
            if self._active >= self.settings.max_concurrent_downloads:
                raise CapacityError("Download capacity is currently full; please try again shortly")
            self._active += 1
        job_id = uuid.uuid4().hex
        directory = self.settings.temp_root / job_id
        directory.mkdir(mode=0o700, parents=False)
        job = Job(job_id, request, directory)
        self.jobs[job_id] = job
        job.task = asyncio.create_task(self._run(job))
        logger.info("job created", extra={"job_id": job_id})
        return job

    async def update(
        self, job: Job, *, stage: JobStage | None = None, detail: str | None = None, **progress: Any
    ) -> None:
        async with job.condition:
            if stage:
                job.stage = stage
            if detail:
                job.detail = detail
            job.progress.update(progress)
            job.version += 1
            job.condition.notify_all()

    async def _run(self, job: Job) -> None:
        try:
            async with self.download_slots:
                await self.update(
                    job, stage=JobStage.DOWNLOADING, detail="Downloading media", percent=0
                )
                source = await download(
                    str(job.request.url),
                    job.request.format_id,
                    job.directory,
                    self.settings,
                    lambda data: self.update(job, **data),
                    job.request.subtitle_language,
                    audio_only=job.request.output == OutputKind.AUDIO,
                )
            stream = await probe(source)
            plan = decide_processing(job.request.output, job.request.audio_format, stream)
            final = source
            if plan.action != Action.DIRECT:
                final = job.directory / f"result.{plan.extension}"
                stage = (
                    JobStage.TRANSCODING
                    if plan.action in {Action.VIDEO_TRANSCODE, Action.AUDIO_CONVERT}
                    else JobStage.MERGING
                )
                await self.update(
                    job,
                    stage=stage,
                    detail="Transcoding media"
                    if stage == JobStage.TRANSCODING
                    else "Remuxing streams",
                )
                async with self.transcode_slots:
                    command = build_ffmpeg_command(
                        source,
                        final,
                        plan,
                        vaapi=self.settings.enable_vaapi,
                        vaapi_device=self.settings.vaapi_device,
                        cpu_fallback=self.settings.enable_cpu_fallback,
                    )
                    process = await asyncio.create_subprocess_exec(
                        *command, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE
                    )
                    _, stderr = await process.communicate()
                    if process.returncode:
                        logger.warning("ffmpeg failed", extra={"job_id": job.id})
                        raise MediaError(
                            stderr.decode(errors="replace").splitlines()[-1][:300]
                            if stderr
                            else "Media processing failed"
                        )
            title = sanitize_filename(source.stem.removeprefix("source"), "download")
            job.file, job.filename = final, f"{title}.{final.suffix.lstrip('.')}"
            await self.update(job, stage=JobStage.READY, detail="Ready to download", percent=100)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.exception("job failed", extra={"job_id": job.id})
            await self.update(job, stage=JobStage.FAILED, detail=str(exc)[:300])
            shutil.rmtree(job.directory, ignore_errors=True)
        finally:
            async with self._lock:
                self._active = max(0, self._active - 1)

    def view(self, job: Job) -> JobView:
        return JobView(
            id=job.id,
            stage=job.stage,
            detail=job.detail,
            download_url=f"/api/jobs/{job.id}/download" if job.stage == JobStage.READY else None,
            **{
                k: job.progress.get(k)
                for k in ("percent", "downloaded_bytes", "total_bytes", "speed", "eta")
            },
        )

    async def cleanup(self, job_id: str) -> None:
        job = self.jobs.pop(job_id, None)
        if job:
            shutil.rmtree(job.directory, ignore_errors=True)
            logger.info("job cleaned", extra={"job_id": job_id})

    async def _cleanup_loop(self) -> None:
        while True:
            await asyncio.sleep(self.settings.cleanup_interval_seconds)
            cutoff = time.time() - self.settings.job_ttl_seconds
            for job_id, job in list(self.jobs.items()):
                if job.created_at < cutoff:
                    if job.task and not job.task.done():
                        job.task.cancel()
                    await self.cleanup(job_id)


async def probe(path: Path) -> StreamInfo:
    process = await asyncio.create_subprocess_exec(
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "stream=codec_type,codec_name:format=format_name",
        "-of",
        "json",
        str(path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, _ = await process.communicate()
    if process.returncode:
        raise MediaError("Could not inspect the downloaded media")
    raw = json.loads(stdout)
    streams = raw.get("streams", [])
    video = next((s.get("codec_name") for s in streams if s.get("codec_type") == "video"), None)
    audio = next((s.get("codec_name") for s in streams if s.get("codec_type") == "audio"), None)
    container = str(raw.get("format", {}).get("format_name", "")).split(",")[0]
    return StreamInfo(video, audio, container)
