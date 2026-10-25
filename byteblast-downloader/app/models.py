from enum import StrEnum

from pydantic import BaseModel, Field, HttpUrl, model_validator


class OutputKind(StrEnum):
    ORIGINAL = "original"
    MP4 = "mp4"
    WEBM = "webm"
    H264_MP4 = "h264_mp4"
    AUDIO = "audio"


class AudioFormat(StrEnum):
    ORIGINAL = "original"
    MP3 = "mp3"
    M4A = "m4a"
    OPUS = "opus"
    WAV = "wav"


class JobStage(StrEnum):
    QUEUED = "queued"
    DOWNLOADING = "downloading"
    MERGING = "merging"
    TRANSCODING = "transcoding"
    READY = "ready"
    FAILED = "failed"


class InfoRequest(BaseModel):
    url: HttpUrl


class FormatChoice(BaseModel):
    id: str
    label: str
    height: int | None = None
    width: int | None = None
    fps: float | None = None
    video_codec: str | None = None
    audio_codec: str | None = None
    container: str | None = None
    approximate_size: int | None = None
    has_audio: bool = False


class MediaInfo(BaseModel):
    url: str
    title: str
    uploader: str | None = None
    duration: float | None = None
    thumbnail: str | None = None
    subtitles: list[str] = []
    formats: list[FormatChoice]


class JobRequest(BaseModel):
    url: HttpUrl
    format_id: str = Field(min_length=1, max_length=200)
    output: OutputKind = OutputKind.ORIGINAL
    audio_format: AudioFormat = AudioFormat.ORIGINAL
    subtitle_language: str | None = Field(None, pattern=r"^[A-Za-z0-9._-]{1,30}$")

    @model_validator(mode="after")
    def validate_combination(self) -> "JobRequest":
        if self.output != OutputKind.AUDIO and self.audio_format != AudioFormat.ORIGINAL:
            raise ValueError("audio_format is only valid for audio-only downloads")
        return self


class JobView(BaseModel):
    id: str
    stage: JobStage
    detail: str
    percent: float | None = None
    downloaded_bytes: int | None = None
    total_bytes: int | None = None
    speed: float | None = None
    eta: float | None = None
    download_url: str | None = None


class HealthResponse(BaseModel):
    status: str
    tools: dict[str, bool]
    vaapi_configured: bool
    vaapi_available: bool
