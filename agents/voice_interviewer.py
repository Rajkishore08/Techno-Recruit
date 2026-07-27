import json
from typing import Dict, Any, List
from groq_client import query_groq_helper


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

    prompt = f"""You are a Master Technical Interviewer & AI Spoken Answer Evaluator Agent.
You are conducting a live, real-time voice interview with a candidate applying for the role of:
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
4. Determine if the interview has completed ("is_final": true/false - set true if 4+ questions answered).

Format output strictly as JSON with keys:
- "answer_score": Integer (0-100)
- "evaluation_feedback": String
- "next_question": String
- "is_final": Boolean

Return ONLY valid JSON.
"""
    return query_groq_helper(prompt, json_mode=True)


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

    prompt = f"""You are a Senior Executive Technical Assessor Agent.
Synthesize a comprehensive final candidate performance scorecard based on the full transcript of this live voice interview session:

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
8. "executive_summary": 2-3 sentence overall candidate evaluation

Format output strictly as JSON.
"""
    return query_groq_helper(prompt, json_mode=True)
