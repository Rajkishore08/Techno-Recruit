import json
from typing import Dict, Any, List
from groq_client import query_groq_helper


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
        
        # Extract full resume context if saved, fallback to snippet or text properties
        full_resume = record.get("resume_text") or record.get("resume_snippet") or ""
        
        # Safe extraction for lists
        top_skills = data.get('top_skills_identified') or data.get('matched_keywords') or []
        leadership = data.get('leadership_and_community') or []
        achievements = data.get('achievements_and_competitions') or []
        experience = data.get('work_and_internship_experience') or []

        candidates_formatted.append(f"""
CANDIDATE #{idx+1} [ID: {analysis_id}]:
- Name: {c_name} (Filename: {filename})
- Summary: {data.get('candidate_summary', '')}
- Why Best Fit: {data.get('why_best_fit', '')}
- Top Skills: {', '.join(top_skills) if isinstance(top_skills, list) else str(top_skills)}
- Leadership: {', '.join(leadership) if isinstance(leadership, list) else str(leadership)}
- Achievements: {', '.join(achievements) if isinstance(achievements, list) else str(achievements)}
- Experience: {', '.join(experience) if isinstance(experience, list) else str(experience)}
- Full Resume Content: {full_resume[:3000]}
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
