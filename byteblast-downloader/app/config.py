from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        enable_decoding=False,
        extra="ignore",
    )

    app_name: str = "ByteBlast Downloader"
    host: str = "127.0.0.1"
    port: int = 3020
    temp_root: Path = Path("/tmp/byteblast-downloads")
    ytdlp_cookies_file: Path | None = None
    enable_vaapi: bool = False
    vaapi_device: Path = Path("/dev/dri/renderD129")
    enable_cpu_fallback: bool = False
    max_concurrent_downloads: int = Field(2, ge=1, le=32)
    max_concurrent_transcodes: int = Field(1, ge=1, le=8)
    max_duration_seconds: int = Field(14_400, ge=1)
    max_file_size_bytes: int = Field(8_000_000_000, ge=1)
    job_ttl_seconds: int = Field(3_600, ge=60)
    cleanup_interval_seconds: int = Field(300, ge=10)
    info_rate_limit: int = Field(30, ge=1)
    job_rate_limit: int = Field(10, ge=1)
    list_job_rate_limit: int = Field(30, ge=1, le=100)
    rate_limit_window_seconds: int = Field(60, ge=1)
    trusted_proxies: list[str] = []

    @field_validator("trusted_proxies", mode="before")
    @classmethod
    def split_proxies(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
