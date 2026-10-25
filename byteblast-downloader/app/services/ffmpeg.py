from dataclasses import dataclass
from enum import StrEnum
from pathlib import Path

from app.models import AudioFormat, OutputKind


class Action(StrEnum):
    DIRECT = "direct"
    REMUX = "remux"
    AUDIO_CONVERT = "audio_convert"
    VIDEO_TRANSCODE = "video_transcode"


@dataclass(frozen=True)
class StreamInfo:
    video_codec: str | None
    audio_codec: str | None
    container: str | None


@dataclass(frozen=True)
class ProcessingPlan:
    action: Action
    extension: str
    copy_video: bool = True
    copy_audio: bool = True


MP4_VIDEO = {"h264", "avc1", "hevc", "h265", "mpeg4", "av1", "vp9"}
MP4_AUDIO = {"aac", "mp3", "alac", "ac3", "eac3"}
WEBM_VIDEO = {"vp8", "vp9", "av1"}
WEBM_AUDIO = {"opus", "vorbis"}


def decide_processing(output: OutputKind, audio: AudioFormat, stream: StreamInfo) -> ProcessingPlan:
    vc, ac = (stream.video_codec or "").lower(), (stream.audio_codec or "").lower()
    container = (stream.container or "").lower()
    if output == OutputKind.ORIGINAL:
        return ProcessingPlan(Action.DIRECT, container or "mkv")
    if output == OutputKind.AUDIO:
        if audio == AudioFormat.ORIGINAL:
            return ProcessingPlan(Action.DIRECT, container or "m4a")
        target = audio.value
        compatible = (target == "m4a" and ac in MP4_AUDIO) or (target == "opus" and ac == "opus")
        return ProcessingPlan(Action.REMUX if compatible else Action.AUDIO_CONVERT, target)
    if output in {OutputKind.MP4, OutputKind.H264_MP4}:
        h264_required = output == OutputKind.H264_MP4
        video_ok = vc in {"h264", "avc1"} if h264_required else vc in MP4_VIDEO
        if video_ok:
            return ProcessingPlan(Action.REMUX, "mp4", copy_audio=ac in MP4_AUDIO)
        return ProcessingPlan(
            Action.VIDEO_TRANSCODE, "mp4", copy_video=False, copy_audio=ac in MP4_AUDIO
        )
    if output == OutputKind.WEBM:
        if vc in WEBM_VIDEO:
            return ProcessingPlan(Action.REMUX, "webm", copy_audio=ac in WEBM_AUDIO)
        return ProcessingPlan(
            Action.VIDEO_TRANSCODE, "webm", copy_video=False, copy_audio=ac in WEBM_AUDIO
        )
    raise ValueError("Unsupported output")


def build_ffmpeg_command(
    source: Path,
    target: Path,
    plan: ProcessingPlan,
    *,
    vaapi: bool,
    vaapi_device: Path,
    cpu_fallback: bool = False,
) -> list[str]:
    cmd = ["ffmpeg", "-nostdin", "-hide_banner", "-y"]
    if plan.action == Action.VIDEO_TRANSCODE and plan.extension == "mp4":
        if not vaapi and not cpu_fallback:
            raise RuntimeError(
                "H.264 conversion requires configured VA-API; CPU fallback is disabled"
            )
        if vaapi:
            cmd += ["-vaapi_device", str(vaapi_device)]
    cmd += ["-i", str(source)]
    if plan.action == Action.REMUX:
        cmd += ["-c:v", "copy", "-c:a", "copy" if plan.copy_audio else "aac"]
    elif plan.action == Action.AUDIO_CONVERT:
        codecs = {"mp3": "libmp3lame", "m4a": "aac", "opus": "libopus", "wav": "pcm_s16le"}
        cmd += ["-vn", "-c:a", codecs[plan.extension]]
    elif plan.action == Action.VIDEO_TRANSCODE:
        if plan.extension == "mp4" and vaapi:
            cmd += [
                "-vf",
                "format=nv12,hwupload",
                "-c:v",
                "h264_vaapi",
                "-profile:v",
                "high",
                "-qp",
                "23",
            ]
        elif plan.extension == "mp4":
            cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "21"]
        else:
            cmd += ["-c:v", "libvpx-vp9", "-crf", "31", "-b:v", "0"]
        cmd += [
            "-c:a",
            "copy" if plan.copy_audio else ("aac" if plan.extension == "mp4" else "libopus"),
        ]
    if plan.extension == "mp4":
        cmd += ["-movflags", "+faststart"]
    return cmd + [str(target)]
