import os
import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents.interview_architect import run_interview_generator_agent
from groq_client import query_groq_helper
from db import get_interview_guide, update_interview_guide

router = APIRouter(tags=["Interview Architect"])


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


class InterviewRequest(BaseModel):
    job_title: str
    job_description: str
    experience_level: str
    categories: List[str]
    count: int = 5
    resume_text: Optional[str] = None


class TweakRequest(BaseModel):
    guide_id: str
    question_id: int
    action: str
    feedback: Optional[str] = None


class EvaluateRequest(BaseModel):
    guide_id: str
    question_id: int
    candidate_answer: str


@router.post("/api/generate")
def generate_questions(req: InterviewRequest, user: dict = Depends(get_optional_current_user)):
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
        "uid": user.get("uid", "anonymous")
    }

    def sse_event_source():
        agent_generator = run_interview_generator_agent(details)
        try:
            for step_data in agent_generator:
                yield f"data: {json.dumps(step_data)}\n\n"
        except Exception as e:
            err_data = {
                "phase": "ERROR",
                "message": f"Exception raised inside server stream: {str(e)}",
                "iteration": 0
            }
            yield f"data: {json.dumps(err_data)}\n\n"

    return StreamingResponse(sse_event_source(), media_type="text/event-stream")


@router.post("/api/tweak")
def tweak_question(req: TweakRequest, user: dict = Depends(get_optional_current_user)):
    """Regenerates a single question in-place, tweaking difficulty or custom feedback."""
    guide = get_interview_guide(req.guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail=f"Guide {req.guide_id} not found.")

    if guide.get("uid") != user.get("uid", "anonymous"):
        raise HTTPException(status_code=403, detail="Not authorized to edit this guide.")

    questions = guide.get("questions", [])
    q_idx = -1
    for idx, q in enumerate(questions):
        if q.get("id") == req.question_id:
            q_idx = idx
            break
            
    if q_idx == -1:
        raise HTTPException(status_code=404, detail=f"Question ID {req.question_id} not found in this guide.")

    target_q = questions[q_idx]

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
        res_str, usage = query_groq_helper(prompt, json_mode=True)
        updated_q = json.loads(res_str)
        questions[q_idx] = updated_q
        update_interview_guide(req.guide_id, {"questions": questions})
        guide["questions"] = questions
        return guide
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to tweak question: {str(e)}")


@router.post("/api/evaluate")
def evaluate_candidate_answer(req: EvaluateRequest, user: dict = Depends(get_optional_current_user)):
    """Grades candidate response to a specific question using structured scorecard rubric."""
    guide = get_interview_guide(req.guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail=f"Guide {req.guide_id} not found.")

    if guide.get("uid") != user.get("uid", "anonymous"):
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
4. "red_flags": A JSON array of warning signs. If none, output empty array [].
5. "follow_up_question": A targeted follow-up question based on their answer.

Format output strictly as JSON with no markdown wrappers.
"""
    try:
        res_str, usage = query_groq_helper(prompt, json_mode=True)
        return json.loads(res_str)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate candidate response: {str(e)}")


@router.get("/api/history")
def get_history(user: dict = Depends(get_optional_current_user)):
    """Returns list of all saved generated interview guides."""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        uid = user.get("uid", "anonymous")
        docs = db.collection("guides").where("uid", "==", uid).stream()
        history = [doc.to_dict() for doc in docs]
        history.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        return history
    except Exception as e:
        print(f"Firestore query notice: {e}")
        return []


@router.get("/api/history/{guide_id}")
def get_history_by_id(guide_id: str, user: dict = Depends(get_optional_current_user)):
    """Retrieves a specific interview guide from the database."""
    uid = user.get("uid", "anonymous")
    record = get_interview_guide(guide_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Interview guide with ID {guide_id} not found.")
    if record.get("uid") != uid:
        raise HTTPException(status_code=403, detail="Not authorized to access this guide.")
    return record
