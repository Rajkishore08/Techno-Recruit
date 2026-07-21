import os
import sys
import site

# Ensure user site-packages are registered in path
user_site = site.getusersitepackages()
if user_site and user_site not in sys.path:
    sys.path.insert(0, user_site)

import json
import uuid
import time
import urllib.request
import urllib.error
from typing import Dict, Any, List, Generator
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_FILE = os.path.join(os.path.dirname(__file__), "interview_guides_db.json")

# =====================================================================
# Groq API Request Helpers (Standard Library only for bulletproof deps)
# =====================================================================

def query_groq(messages: List[Dict[str, str]], tools: List[Dict[str, Any]] = None, json_mode: bool = False) -> tuple:
    """
    Queries the Groq API and returns a tuple of (response_text, token_usage).
    Bypasses Cloudflare limits by setting a browser User-Agent header.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in environment.")

    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.1
    }
    
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
        
    if tools:
        payload["tools"] = tools

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            content = res_json["choices"][0]["message"].get("content", "")
            usage = res_json.get("usage", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0})
            return content, usage
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        raise RuntimeError(f"Groq API returned HTTP error: {e.code} - {err_msg}")
    except Exception as e:
        raise RuntimeError(f"Failed to reach Groq API: {str(e)}")


def query_groq_helper(prompt: str, json_mode: bool = False) -> tuple:
    """Helper to query Groq for single prompt sub-tasks inside tools, returning (content, usage)."""
    messages = [{"role": "user", "content": prompt}]
    return query_groq(messages, json_mode=json_mode)


# =====================================================================
# Specialist Sub-Agents Calls (Simulated Orchestrator Tasks)
# =====================================================================

def run_jd_parser_agent(job_title: str, job_description: str, experience_level: str) -> tuple:
    """JD Parser Agent: structured extraction of candidate profile and technical domains."""
    prompt = f"""You are a specialized HR JD Parser Agent.
Analyze the following Job Title and Job Description for a candidate at '{experience_level}' seniority level:
Job Title: {job_title}
Job Description:
{job_description}

Extract:
1. technical_competencies: A list of 4-6 key technical skills, tools, or frameworks required.
2. soft_skills: A list of 2-3 key communication, leadership, or culture fit requirements.
3. candidate_profile: A 2-3 sentence summary of the target candidate persona.

Format the output strictly as a JSON object with keys: "technical_competencies", "soft_skills", "candidate_profile". Do not wrap in markdown code blocks.
"""
    return query_groq_helper(prompt, json_mode=True)


def run_syllabus_agent(job_analysis_json: str) -> tuple:
    """Syllabus Designer Agent: designs a topics framework/curriculum based on JD analysis."""
    prompt = f"""You are a Screening Syllabus Agent.
Based on the Job Description analysis below, outline an interview curriculum (syllabus) listing exactly what areas we should test.
For each area, specify:
1. Topic name
2. Core concepts to focus on
3. Expected knowledge depth for this role

Job Analysis Profile:
{job_analysis_json}

Format the output strictly as a JSON list of topics under the key "syllabus". Do not wrap in markdown code blocks.
"""
    return query_groq_helper(prompt, json_mode=True)


def run_question_writer_agent(syllabus_json: str, categories: List[str], count: int) -> tuple:
    """Question Generator Agent: writes initial drafts of questions mapping to syllabus modules."""
    prompt = f"""You are a Question Generator Agent.
Based on the Screening Syllabus below, generate exactly {count} interview questions.
Distribute the questions across these categories: {", ".join(categories)}.
Each question must target a topic in the syllabus.

Syllabus Profile:
{syllabus_json}

For each question, provide:
1. "id": A simple integer ID (1, 2, ...).
2. "question": The question text.
3. "category": The category of this question.
4. "target_skill": The target concept being evaluated.
5. "difficulty": Estimated difficulty (Easy, Medium, Hard).

Format the output strictly as a JSON list of draft questions under the key "drafts". Do not wrap in markdown code blocks.
"""
    return query_groq_helper(prompt, json_mode=True)


def run_interviewer_critic_agent(draft_questions_json: str, job_analysis_json: str) -> tuple:
    """Critic Agent: critiques questions on duplication, difficulty level alignment, and style constraints."""
    prompt = f"""You are an Interview Critic Agent.
Evaluate the following drafted interview questions against the Target Candidate Requirements Profile.
Determine if each question is:
- Appropriate for the seniority level (e.g. not too easy for Senior, not too hard for Junior).
- Clear, unique (no duplicate concepts), and professionally worded.

Target Profile:
{job_analysis_json}

Drafted Questions:
{draft_questions_json}

Output a feedback report. For each question, output:
1. "id": The integer ID of the question.
2. "status": Either "APPROVED" or "REJECTED".
3. "feedback": A brief explanation of why it was approved or rejected (how to fix it).

Format the output strictly as a JSON list of reviews under the key "critic_reviews". Do not wrap in markdown code blocks.
"""
    return query_groq_helper(prompt, json_mode=True)


def run_question_refiner_agent(draft_questions_json: str, critic_feedback_json: str) -> tuple:
    """Refiner Agent: rewrites rejected draft questions incorporating critic recommendations."""
    prompt = f"""You are a Question Refiner Agent.
You must update the drafted questions that were REJECTED by the Interview Critic Agent.
Keep all APPROVED questions exactly as they are.
For any REJECTED question, rewrite the question text and target skill based on the Critic's feedback.

Original Drafts:
{draft_questions_json}

Critic's Feedback:
{critic_feedback_json}

Provide the output strictly in the same format: a JSON list of updated questions containing "id", "question", "category", "target_skill", and "difficulty" under the key "drafts". Do not wrap in markdown code blocks.
"""
    return query_groq_helper(prompt, json_mode=True)


def run_scorecard_architect_agent(questions_json: str) -> tuple:
    """Scorecard Agent: generates model answers, rationales, and structured evaluation rubrics."""
    prompt = f"""You are a Scorecard Architect Agent.
For each of the interview questions below, add:
1. "rationale": A brief description of what the question assesses.
2. "model_answer": A detailed ideal candidate response.
3. "grading_rubric": An object with keys "1", "3", and "5" detailing what constitutes a Poor (1), Good (3), and Excellent (5) response.

Questions list:
{questions_json}

Format the output strictly as a JSON list of finalized questions under the key "questions". Each question should contain:
"id", "question", "category", "target_skill", "difficulty", "rationale", "model_answer", "grading_rubric" (an object with keys "1", "3", "5").
Do not wrap in markdown code blocks.
"""
    return query_groq_helper(prompt, json_mode=True)


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


# =====================================================================
# Database Operations
# =====================================================================

def save_interview_guide(
    guide_id: str,
    job_title: str,
    experience_level: str,
    questions_json: str,
    uid: str
) -> str:
    """Saves the finalized interview guide list in the database."""
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


# =====================================================================
# Redesigned Multi-Agent Loop Orchestrator (SSE Generator)
# =====================================================================

def run_interview_generator_agent(
    details: Dict[str, Any]
) -> Generator[Dict[str, Any], None, None]:
    """
    Executes the multi-agent orchestration pipeline.
    Yields events with visual phase indicators to drive the flowchart.
    Calculates cost/latency/token metrics dynamically.
    """
    start_time = time.time()
    
    total_prompt_tokens = 0
    total_completion_tokens = 0
    
    def accumulate_tokens(usage):
        nonlocal total_prompt_tokens, total_completion_tokens
        total_prompt_tokens += usage.get("prompt_tokens", 0)
        total_completion_tokens += usage.get("completion_tokens", 0)

    job_title = details.get("job_title", "Software Engineer")
    job_description = details.get("job_description", "")
    experience_level = details.get("experience_level", "Senior")
    categories = details.get("categories", ["Technical", "Behavioral"])
    count = details.get("count", 5)
    uid = details.get("uid", "")
    resume_text = details.get("resume_text", "")

    resume_match_obj = None

    # ------------------------------------------------------------
    # 0. RESUME MATCHER AGENT (OPTIONAL)
    # ------------------------------------------------------------
    if resume_text and resume_text.strip():
        yield {
            "phase": "RESUME_MATCHER",
            "message": f"🤖 [Resume Screener Agent] Cross-referencing candidate resume against '{job_title}' requirements...",
            "iteration": 0
        }
        try:
            match_json_str, usage = run_resume_jd_matcher_agent(resume_text, job_title, job_description, experience_level)
            accumulate_tokens(usage)
            resume_match_obj = json.loads(match_json_str)
            yield {
                "phase": "OBSERVE",
                "message": f"[Resume Screener Agent] Calculated {resume_match_obj.get('overall_fit_score', 0)}% JD fit match.",
                "tool": "resume_matcher",
                "result": match_json_str,
                "iteration": 0
            }
        except Exception as e:
            yield {"phase": "OBSERVE", "message": f"[Resume Screener Agent] Resume parse note: {str(e)}", "tool": "resume_matcher", "result": "{}", "iteration": 0}

    # ------------------------------------------------------------
    # 1. JD PARSER AGENT
    # ------------------------------------------------------------
    yield {
        "phase": "JD_PARSER",
        "message": f"🤖 [JD Parser Agent] Running requirements parsing for '{job_title}'...",
        "iteration": 1
    }
    
    try:
        jd_analysis, usage = run_jd_parser_agent(job_title, job_description, experience_level)
        accumulate_tokens(usage)
        yield {
            "phase": "OBSERVE",
            "message": "[JD Parser Agent] Parsed job details and extracted target persona.",
            "tool": "jd_parser",
            "result": jd_analysis,
            "iteration": 1
        }
    except Exception as e:
        yield {"phase": "ERROR", "message": f"JD Parser Agent failed: {str(e)}", "iteration": 1}
        return

    # ------------------------------------------------------------
    # 2. SYLLABUS AGENT
    # ------------------------------------------------------------
    yield {
        "phase": "SYLLABUS",
        "message": "🤖 [Syllabus Agent] Compiling interview screening syllabus modules...",
        "iteration": 2
    }
    
    try:
        syllabus, usage = run_syllabus_agent(jd_analysis)
        accumulate_tokens(usage)
        yield {
            "phase": "OBSERVE",
            "message": "[Syllabus Agent] Syllabus designed successfully.",
            "tool": "syllabus_designer",
            "result": syllabus,
            "iteration": 2
        }
    except Exception as e:
        yield {"phase": "ERROR", "message": f"Syllabus Agent failed: {str(e)}", "iteration": 2}
        return

    # ------------------------------------------------------------
    # 3. QUESTION GENERATOR AGENT
    # ------------------------------------------------------------
    yield {
        "phase": "GENERATING",
        "message": f"🤖 [Question Generator Agent] Drafting {count} questions targeting syllabus blocks...",
        "iteration": 3
    }
    
    try:
        drafts, usage = run_question_writer_agent(syllabus, categories, count)
        accumulate_tokens(usage)
        yield {
            "phase": "OBSERVE",
            "message": f"[Question Generator Agent] Raw questions drafted.",
            "tool": "question_writer",
            "result": drafts,
            "iteration": 3
        }
    except Exception as e:
        yield {"phase": "ERROR", "message": f"Question Generator Agent failed: {str(e)}", "iteration": 3}
        return

    # ------------------------------------------------------------
    # 4. CRITIC AGENT (REFLEXION LOOP)
    # ------------------------------------------------------------
    current_drafts = drafts
    max_loops = 2
    rejection_count = 0
    
    for loop in range(1, max_loops + 1):
        yield {
            "phase": "CRITIC",
            "message": f"🤖 [Interviewer Critic Agent] Performing self-correction alignment check (Critique Round {loop})...",
            "iteration": 3 + loop
        }
        
        try:
            reviews_str, usage = run_interviewer_critic_agent(current_drafts, jd_analysis)
            accumulate_tokens(usage)
            yield {
                "phase": "OBSERVE",
                "message": f"[Interviewer Critic Agent] Critique check completed.",
                "tool": "interviewer_critic",
                "result": reviews_str,
                "iteration": 3 + loop
            }
            
            # Parse critique outcome
            reviews_parsed = json.loads(reviews_str)
            reviews = reviews_parsed.get("critic_reviews", [])
            rejections = [r for r in reviews if r.get("status") == "REJECTED"]
            
            if rejections and loop < max_loops:
                rejection_count += len(rejections)
                rejection_msgs = [f"Q{r['id']}: {r['feedback']}" for r in rejections]
                yield {
                    "phase": "REASON",
                    "message": f"⚠️ [CRITIQUE ALERT] Rejected {len(rejections)} draft questions. Requesting self-correction loop:\n" + "\n".join(rejection_msgs),
                    "iteration": 3 + loop
                }
                
                # ------------------------------------------------------------
                # REFINER AGENT
                # ------------------------------------------------------------
                yield {
                    "phase": "REFINER",
                    "message": "🤖 [Question Refiner Agent] Fixing questions to align with Critic recommendations...",
                    "iteration": 3 + loop
                }
                
                current_drafts, ref_usage = run_question_refiner_agent(current_drafts, reviews_str)
                accumulate_tokens(ref_usage)
                
                yield {
                    "phase": "OBSERVE",
                    "message": "[Question Refiner Agent] Draft questions refined.",
                    "tool": "question_refiner",
                    "result": current_drafts,
                    "iteration": 3 + loop
                }
            else:
                if rejections:
                    # Final loop exit even with rejections to prevent infinite spin
                    yield {
                        "phase": "REASON",
                        "message": "⚠️ [CRITIQUE DONE] Passed loop limitations with warnings. Continuing...",
                        "iteration": 3 + loop
                    }
                else:
                    yield {
                        "phase": "REASON",
                        "message": "✅ [CRITIQUE PASSED] Critic Agent approved all draft questions.",
                        "iteration": 3 + loop
                    }
                break
        except Exception as e:
            yield {"phase": "ERROR", "message": f"Self-critique loop failed: {str(e)}", "iteration": 3 + loop}
            return

    # ------------------------------------------------------------
    # 5. SCORECARD ARCHITECT AGENT
    # ------------------------------------------------------------
    yield {
        "phase": "SCORECARD",
        "message": "🤖 [Scorecard Architect Agent] Structuring detailed rubrics and model responses...",
        "iteration": 6
    }
    
    try:
        final_questions, usage = run_scorecard_architect_agent(current_drafts)
        accumulate_tokens(usage)
        yield {
            "phase": "OBSERVE",
            "message": "[Scorecard Architect Agent] Evaluation rubrics generated.",
            "tool": "scorecard_architect",
            "result": final_questions,
            "iteration": 6
        }
    except Exception as e:
        yield {"phase": "ERROR", "message": f"Scorecard Architect Agent failed: {str(e)}", "iteration": 6}
        return

    # ------------------------------------------------------------
    # 6. DB LOGGER AGENT
    # ------------------------------------------------------------
    yield {
        "phase": "DB_LOGGING",
        "message": "🤖 [DB Logger Agent] Logging final guide to history database...",
        "iteration": 7
    }
    
    guide_id = f"GUIDE-{uuid.uuid4().hex[:8].upper()}"
    try:
        save_result = save_interview_guide(guide_id, job_title, experience_level, final_questions, uid)
        if "ERROR" in save_result:
            raise RuntimeError(save_result)
            
        yield {
            "phase": "OBSERVE",
            "message": f"[DB Logger Agent] Database write complete. Guide ID: {guide_id}",
            "tool": "db_logger",
            "result": f"SUCCESS: Guide saved.",
            "iteration": 7
        }
    except Exception as e:
        yield {"phase": "ERROR", "message": f"DB Logger Agent failed: {str(e)}", "iteration": 7}
        return

    # ------------------------------------------------------------
    # 7. FINALIZE & COMPILE METRICS
    # ------------------------------------------------------------
    end_time = time.time()
    latency = round(end_time - start_time, 2)
    
    # Calculate costs: Llama-3.3-70b is $0.59/1M input and $0.79/1M output tokens
    cost = round(((total_prompt_tokens / 1000000) * 0.59) + ((total_completion_tokens / 1000000) * 0.79), 5)
    
    try:
        questions_obj = json.loads(final_questions)
        if isinstance(questions_obj, dict) and "questions" in questions_obj:
            questions_list = questions_obj["questions"]
        else:
            questions_list = questions_obj
            
        analysis_obj = json.loads(jd_analysis)
    except Exception:
        questions_list = []
        analysis_obj = {}

    metrics_obj = {
        "total_latency_sec": latency,
        "prompt_tokens": total_prompt_tokens,
        "completion_tokens": total_completion_tokens,
        "total_tokens": total_prompt_tokens + total_completion_tokens,
        "estimated_cost_usd": cost,
        "critique_rejections": rejection_count
    }

    # Enforce metrics enrichment inside database file
    update_saved_guide_metrics(guide_id, metrics_obj, analysis_obj)

    final_payload = {
        "guide_id": guide_id,
        "job_title": job_title,
        "experience_level": experience_level,
        "job_analysis": analysis_obj,
        "questions": questions_list,
        "metrics": metrics_obj,
        "resume_match": resume_match_obj
    }
    
    yield {
        "phase": "COMPLETED",
        "message": "AI multi-agent orchestration pipeline completed successfully.",
        "data": final_payload,
        "iteration": 8
    }


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


def run_talent_search_agent(search_query: str, candidate_records: List[Dict[str, Any]]) -> tuple:
    """
    Vector RAG Talent Search Agent:
    Performs AI semantic matching and relevance re-ranking across candidate records in the talent pool.
    Returns ranked candidate matches with suitability percentages and search query fit justifications.
    """
    if not candidate_records:
        return json.dumps({"matched_candidates": [], "query": search_query, "total_matches": 0}), {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    # Format candidate summaries for LLM semantic scoring
    candidates_formatted = []
    for idx, record in enumerate(candidate_records):
        data = record.get("data", {})
        c_name = record.get("candidate_name") or data.get("candidate_name") or f"Candidate #{idx+1}"
        analysis_id = record.get("analysis_id", f"c_{idx}")
        filename = record.get("filename", "resume.pdf")
        
        candidates_formatted.append(f"""
CANDIDATE #{idx+1} [ID: {analysis_id}]:
- Name: {c_name} (Filename: {filename})
- Summary: {data.get('candidate_summary', '')}
- Why Best Fit: {data.get('why_best_fit', '')}
- Top Skills: {', '.join(data.get('top_skills_identified', []))}
- Leadership: {', '.join(data.get('leadership_and_community', []))}
- Achievements: {', '.join(data.get('achievements_and_competitions', []))}
- Experience: {', '.join(data.get('work_and_internship_experience', []))}
""")

    candidates_blob = "\n".join(candidates_formatted)

    prompt = f"""You are a Senior Talent Acquisition Vector RAG Search & Re-ranking Agent.
Evaluate the following candidate database against the recruiter's search query:

RECRUITER SEARCH QUERY: "{search_query}"

--- CANDIDATE TALENT POOL ---
{candidates_blob}
--- END CANDIDATE POOL ---

Perform a deep semantic relevance analysis:
1. Calculate a "relevance_score" (0 to 100%) for EACH candidate based on how closely their skills, projects, hackathons, and experience match the search query.
2. Filter and rank candidates, including only those with relevance_score >= 35%.
3. For each candidate, generate a compelling 1-2 sentence "match_reasoning" explaining specifically why they fit the recruiter's search query.

Format output strictly as JSON with keys:
- "query": "{search_query}"
- "total_matches": Integer count
- "matched_candidates": A list of objects sorted by relevance_score descending, each containing:
    - "analysis_id": String (matches candidate ID)
    - "candidate_name": String
    - "filename": String
    - "relevance_score": Integer (0-100)
    - "match_reasoning": String
    - "top_skills": List of strings

Return ONLY valid JSON.
"""
    return query_groq_helper(prompt, json_mode=True)


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

