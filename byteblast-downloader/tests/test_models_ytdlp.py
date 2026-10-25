import pytest
from pydantic import ValidationError

from app.models import AudioFormat, JobRequest, OutputKind
from app.services.ytdlp import normalize_info, parse_progress_line


def test_format_normalization_filters_audio_and_sorts():
    info = normalize_info(
        {
            "title": "Demo",
            "formats": [
                {"format_id": "a", "vcodec": "none", "acodec": "opus"},
                {
                    "format_id": "720",
                    "height": 720,
                    "vcodec": "h264",
                    "acodec": "none",
                    "ext": "mp4",
                },
                {
                    "format_id": "1080",
                    "height": 1080,
                    "vcodec": "vp9",
                    "acodec": "opus",
                    "ext": "webm",
                    "filesize": 42,
                },
            ],
        },
        "https://example.com/watch",
    )
    assert [f.id for f in info.formats] == ["1080", "720"]
    assert info.formats[0].has_audio and info.formats[0].approximate_size == 42


def test_invalid_frontend_option_combination():
    with pytest.raises(ValidationError):
        JobRequest(
            url="https://example.com/x",
            format_id="1",
            output=OutputKind.MP4,
            audio_format=AudioFormat.MP3,
        )


def test_progress_parser_keeps_percentage_when_other_fields_are_unavailable():
    parsed = parse_progress_line("byteblast: 42.5%|1048576|NA|NA|12")
    assert parsed == {
        "percent": 42.5,
        "downloaded_bytes": 1048576,
        "total_bytes": None,
        "speed": None,
        "eta": 12.0,
    }
