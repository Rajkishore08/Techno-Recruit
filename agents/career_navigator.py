import json
import re
from typing import Dict, Any, List
from groq_client import query_groq_helper


def sanitize_bullet_list(items: Any) -> Any:
    """Strips leading bullet characters like '*', '*', '-', '•' and flattens internal newlines/sub-bullets into single articulate bullet sentences."""
    if not isinstance(items, list):
        return items
    cleaned = []
    for item in items:
        if isinstance(item, str):
            # Replace internal linebreaks and sub-bullets with spaces/commas
            s = item.replace('\r', ' ')
            s = re.sub(r'\n+\s*[\-\•\*\>]?\s*', ', ', s)
            s = re.sub(r'\s+', ' ', s).strip()
            # Clean leading bullet markers repeatedly
            while True:
                prev = s
                s = re.sub(r'^[\-\•\*\>]\s*', '', s)
                s = re.sub(r'^\*\s*\*\s+', '', s)
                s = re.sub(r'^\*\s+(?!\*)', '', s)
                s = re.sub(r'^,\s*', '', s)
                if s == prev:
                    break
            cleaned.append(s)
        else:
            cleaned.append(item)
    return cleaned


def enforce_logical_seniority_scores(suggested_roles: Any) -> Any:
    """
    Enforces the logical hiring rule:
    If candidate is qualified for a Mid-Level position (intermediate_score >= 80%),
    their Junior/Beginner match score MUST logically be higher (e.g. 95-100%).
    beginner_score >= intermediate_score ALWAYS holds.
    """
    if not isinstance(suggested_roles, list):
        return suggested_roles
    
    for role in suggested_roles:
        if not isinstance(role, dict):
            continue
        try:
            b = int(role.get("beginner_score", 0))
            i = int(role.get("intermediate_score", 0))
            e = int(role.get("experienced_score", 0))
            
            # If intermediate is high (>= 80), beginner fit should scale up (e.g. min 95 or intermediate + 5)
            if i >= 80:
                target_b = max(b, i + 5, 95)
            else:
                target_b = max(b, i)
            
            role["beginner_score"] = min(100, target_b)
            role["intermediate_score"] = i
            role["experienced_score"] = e
        except (ValueError, TypeError):
            pass
    return suggested_roles


def run_resume_role_suggester_agent(resume_text: str) -> tuple:
    """Career Navigator Agent: analyzes candidate resume and recommends optimal career roles with tiered match scores, extracted hyperlinks, best fit reasoning, and bold highlights."""
    prompt = f"""You are an expert Executive Career Navigator & Senior Talent Analytics Agent.
Analyze the following candidate resume text in exhaustive detail:

--- BEGIN RESUME ---
{resume_text}
--- END RESUME ---

Perform a deep, multi-dimensional evaluation of candidate background, technical skills, leadership initiatives, competitive achievements, work experience, and all extracted hyperlinks.

CRITICAL FORMATTING & LOGICAL SCORING INSTRUCTIONS:
1. Do NOT start bullet strings with asterisks ('*'), hyphens ('-'), or bullet symbols ('•'). Provide clean sentences with **bold markdown** for key titles, companies, awards, and tools.
2. LOGICAL MATCH SCORE HIERARCHY RULE: A candidate's Junior/Beginner match score MUST ALWAYS be greater than or equal to their Mid-level match score (beginner_score >= intermediate_score). If a candidate is 90% fit for a Mid-level role, they are inherently 95-100% fit for Junior/Beginner roles. NEVER assign a lower score to beginner than to intermediate!
3. SPECIALIZED ROLE MATCHING: Recommend highly specific, specialized role titles matching candidate exact tech stack (e.g. "Flutter Developer", "DevOps & Cloud Engineer", "Product Designer & UI/UX Specialist", "React / Frontend Developer", "Node.js / Backend Engineer", "Full Stack Developer", "Data Engineer", "AI/ML Engineer", "QA Automation Engineer"). Avoid returning only generic titles like "Software Engineer" when specific roles apply!

Extract and compile detailed bullet lists with **bold markdown formatting** for:
1. "candidate_name": Extract candidate's full name from resume header.
2. "why_best_fit": A compelling 2-3 sentence argument highlighting **why candidate is the BEST FIT for hiring teams**.
3. "profile_and_project_links": List of objects extracted from URLs, GitHub, LinkedIn, portfolio, or project links [{{"title": "...", "url": "..."}}].
4. "leadership_and_community": List 2-4 detailed bullet strings (use **bold markdown** for orgs/titles). Do NOT include leading '* ' or '- '.
5. "achievements_and_competitions": List 2-4 detailed bullet strings (use **bold markdown** for awards/events). Do NOT include leading '* ' or '- '.
6. "work_and_internship_experience": List 2-4 detailed bullet strings (use **bold markdown** for companies/roles). Do NOT include leading '* ' or '- '.
7. "dynamic_recommendations": List 3-5 specific bullet strings to help candidate boost match scores.

Recommend 3 to 5 matching job roles for this candidate.
For EACH suggested role, calculate match suitability scores (0 to 100%) for three seniority levels:
- "beginner_score": How suitable candidate is for a Junior/Entry-level position (MUST BE >= intermediate_score, 0-100).
- "intermediate_score": How suitable candidate is for a Mid-level position (0-100).
- "experienced_score": How suitable candidate is for a Senior/Lead position (0-100).

Format output strictly as JSON:
- "candidate_name": String
- "candidate_summary": String overview of candidate profile
- "why_best_fit": String explaining why candidate is best fit
- "profile_and_project_links": List of objects [{{"title": "...", "url": "..."}}]
- "top_skills_identified": List of 5-8 primary technical skills
- "leadership_and_community": List of 2-4 bullet strings
- "achievements_and_competitions": List of 2-4 bullet strings
- "work_and_internship_experience": List of 2-4 bullet strings
- "dynamic_recommendations": List of 3-5 actionable bullet strings
- "suggested_roles": List of objects [{{"role_title": "...", "domain": "...", "match_summary": "...", "beginner_score": int, "intermediate_score": int, "experienced_score": int, "key_strengths": [...], "skill_gaps": [...], "recommended_next_steps": "..."}}]

Return ONLY valid JSON.
"""
    json_str, usage = query_groq_helper(prompt, json_mode=True)
    try:
        data = json.loads(json_str)
        data["leadership_and_community"] = sanitize_bullet_list(data.get("leadership_and_community", []))
        data["achievements_and_competitions"] = sanitize_bullet_list(data.get("achievements_and_competitions", []))
        data["work_and_internship_experience"] = sanitize_bullet_list(data.get("work_and_internship_experience", []))
        data["dynamic_recommendations"] = sanitize_bullet_list(data.get("dynamic_recommendations", []))
        
        if "suggested_roles" in data:
            data["suggested_roles"] = enforce_logical_seniority_scores(data["suggested_roles"])
            for role in data["suggested_roles"]:
                if "role_title" in role and isinstance(role["role_title"], str):
                    role["role_title"] = role["role_title"].replace('*', '').strip()
                if "domain" in role and isinstance(role["domain"], str):
                    role["domain"] = role["domain"].replace('*', '').strip()
                role["key_strengths"] = sanitize_bullet_list(role.get("key_strengths", []))
                role["skill_gaps"] = sanitize_bullet_list(role.get("skill_gaps", []))
                
        json_str = json.dumps(data)
    except Exception:
        pass
    return json_str, usage



def run_resume_jd_matcher_agent(resume_text: str, job_title: str, job_description: str, experience_level: str) -> tuple:
    """Resume vs JD Matcher Agent: evaluates candidate fit for specific job description and generates 3 custom resume questions."""
    prompt = f"""You are a Senior Talent Acquisition & Technical Screener Agent.
Compare the following Candidate Resume against the Target Job Opening:

Job Title: {job_title}
Seniority Level: {experience_level}
Job Description:
{job_description}

--- CANDIDATE RESUME ---
{resume_text}
--- END CANDIDATE RESUME ---

Perform a deep match analysis:
1. Overall Match Fit Percentage (0 to 100).
2. Fit Category (e.g. "Exceptional Match", "Strong Match", "Moderate Fit", "Requires Upskilling").
3. List of Matched Skills & Qualifications.
4. List of Missing Requirements or Potential Gaps.
5. Generate exactly THREE (3) highly personalized, custom interview questions tailored specifically to the candidate's actual projects, achievements, or employment history mentioned in their resume relative to this job opening.

Format the output strictly as a JSON object with keys:
- "overall_fit_score": Integer (0-100)
- "fit_level": String
- "summary_reasoning": 2-3 sentence overview of fit
- "matched_skills": List of strings
- "missing_requirements": List of strings
- "personalized_questions": A list of 3 objects, each containing:
    - "id": Integer (1, 2, 3)
    - "question": Question text referencing candidate's specific background or project
    - "focus_area": Target skill or experience being probed
    - "sample_ideal_answer": Sample ideal candidate response grounded in their resume context

Return ONLY valid JSON. Do not wrap in markdown code blocks.
"""
    return query_groq_helper(prompt, json_mode=True)
