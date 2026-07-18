import os
import sys
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
        "metrics": metrics_obj
    }
    
    yield {
        "phase": "COMPLETED",
        "message": "AI multi-agent orchestration pipeline completed successfully.",
        "data": final_payload,
        "iteration": 8
    }
