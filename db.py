import os
import sys
import time
import uuid
import json
from typing import Dict, Any, List, Optional

LOCAL_CAREER_DB = "career_analyses_db.json"
LOCAL_GUIDES_DB = "interview_guides_db.json"

DEFAULT_CANDIDATES = [
    {
        "analysis_id": "career_rajkishore_default",
        "uid": "anonymous",
        "candidate_name": "Raj Kishore S",
        "version": 1,
        "filename": "RajKishore_FullStack_Resume.pdf",
        "timestamp": 1770000000,
        "resume_snippet": "Full-stack AI developer with expertise in React, Node.js, Python, Vector DB RAG architectures, and GDG Campus Lead experience.",
        "resume_text": "Raj Kishore S. Highly skilled full-stack AI engineer. GDG CIT Campus Lead, Student Developers Cell Co-Founder. Hackathon Winner (IBM Quantum Challenge, CryptoShield, HackVerse 5.0). Built Techno Badge and Techno Recruit.",
        "data": {
            "candidate_name": "Raj Kishore S",
            "candidate_summary": "Highly skilled full-stack developer with expertise in AI agents, software systems, and data engineering, complemented by GDSC leadership experience.",
            "why_best_fit": "Raj Kishore S stands out due to his unique blend of technical expertise, hackathon championships, and proven student leadership.",
            "top_skills_identified": ["React.js", "Node.js", "Python", "Vector RAG", "Firestore", "FastAPI", "MongoDB"],
            "leadership_and_community": [
                "Campus Lead (Google Developer Group - CIT): Hosted technical events and hackathons.",
                "Co-Founder & Associate Director (Student Developers Cell - CIT): Scaled technical growth."
            ],
            "achievements_and_competitions": [
                "Winner (IBM Quantum Challenge 2023): Awarded 1st place.",
                "Runner Up (CryptoShield 2K24): Awarded 2nd place.",
                "Winner (HackVerse 5.0): Awarded 1st place."
            ],
            "work_and_internship_experience": [
                "Full Stack Developer Intern (Xthlete): Enhanced React.js & Node.js web analytics.",
                "Full Stack Developer Intern (TIA IT): Built RESTful APIs with Node.js & Express."
            ],
            "suggested_roles": [
                {
                    "role_title": "Full Stack Engineer",
                    "domain": "Software Engineering",
                    "beginner_score": 95,
                    "intermediate_score": 92,
                    "experienced_score": 88,
                    "match_summary": "Exceptional alignment for full-stack engineering."
                }
            ]
        }
    },
    {
        "analysis_id": "career_alex_chen",
        "uid": "anonymous",
        "candidate_name": "Alex Chen",
        "version": 1,
        "filename": "AlexChen_Flutter_Resume.pdf",
        "timestamp": 1770000100,
        "resume_snippet": "Senior Mobile Developer specializing in Flutter, Dart, BLoC state management, and cross-platform native iOS & Android apps.",
        "resume_text": "Alex Chen. 4+ years Flutter & Dart mobile engineering experience. Built 8 production apps on App Store and Play Store.",
        "data": {
            "candidate_name": "Alex Chen",
            "candidate_summary": "Senior mobile engineer with deep technical mastery in Flutter SDK, Dart, BLoC architecture, and mobile UI performance optimization.",
            "why_best_fit": "Alex Chen brings 4+ years of cross-platform mobile expertise with high production app delivery speed.",
            "top_skills_identified": ["Flutter", "Dart", "BLoC Pattern", "iOS & Android Native", "Firebase", "REST APIs"],
            "leadership_and_community": ["Mobile Tech Speaker & Open Source Flutter Contributor"],
            "achievements_and_competitions": ["Published 8+ production apps on App Store & Google Play"],
            "work_and_internship_experience": ["Senior Flutter Developer at MobileTech Solutions (2022-Present)"],
            "suggested_roles": [
                {
                    "role_title": "Flutter Developer",
                    "domain": "Mobile Engineering",
                    "beginner_score": 94,
                    "intermediate_score": 90,
                    "experienced_score": 86,
                    "match_summary": "Outstanding fit for Flutter & mobile architecture."
                }
            ]
        }
    },
    {
        "analysis_id": "career_devin_vance",
        "uid": "anonymous",
        "candidate_name": "Devin Vance",
        "version": 1,
        "filename": "DevinVance_DevOps_Resume.pdf",
        "timestamp": 1770000200,
        "resume_snippet": "DevOps & Cloud Architect specializing in AWS, Docker, Kubernetes, Terraform, CI/CD pipelines, and high availability system design.",
        "resume_text": "Devin Vance. AWS Certified Solutions Architect & SRE Specialist. Automated CI/CD pipelines and infrastructure for 50+ microservices.",
        "data": {
            "candidate_name": "Devin Vance",
            "candidate_summary": "Cloud Architect with expertise in AWS, Kubernetes cluster management, Docker containerization, and Infrastructure as Code.",
            "why_best_fit": "Devin Vance excels in cloud scalability, automated deployments, and zero-downtime microservices infrastructure.",
            "top_skills_identified": ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD Pipelines", "Linux", "Prometheus"],
            "leadership_and_community": ["AWS Community Builder & Cloud Security Mentor"],
            "achievements_and_competitions": ["AWS Certified Solutions Architect Professional"],
            "work_and_internship_experience": ["Lead SRE & Cloud Architect at CloudScale Systems"],
            "suggested_roles": [
                {
                    "role_title": "DevOps & Cloud Engineer",
                    "domain": "Infrastructure & Cloud",
                    "beginner_score": 96,
                    "intermediate_score": 93,
                    "experienced_score": 89,
                    "match_summary": "Perfect alignment for DevOps & Infrastructure engineering."
                }
            ]
        }
    }
]


def _read_local_json(filepath: str) -> List[Dict[str, Any]]:
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data:
                    return data
        except Exception:
            pass

    if filepath == LOCAL_CAREER_DB:
        _write_local_json(LOCAL_CAREER_DB, DEFAULT_CANDIDATES)
        return DEFAULT_CANDIDATES

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
        "resume_text": resume_text or "",
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

    # 3. Automatic Vector DB Indexing (Pinecone + TF-IDF Vector Space)
    try:
        from agents.talent_search import upsert_candidate_to_vector_db
        upsert_candidate_to_vector_db(record)
    except Exception as ve:
        print(f"Vector DB indexing notice: {ve}")

    return record


def get_user_career_analyses(user_uid: str) -> List[Dict[str, Any]]:
    """Retrieves all past career analysis sessions for a given user UID."""
    results = _read_local_json(LOCAL_CAREER_DB)
    seen_ids = {r.get("analysis_id") for r in results if r.get("analysis_id")}

    # Try Cloud Firestore to fetch any additional cloud records
    try:
        from firebase_admin import firestore
        db = firestore.client()
        if user_uid and user_uid != "anonymous":
            docs = db.collection("career_analyses").where("uid", "==", user_uid).limit(50).stream()
        else:
            docs = db.collection("career_analyses").limit(50).stream()
        for doc in docs:
            d = doc.to_dict()
            if d.get("analysis_id") not in seen_ids:
                results.append(d)
                seen_ids.add(d.get("analysis_id"))
    except Exception as e:
        print(f"Firestore career history read notice: {e}")

    results.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    return results


def get_interview_guide(guide_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a saved interview guide by ID, checking Firestore first and falling back to local JSON."""
    # 1. Try Cloud Firestore
    try:
        from firebase_admin import firestore
        db = firestore.client()
        doc = db.collection("guides").document(guide_id).get()
        if doc.exists:
            return doc.to_dict()
    except Exception:
        pass
        
    # 2. Local Fallback
    local_guides = _read_local_json(LOCAL_GUIDES_DB)
    for g in local_guides:
        if g.get("guide_id") == guide_id:
            return g
    return None


def update_interview_guide(guide_id: str, updated_fields: Dict[str, Any]) -> bool:
    """Updates a saved interview guide by ID across Firestore and local JSON."""
    success = False
    # 1. Firestore Update
    try:
        from firebase_admin import firestore
        db = firestore.client()
        db.collection("guides").document(guide_id).update(updated_fields)
        success = True
    except Exception:
        pass
        
    # 2. Local Update
    try:
        local_guides = _read_local_json(LOCAL_GUIDES_DB)
        updated = False
        for g in local_guides:
            if g.get("guide_id") == guide_id:
                g.update(updated_fields)
                updated = True
                break
        if updated:
            _write_local_json(LOCAL_GUIDES_DB, local_guides)
            success = True
    except Exception:
        pass
        
    return success


def get_user_interview_guides(user_uid: str) -> List[Dict[str, Any]]:
    """Retrieves all past interview guide sessions for a given user UID, with local JSON fallback."""
    results = []
    # 1. Try Cloud Firestore first
    try:
        from firebase_admin import firestore
        db = firestore.client()
        if user_uid and user_uid != "anonymous":
            docs = db.collection("guides").where("uid", "==", user_uid).stream()
        else:
            docs = db.collection("guides").limit(50).stream()
        results = [doc.to_dict() for doc in docs]
    except Exception as e:
        print(f"Firestore guides history read notice: {e}")

    # 2. Fallback/Merge local persistence
    local_guides = _read_local_json(LOCAL_GUIDES_DB)
    seen_ids = {g.get("guide_id") for g in results if g.get("guide_id")}
    for lg in local_guides:
        if lg.get("guide_id") not in seen_ids:
            results.append(lg)

    results.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    return results
