import os
import sys
import site

# Ensure user site-packages are registered in path
user_site = site.getusersitepackages()
if user_site and user_site not in sys.path:
    sys.path.insert(0, user_site)

import json
import urllib.request
import urllib.error
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()


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
