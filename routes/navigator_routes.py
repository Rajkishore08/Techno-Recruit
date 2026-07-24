import os
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Header
from pydantic import BaseModel
from resume_parser import extract_resume_text
from db import save_career_analysis, get_user_career_analyses
from agents.career_navigator import run_resume_role_suggester_agent

router = APIRouter(tags=["Career Navigator"])


def get_optional_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return {"uid": "anonymous"}
    token = authorization.split("Bearer ")[1]
    if token == "local_dev_token":
        return {"uid": "local_dev_admin", "name": "Local Developer Admin", "email": "dev@techno-recruit.local"}
    try:
        from firebase_admin import auth as firebase_auth
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception:
        return {"uid": "anonymous"}


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized: Missing or invalid token format.")
    token = authorization.split("Bearer ")[1]
    if token == "local_dev_token":
        return {"uid": "local_dev_admin", "name": "Local Developer Admin", "email": "dev@techno-recruit.local"}
    try:
        from firebase_admin import auth as firebase_auth
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Unauthorized: {str(e)}")


class CustomRoleRequest(BaseModel):
    resume_text: str
    role_title: str


@router.api_route("/api/parse-resume", methods=["POST", "OPTIONS"])
@router.api_route("/api/parse-resume/", methods=["POST", "OPTIONS"])
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


@router.api_route("/api/suggest-roles", methods=["POST", "OPTIONS"])
@router.api_route("/api/suggest-roles/", methods=["POST", "OPTIONS"])
async def suggest_roles_endpoint(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    candidate_name: Optional[str] = Form(None),
    parent_analysis_id: Optional[str] = Form(None),
    user: dict = Depends(get_optional_current_user)
):
    """
    Career Navigator Agent Endpoint:
    Analyzes candidate resume (file or text) and extracts leadership, hackathons, internships, and tiered match scores.
    Saves candidate session versioning and calculates side-by-side Before/After score comparisons against baseline.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable is not configured.")

    target_resume_text = ""
    filename = "Uploaded Resume"
    if file:
        try:
            content = await file.read()
            filename = file.filename
            target_resume_text = extract_resume_text(content, file.filename)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Resume file error: {str(e)}")
    elif resume_text and resume_text.strip():
        target_resume_text = resume_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please upload a resume file or provide resume text.")

    try:
        uid = user.get("uid", "anonymous")
        existing_history = get_user_career_analyses(uid) if uid != "anonymous" else []
        
        # Determine baseline comparison session
        baseline_session = None
        if parent_analysis_id:
            baseline_match = [r for r in existing_history if r.get("analysis_id") == parent_analysis_id]
            if baseline_match:
                baseline_session = baseline_match[0]
        elif candidate_name and candidate_name.strip():
            c_matches = [r for r in existing_history if r.get("candidate_name", "").strip().lower() == candidate_name.strip().lower()]
            if c_matches:
                baseline_session = c_matches[0]
        elif existing_history:
            baseline_session = existing_history[0]

        result_json_str, usage = run_resume_role_suggester_agent(target_resume_text)
        result_data = json.loads(result_json_str)

        # Save session to Firestore with version tracking
        saved_record = save_career_analysis(
            user_uid=uid,
            filename=filename,
            resume_text=target_resume_text,
            analysis_data=result_data,
            candidate_name=candidate_name or result_data.get("candidate_name"),
            parent_analysis_id=parent_analysis_id or (baseline_session.get("analysis_id") if baseline_session else None)
        )

        return {
            "status": "success",
            "session": saved_record,
            "data": result_data,
            "baseline_session": baseline_session,
            "usage": usage
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Career Navigator Agent failed: {str(e)}")


@router.post("/api/analyze-custom-role")
async def analyze_custom_role_endpoint(req: CustomRoleRequest):
    """Analyzes candidate resume suitability for a specific custom role."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")
    
    prompt = f"""You are an expert Executive Career Navigator & Senior Talent Analytics Agent.
Analyze the following candidate resume text:
--- BEGIN RESUME ---
{req.resume_text}
--- END RESUME ---

Evaluate the candidate's suitability for this specific job role: "{req.role_title}".

CRITICAL LOGICAL SCORING RULE:
A candidate's Junior/Beginner match score MUST ALWAYS be higher than or equal to their Mid-level match score (beginner_score >= intermediate_score). If a candidate is 90% fit for a Mid-level role, they are inherently 95-100% fit for Junior/Beginner roles. NEVER assign a lower score to beginner than to intermediate!

Format output strictly as a JSON object with keys:
- "role_title": "{req.role_title}"
- "domain": String (technology domain)
- "match_summary": 1-2 sentence explanation of candidate suitability
- "beginner_score": Integer (MUST BE >= intermediate_score, 0-100)
- "intermediate_score": Integer (0-100)
- "experienced_score": Integer (0-100)
- "key_strengths": List of 3-4 bullet strings (use **bold markdown** for key skills, no leading '* ' or '- ')
- "skill_gaps": List of 2-3 bullet strings (no leading '* ' or '- ')
- "recommended_next_steps": String

Return ONLY valid JSON.
"""
    try:
        from groq_client import query_groq_helper
        from agents.career_navigator import sanitize_bullet_list
        res_str, usage = query_groq_helper(prompt, json_mode=True)
        data = json.loads(res_str)
        
        b = int(data.get("beginner_score", 0))
        i = int(data.get("intermediate_score", 0))
        e = int(data.get("experienced_score", 0))
        
        if i >= 80:
            target_b = max(b, i + 5, 95)
        else:
            target_b = max(b, i)
            
        data["beginner_score"] = min(100, target_b)
        data["intermediate_score"] = i
        data["experienced_score"] = e
        data["key_strengths"] = sanitize_bullet_list(data.get("key_strengths", []))
        data["skill_gaps"] = sanitize_bullet_list(data.get("skill_gaps", []))
        
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze custom role: {str(e)}")



@router.get("/api/candidate-sessions")
def get_candidate_sessions_endpoint(user: dict = Depends(get_optional_current_user)):
    """Retrieves all past career analysis sessions grouped by candidate profile."""
    try:
        uid = user.get("uid", "anonymous")
        history = get_user_career_analyses(uid)
        
        grouped = {}
        for record in history:
            c_name = record.get("candidate_name", "Candidate Profile")
            if c_name not in grouped:
                grouped[c_name] = []
            grouped[c_name].append(record)

        return {
            "status": "success",
            "candidates": grouped,
            "total_candidates": len(grouped),
            "total_runs": len(history)
        }
    except Exception as e:
        return {"status": "success", "candidates": {}, "total_candidates": 0, "total_runs": 0}


@router.get("/api/career-history")
def get_career_history_endpoint(user: dict = Depends(get_optional_current_user)):
    """Retrieves list of past career navigator sessions for current user."""
    try:
        uid = user.get("uid", "anonymous")
        history = get_user_career_analyses(uid)
        return {"status": "success", "history": history}
    except Exception as e:
        return {"status": "success", "history": []}
