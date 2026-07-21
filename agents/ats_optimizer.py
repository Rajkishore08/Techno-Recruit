import json
from groq_client import query_groq_helper


def run_ats_optimizer_agent(resume_text: str, job_title: str, job_description: str) -> tuple:
    """
    AI Resume Enhancer & ATS Optimizer Agent:
    Compares candidate resume against target Job Description, conducts ATS keyword gap analysis,
    and generates a fully tailored, high-scoring ATS resume with action verbs and impact metrics.
    """
    prompt = f"""You are a Master Certified Executive Resume Writer & Senior ATS Optimization Specialist Agent.
Perform a comprehensive ATS audit and resume enhancement for the candidate targeting this specific job opening:

TARGET JOB TITLE: {job_title}
TARGET JOB DESCRIPTION:
{job_description}

--- CANDIDATE CURRENT RESUME ---
{resume_text}
--- END CANDIDATE RESUME ---

Perform a deep ATS gap analysis and resume rewrite:
1. "ats_score": Calculate an overall ATS compatibility match percentage (0 to 100).
2. "matched_keywords": List 5-10 technical skills, tools, methodologies, and qualifications found in BOTH the resume and Job Description.
3. "missing_keywords": List 4-8 critical ATS keywords, certifications, tools, or frameworks present in the Job Description but MISSING from the current resume.
4. "formatting_and_impact_improvements": List 3-5 specific, actionable bullet points recommending how to improve bullet impact (using strong action verbs and quantitative metrics like %, $, time saved).
5. "ats_optimized_resume_text": Write a COMPLETE, beautifully formatted, professional, ATS-optimized version of the resume. Incorporate the missing keywords naturally, enhance action verbs, structure clear sections (HEADER, SUMMARY, CORE COMPETENCIES, WORK EXPERIENCE, PROJECTS, EDUCATION), and highlight impact metrics.

Format the output strictly as a JSON object with keys:
- "job_title": "{job_title}"
- "ats_score": Integer (0-100)
- "matched_keywords": List of strings
- "missing_keywords": List of strings
- "formatting_and_impact_improvements": List of strings
- "ats_optimized_resume_text": String (full enhanced text ready for ATS submission)

Return ONLY valid JSON.
"""
    return query_groq_helper(prompt, json_mode=True)
