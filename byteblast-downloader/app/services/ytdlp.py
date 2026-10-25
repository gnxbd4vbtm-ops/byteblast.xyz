import asyncio
import json
import logging
from collections.abc import Awaitable, Callable
from pathlib import Path
from typing import Any

from app.config import Settings
from app.models import FormatChoice, MediaInfo

logger = logging.getLogger(__name__)
ProgressCallback = Callable[[dict[str, Any]], Awaitable[None]]


class MediaError(RuntimeError):
    pass


def parse_progress_line(line: str) -> dict[str, float | int | None] | None:
    """Parse fields independently because yt-dlp may report some values as NA."""
    if not line.startswith("byteblast:"):
        return None
    values = line.removeprefix("byteblast:").split("|")
    if len(values) != 5:
        return None

    def number(value: str) -> float | None:
        cleaned = value.strip().removesuffix("%")
        if cleaned in {"", "NA", "None"}:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None

    percent, downloaded, total, speed, eta = (number(value) for value in values)
    return {
        "percent": percent,
        "downloaded_bytes": int(downloaded) if downloaded is not None else None,
        "total_bytes": int(total) if total is not None else None,
        "speed": speed,
        "eta": eta,
    }


def _base_args(settings: Settings) -> list[str]:
    args = ["yt-dlp", "--no-playlist", "--no-warnings", "--no-call-home"]
    if settings.ytdlp_cookies_file:
        args += ["--cookies", str(settings.ytdlp_cookies_file)]
    return args


async def _run_json(args: list[str]) -> dict[str, Any]:
    process = await asyncio.create_subprocess_exec(
        *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()
    if process.returncode:
        message = stderr.decode(errors="replace").strip().splitlines()
        raise MediaError(message[-1][:300] if message else "yt-dlp failed")
    try:
        return json.loads(stdout)
    except json.JSONDecodeError as exc:
        raise MediaError("The media service returned invalid metadata") from exc


def normalize_info(raw: dict[str, Any], submitted_url: str) -> MediaInfo:
    formats: list[FormatChoice] = []
    seen: set[str] = set()
    for item in raw.get("formats") or []:
        format_id = str(item.get("format_id") or "")
        if not format_id or format_id in seen or item.get("vcodec") in {None, "none"}:
            continue
        seen.add(format_id)
        height = item.get("height")
        label = (
            f"{height}p"
            if height
            else str(item.get("format_note") or item.get("resolution") or "Video")
        )
        if item.get("fps"):
            label += f" · {item['fps']:g} fps"
        formats.append(
            FormatChoice(
                id=format_id,
                label=label,
                height=height,
                width=item.get("width"),
                fps=item.get("fps"),
                video_codec=item.get("vcodec"),
                audio_codec=None if item.get("acodec") == "none" else item.get("acodec"),
                container=item.get("ext"),
                approximate_size=item.get("filesize") or item.get("filesize_approx"),
                has_audio=item.get("acodec") not in {None, "none"},
            )
        )
    formats.sort(key=lambda f: (f.height or 0, f.fps or 0), reverse=True)
    return MediaInfo(
        url=submitted_url,
        title=str(raw.get("title") or "Untitled media")[:500],
        uploader=(raw.get("uploader") or raw.get("channel")),
        duration=raw.get("duration"),
        thumbnail=raw.get("thumbnail"),
        subtitles=sorted((raw.get("subtitles") or {}).keys()),
        formats=formats,
    )


async def extract_info(url: str, settings: Settings) -> tuple[MediaInfo, dict[str, Any]]:
    raw = await _run_json(_base_args(settings) + ["--dump-single-json", "--skip-download", url])
    info = normalize_info(raw, url)
    if not info.formats:
        raise MediaError("No downloadable video formats were found")
    if info.duration and info.duration > settings.max_duration_seconds:
        raise MediaError("This media exceeds the configured duration limit")
    return info, raw


async def download(
    url: str,
    format_id: str,
    workdir: Path,
    settings: Settings,
    progress: ProgressCallback,
    subtitle_language: str | None = None,
    *,
    audio_only: bool = False,
) -> Path:
    _, raw = await extract_info(url, settings)
    available = {str(f.get("format_id")) for f in raw.get("formats") or []}
    if format_id not in available:
        raise MediaError("The selected format is no longer available")
    selected = next(f for f in raw["formats"] if str(f.get("format_id")) == format_id)
    selector = (
        "bestaudio/best"
        if audio_only
        else (
            format_id
            if selected.get("acodec") not in {None, "none"}
            else f"{format_id}+bestaudio/best"
        )
    )
    args = _base_args(settings) + [
        "--newline",
        "--no-colors",
        "--progress",
        "--progress-delta",
        "0.25",
        "--no-part",
        "--format",
        selector,
        "--output",
        str(workdir / "source.%(ext)s"),
        "--progress-template",
        "download:byteblast:%(progress._percent_str)s|%(progress.downloaded_bytes)s|%(progress.total_bytes_estimate)s|%(progress.speed)s|%(progress.eta)s",
    ]
    if subtitle_language:
        args += ["--write-subs", "--sub-langs", subtitle_language]
    args.append(url)
    process = await asyncio.create_subprocess_exec(
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        cwd=workdir,
        start_new_session=True,
    )
    assert process.stdout
    async for line_bytes in process.stdout:
        line = line_bytes.decode(errors="replace").strip()
        parsed = parse_progress_line(line)
        if parsed is not None:
            await progress(parsed)
    if await process.wait():
        raise MediaError("The download failed")
    candidates = [
        p for p in workdir.iterdir() if p.is_file() and not p.name.endswith((".vtt", ".srt"))
    ]
    if not candidates:
        raise MediaError("The download produced no media file")
    result = max(candidates, key=lambda p: p.stat().st_size)
    if result.stat().st_size > settings.max_file_size_bytes:
        raise MediaError("The downloaded file exceeds the configured size limit")
    return result
