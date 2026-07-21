import os
import sys
import time
import uuid
import json
from typing import Dict, Any, List

LOCAL_CAREER_DB = "career_analyses_db.json"
LOCAL_GUIDES_DB = "interview_guides_db.json"


def _read_local_json(filepath: str) -> List[Dict[str, Any]]:
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def _write_local_json(filepath: str, data: List[Dict[str, Any]]):
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error writing local DB {filepath}: {e}")


def save_interview_guide(
    guide_id: str,
    job_title: str,
    experience_level: str,
    questions_json: str,
    uid: str
) -> str:
    """Saves the finalized interview guide list in Cloud Firestore and local DB."""
    try:
        data_parsed = json.loads(questions_json)
        if isinstance(data_parsed, dict) and "questions" in data_parsed:
            questions = data_parsed["questions"]
        elif isinstance(data_parsed, dict) and "drafts" in data_parsed:
            questions = data_parsed["drafts"]
        else:
            questions = data_parsed

        record = {
            "guide_id": guide_id,
            "uid": uid or "anonymous",
            "job_title": job_title,
            "experience_level": experience_level,
            "questions": questions,
            "timestamp": time.time()
        }

        # 1. Local Persistence
        guides = _read_local_json(LOCAL_GUIDES_DB)
        # Update if exists, else append
        guides = [g for g in guides if g.get("guide_id") != guide_id]
        guides.insert(0, record)
        _write_local_json(LOCAL_GUIDES_DB, guides)

        # 2. Firestore Persistence
        try:
            from firebase_admin import firestore
            db = firestore.client()
            db.collection("guides").document(guide_id).set(record)
        except Exception:
            pass

        return "SUCCESS"
    except Exception as e:
        return f"ERROR: {str(e)}"


def update_saved_guide_metrics(guide_id: str, metrics: dict, job_analysis: dict):
    """Enriches the saved DB record with token/latency metrics and requirements analysis details."""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        db.collection("guides").document(guide_id).update({
            "metrics": metrics,
            "job_analysis": job_analysis
        })
    except Exception:
        pass


def save_career_analysis(
    user_uid: str, 
    filename: str, 
    resume_text: str, 
    analysis_data: Dict[str, Any],
    candidate_name: str = None,
    parent_analysis_id: str = None
) -> Dict[str, Any]:
    """Saves a Career Navigator analysis session with version tracking per candidate profile."""
    analysis_id = f"career_{uuid.uuid4().hex[:8]}"
    
    c_name = candidate_name or analysis_data.get("candidate_name") or "Candidate Profile"
    
    version = 1
    existing = get_user_career_analyses(user_uid)
    candidate_records = [r for r in existing if r.get("candidate_name", "").strip().lower() == c_name.strip().lower() or r.get("analysis_id") == parent_analysis_id]
    if candidate_records:
        version = len(candidate_records) + 1

    record = {
        "analysis_id": analysis_id,
        "parent_analysis_id": parent_analysis_id,
        "uid": user_uid or "anonymous",
        "candidate_name": c_name,
        "version": version,
        "filename": filename or "resume.pdf",
        "timestamp": int(time.time()),
        "resume_snippet": resume_text[:300] if resume_text else "",
        "data": analysis_data
    }

    # 1. Save to local JSON fallback
    local_records = _read_local_json(LOCAL_CAREER_DB)
    local_records.insert(0, record)
    _write_local_json(LOCAL_CAREER_DB, local_records)

    # 2. Save to Cloud Firestore
    try:
        from firebase_admin import firestore
        db = firestore.client()
        db.collection("career_analyses").document(analysis_id).set(record)
    except Exception as e:
        print(f"Firestore career analysis save notice: {e}")

    return record


def get_user_career_analyses(user_uid: str) -> List[Dict[str, Any]]:
    """Retrieves all past career analysis sessions for a given user UID."""
    results = []
    # Try Cloud Firestore first
    try:
        from firebase_admin import firestore
        db = firestore.client()
        if user_uid and user_uid != "anonymous":
            docs = db.collection("career_analyses").where("uid", "==", user_uid).stream()
        else:
            docs = db.collection("career_analyses").limit(50).stream()
        results = [doc.to_dict() for doc in docs]
    except Exception as e:
        print(f"Firestore career history read notice: {e}")

    # Fallback/Merge local persistence
    local_records = _read_local_json(LOCAL_CAREER_DB)
    seen_ids = {r.get("analysis_id") for r in results if r.get("analysis_id")}
    for lr in local_records:
        if lr.get("analysis_id") not in seen_ids:
            results.append(lr)

    results.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    return results
