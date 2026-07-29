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


def query_gemini(messages: List[Dict[str, str]], json_mode: bool = False) -> tuple:
    """
    Queries Google Gemini API (gemini-2.0-flash / gemini-1.5-flash) as secondary failover LLM.
    Bypasses external SDK dependencies by sending direct REST requests to Google Generative Language API.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured in environment.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    # Combine prompt messages for Gemini
    combined_text = "\n\n".join([f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in messages])
    
    payload = {
        "contents": [
            {
                "parts": [{"text": combined_text}]
            }
        ],
        "generationConfig": {
            "temperature": 0.1
        }
    }
    
    if json_mode:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            res_body = response.read().decode("utf-8")
            res_json = json.loads(res_body)
            candidates = res_json.get("candidates", [])
            if not candidates:
                raise RuntimeError("Gemini API returned empty candidate response.")
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise RuntimeError("Gemini API returned empty content parts.")
            content = parts[0].get("text", "")
            usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            print("✨ Successfully generated response using Google Gemini API!")
            return content, usage
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        raise RuntimeError(f"Gemini API returned HTTP error: {e.code} - {err_msg}")
    except Exception as e:
        raise RuntimeError(f"Failed to query Gemini API: {str(e)}")


def query_nvidia_internal(messages: List[Dict[str, str]], json_mode: bool = False, model_name: str = None) -> tuple:
    """
    Queries NVIDIA NIM API (https://integrate.api.nvidia.com/v1/chat/completions)
    using high-performance GPUs and Meta LLaMA 3.1 70B Instruct / 8B Instruct models.
    """
    api_key = os.environ.get("NVIDIA_API_KEY")
    if not api_key:
        raise ValueError("NVIDIA_API_KEY is not set in environment.")

    url = "https://integrate.api.nvidia.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "TechnoRecruit-AI/2.0"
    }

    target_model = model_name or os.environ.get("NVIDIA_PRIMARY_MODEL", "meta/llama-3.1-70b-instruct")
    payload = {
        "model": target_model,
        "messages": messages,
        "temperature": 0.1
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=22) as response:
        res_body = response.read().decode("utf-8")
        res_json = json.loads(res_body)
        content = res_json["choices"][0]["message"].get("content", "")
        usage = res_json.get("usage", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0})
        print(f"🚀 Generated response using Primary NVIDIA NIM AI ({target_model})!")
        return content, usage


def query_groq_internal(messages: List[Dict[str, str]], tools: List[Dict[str, Any]] = None, json_mode: bool = False, model_name: str = None) -> tuple:
    """Queries Groq API with specified model or default."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in environment.")

    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    target_model = model_name or os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
    payload = {
        "model": target_model,
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

    with urllib.request.urlopen(req, timeout=18) as response:
        res_body = response.read().decode("utf-8")
        res_json = json.loads(res_body)
        content = res_json["choices"][0]["message"].get("content", "")
        usage = res_json.get("usage", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0})
        return content, usage


def query_groq(messages: List[Dict[str, str]], tools: List[Dict[str, Any]] = None, json_mode: bool = False, model_name: str = None) -> tuple:
    """
    Multi-Tiered Enterprise AI Chain:
    1. Primary Tier: NVIDIA NIM AI (meta/llama-3.1-70b-instruct).
    2. NVIDIA Fast Tier: NVIDIA NIM AI (meta/llama-3.1-8b-instruct).
    3. Groq Tier: Groq LLaMA 3.3 70B.
    4. Gemini Tier: Google Gemini 2.0 Flash API.
    """
    # 1. Attempt Primary NVIDIA NIM AI (meta/llama-3.1-70b-instruct)
    try:
        return query_nvidia_internal(messages, json_mode=json_mode, model_name="meta/llama-3.1-70b-instruct")
    except Exception as nv_err:
        print(f"⚠️ Primary NVIDIA NIM AI notice: {nv_err}. Trying NVIDIA Fast model (meta/llama-3.1-8b-instruct)...")
        # 2. Attempt NVIDIA Fast (meta/llama-3.1-8b-instruct)
        try:
            return query_nvidia_internal(messages, json_mode=json_mode, model_name="meta/llama-3.1-8b-instruct")
        except Exception as nv_fast_err:
            print(f"⚠️ NVIDIA Fast model notice: {nv_fast_err}. Falling back to Groq LLaMA 3.3 70B...")
            # 3. Attempt Groq API
            try:
                return query_groq_internal(messages, tools=tools, json_mode=json_mode, model_name=model_name)
            except Exception as groq_err:
                print(f"⚠️ Groq notice: {groq_err}. Failing over to Google Gemini 2.0 Flash API...")
                # 4. Attempt Google Gemini API
                try:
                    return query_gemini(messages, json_mode=json_mode)
                except Exception as gemini_err:
                    raise RuntimeError(f"All AI Tiers exhausted. NVIDIA 70B ({nv_err}), NVIDIA 8B ({nv_fast_err}), Groq ({groq_err}), Gemini ({gemini_err}).")


def query_groq_helper(prompt: str, json_mode: bool = False, model_name: str = None) -> tuple:
    """Helper to query multi-tiered AI engine for single prompt sub-tasks inside agents."""
    messages = [{"role": "user", "content": prompt}]
    return query_groq(messages, json_mode=json_mode, model_name=model_name)
