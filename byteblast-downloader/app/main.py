import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.config import get_settings
from app.services.jobs import JobManager

BASE = Path(__file__).parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    app.state.jobs = JobManager(settings)
    await app.state.jobs.start()
    yield
    await app.state.jobs.stop()


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
app = FastAPI(
    title="ByteBlast Downloader API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url=None,
)
app.include_router(router)
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")


@app.middleware("http")
async def security_headers(request: Request, call_next):
    if request.headers.get("content-length") and int(request.headers["content-length"]) > 16_384:
        from fastapi.responses import JSONResponse

        return JSONResponse({"detail": "Request body too large"}, status_code=413)
    response = await call_next(request)
    response.headers.update(
        {
            "Content-Security-Policy": (
                "default-src 'self'; img-src 'self' https: data:; script-src 'self'; "
                "style-src 'self'; connect-src 'self'; frame-ancestors 'none'"
            ),
            "Referrer-Policy": "no-referrer",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        }
    )
    return response


@app.get("/", response_class=HTMLResponse, include_in_schema=False)
async def index() -> HTMLResponse:
    return HTMLResponse((BASE / "templates" / "index.html").read_text())


@app.get("/list", response_class=HTMLResponse, include_in_schema=False)
async def list_downloads() -> HTMLResponse:
    return HTMLResponse((BASE / "templates" / "list.html").read_text())


@app.get("/license", response_class=HTMLResponse, include_in_schema=False)
async def license_page() -> HTMLResponse:
    license_text = (BASE.parent / "LICENSE").read_text()
    return HTMLResponse(
        "<!doctype html><html lang='en'><head><meta charset='utf-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1'>"
        "<title>MIT License | ByteBlast Downloader</title>"
        "<link rel='stylesheet' href='/static/style.css'></head><body>"
        "<header><a class='brand' href='/'>ByteBlast / Downloader</a>"
        "<nav><a href='/'>Downloader</a>"
        "<a href='https://byteblast.xyz'>Main site</a></nav></header>"
        f"<main class='license-page'><h1>MIT License</h1><pre>{license_text}</pre></main>"
        "<footer><span>ByteBlast / Downloader</span><span>"
        "<a href='mailto:contact@byteblast.xyz'>Contact</a> · "
        "<a href='/license'>MIT License</a></span></footer>"
        "</body></html>"
    )
