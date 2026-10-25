import pytest

from app.config import Settings
from app.models import JobRequest
from app.services.jobs import CapacityError, JobManager


async def test_job_isolation_and_capacity(tmp_path, monkeypatch):
    settings = Settings(temp_root=tmp_path, max_concurrent_downloads=1)
    manager = JobManager(settings)
    blocker = __import__("asyncio").Event()

    async def fake_run(job):
        await blocker.wait()
        async with manager._lock:
            manager._active -= 1

    monkeypatch.setattr(manager, "_run", fake_run)
    first = await manager.create(JobRequest(url="https://example.com/a", format_id="1"))
    assert first.directory.parent == tmp_path and first.id not in str(tmp_path)
    with pytest.raises(CapacityError):
        await manager.create(JobRequest(url="https://example.com/b", format_id="1"))
    blocker.set()
    await first.task
    await manager.cleanup(first.id)


async def test_cleanup_removes_entire_job_directory(tmp_path):
    manager = JobManager(Settings(temp_root=tmp_path))
    directory = tmp_path / ("a" * 32)
    directory.mkdir()
    (directory / "media").write_text("x")
    from app.services.jobs import Job

    job = Job("a" * 32, JobRequest(url="https://example.com/a", format_id="1"), directory)
    manager.jobs[job.id] = job
    await manager.cleanup(job.id)
    assert not directory.exists() and job.id not in manager.jobs
