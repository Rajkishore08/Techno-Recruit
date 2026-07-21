import json
import time
import uuid
from typing import Dict, Any, List, Generator
from groq_client import query_groq_helper
from db import save_interview_guide, update_saved_guide_metrics


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
    experience_level = details.get("experience_level", "Mid-Level")
    categories = details.get("categories", ["Technical", "System Design", "Behavioral"])
    count = details.get("count", 5)
    resume_text = details.get("resume_text", None)
    uid = details.get("uid", "anonymous")

    # ------------------------------------------------------------
    # 1. JD PARSER AGENT
    # ------------------------------------------------------------
    yield {
        "phase": "JD_PARSING",
        "message": "🤖 [JD Parser Agent] Analyzing Job Description and extracting required competencies...",
        "iteration": 1
    }
    try:
        jd_analysis, usage1 = run_jd_parser_agent(job_title, job_description, experience_level)
        accumulate_tokens(usage1)
        yield {
            "phase": "OBSERVE",
            "message": "[JD Parser Agent] Job Description requirements parsed successfully.",
            "tool": "jd_parser",
            "result": jd_analysis,
            "iteration": 1
        }
    except Exception as e:
        yield {"phase": "ERROR", "message": f"JD Parser Agent failed: {str(e)}", "iteration": 1}
        return

    # Optional Resume Matcher step
    resume_match_obj = None
    if resume_text and resume_text.strip():
        yield {
            "phase": "RESUME_MATCHING",
            "message": "🤖 [Resume Matcher Agent] Evaluating candidate resume against target Job Description...",
            "iteration": 1.5
        }
        try:
            from .career_navigator import run_resume_jd_matcher_agent
            match_res, usage_rm = run_resume_jd_matcher_agent(resume_text, job_title, job_description, experience_level)
            accumulate_tokens(usage_rm)
            resume_match_obj = json.loads(match_res)
            yield {
                "phase": "OBSERVE",
                "message": "[Resume Matcher Agent] Candidate resume match score and personalized questions generated.",
                "tool": "resume_matcher",
                "result": match_res,
                "iteration": 1.5
            }
        except Exception as e:
            print(f"Resume Matcher Agent non-fatal warning: {e}")

    # ------------------------------------------------------------
    # 2. SYLLABUS DESIGNER AGENT
    # ------------------------------------------------------------
    yield {
        "phase": "SYLLABUS_DESIGN",
        "message": "🤖 [Syllabus Designer Agent] Creating interview syllabus module map...",
        "iteration": 2
    }
    try:
        syllabus, usage2 = run_syllabus_agent(jd_analysis)
        accumulate_tokens(usage2)
        yield {
            "phase": "OBSERVE",
            "message": "[Syllabus Designer Agent] Interview curriculum modules established.",
            "tool": "syllabus_designer",
            "result": syllabus,
            "iteration": 2
        }
    except Exception as e:
        yield {"phase": "ERROR", "message": f"Syllabus Designer Agent failed: {str(e)}", "iteration": 2}
        return

    # ------------------------------------------------------------
    # 3. QUESTION GENERATOR AGENT
    # ------------------------------------------------------------
    yield {
        "phase": "QUESTION_GENERATION",
        "message": f"🤖 [Question Writer Agent] Writing initial drafts of {count} interview questions...",
        "iteration": 3
    }
    try:
        draft_questions, usage3 = run_question_writer_agent(syllabus, categories, count)
        accumulate_tokens(usage3)
        yield {
            "phase": "OBSERVE",
            "message": f"[Question Writer Agent] Drafted {count} questions across requested categories.",
            "tool": "question_writer",
            "result": draft_questions,
            "iteration": 3
        }
    except Exception as e:
        yield {"phase": "ERROR", "message": f"Question Writer Agent failed: {str(e)}", "iteration": 3}
        return

    # ------------------------------------------------------------
    # 4. INTERVIEWER CRITIC AGENT (Reflexion Loop)
    # ------------------------------------------------------------
    yield {
        "phase": "CRITIQUE",
        "message": "🤖 [Interviewer Critic Agent] Evaluating draft question quality, difficulty alignment, and style constraints...",
        "iteration": 4
    }
    try:
        critic_reviews, usage4 = run_interviewer_critic_agent(draft_questions, jd_analysis)
        accumulate_tokens(usage4)
        yield {
            "phase": "OBSERVE",
            "message": "[Interviewer Critic Agent] Question evaluation complete.",
            "tool": "interviewer_critic",
            "result": critic_reviews,
            "iteration": 4
        }
    except Exception as e:
        yield {"phase": "ERROR", "message": f"Interviewer Critic Agent failed: {str(e)}", "iteration": 4}
        return

    current_drafts = draft_questions
    rejection_count = 0
    try:
        reviews_parsed = json.loads(critic_reviews)
        if isinstance(reviews_parsed, dict) and "critic_reviews" in reviews_parsed:
            revs = reviews_parsed["critic_reviews"]
        else:
            revs = reviews_parsed
        rejections = [r for r in revs if r.get("status") == "REJECTED"]
        rejection_count = len(rejections)
    except Exception:
        rejections = []

    # ------------------------------------------------------------
    # 4b. QUESTION REFINER AGENT (If any rejections)
    # ------------------------------------------------------------
    if rejections:
        yield {
            "phase": "REFINEMENT",
            "message": f"🤖 [Question Refiner Agent] Rewriting {len(rejections)} rejected question(s) based on Critic feedback...",
            "iteration": 5
        }
        try:
            refined_questions, usage_ref = run_question_refiner_agent(current_drafts, critic_reviews)
            accumulate_tokens(usage_ref)
            current_drafts = refined_questions
            yield {
                "phase": "OBSERVE",
                "message": "[Question Refiner Agent] Question drafts successfully refined.",
                "tool": "question_refiner",
                "result": refined_questions,
                "iteration": 5
            }
        except Exception as e:
            yield {"phase": "ERROR", "message": f"Question Refiner Agent failed: {str(e)}", "iteration": 5}
            return

    # ------------------------------------------------------------
    # 5. SCORECARD ARCHITECT AGENT
    # ------------------------------------------------------------
    yield {
        "phase": "SCORECARD_BUILDING",
        "message": "🤖 [Scorecard Architect Agent] Architecting model answers, evaluation rubrics, and scoring benchmarks...",
        "iteration": 6
    }
    try:
        final_questions, usage6 = run_scorecard_architect_agent(current_drafts)
        accumulate_tokens(usage6)
        yield {
            "phase": "OBSERVE",
            "message": "[Scorecard Architect Agent] Model answers and grading rubrics generated.",
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
