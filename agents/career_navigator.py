import json
from typing import Dict, Any, List
from groq_client import query_groq_helper


def run_resume_role_suggester_agent(resume_text: str) -> tuple:
    """Career Navigator Agent: analyzes candidate resume and recommends optimal career roles with tiered match scores, extracted hyperlinks, best fit reasoning, and bold highlights."""
    prompt = f"""You are an expert Executive Career Navigator & Senior Talent Analytics Agent.
Analyze the following candidate resume text in exhaustive detail:

--- BEGIN RESUME ---
{resume_text}
--- END RESUME ---

Perform a deep, multi-dimensional evaluation of candidate background, technical skills, leadership initiatives, competitive achievements, work experience, and all extracted hyperlinks.

You MUST extract and compile detailed bullet lists with **bold markdown formatting** for key terms, organizations, project titles, and tech stacks for the following mandatory fields:
1. "candidate_name": Extract the candidate's full name from the top header of the resume (e.g. "Rajkishore S").
2. "why_best_fit": A compelling, highly persuasive 2-3 sentence argument highlighting **why this candidate will be the BEST FIT for hiring teams**, emphasizing their unique execution strengths, technical capabilities, and proven achievements.
3. "profile_and_project_links": List of objects extracted from URLs, GitHub links, LinkedIn profiles, portfolio websites, LeetCode, or project hyperlinks found in the resume. Each object contains:
    - "title": Descriptive label (e.g., "GitHub Profile", "LinkedIn", "Portfolio Website", "DeFai-Nexus Repository", "Live Demo")
    - "url": Valid HTTP/HTTPS URL string extracted from the text (or inferred standard link like "https://github.com/..." if unstated).
4. "leadership_and_community": List 2-4 detailed bullet strings highlighting leadership roles, student community leadership, organizing hackathons or workshops, project lead roles, and peer mentoring. Use **bold markdown** for organization names and position titles.
5. "achievements_and_competitions": List 2-4 detailed bullet strings highlighting hackathon wins, competitive programming achievements, hackathon participations, academic honors, certifications, awards, or technical publications. Use **bold markdown** for awards and event titles.
6. "work_and_internship_experience": List 2-4 detailed bullet strings detailing company internships, SDE/Data Science internship roles, startup contributions, corporate work experience, or client project implementations. Use **bold markdown** for company names and roles.
7. "dynamic_recommendations": List 3-5 specific, dynamic recommendations tailored to this candidate's trajectory to help them improve their resume, fill skill gaps, and unlock higher seniority match scores.

Recommend 3 to 5 matching job roles for this candidate.
For EACH suggested role, calculate match suitability scores (0 to 100%) for three seniority levels:
- "beginner_score": How suitable the candidate is for a Junior/Entry-level position in this role (0-100).
- "intermediate_score": How suitable the candidate is for a Mid-level position in this role (0-100).
- "experienced_score": How suitable the candidate is for a Senior/Lead position in this role (0-100).

Format the output strictly as a JSON object with keys:
- "candidate_name": String
- "candidate_summary": String overview of candidate profile
- "why_best_fit": String explaining why candidate is the best fit
- "profile_and_project_links": List of objects [{{"title": "...", "url": "..."}}]
- "top_skills_identified": List of 5-8 primary technical skills
- "leadership_and_community": List of 2-4 detailed bullet strings with **bold formatting**
- "achievements_and_competitions": List of 2-4 detailed bullet strings with **bold formatting**
- "work_and_internship_experience": List of 2-4 detailed bullet strings with **bold formatting**
- "dynamic_recommendations": List of 3-5 actionable bullet strings
- "suggested_roles": A list of role objects, where each role object contains:
    - "role_title": String
    - "domain": String
    - "match_summary": 1-2 sentence explanation of why candidate fits this role
    - "beginner_score": Integer (0-100)
    - "intermediate_score": Integer (0-100)
    - "experienced_score": Integer (0-100)
    - "key_strengths": List of 3-4 bullet strings (use **bold markdown** for key skills)
    - "skill_gaps": List of 2-3 bullet strings
    - "recommended_next_steps": String

Return ONLY valid JSON. Do not wrap in markdown code blocks.
"""
    return query_groq_helper(prompt, json_mode=True)


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
