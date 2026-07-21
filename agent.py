"""
Techno Recruit — Multi-Agent Intelligence Facade Module.
Re-exports modularized agent functions and database utilities for backward compatibility.
"""

from groq_client import query_groq, query_groq_helper
from db import (
    save_interview_guide,
    update_saved_guide_metrics,
    save_career_analysis,
    get_user_career_analyses
)
from agents import (
    run_jd_parser_agent,
    run_syllabus_agent,
    run_question_writer_agent,
    run_interviewer_critic_agent,
    run_question_refiner_agent,
    run_scorecard_architect_agent,
    run_interview_generator_agent,
    run_resume_role_suggester_agent,
    run_resume_jd_matcher_agent,
    run_talent_search_agent,
    run_ats_optimizer_agent
)

__all__ = [
    "query_groq",
    "query_groq_helper",
    "save_interview_guide",
    "update_saved_guide_metrics",
    "save_career_analysis",
    "get_user_career_analyses",
    "run_jd_parser_agent",
    "run_syllabus_agent",
    "run_question_writer_agent",
    "run_interviewer_critic_agent",
    "run_question_refiner_agent",
    "run_scorecard_architect_agent",
    "run_interview_generator_agent",
    "run_resume_role_suggester_agent",
    "run_resume_jd_matcher_agent",
    "run_talent_search_agent",
    "run_ats_optimizer_agent"
]
