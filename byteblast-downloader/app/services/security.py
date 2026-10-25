import asyncio
import ipaddress
import re
import socket
import time
from collections import defaultdict, deque
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import HTTPException, Request


class UnsafeUrl(ValueError):
    pass


def is_public_ip(address: str) -> bool:
    ip = ipaddress.ip_address(address)
    return bool(ip.is_global) and not any(
        (ip.is_private, ip.is_loopback, ip.is_link_local, ip.is_multicast, ip.is_unspecified)
    )


async def validate_public_url(url: str) -> str:
    parsed = urlsplit(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise UnsafeUrl("Only public HTTP and HTTPS URLs are allowed")
    if parsed.username or parsed.password:
        raise UnsafeUrl("URLs containing credentials are not allowed")
    host = parsed.hostname.rstrip(".")
    if host.lower() in {"localhost", "localhost.localdomain"}:
        raise UnsafeUrl("Local network destinations are not allowed")
    try:
        if not is_public_ip(host):
            raise UnsafeUrl("Local network destinations are not allowed")
        return url
    except ValueError:
        pass
    try:
        records = await asyncio.get_running_loop().getaddrinfo(
            host,
            parsed.port or (443 if parsed.scheme == "https" else 80),
            family=socket.AF_UNSPEC,
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror as exc:
        raise UnsafeUrl("The hostname could not be resolved") from exc
    addresses = {record[4][0] for record in records}
    if not addresses or any(not is_public_ip(address) for address in addresses):
        raise UnsafeUrl("Local network destinations are not allowed")
    return url


def sanitize_filename(value: str, fallback: str = "download") -> str:
    value = value.replace("\\", "/").split("/")[-1]
    value = re.sub(r"[\x00-\x1f\x7f/\\:*?\"<>|]+", "_", value)
    value = re.sub(r"\s+", " ", value).strip(" .")
    value = value[:180].strip(" .")
    return value or fallback


def ensure_child(path: Path, parent: Path) -> Path:
    resolved, root = path.resolve(), parent.resolve()
    if not resolved.is_relative_to(root):
        raise ValueError("Path escapes its job directory")
    return resolved


def client_ip(request: Request, trusted_proxies: list[str]) -> str:
    peer = request.client.host if request.client else "unknown"
    trusted = any(
        ipaddress.ip_address(peer) in ipaddress.ip_network(net) for net in trusted_proxies
    )
    if trusted:
        forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if forwarded:
            try:
                ipaddress.ip_address(forwarded)
                return forwarded
            except ValueError:
                pass
    return peer


class RateLimiter:
    def __init__(self) -> None:
        self._hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self._lock = asyncio.Lock()

    async def check(self, bucket: str, key: str, limit: int, window: int) -> None:
        now = time.monotonic()
        async with self._lock:
            hits = self._hits[(bucket, key)]
            while hits and hits[0] <= now - window:
                hits.popleft()
            if len(hits) >= limit:
                raise HTTPException(429, "Rate limit exceeded; please try again later")
            hits.append(now)
