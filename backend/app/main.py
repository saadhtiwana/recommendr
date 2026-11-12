"""Recommendr HTTP API (the Render `web` process). Phase 1: health check only."""

from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Recommendr API", version="0.1.0")


class HealthResponse(BaseModel):
    status: Literal["ok"]


@app.get("/healthz", response_model=HealthResponse)
async def healthz() -> HealthResponse:
    # Liveness only, with no database check: a Neon cold start or outage must not make
    # Render restart healthy API instances (that would turn a DB blip into an API outage).
    return HealthResponse(status="ok")
