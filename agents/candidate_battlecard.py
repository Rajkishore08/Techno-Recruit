import json
from typing import Dict, Any, List
from groq_client import query_groq_helper


def run_candidate_battlecard_agent(candidate_records: List[Dict[str, Any]], target_role: str = "") -> tuple:
    """
    AI Candidate Battle-Card & Decision Matrix Agent:
    Performs head-to-head multi-candidate comparison, skill matrix breakdown, risk trade-off analysis,
    and determines the recommended winner with hiring decision rationale.
    """
    if not candidate_records or len(candidate_records) < 2:
        return json.dumps({"error": "At least 2 candidates are required for head-to-head comparison."}), {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    # Limit to top 3 candidates for battle-card comparison
    candidate_records = candidate_records[:3]

    candidates_formatted = []
    for idx, record in enumerate(candidate_records):
        data = record.get("data", {})
        c_name = record.get("candidate_name") or data.get("candidate_name") or f"Candidate #{idx+1}"
        analysis_id = record.get("analysis_id", f"c_{idx}")
        filename = record.get("filename", "resume.pdf")
        
        top_skills = data.get('top_skills_identified') or data.get('matched_keywords') or []
        leadership = data.get('leadership_and_community') or []
        achievements = data.get('achievements_and_competitions') or []
        experience = data.get('work_and_internship_experience') or []
        summary = data.get('candidate_summary', '')
        why_fit = data.get('why_best_fit', '')

        candidates_formatted.append(f"""
CANDIDATE #{idx+1} [ID: {analysis_id}]:
- Name: {c_name} (File: {filename})
- Summary: {summary}
- Why Best Fit: {why_fit}
- Top Skills: {', '.join(top_skills) if isinstance(top_skills, list) else str(top_skills)}
- Leadership: {', '.join(leadership) if isinstance(leadership, list) else str(leadership)}
- Achievements: {', '.join(achievements) if isinstance(achievements, list) else str(achievements)}
- Experience: {', '.join(experience) if isinstance(experience, list) else str(experience)}
""")

    candidates_blob = "\n".join(candidates_formatted)
    role_context = f"TARGET JOB ROLE: '{target_role}'\n" if target_role else "TARGET JOB ROLE: General Senior Technical Hire\n"

    prompt = f"""You are a Master Executive Hiring Committee & Head-to-Head AI Candidate Battle-Card Agent.
Compare the following candidates in a rigorous, objective, side-by-side evaluation matrix:

{role_context}
--- CANDIDATES TO COMPARE ---
{candidates_blob}
--- END CANDIDATES ---

Perform a deep comparative evaluation across:
1. Executive Winner Decision: Identify the single top recommended hire ("winner_name" and "winner_id").
2. Overall Candidate Scores: Rate each candidate overall (0 to 100).
3. Side-by-Side Dimension Scores (0-100 for each candidate):
   - "technical_depth"
   - "leadership_impact"
   - "project_execution_speed"
   - "team_adaptability"
4. Core Skill Overlap Matrix: Compare proficiency (0-100) across 4-6 primary skills required for the role.
5. Strengths & Risk Trade-offs: List top 2 key strengths and 1-2 potential risks/trade-offs for each candidate.
6. Executive Recommendation Summary: A compelling 2-3 sentence hiring verdict explaining WHY the winner was chosen over the runner(s)-up.

Format output strictly as a JSON object with keys:
- "target_role": String
- "winner_name": String
- "winner_id": String
- "hiring_recommendation_summary": String
- "candidates": List of objects [{{"analysis_id": "...", "name": "...", "overall_score": int, "technical_depth": int, "leadership_impact": int, "project_execution_speed": int, "team_adaptability": int, "key_strengths": [...], "trade_offs": [...], "best_suited_for": "..."}}]
- "skills_matrix": List of objects [{{"skill": "...", "scores": {{"<candidate_name>": int, ...}}}}]
- "comparison_highlights": List of 3-4 bullet insights comparing candidate strengths

Return ONLY valid JSON.
"""
    return query_groq_helper(prompt, json_mode=True)
