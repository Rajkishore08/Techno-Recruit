import os
import sys
import time
import uuid
import json
from typing import Dict, Any, List


def save_interview_guide(
    guide_id: str,
    job_title: str,
    experience_level: str,
    questions_json: str,
    uid: str
) -> str:
    """Saves the finalized interview guide list in the Cloud Firestore database."""
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
            "uid": uid,
            "job_title": job_title,
            "experience_level": experience_level,
            "questions": questions,
            "timestamp": time.time()
        }

        from firebase_admin import firestore
        db = firestore.client()
        db.collection("guides").document(guide_id).set(record)
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
    """Saves a Career Navigator analysis session into Firestore with version tracking per candidate profile."""
    analysis_id = f"career_{uuid.uuid4().hex[:8]}"
    
    # Extract candidate name from parsed data if not explicitly provided
    c_name = candidate_name or analysis_data.get("candidate_name") or "Candidate Profile"
    
    version = 1
    if parent_analysis_id or user_uid:
        try:
            existing = get_user_career_analyses(user_uid)
            # Find matching candidate sessions to determine version number
            candidate_records = [r for r in existing if r.get("candidate_name", "").strip().lower() == c_name.strip().lower() or r.get("analysis_id") == parent_analysis_id]
            if candidate_records:
                version = len(candidate_records) + 1
        except Exception:
            version = 1

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

    try:
        from firebase_admin import firestore
        db = firestore.client()
        db.collection("career_analyses").document(analysis_id).set(record)
    except Exception as e:
        print(f"Firestore career analysis save fallback/warning: {e}")

    return record


def get_user_career_analyses(user_uid: str) -> List[Dict[str, Any]]:
    """Retrieves all past career analysis sessions for a given user UID from Firestore."""
    if not user_uid:
        return []
    try:
        from firebase_admin import firestore
        db = firestore.client()
        docs = db.collection("career_analyses").where("uid", "==", user_uid).stream()
        results = [doc.to_dict() for doc in docs]
        results.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
        return results
    except Exception as e:
        print(f"Firestore career history read error: {e}")
        return []
