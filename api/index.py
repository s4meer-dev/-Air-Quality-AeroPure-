"""
Vercel Serverless Function Entrypoint for AeroPure ML Engine
============================================================
Exposes the production FastAPI application instance for @vercel/python runtime.
"""

from api.main import app

__all__ = ["app"]

