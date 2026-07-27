import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from agents.voice_interviewer import run_voice_interviewer_agent, run_voice_scorecard_agent

router = APIRouter(tags=["Voice Interviewer"])


class VoiceTurnRequest(BaseModel):
    job_title: str
    experience_level: Optional[str] = "Senior"
    history: List[Dict[str, str]] = []
    spoken_answer: Optional[str] = ""


class VoiceScorecardRequest(BaseModel):
    job_title: str
    experience_level: Optional[str] = "Senior"
    history: List[Dict[str, str]] = []


@router.post("/api/voice-interview/evaluate-turn")
async def evaluate_voice_turn_endpoint(req: VoiceTurnRequest):
    """
    Evaluates the candidate's spoken response in real-time, scores answer depth,
    and returns the next conversational follow-up question.
    """
    if not req.job_title:
        raise HTTPException(status_code=400, detail="Job title cannot be empty.")

    try:
        result_json_str, usage = run_voice_interviewer_agent(
            job_title=req.job_title,
            experience_level=req.experience_level or "Senior",
            conversation_history=req.history,
            spoken_answer=req.spoken_answer or ""
        )
        res_data = json.loads(result_json_str)
        return {
            "status": "success",
            "data": res_data,
            "usage": usage
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice Interviewer Agent error: {str(e)}")


@router.post("/api/voice-interview/generate-final-scorecard")
async def generate_voice_scorecard_endpoint(req: VoiceScorecardRequest):
    """
    Generates a final overall performance scorecard for a completed voice interview session.
    """
    if not req.job_title or not req.history:
        raise HTTPException(status_code=400, detail="Job title and interview history are required.")

    try:
        result_json_str, usage = run_voice_scorecard_agent(
            job_title=req.job_title,
            experience_level=req.experience_level or "Senior",
            conversation_history=req.history
        )
        res_data = json.loads(result_json_str)
        return {
            "status": "success",
            "data": res_data,
            "usage": usage
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice Scorecard Agent error: {str(e)}")
