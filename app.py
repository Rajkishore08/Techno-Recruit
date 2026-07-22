import os
import sys
import site

# Ensure user site-packages are registered in path
user_site = site.getusersitepackages()
if user_site and user_site not in sys.path:
    sys.path.insert(0, user_site)

from pathlib import Path
from fastapi import FastAPI, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Initialize Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import credentials
    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': os.environ.get("FIREBASE_PROJECT_ID", "techno-recruit")
        })
except Exception as e:
    print(f"Firestore Client initialization notice: {e}")

load_dotenv()

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
DIST_DIR = BASE_DIR / "dist"
SERVE_DIR = DIST_DIR if DIST_DIR.exists() else STATIC_DIR

app = FastAPI(
    title="Techno Recruit — AI Talent Intelligence & Multi-Agent Platform",
    description="Modular Multi-Agent Architecture for Resume Screening, Role Matching, ATS Optimization, and Interview Architecture."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and mount modular APIRouters
from routes import (
    navigator_router,
    search_router,
    ats_router,
    architect_router
)

app.include_router(navigator_router)
app.include_router(search_router)
app.include_router(ats_router)
app.include_router(architect_router)


@app.get("/favicon.ico")
def favicon():
    fav = SERVE_DIR / "favicon.png"
    if fav.exists():
        return FileResponse(fav)
    return Response(status_code=204)


@app.get("/favicon.png")
def favicon_png():
    fav = SERVE_DIR / "favicon.png"
    if fav.exists():
        return FileResponse(fav)
    return Response(status_code=204)


@app.get("/logo.png")
def logo_png():
    logo = SERVE_DIR / "logo.png"
    if logo.exists():
        return FileResponse(logo)
    return Response(status_code=204)


@app.get("/")
def index():
    """Serves main dashboard front end page."""
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/config")
@app.get("/__/firebase/init.json")
def get_firebase_config():
    """Returns public Firebase configuration for client SDK initialization."""
    return {
        "apiKey": os.environ.get("FIREBASE_API_KEY", ""),
        "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN", ""),
        "projectId": os.environ.get("FIREBASE_PROJECT_ID", ""),
        "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET", ""),
        "messagingSenderId": os.environ.get("FIREBASE_MESSAGING_SENDER_ID", ""),
        "appId": os.environ.get("FIREBASE_APP_ID", ""),
        "measurementId": os.environ.get("FIREBASE_MEASUREMENT_ID", "")
    }


# Mount static files directory at root
app.mount("/", StaticFiles(directory=SERVE_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=True)
