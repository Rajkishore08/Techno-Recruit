"""
FastAPI Routes Package for Techno Recruit.
Combines APIRouters for Career Navigator, Vector RAG Search, ATS Optimizer, and Interview Architect.
"""

from .navigator_routes import router as navigator_router
from .search_routes import router as search_router
from .ats_routes import router as ats_router
from .architect_routes import router as architect_router

__all__ = [
    "navigator_router",
    "search_router",
    "ats_router",
    "architect_router"
]
