from pathlib import Path

import pytest

from app.models import AudioFormat, OutputKind
from app.services.ffmpeg import Action, StreamInfo, build_ffmpeg_command, decide_processing


def test_h264_aac_mp4_is_remuxed_without_encoding():
    plan = decide_processing(
        OutputKind.H264_MP4, AudioFormat.ORIGINAL, StreamInfo("h264", "aac", "webm")
    )
    assert plan.action == Action.REMUX
    command = build_ffmpeg_command(
        Path("in.mkv"), Path("out.mp4"), plan, vaapi=False, vaapi_device=Path("/dev/null")
    )
    assert command.count("copy") == 2
    assert "h264_vaapi" not in command


def test_vp9_to_h264_uses_vaapi():
    plan = decide_processing(
        OutputKind.H264_MP4, AudioFormat.ORIGINAL, StreamInfo("vp9", "opus", "webm")
    )
    assert plan.action == Action.VIDEO_TRANSCODE
    command = build_ffmpeg_command(
        Path("in.webm"), Path("out.mp4"), plan, vaapi=True, vaapi_device=Path("/dev/dri/renderD129")
    )
    assert "h264_vaapi" in command and "/dev/dri/renderD129" in command
    assert command[command.index("-c:a") + 1] == "aac"


def test_vaapi_disabled_does_not_silently_fallback():
    plan = decide_processing(
        OutputKind.H264_MP4, AudioFormat.ORIGINAL, StreamInfo("vp9", "opus", "webm")
    )
    with pytest.raises(RuntimeError, match="CPU fallback is disabled"):
        build_ffmpeg_command(Path("in"), Path("out"), plan, vaapi=False, vaapi_device=Path("none"))


def test_compatible_webm_is_stream_copied():
    plan = decide_processing(
        OutputKind.WEBM, AudioFormat.ORIGINAL, StreamInfo("vp9", "opus", "webm")
    )
    assert plan.action == Action.REMUX and plan.copy_audio


def test_vp9_regular_mp4_is_remuxed_without_h264_requirement():
    plan = decide_processing(
        OutputKind.MP4, AudioFormat.ORIGINAL, StreamInfo("vp9", "opus", "webm")
    )
    assert plan.action == Action.REMUX
    assert not plan.copy_audio
