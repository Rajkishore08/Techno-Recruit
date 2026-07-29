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
load_dotenv()

# Initialize Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import credentials
    if not firebase_admin._apps:
        service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
        if service_account_json:
            import json
            try:
                cert_dict = json.loads(service_account_json)
                if "private_key" in cert_dict and isinstance(cert_dict["private_key"], str):
                    cert_dict["private_key"] = cert_dict["private_key"].replace("\\n", "\n")
                cred = credentials.Certificate(cert_dict)
                firebase_admin.initialize_app(cred, {
                    'projectId': os.environ.get("FIREBASE_PROJECT_ID", "techno-recruit")
                })
                print("🔥 Firebase Admin SDK initialized with Service Account Certificate.")
            except Exception as se_err:
                print(f"Notice parsing FIREBASE_SERVICE_ACCOUNT: {se_err}")
                cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, {
                    'projectId': os.environ.get("FIREBASE_PROJECT_ID", "techno-recruit")
                })
        else:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {
                'projectId': os.environ.get("FIREBASE_PROJECT_ID", "techno-recruit")
            })
except Exception as e:
    print(f"Firestore Client initialization notice: {e}")

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
    architect_router,
    voice_router
)

app.include_router(navigator_router)
app.include_router(search_router)
app.include_router(ats_router)
app.include_router(architect_router)
app.include_router(voice_router)


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


from fastapi import Depends
from routes.navigator_routes import get_optional_current_user

@app.get("/api/memories")
def get_mem0_memories(user: dict = Depends(get_optional_current_user)):
    """Returns stored Mem0 candidate entity facts and recruiter memory graph items."""
    try:
        from mem0_service import get_all_mem0_memories
        uid = user.get("uid", "techno_recruit_admin")
        memories = get_all_mem0_memories(user_id=uid)
        return {"status": "success", "memories": memories, "count": len(memories)}
    except Exception as e:
        return {"status": "error", "message": str(e), "memories": []}


# Mount static files directory at root
app.mount("/", StaticFiles(directory=SERVE_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8080, reload=True)
