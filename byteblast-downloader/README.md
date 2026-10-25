# Free YouTube Downloader

## What is it?

Free YouTube Downloader is a self-hosted web interface for `yt-dlp` and FFmpeg.

Paste a supported public media URL, choose a format, and download the resulting file in your browser. The `/list` page accepts multiple URLs and applies the same settings to each download.

The backend uses Python, FastAPI, and Uvicorn. The frontend uses plain HTML, CSS, and JavaScript styled to match the main ByteBlast and status sites. This app lives beside both sites in the `byteblast.xyz` repository and uses the same systemd/Cloudflare Tunnel deployment flow.

## Why does it exist?

It provides a simple browser interface for `yt-dlp` without exposing command-line options to visitors.

Each download runs in a separate temporary directory. Files are deleted after delivery, failed jobs are cleaned up, and stale jobs are removed automatically.

## How do I install and use it?

The primary deployment target is CachyOS. Python 3.12 or newer is required.

Install the system dependencies:

```fish
yay -S python uv yt-dlp ffmpeg
```

Clone and start the application:

```fish
cd /home/byte/Projects/byteblast.xyz/byteblast-downloader
uv sync --group dev
uv run uvicorn app.main:app --host 127.0.0.1 --port 3020
```

Open `http://127.0.0.1:3020` for one download or `http://127.0.0.1:3020/list` for multiple downloads.

Copy the example configuration before a production deployment:

```fish
cp .env.example .env
```

Important settings include:

- `MAX_CONCURRENT_DOWNLOADS`
- `MAX_CONCURRENT_TRANSCODES`
- `MAX_DURATION_SECONDS`
- `MAX_FILE_SIZE_BYTES`
- `JOB_TTL_SECONDS`
- `YTDLP_COOKIES_FILE`
- `ENABLE_VAAPI`
- `VAAPI_DEVICE`

The included `byteblast-downloader.service.example` mirrors the monorepo deployment and runs the service on `127.0.0.1:3020`. The production VA-API device is configured as `/dev/dri/renderD129`. The service user must have permission to access that render device, normally through the `render` group.

Run the checks with:

```fish
uv run pytest
uv run ruff check .
```

## What can it do?

- Fetch titles, thumbnails, channels, durations, subtitles, and available formats
- Download the original format, MP4, WebM, H.264-compatible MP4, or audio only
- Convert audio to MP3, M4A, Opus, or WAV
- Download multiple URLs from `/list`
- Show live download progress with Server-Sent Events
- Remux compatible streams without re-encoding them
- Use Intel VA-API for H.264 conversion when configured
- Limit download and transcode concurrency
- Reject private, local, link-local, multicast, and metadata-network URLs
- Rate-limit API requests
- Remove temporary files after delivery or expiration
- Use an optional server-side yt-dlp cookies file

API documentation is available at `/api/docs`. Basic service status is available at `/api/health`.

## Is it maintained?

Yes. ByteBlast maintains this project for its downloader service.

`yt-dlp` should be updated regularly because supported websites change often:

```fish
uv lock --upgrade-package yt-dlp
uv sync
```

Problems and security reports can be sent to [contact@byteblast.xyz](mailto:contact@byteblast.xyz).

## Who or what uses it?

The application is built for the ByteBlast downloader at [download.byteblast.xyz](https://download.byteblast.xyz) and can also be run on another single Linux server.

It uses:

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) to retrieve media information and streams
- [FFmpeg](https://ffmpeg.org/) to inspect, remux, and convert media
- [FastAPI](https://fastapi.tiangolo.com/) to provide the web API

Copyright © 2026 [ByteBlast](https://byteblast.xyz).

Licensed under the [MIT License](LICENSE).
