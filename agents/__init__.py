import sys
from pathlib import Path

# Ensure project root directory is in sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from .interview_architect import (
    run_jd_parser_agent,
    run_syllabus_agent,
    run_question_writer_agent,
    run_interviewer_critic_agent,
    run_question_refiner_agent,
    run_scorecard_architect_agent,
    run_interview_generator_agent
)
from .career_navigator import (
    run_resume_role_suggester_agent,
    run_resume_jd_matcher_agent
)
from .talent_search import run_talent_search_agent, upsert_candidate_to_vector_db
from .ats_optimizer import run_ats_optimizer_agent
from .candidate_battlecard import run_candidate_battlecard_agent
from .voice_interviewer import run_voice_interviewer_agent, run_voice_scorecard_agent

__all__ = [
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
    "upsert_candidate_to_vector_db",
    "run_ats_optimizer_agent",
    "run_candidate_battlecard_agent",
    "run_voice_interviewer_agent",
    "run_voice_scorecard_agent",
]
