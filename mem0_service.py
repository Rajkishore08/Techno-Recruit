import os
import requests
from typing import List, Dict, Any, Optional

MEM0_API_KEY = os.getenv("MEM0_API_KEY", "m0-kcQb7mM1rodDFuyKOZVFOMoPw1JV1DcEyrPdDSHR")
MEM0_BASE_URL = "https://api.mem0.ai/v1"

def add_mem0_memory(messages: List[Dict[str, str]], user_id: str = "techno_recruit_admin", agent_id: str = "techno_recruit_agent") -> Optional[Dict[str, Any]]:
    """
    Saves conversation or analysis context into Mem0 memory graph.
    Mem0 automatically extracts entity facts, candidate traits, and recruiter preferences.
    """
    if not MEM0_API_KEY:
        return None

    headers = {
        "Authorization": f"Token {MEM0_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "messages": messages,
        "user_id": user_id,
        "agent_id": agent_id
    }
    try:
        resp = requests.post(f"{MEM0_BASE_URL}/memories/", json=payload, headers=headers, timeout=5)
        if resp.status_code in (200, 201):
            return resp.json()
        print(f"[Mem0] Notice: Failed to save memory (status {resp.status_code}): {resp.text}")
        return None
    except Exception as e:
        print(f"[Mem0] Error adding memory: {e}")
        return None

def search_mem0_memory(query: str, user_id: str = "techno_recruit_admin", limit: int = 5) -> List[str]:
    """
    Searches Mem0 memory for relevant candidate & recruiter background context.
    """
    if not MEM0_API_KEY:
        return []

    headers = {
        "Authorization": f"Token {MEM0_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "query": query,
        "user_id": user_id,
        "limit": limit
    }
    try:
        resp = requests.post(f"{MEM0_BASE_URL}/memories/search/", json=payload, headers=headers, timeout=5)
        if resp.status_code == 200:
            results = resp.json()
            if isinstance(results, list):
                return [r.get("memory", "") for r in results if r.get("memory")]
            elif isinstance(results, dict) and "results" in results:
                return [r.get("memory", "") for r in results["results"] if r.get("memory")]
        return []
    except Exception as e:
        print(f"[Mem0] Error searching memory: {e}")
        return []

def get_all_mem0_memories(user_id: str = "techno_recruit_admin") -> List[Dict[str, Any]]:
    """
    Retrieves all stored Mem0 memories for a given user.
    """
    if not MEM0_API_KEY:
        return []

    headers = {
        "Authorization": f"Token {MEM0_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        resp = requests.get(f"{MEM0_BASE_URL}/memories/?user_id={user_id}", headers=headers, timeout=5)
        if resp.status_code == 200:
            res = resp.json()
            if isinstance(res, list):
                return res
            elif isinstance(res, dict) and "results" in res:
                return res["results"]
        return []
    except Exception as e:
        print(f"[Mem0] Error fetching memories: {e}")
        return []

def record_candidate_screening_memory(candidate_name: str, resume_summary: str, top_roles: List[str], user_id: str = "techno_recruit_admin"):
    """
    Formally records candidate screening result into Mem0.
    """
    roles_str = ", ".join(top_roles)
    messages = [
        {"role": "user", "content": f"Candidate Resume Screening for {candidate_name}: {resume_summary[:500]}"},
        {"role": "assistant", "content": f"Screened candidate {candidate_name}. Qualified roles: {roles_str}."}
    ]
    return add_mem0_memory(messages, user_id=user_id, agent_id="career_navigator_agent")

def record_interview_evaluation_memory(question: str, candidate_answer: str, score: int, strengths: List[str], gaps: List[str], user_id: str = "techno_recruit_admin"):
    """
    Formally records candidate interview evaluation result into Mem0.
    """
    strengths_str = "; ".join(strengths) if strengths else "None"
    gaps_str = "; ".join(gaps) if gaps else "None"
    messages = [
        {"role": "user", "content": f"Interview Question: '{question}' | Candidate Spoken Answer: '{candidate_answer}'"},
        {"role": "assistant", "content": f"Evaluated response with score {score}/5. Key Strengths: {strengths_str}. Gaps/Weaknesses: {gaps_str}."}
    ]
    return add_mem0_memory(messages, user_id=user_id, agent_id="interview_evaluator_agent")
