import asyncio
import shutil

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from starlette.background import BackgroundTask

from app.config import Settings
from app.models import HealthResponse, InfoRequest, JobRequest, JobStage, JobView, MediaInfo
from app.services.jobs import CapacityError, JobManager
from app.services.security import RateLimiter, UnsafeUrl, client_ip, validate_public_url
from app.services.ytdlp import MediaError, extract_info

router = APIRouter(prefix="/api")
limiter = RateLimiter()


def services(request: Request) -> tuple[Settings, JobManager]:
    return request.app.state.settings, request.app.state.jobs


async def guard(request: Request, bucket: str) -> None:
    settings, _ = services(request)
    limits = {
        "info": settings.info_rate_limit,
        "jobs": settings.job_rate_limit,
        "list_jobs": settings.list_job_rate_limit,
    }
    limit = limits[bucket]
    await limiter.check(
        bucket,
        client_ip(request, settings.trusted_proxies),
        limit,
        settings.rate_limit_window_seconds,
    )


@router.post("/info", response_model=MediaInfo)
async def media_info(payload: InfoRequest, request: Request) -> MediaInfo:
    await guard(request, "info")
    try:
        await validate_public_url(str(payload.url))
        info, _ = await extract_info(str(payload.url), services(request)[0])
        return info
    except (UnsafeUrl, MediaError) as exc:
        raise HTTPException(400, str(exc)) from exc


@router.post("/jobs", response_model=JobView, status_code=202)
async def create_job(payload: JobRequest, request: Request) -> JobView:
    await guard(request, "jobs")
    try:
        await validate_public_url(str(payload.url))
        manager = services(request)[1]
        return manager.view(await manager.create(payload))
    except UnsafeUrl as exc:
        raise HTTPException(400, str(exc)) from exc
    except CapacityError as exc:
        raise HTTPException(503, str(exc), headers={"Retry-After": "10"}) from exc


@router.post("/list/jobs", response_model=JobView, status_code=202)
async def create_list_job(payload: JobRequest, request: Request) -> JobView:
    await guard(request, "list_jobs")
    try:
        await validate_public_url(str(payload.url))
        manager = services(request)[1]
        return manager.view(await manager.create(payload))
    except UnsafeUrl as exc:
        raise HTTPException(400, str(exc)) from exc
    except CapacityError as exc:
        raise HTTPException(503, str(exc), headers={"Retry-After": "10"}) from exc


@router.get("/jobs/{job_id}", response_model=JobView)
async def get_job(job_id: str, request: Request) -> JobView:
    manager = services(request)[1]
    job = manager.jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found or expired")
    return manager.view(job)


@router.get("/jobs/{job_id}/events")
async def job_events(job_id: str, request: Request) -> StreamingResponse:
    manager = services(request)[1]
    job = manager.jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found or expired")

    async def stream():
        version = -1
        while not await request.is_disconnected():
            if version != job.version:
                version = job.version
                yield f"data: {manager.view(job).model_dump_json()}\n\n"
                if job.stage in {JobStage.READY, JobStage.FAILED}:
                    return
            try:
                async with job.condition:
                    await asyncio.wait_for(
                        job.condition.wait_for(
                            lambda current_version=version: job.version != current_version
                        ),
                        timeout=15,
                    )
            except TimeoutError:
                yield ": keepalive\n\n"

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
    )


@router.get("/jobs/{job_id}/download")
async def get_download(job_id: str, request: Request) -> FileResponse:
    manager = services(request)[1]
    job = manager.jobs.get(job_id)
    if not job or job.stage != JobStage.READY or not job.file or not job.file.is_file():
        raise HTTPException(404, "Download not found, not ready, or expired")
    return FileResponse(
        job.file,
        filename=job.filename or "download",
        media_type="application/octet-stream",
        background=BackgroundTask(manager.cleanup, job_id),
    )


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    settings = services(request)[0]
    tools = {name: shutil.which(name) is not None for name in ("yt-dlp", "ffmpeg", "ffprobe")}
    return HealthResponse(
        status="ok" if all(tools.values()) else "degraded",
        tools=tools,
        vaapi_configured=settings.enable_vaapi,
        vaapi_available=settings.enable_vaapi and settings.vaapi_device.exists(),
    )
