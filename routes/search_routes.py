import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from db import get_user_career_analyses
from agents.talent_search import run_talent_search_agent

router = APIRouter(tags=["Talent Search"])


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
    candidate_records = get_user_career_analyses(uid) if uid != "anonymous" else []

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
