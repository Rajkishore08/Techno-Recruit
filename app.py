import os
import json
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Depends

# Load environment variables from .env file
load_dotenv()
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore

# Import the agent loop
from agent import run_interview_generator_agent

# Initialize Firebase Admin SDK
if not firebase_admin._apps:
    try:
        service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
        if service_account_json:
            import json
            cred_dict = json.loads(service_account_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized with Service Account.")
        else:
            project_id = os.environ.get("FIREBASE_PROJECT_ID", "techno-recruit")
            firebase_admin.initialize_app(options={'projectId': project_id})
            print(f"Firebase Admin SDK initialized with Project ID: {project_id}")
    except Exception as e:
        print(f"Firebase Admin SDK initialization warning: {e}")

try:
    db = firestore.client()
except Exception as e:
    db = None
    print(f"Firestore Client initialization warning: {e}")

BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Techno Recruit — AI Screening & Multi-Agent Interview Architect")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi import HTTPException, Header, Depends, UploadFile, File, Form
from resume_parser import extract_resume_text
from agent import (
    run_interview_generator_agent,
    run_resume_role_suggester_agent,
    run_resume_jd_matcher_agent
)


class InterviewRequest(BaseModel):
    job_title: str
    job_description: str
    experience_level: str
    categories: List[str]
    count: int = 5
    resume_text: Optional[str] = None


class SuggestRolesRequest(BaseModel):
    resume_text: str


class TweakRequest(BaseModel):
    guide_id: str
    question_id: int
    action: str  # "harder", "easier", "custom"
    feedback: Optional[str] = None


class EvaluateRequest(BaseModel):
    guide_id: str
    question_id: int
    candidate_answer: str


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid token format.")
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}")


def get_optional_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return {"uid": "anonymous"}
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception:
        return {"uid": "anonymous"}


@app.get("/")
def index():
    """Serves the front end page."""
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/config")
def get_firebase_config():
    """Returns public Firebase configuration for client SDK initialization."""
    return {
        "apiKey": os.environ.get("FIREBASE_API_KEY", "AIzaSyBJa0JPhdfdGI8qsVsLyvB87VvqvFb4LR8"),
        "authDomain": os.environ.get("FIREBASE_AUTH_DOMAIN", "techno-recruit.firebaseapp.com"),
        "projectId": os.environ.get("FIREBASE_PROJECT_ID", "techno-recruit"),
        "storageBucket": os.environ.get("FIREBASE_STORAGE_BUCKET", "techno-recruit.firebasestorage.app"),
        "messagingSenderId": os.environ.get("FIREBASE_MESSAGING_SENDER_ID", "235364274013"),
        "appId": os.environ.get("FIREBASE_APP_ID", "1:235364274013:web:9db2497f8946987989e2b4"),
        "measurementId": os.environ.get("FIREBASE_MEASUREMENT_ID", "G-LKVL7NWK5L")
    }


@app.api_route("/api/parse-resume", methods=["POST", "OPTIONS"])
@app.api_route("/api/parse-resume/", methods=["POST", "OPTIONS"])
async def parse_resume_endpoint(file: UploadFile = File(...), user: dict = Depends(get_optional_current_user)):
    """Extracts text content from uploaded resume file (PDF, DOCX, TXT)."""
    try:
        content = await file.read()
        extracted_text = extract_resume_text(content, file.filename)
        return {
            "status": "success",
            "filename": file.filename,
            "resume_text": extracted_text,
            "word_count": len(extracted_text.split())
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process resume file: {str(e)}")


@app.api_route("/api/suggest-roles", methods=["POST", "OPTIONS"])
@app.api_route("/api/suggest-roles/", methods=["POST", "OPTIONS"])
async def suggest_roles_endpoint(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    user: dict = Depends(get_optional_current_user)
):
    """
    Career Navigator Agent Endpoint:
    Analyzes resume (file or text) and recommends matching career roles with Beginner/Intermediate/Experienced scores.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable is not configured.")

    target_resume_text = ""
    if file:
        try:
            content = await file.read()
            target_resume_text = extract_resume_text(content, file.filename)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Resume file error: {str(e)}")
    elif resume_text and resume_text.strip():
        target_resume_text = resume_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please upload a resume file or provide resume text.")

    try:
        result_json_str, usage = run_resume_role_suggester_agent(target_resume_text)
        result_data = json.loads(result_json_str)
        return {
            "status": "success",
            "data": result_data,
            "usage": usage
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Career Navigator Agent failed: {str(e)}")


@app.post("/api/generate")
def generate_questions(req: InterviewRequest, user: dict = Depends(get_current_user)):
    """
    Triggers the autonomous agent loop and streams the Multi-Agent loop
    traces in real-time back to the client using Server-Sent Events (SSE).
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY environment variable is not configured. Check the .env file."
        )

    details = {
        "job_title": req.job_title,
        "job_description": req.job_description,
        "experience_level": req.experience_level,
        "categories": req.categories,
        "count": req.count,
        "resume_text": req.resume_text or "",
        "uid": user["uid"]
    }

    def sse_event_source():
        # Instantiate agent loop generator
        agent_generator = run_interview_generator_agent(details)
        try:
            for step_data in agent_generator:
                yield f"data: {json.dumps(step_data)}\n\n"
        except Exception as e:
            # Yield error event
            err_data = {
                "phase": "ERROR",
                "message": f"Exception raised inside server stream: {str(e)}",
                "iteration": 0
            }
            yield f"data: {json.dumps(err_data)}\n\n"

    return StreamingResponse(sse_event_source(), media_type="text/event-stream")


@app.post("/api/tweak")
def tweak_question(req: TweakRequest, user: dict = Depends(get_current_user)):
    """
    Regenerates a single question in-place, tweaking its difficulty
    or incorporating custom prompt feedback.
    """
    if not db:
        raise HTTPException(status_code=500, detail="Database connection not available.")

    uid = user["uid"]
    try:
        doc_ref = db.collection("guides").document(req.guide_id)
        doc = doc_ref.get()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to query database: {str(e)}")

    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Guide {req.guide_id} not found.")

    guide = doc.to_dict()
    if guide.get("uid") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to edit this guide.")

    questions = guide.get("questions", [])

    # Locate question
    q_idx = -1
    for idx, q in enumerate(questions):
        if q.get("id") == req.question_id:
            q_idx = idx
            break
            
    if q_idx == -1:
        raise HTTPException(status_code=404, detail=f"Question ID {req.question_id} not found in this guide.")

    target_q = questions[q_idx]

    # Invoke Groq helper to refine the specific question
    prompt = f"""You are an expert technical interviewer.
Your task is to modify a single interview question object based on the requested action: '{req.action}' and custom feedback constraints.

Current Question Details:
{json.dumps(target_q, indent=2)}

Requested Tweak Action: {req.action}
Custom Feedback/Constraints: {req.feedback or 'None provided.'}

Output the updated question object matching this schema:
{{
  "id": {req.question_id},
  "question": "updated question text",
  "category": "category",
  "target_skill": "skill",
  "difficulty": "Easy/Medium/Hard",
  "rationale": "rationale",
  "model_answer": "model answer",
  "grading_rubric": {{
    "1": "criteria for score of 1",
    "3": "criteria for score of 3",
    "5": "criteria for score of 5"
  }}
}}

Format the output strictly as a JSON object with no markdown codeblocks or explanations.
"""
    try:
        from agent import query_groq_helper
        res_str, usage = query_groq_helper(prompt, json_mode=True)
        updated_q = json.loads(res_str)
        
        # Replace in array
        questions[q_idx] = updated_q
        
        # Write back to Firestore
        doc_ref.update({"questions": questions})
        
        guide["questions"] = questions
        return guide
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to tweak question: {str(e)}")


@app.post("/api/evaluate")
def evaluate_candidate_answer(req: EvaluateRequest, user: dict = Depends(get_current_user)):
    """
    Grades a candidate's response to a specific question using the structured scorecard rubric.
    """
    if not db:
        raise HTTPException(status_code=500, detail="Database connection not available.")

    uid = user["uid"]
    try:
        doc_ref = db.collection("guides").document(req.guide_id)
        doc = doc_ref.get()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read database: {str(e)}")

    if not doc.exists:
        raise HTTPException(status_code=404, detail=f"Guide {req.guide_id} not found.")

    guide = doc.to_dict()
    if guide.get("uid") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to access this guide.")

    questions = guide.get("questions", [])
    target_q = None
    for q in questions:
        if q.get("id") == req.question_id:
            target_q = q
            break
            
    if not target_q:
        raise HTTPException(status_code=404, detail=f"Question ID {req.question_id} not found in this guide.")

    r1 = target_q.get("grading_rubric", {}).get("1", "Poor answer.")
    r3 = target_q.get("grading_rubric", {}).get("3", "Good answer.")
    r5 = target_q.get("grading_rubric", {}).get("5", "Excellent answer.")

    prompt = f"""You are an elite AI technical interviewer. Your job is to grade the candidate's response to the interview question below on a scale of 1 to 5.

Interview Question:
{target_q.get('question')}

Grading Rubric Criteria:
- Score 1 (Poor): {r1}
- Score 3 (Good): {r3}
- Score 5 (Excellent/Elite): {r5}

Candidate's Actual Response:
{req.candidate_answer}

Analyze the response and output:
1. "score": An integer rating (1 to 5) matching the rubric guidelines.
2. "strengths": A JSON array of bullet points highlighting what they did well.
3. "weaknesses": A JSON array of bullet points highlighting what they missed or got wrong.
4. "red_flags": A JSON array of warning signs (e.g. evasiveness, wrong terminology, clear lack of experience). If none, output empty array [].
5. "follow_up_question": A targeted follow-up question based on their answer to explore their depth.

Format the output strictly as a JSON object with no markdown wrappers or text outside the JSON.
"""
    try:
        from agent import query_groq_helper
        res_str, usage = query_groq_helper(prompt, json_mode=True)
        return json.loads(res_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate candidate response: {str(e)}")


@app.get("/api/history")
def get_history(user: dict = Depends(get_current_user)):
    """Returns list of all saved generated interview guides."""
    if not db:
        return []
    try:
        uid = user["uid"]
        docs = db.collection("guides").where("uid", "==", uid).stream()
        history = [doc.to_dict() for doc in docs]
        history.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read database: {str(e)}")


@app.get("/api/history/{guide_id}")
def get_history_by_id(guide_id: str, user: dict = Depends(get_current_user)):
    """Retrieves a specific interview guide from the database."""
    if not db:
        raise HTTPException(status_code=500, detail="Database connection not available.")
    try:
        uid = user["uid"]
        doc_ref = db.collection("guides").document(guide_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Interview guide with ID {guide_id} not found."
            )
        
        record = doc.to_dict()
        if record.get("uid") != uid:
            raise HTTPException(status_code=403, detail="Not authorized to access this guide.")
            
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading database record: {str(e)}")


# Mount the static files directory at root to match Firebase Hosting structure
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
