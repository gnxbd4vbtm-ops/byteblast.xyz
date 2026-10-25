import socket

import pytest

from app.services.security import UnsafeUrl, sanitize_filename, validate_public_url


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/x",
        "http://10.0.0.1",
        "http://169.254.169.254/latest/meta-data",
        "http://[::1]/",
        "ftp://example.com/file",
        "https://user:pass@example.com",
    ],
)
async def test_unsafe_urls_are_blocked(url):
    with pytest.raises(UnsafeUrl):
        await validate_public_url(url)


async def test_dns_with_private_answer_is_blocked(monkeypatch):
    async def answer(*args, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("192.168.1.4", 443))]

    monkeypatch.setattr("asyncio.BaseEventLoop.getaddrinfo", answer)
    with pytest.raises(UnsafeUrl):
        await validate_public_url("https://example.invalid")


def test_filename_sanitization():
    assert sanitize_filename("../../my:\0 video?.mp4") == "my_ video_.mp4"
    assert sanitize_filename(" . ") == "download"
