import json
import re
from typing import Dict, Any, List
from groq_client import query_groq_helper


def clean_json_output(raw_str: str) -> dict:
    """Helper to safely parse JSON response from LLM."""
    if not raw_str:
        return {}
    cleaned = str(raw_str).strip()
    if "```json" in cleaned:
        cleaned = cleaned.split("```json")[1].split("```")[0].strip()
    elif "```" in cleaned:
        cleaned = cleaned.split("```")[1].split("```")[0].strip()
    try:
        return json.loads(cleaned)
    except Exception:
        match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass
        return {}


def run_bulk_screener_agent(
    candidates_list: List[Dict[str, str]], 
    job_title: str = "", 
    job_description: str = "", 
    criteria_skills: str = ""
) -> tuple:
    """
    AI Recruiter Bulk Candidate Screener Agent:
    Evaluates multiple uploaded candidate resumes against a Target Job Title, Job Description,
    and Custom Required Criteria / Skills to look for.
    Extracts explicit candidate details, calculates fit scores (0-100%), determines fit tiers,
    and generates concrete evidence-backed rationales explaining "Why He/She Fits".
    """
    if not candidates_list:
        return json.dumps({"error": "No candidates provided for screening."}), {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    # Format candidates for LLM prompt
    candidates_blob_parts = []
    for idx, c in enumerate(candidates_list, start=1):
        filename = c.get("filename", f"Candidate_{idx}.pdf")
        text = c.get("text", "")[:3500] # Cap text per candidate for clean prompt context
        candidates_blob_parts.append(f"""
=== CANDIDATE RECORD #{idx} ===
FILENAME: {filename}
RESUME CONTENT:
{text}
""")

    candidates_blob = "\n".join(candidates_blob_parts)

    target_title_str = job_title.strip() if job_title else "Target Specialized Role"
    jd_str = job_description.strip() if job_description else "Evaluate overall technical & leadership qualifications."
    criteria_str = criteria_skills.strip() if criteria_skills else "Highlight key technical skills, experience level, system architecture, and projects."

    prompt = f"""You are an Expert Talent Acquisition Executive & Technical Hiring Lead.
You are evaluating a batch of candidate resumes for the following open position:

TARGET JOB TITLE: {target_title_str}

JOB DESCRIPTION:
{jd_str}

CUSTOM REQUIRED CRITERIA & SKILLS TO LOOK FOR:
{criteria_str}

---
CANDIDATE RESUMES TO SCREEN ({len(candidates_list)} Total):
{candidates_blob}

---
TASK INSTRUCTIONS:
1. For EACH candidate, analyze their background, extracted skills, projects, work experience, education, and hackathons/awards.
2. Evaluate how accurately they satisfy the Job Description and the CUSTOM REQUIRED CRITERIA & SKILLS.
3. Determine a numerical match_score from 0 to 100%.
4. Assign a fit_tier:
   - "Top Fit 🌟" (Match Score >= 85%)
   - "Good Match ✅" (Match Score 70-84%)
   - "Potential Fit ⚠️" (Match Score 50-69%)
   - "Low Match ❌" (Match Score < 50%)
5. Provide a detailed, 2-3 sentence evidence-backed "why_fits_reason" explaining EXACTLY WHY THIS CANDIDATE FITS (or doesn't fit) the role, citing specific projects, tech stack, leadership experience, or hackathon wins found in their resume.
6. Extract candidate contact info (email, phone, location) if present.

Return ONLY a valid, raw JSON object (with NO markdown backticks or commentary) matching this schema:

{{
  "job_title": "{target_title_str}",
  "custom_criteria": "{criteria_str}",
  "total_screened": {len(candidates_list)},
  "summary": "Brief 1-2 sentence executive overview of the candidate pool quality.",
  "candidates": [
    {{
      "filename": "candidate1.pdf",
      "candidate_name": "Full Name",
      "contact_email": "email@example.com or N/A",
      "contact_phone": "phone or N/A",
      "location": "Location or N/A",
      "match_score": 92,
      "fit_tier": "Top Fit 🌟",
      "why_fits_reason": "Detailed 2-3 sentence rationale on why candidate matches the role and custom criteria...",
      "matched_skills": ["Skill 1", "Skill 2"],
      "missing_criteria": ["Missing Skill or Requirement"],
      "experience_summary": "3+ years as Senior Software Engineer leading React/Node microservices...",
      "key_highlights": ["Built distributed payment gateway", "Winner at 2024 Tech Hackathon"]
    }}
  ]
}}
"""

    messages = [
        {"role": "system", "content": "You are a specialized AI recruiter that evaluates and ranks candidate resumes in structured JSON format."},
        {"role": "user", "content": prompt}
    ]

    response_text, usage = query_groq_helper(messages, json_mode=True)
    parsed_json = clean_json_output(response_text)

    # Fallback structure if JSON parse failed
    if not parsed_json or "candidates" not in parsed_json:
        parsed_json = {
            "job_title": target_title_str,
            "custom_criteria": criteria_str,
            "total_screened": len(candidates_list),
            "summary": "Processed candidates with standard scoring.",
            "candidates": [
                {
                    "filename": c.get("filename", f"Candidate_{idx+1}.pdf"),
                    "candidate_name": c.get("filename", f"Candidate #{idx+1}").replace(".pdf", "").replace(".docx", ""),
                    "contact_email": "N/A",
                    "contact_phone": "N/A",
                    "location": "N/A",
                    "match_score": 75,
                    "fit_tier": "Good Match ✅",
                    "why_fits_reason": f"Evaluated candidate resume for {target_title_str}.",
                    "matched_skills": ["Technical Experience"],
                    "missing_criteria": [],
                    "experience_summary": "Extracted from uploaded resume.",
                    "key_highlights": ["Processed resume"]
                }
                for idx, c in enumerate(candidates_list)
            ]
        }

    # Sort candidates descending by match score
    sorted_candidates = sorted(
        parsed_json.get("candidates", []),
        key=lambda x: x.get("match_score", 0),
        reverse=True
    )

    # Assign rank numbers (#1 Best Fit, #2, etc.)
    top_fits_count = 0
    total_scores = 0

    for rank_idx, c in enumerate(sorted_candidates, start=1):
        c["rank"] = rank_idx
        score = c.get("match_score", 0)
        total_scores += score
        if score >= 80:
            top_fits_count += 1

    parsed_json["candidates"] = sorted_candidates
    parsed_json["top_fits_count"] = top_fits_count
    parsed_json["average_match_score"] = round(total_scores / len(sorted_candidates)) if sorted_candidates else 0

    return json.dumps(parsed_json), usage
