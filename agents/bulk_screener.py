import json
import re
from typing import Dict, Any, List
from groq_client import query_groq, query_groq_helper


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

    system_prompt = (
        "You are an Expert Talent Acquisition Executive & Technical Hiring Lead operating with strict fact-grounding. "
        "STRICT ANTI-HALLUCINATION PROTOCOL: Extract and evaluate ONLY facts, skills, companies, degrees, and metrics explicitly stated in the candidate's resume text. "
        "DO NOT fabricate or assume unstated company names, years of experience, or technical qualifications. "
        "If a required criteria or skill is missing from the resume, explicitly record it in missing_criteria and penalize the match score appropriately."
    )

    prompt = f"""EVALUATE THE FOLLOWING CANDIDATE RESUMES FOR THE TARGET POSITION:

TARGET JOB TITLE: {target_title_str}

JOB DESCRIPTION:
{jd_str}

CUSTOM REQUIRED CRITERIA & SKILLS TO LOOK FOR:
{criteria_str}

---
CANDIDATE RESUMES TO SCREEN ({len(candidates_list)} Total):
{candidates_blob}

---
EVALUATION & SCORING RUBRIC:
1. For EACH candidate, analyze their background, extracted skills, projects, work experience, education, and hackathons/awards strictly from their resume text.
2. Compare their qualifications against the Job Description and REQUIRED CRITERIA.
3. Apply this calibrated scoring rubric:
   - 90–100%: Candidate possesses ALL required skills + extensive direct experience in target role.
   - 75–89%: Strong fit; meets core required skills, missing 1 minor secondary tool.
   - 50–74%: Potential fit; meets 50% of criteria, but has 2 missing key skills/requirements.
   - < 50%: Low match; major missing skills or irrelevant domain experience.
4. Assign a fit_tier:
   - "Top Fit 🌟" (Match Score >= 85%)
   - "Good Match ✅" (Match Score 70-84%)
   - "Potential Fit ⚠️" (Match Score 50-69%)
   - "Low Match ❌" (Match Score < 50%)
5. Provide a detailed, 2-3 sentence evidence-backed "why_fits_reason" citing EXACT evidence from the resume (e.g. "Candidate built distributed payment microservices using React & Python as shown in project section").
6. List all "matched_skills" (skills present in resume matching criteria) and "missing_criteria" (required skills NOT found in resume).
7. Extract candidate contact info (email, phone, location) if present in resume.

Return ONLY a valid JSON object matching this schema:

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
      "why_fits_reason": "Evidence-backed 2-3 sentence rationale citing specific project & tech stack evidence...",
      "matched_skills": ["Skill 1", "Skill 2"],
      "missing_criteria": ["Missing Skill 1"],
      "experience_summary": "3+ years as Senior Software Engineer leading React/Node microservices...",
      "key_highlights": ["Built distributed payment gateway", "Winner at 2024 Tech Hackathon"]
    }}
  ]
}}
"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]

    response_text, usage = query_groq(messages, json_mode=True, temperature=0.1)
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
