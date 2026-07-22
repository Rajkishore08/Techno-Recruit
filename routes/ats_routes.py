import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Header
from pydantic import BaseModel
from resume_parser import extract_resume_text
from agents.ats_optimizer import run_ats_optimizer_agent

router = APIRouter(tags=["ATS Optimizer"])


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


class AtsOptimizerRequest(BaseModel):
    job_title: str
    job_description: str
    resume_text: Optional[str] = None


@router.api_route("/api/optimize-resume", methods=["POST", "OPTIONS"])
@router.api_route("/api/optimize-resume/", methods=["POST", "OPTIONS"])
async def optimize_resume_endpoint(
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    job_title: Optional[str] = Form(None),
    job_description: Optional[str] = Form(None),
    user: dict = Depends(get_optional_current_user)
):
    """
    AI Resume Enhancer & ATS Optimizer Endpoint:
    Compares candidate resume (file or text) against target JD and returns ATS score, keyword heatmap, impact audit, and tailored resume.
    """
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

    j_title = job_title.strip() if job_title and job_title.strip() else "Target Role"
    j_desc = job_description.strip() if job_description and job_description.strip() else "Software Engineering requirements"

    try:
        result_json_str, usage = run_ats_optimizer_agent(target_resume_text, j_title, j_desc)
        result_data = json.loads(result_json_str)

        # Save candidate profile to Talent Pool database for Vector RAG search
        try:
            from db import save_career_analysis
            uid = user.get("uid", "anonymous")
            c_name = filename.split(".")[0] if "." in filename else filename
            if c_name == "Uploaded Resume" or not c_name:
                c_name = "ATS Candidate Profile"

            # Enrich result_data with summary field so RAG search runs cleanly
            if "candidate_summary" not in result_data:
                result_data["candidate_summary"] = f"Candidate screened for {j_title} with ATS Score {result_data.get('ats_score', 0)}%"

            save_career_analysis(
                user_uid=uid,
                filename=filename,
                resume_text=target_resume_text,
                analysis_data=result_data,
                candidate_name=c_name
            )
        except Exception as db_err:
            print(f"Failed to auto-save ATS candidate to database: {db_err}")

        return {
            "status": "success",
            "filename": filename,
            "data": result_data,
            "usage": usage
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ATS Optimizer Agent failed: {str(e)}")
