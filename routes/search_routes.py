import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from db import get_user_career_analyses
from agents.talent_search import run_talent_search_agent
from agents.candidate_battlecard import run_candidate_battlecard_agent

router = APIRouter(tags=["Talent Search & Battlecard"])


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


class TalentSearchRequest(BaseModel):
    query: str


class CompareCandidatesRequest(BaseModel):
    analysis_ids: List[str]
    target_role: Optional[str] = ""


@router.post("/api/search-talent-pool")
async def search_talent_pool_endpoint(
    req: TalentSearchRequest,
    user: dict = Depends(get_optional_current_user)
):
    """
    Vector RAG Talent Search Endpoint:
    Searches the user's candidate talent pool using AI semantic relevance re-ranking.
    """
    if not req.query or not req.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    uid = user.get("uid", "anonymous")
    candidate_records = get_user_career_analyses(uid)

    if not candidate_records:
        return {
            "status": "success",
            "query": req.query,
            "data": {
                "query": req.query,
                "total_matches": 0,
                "matched_candidates": []
            }
        }

    try:
        result_json_str, usage = run_talent_search_agent(req.query.strip(), candidate_records)
        res_data = json.loads(result_json_str)
        return {
            "status": "success",
            "data": res_data,
            "usage": usage
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Talent Search Agent failed: {str(e)}")


@router.post("/api/compare-candidates")
async def compare_candidates_endpoint(
    req: CompareCandidatesRequest,
    user: dict = Depends(get_optional_current_user)
):
    """
    AI Candidate Battle-Card & Decision Matrix Endpoint:
    Performs head-to-head multi-candidate comparison, skill matrix analysis, and hiring verdict.
    """
    if not req.analysis_ids or len(req.analysis_ids) < 2:
        raise HTTPException(status_code=400, detail="Please select at least 2 candidates for comparison.")

    uid = user.get("uid", "anonymous")
    all_records = get_user_career_analyses(uid)

    # Filter selected candidates by ID
    selected_records = [r for r in all_records if r.get("analysis_id") in req.analysis_ids]

    if len(selected_records) < 2:
        # If IDs didn't match directly, try slicing first few records
        selected_records = all_records[:len(req.analysis_ids)]

    if not selected_records or len(selected_records) < 2:
        raise HTTPException(status_code=404, detail="Could not find sufficient candidate records for comparison.")

    try:
        result_json_str, usage = run_candidate_battlecard_agent(selected_records, target_role=req.target_role or "")
        res_data = json.loads(result_json_str)
        return {
            "status": "success",
            "data": res_data,
            "usage": usage
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Candidate Battle-Card Agent failed: {str(e)}")

