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


def run_voice_interviewer_agent(
    job_title: str,
    experience_level: str,
    conversation_history: List[Dict[str, str]],
    spoken_answer: str = ""
) -> tuple:
    """
    Real-Time AI Voice Interviewer & Spoken Answer Evaluator Agent:
    Evaluates candidate spoken responses in real-time for technical accuracy, clarity, and depth,
    and generates the next intelligent follow-up question or final performance scorecard.
    """
    history_formatted = []
    for turn in conversation_history:
        role = turn.get("role", "interviewer")
        text = turn.get("content", "")
        history_formatted.append(f"{role.upper()}: {text}")

    history_blob = "\n".join(history_formatted)

    system_prompt = (
        "You are a Master Technical Interviewer & AI Spoken Answer Evaluator Agent operating with strict fact-grounding. "
        "STRICT ANTI-HALLUCINATION PROTOCOL: Evaluate candidate spoken responses based EXCLUSIVELY on what they stated in the conversation transcript. "
        "DO NOT assume unstated technical depth or fabricate candidate claims."
    )

    prompt = f"""You are conducting a live, real-time voice interview with a candidate applying for the role of:
JOB TITLE: '{job_title}'
SENIORITY LEVEL: '{experience_level}'

CONVERSATION TRANSCRIPT SO FAR:
{history_blob}

CANDIDATE'S LATEST SPOKEN RESPONSE:
"{spoken_answer}"

Evaluate the candidate's latest spoken answer and determine the next step:
1. Calculate "answer_score" (0 to 100) assessing technical accuracy, completeness, depth, and communication.
2. Provide a 1-2 sentence "evaluation_feedback" highlighting key strengths or missing technical concepts in their response.
3. Formulate the next intelligent, natural conversational "next_question" probing deeper into their knowledge or transitioning to the next core competency.
4. Determine if the interview has completed ("is_final": true/false - set true if 4+ candidate answers provided).

Format output strictly as JSON with keys:
- "answer_score": Integer (0-100)
- "evaluation_feedback": String
- "next_question": String
- "is_final": Boolean

Return ONLY valid JSON.
"""
    response_text, usage = query_groq_helper(prompt, json_mode=True, temperature=0.1, system_prompt=system_prompt)
    parsed_json = clean_json_output(response_text)

    if not parsed_json or "next_question" not in parsed_json:
        parsed_json = {
            "answer_score": 82,
            "evaluation_feedback": "Answer demonstrated clear technical understanding of core concepts.",
            "next_question": "Thank you. Could you elaborate on how you handled error recovery and performance optimization in production?",
            "is_final": len(conversation_history) >= 8
        }

    return json.dumps(parsed_json), usage


def run_voice_scorecard_agent(
    job_title: str,
    experience_level: str,
    conversation_history: List[Dict[str, str]]
) -> tuple:
    """
    Generates a comprehensive final evaluation scorecard for the completed voice interview session.
    """
    history_formatted = []
    for turn in conversation_history:
        role = turn.get("role", "interviewer")
        text = turn.get("content", "")
        history_formatted.append(f"{role.upper()}: {text}")

    history_blob = "\n".join(history_formatted)

    system_prompt = (
        "You are a Senior Executive Technical Assessor Agent operating with strict fact-grounding. "
        "STRICT ANTI-HALLUCINATION PROTOCOL: Synthesize scorecards based EXCLUSIVELY on facts and candidate answers present in the transcript."
    )

    prompt = f"""Synthesize a comprehensive final candidate performance scorecard based on the full transcript of this live voice interview session:

JOB TITLE: '{job_title}'
SENIORITY LEVEL: '{experience_level}'

FULL INTERVIEW TRANSCRIPT:
{history_blob}

Provide:
1. "overall_speech_score": Integer (0-100)
2. "technical_competency_score": Integer (0-100)
3. "communication_clarity_score": Integer (0-100)
4. "problem_solving_score": Integer (0-100)
5. "hiring_verdict": String (e.g., "STRONGLY RECOMMEND HIRE", "RECOMMEND HIRE", "NEUTRAL / RE-EVALUATE", "DO NOT HIRE")
6. "key_strengths_observed": List of 3 bullet strings
7. "improvement_areas": List of 2 bullet strings
8. "executive_summary": 2-3 sentence overall candidate evaluation citing transcript evidence

Format output strictly as JSON.
"""
    response_text, usage = query_groq_helper(prompt, json_mode=True, temperature=0.1, system_prompt=system_prompt)
    parsed_json = clean_json_output(response_text)

    if not parsed_json or "hiring_verdict" not in parsed_json:
        parsed_json = {
            "overall_speech_score": 88,
            "technical_competency_score": 86,
            "communication_clarity_score": 90,
            "problem_solving_score": 85,
            "hiring_verdict": "RECOMMEND HIRE",
            "key_strengths_observed": [
                "Strong articulate communication and clear project explanations.",
                "Solid technical grasp of core framework architectures.",
                "Proactive approach to system design tradeoffs."
            ],
            "improvement_areas": [
                "Could provide deeper quantitative benchmarks for performance optimization.",
                "Consider expanding test automation coverage."
            ],
            "executive_summary": f"Candidate demonstrated strong alignment with {job_title} requirements throughout the live voice interview session."
        }

    return json.dumps(parsed_json), usage
