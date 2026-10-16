import os
import json
import time
import random
import requests
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Tuple

# ==================== ENVIRONMENT CONFIGURATION ====================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROK_API_KEY = os.getenv("GROK_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

AI_PRIMARY_PROVIDER = os.getenv("AI_PRIMARY_PROVIDER", "gemini")
AI_FALLBACK_PROVIDERS = os.getenv("AI_FALLBACK_PROVIDERS", "grok,openrouter").split(",")
AI_PROVIDER_COOLDOWN_SECONDS = int(os.getenv("AI_PROVIDER_COOLDOWN_SECONDS", "60"))
AI_MAX_RETRIES_PER_PROVIDER = int(os.getenv("AI_MAX_RETRIES_PER_PROVIDER", "1"))
AI_REQUEST_TIMEOUT_MS = int(os.getenv("AI_REQUEST_TIMEOUT_MS", "15000"))

# ==================== BASE PROVIDER INTERFACE ====================
class AIProvider(ABC):
    def __init__(self, provider_key: str, name: str, model_name: str, api_key: str):
        self.provider_key = provider_key
        self.name = name
        self.model_name = model_name
        self.api_key = api_key
        self.timeout_sec = AI_REQUEST_TIMEOUT_MS / 1000.0

    @abstractmethod
    def analyze(self, comparison_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute clinical summary extraction with prompt."""
        pass

    def validate_output(self, output: Any) -> bool:
        """Strict schema validation for clinical structured summary."""
        if not isinstance(output, dict):
            return False
        if "english_summary" not in output or not isinstance(output["english_summary"], list):
            return False
        if "tamil_summary" not in output or not isinstance(output["tamil_summary"], list):
            return False
        if len(output["english_summary"]) == 0 or len(output["tamil_summary"]) == 0:
            return False
        return True

    def _build_prompt(self, data: Dict[str, Any]) -> str:
        return f"""
You are MEDI-TREND AI, a clinical review assistant for hospital physicians.
CRITICAL SAFETY & GROUNDING RULES:
1. You are NOT diagnosing, prescribing, or overclaiming that a patient is cured or completely healthy.
2. Ground all statements EXCLUSIVELY in the provided verified report comparison data.
3. NEVER invent values, test metrics, or reference ranges. If not present in source, state 'Not detected'.
4. Keep findings concise and factual (e.g. 'LDL decreased from 145 to 118 mg/dL across the selected reports.').
5. Output strict JSON matching the schema below.

Comparison Data:
{json.dumps(data, indent=2)}

Required JSON Structure:
{{
  "english_summary": [
    "LDL Cholesterol decreased from 145.0 to 118.0 mg/dL across selected reports.",
    "Clinical interpretation requires physician review."
  ],
  "tamil_summary": [
    "தேர்ந்தெடுக்கப்பட்ட அறிக்கைகளில் LDL கெட்ட கொலஸ்ட்ரால் அளவு 145.0-லிருந்து 118.0 mg/dL ஆகக் குறைந்துள்ளது.",
    "இறுதி மருத்துவ மதிப்பீட்டிற்கு மருத்துவரின் ஆலோசனை தேவை."
  ],
  "monitoring_items": [
    {{"parameter": "...", "reason": "Borderline elevated", "action": "Recheck in next follow-up panel"}}
  ],
  "clinical_notes": "Clinical review support summary grounded in verified source parameters."
}}
"""

# ==================== GOOGLE GEMINI PROVIDER ====================
class GeminiProvider(AIProvider):
    def __init__(self, api_key: str = GEMINI_API_KEY, model_name: str = "gemini-flash-lite-latest"):
        super().__init__("gemini", "Google Gemini Intelligence", model_name, api_key)

    def analyze(self, comparison_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not configured")

        prompt = self._build_prompt(comparison_data)
        models_to_try = [self.model_name, "gemini-flash-latest"]
        last_err = None

        for m in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.1
                }
            }

            try:
                resp = requests.post(url, json=payload, timeout=self.timeout_sec)
                if resp.status_code == 429:
                    raise QuotaExhaustedError(f"Gemini HTTP 429 Quota Exceeded: {resp.text}")
                if resp.status_code == 200:
                    data = resp.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    result = json.loads(raw_text)
                    if self.validate_output(result):
                        return result
                last_err = f"Gemini ({m}) HTTP {resp.status_code}: {resp.text[:100]}"
            except QuotaExhaustedError:
                raise
            except Exception as e:
                last_err = str(e)

        raise RuntimeError(last_err or "Gemini invocation failed")

# ==================== XAI GROK PROVIDER ====================
class GrokProvider(AIProvider):
    def __init__(self, api_key: str = GROK_API_KEY, model_name: str = "grok-beta"):
        super().__init__("grok", "xAI Grok Engine", model_name, api_key)

    def analyze(self, comparison_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("GROK_API_KEY not configured")

        prompt = self._build_prompt(comparison_data)
        url = "https://api.x.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": "You are MEDI-TREND AI clinical intelligence. Return strict JSON with english_summary, tamil_summary, and monitoring_items lists."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }

        resp = requests.post(url, headers=headers, json=payload, timeout=self.timeout_sec)
        
        if resp.status_code == 429:
            raise QuotaExhaustedError(f"Grok HTTP 429 Quota Exceeded: {resp.text}")
        if resp.status_code != 200:
            raise RuntimeError(f"Grok HTTP {resp.status_code}: {resp.text}")

        data = resp.json()
        raw_content = data["choices"][0]["message"]["content"]
        result = json.loads(raw_content)
        if not self.validate_output(result):
            raise SchemaValidationError("Grok output failed schema validation")
        return result

# ==================== OPENROUTER / OPENAI PROVIDER ====================
class OpenRouterProvider(AIProvider):
    def __init__(self, api_key: str = OPENROUTER_API_KEY, model_name: str = "openai/gpt-4o"):
        super().__init__("openrouter", "OpenRouter Multi-Model Gateway", model_name, api_key)

    def analyze(self, comparison_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not configured")

        prompt = self._build_prompt(comparison_data)
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://medi-trend.ai",
            "X-Title": "MEDI-TREND AI"
        }
        payload = {
            "model": self.model_name,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": "You are MEDI-TREND AI clinical intelligence. Return strict JSON with english_summary, tamil_summary, and monitoring_items lists."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2
        }

        resp = requests.post(url, headers=headers, json=payload, timeout=self.timeout_sec)
        
        if resp.status_code == 429:
            raise QuotaExhaustedError(f"OpenRouter HTTP 429 Quota Exceeded: {resp.text}")
        if resp.status_code != 200:
            raise RuntimeError(f"OpenRouter HTTP {resp.status_code}: {resp.text}")

        data = resp.json()
        raw_content = data["choices"][0]["message"]["content"]
        result = json.loads(raw_content)
        if not self.validate_output(result):
            raise SchemaValidationError("OpenRouter output failed schema validation")
        return result

# ==================== GROUNDED CLINICAL RULE ENGINE ====================
class DeterministicClinicalEngine(AIProvider):
    """
    100% grounded deterministic engine used as reliable high-availability clinical fallback.
    Never invents or hallucinates. Uses exact calculated values.
    """
    def __init__(self):
        super().__init__("grounded", "Deterministic Clinical Rule Engine", "deterministic-v2", "LOCAL")

    def analyze(self, data: Dict[str, Any]) -> Dict[str, Any]:
        key_params = data.get("key_parameters", [])
        english_points: List[str] = []
        tamil_points: List[str] = []
        monitoring: List[Dict[str, Any]] = []

        for p in key_params:
            name = p.get("name") or p.get("canonicalName") or "Parameter"
            before = p.get("beforeValue")
            after = p.get("afterValue")
            unit = p.get("unit", "")
            pct = p.get("percentChange")
            traj = p.get("trajectory", "Stable")
            
            if before is not None and after is not None:
                if after < before:
                    pct_str = f" ({abs(pct)}% reduction)" if pct is not None else ""
                    english_points.append(f"{name} decreased from {before} to {after} {unit}{pct_str}.")
                    tamil_points.append(f"தேர்ந்தெடுக்கப்பட்ட அறிக்கைகளில் {name} அளவு {before}-லிருந்து {after} {unit} ஆக குறைந்துள்ளது.")
                elif after > before:
                    pct_str = f" (+{abs(pct)}%)" if pct is not None else ""
                    english_points.append(f"{name} increased from {before} to {after} {unit}{pct_str}.")
                    tamil_points.append(f"தேர்ந்தெடுக்கப்பட்ட அறிக்கைகளில் {name} அளவு {before}-லிருந்து {after} {unit} ஆக அதிகரித்துள்ளது.")
                else:
                    english_points.append(f"{name} remained stable at {after} {unit}.")
                    tamil_points.append(f"தேர்ந்தெடுக்கப்பட்ட அறிக்கைகளில் {name} அளவு {after} {unit} என்ற அளவில் சீராக உள்ளது.")

            if traj in ("Needs Monitoring", "Worsened"):
                monitoring.append({
                    "parameter": name,
                    "reason": f"Observed at {after} {unit} ({traj})",
                    "action": "Follow up in next clinical review"
                })

        if not english_points:
            english_points.append("Selected reports contain insufficient comparative numerical parameters.")
            tamil_points.append("தேர்ந்தெடுக்கப்பட்ட அறிக்கைகளில் போதுமான ஒப்பீட்டு அளவீடுகள் கண்டறியப்படவில்லை.")

        english_points.append("Clinical interpretation requires physician review.")
        tamil_points.append("இறுதி மருத்துவ மதிப்பீட்டிற்கு மருத்துவரின் ஆலோசனை தேவை.")

        return {
            "english_summary": english_points,
            "tamil_summary": tamil_points,
            "monitoring_items": monitoring,
            "clinical_notes": "Deterministic clinical review support summary grounded in verified source parameters."
        }

# ==================== EXCEPTIONS ====================
class QuotaExhaustedError(Exception):
    """Raised when an AI provider returns HTTP 429 / Quota / Rate Limit."""
    pass

class SchemaValidationError(Exception):
    """Raised when structured AI output does not match expected JSON schema."""
    pass

# ==================== AI PROVIDER ROUTER ====================
class AIProviderRouter:
    """
    Production-grade Multi-Provider AI Fallback Router.
    - Manages runtime provider health, failure metrics & cooldown states.
    - Quota exhaustion (HTTP 429) triggers immediate failover without wasteful retries.
    - Temporary errors retry with jittered backoff before seamless fallback.
    - Passes identical validated clinical context to the next provider.
    - Guarantees 100% availability through deterministic grounded fallback.
    """
    def __init__(self):
        self.providers: Dict[str, AIProvider] = {
            "gemini": GeminiProvider(),
            "grok": GrokProvider(),
            "openrouter": OpenRouterProvider(),
            "grounded": DeterministicClinicalEngine()
        }

        # Runtime state tracking per provider
        self.state: Dict[str, Dict[str, Any]] = {
            k: {
                "status": "available",
                "failures": 0,
                "success_count": 0,
                "fallback_count": 0,
                "last_error": None,
                "cooldown_until": 0.0,
                "last_success_time": None,
                "last_failure_time": None,
                "total_requests": 0,
                "avg_latency_ms": 0.0
            }
            for k in self.providers.keys()
        }

        self._configure_chain()

    def _configure_chain(self):
        """Construct the prioritized provider sequence from configuration."""
        chain = [AI_PRIMARY_PROVIDER.strip().lower()]
        for fb in AI_FALLBACK_PROVIDERS:
            p = fb.strip().lower()
            if p and p not in chain and p in self.providers:
                chain.append(p)
        if "grounded" not in chain:
            chain.append("grounded")
        self.chain = chain

    def get_provider_states(self) -> Dict[str, Any]:
        """Return runtime health of all providers for Admin diagnostics."""
        now = time.time()
        states = {}
        for k, s in self.state.items():
            is_cooling_down = s["cooldown_until"] > now
            status = "rate_limited" if is_cooling_down else s["status"]
            states[k] = {
                "provider": self.providers[k].name,
                "model": self.providers[k].model_name,
                "status": status,
                "failures": s["failures"],
                "success_count": s["success_count"],
                "fallback_count": s["fallback_count"],
                "last_error": s["last_error"],
                "cooldown_remaining_sec": max(0, int(s["cooldown_until"] - now)) if is_cooling_down else 0,
                "avg_latency_ms": round(s["avg_latency_ms"], 1)
            }
        return states

    def execute_with_fallback(self, comparison_data: Dict[str, Any]) -> Tuple[Dict[str, Any], str, bool, List[str]]:
        """
        Execute analysis through the fallback chain.
        Returns: (result_dict, provider_used_name, fallback_triggered_bool, fallback_chain_history)
        """
        now = time.time()
        fallback_history: List[str] = []
        attempt_count = 0

        # Filter eligible providers
        for p_key in self.chain:
            provider = self.providers.get(p_key)
            if not provider:
                continue

            state = self.state[p_key]

            # Check if active in cooldown
            if state["cooldown_until"] > now and p_key != "grounded":
                fallback_history.append(f"{provider.name}: in cooldown ({int(state['cooldown_until'] - now)}s remaining)")
                continue

            # Check if API key is present
            if not provider.api_key and p_key != "grounded":
                fallback_history.append(f"{provider.name}: API key not configured")
                continue

            # Attempt provider execution with appropriate retry policy
            max_retries = 0 if p_key == "grounded" else AI_MAX_RETRIES_PER_PROVIDER
            current_attempt = 0

            while current_attempt <= max_retries:
                current_attempt += 1
                attempt_count += 1
                call_start = time.time()
                state["total_requests"] += 1

                try:
                    output = provider.analyze(comparison_data)
                    latency_ms = (time.time() - call_start) * 1000

                    # Update successful state metrics
                    state["status"] = "available"
                    state["success_count"] += 1
                    state["last_success_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
                    state["last_error"] = None
                    state["cooldown_until"] = 0.0
                    
                    # Update moving average latency
                    if state["avg_latency_ms"] == 0:
                        state["avg_latency_ms"] = latency_ms
                    else:
                        state["avg_latency_ms"] = (state["avg_latency_ms"] * 0.8) + (latency_ms * 0.2)

                    fallback_used = len(fallback_history) > 0
                    if fallback_used:
                        state["fallback_count"] += 1

                    return output, provider.name, fallback_used, fallback_history

                except QuotaExhaustedError as qe:
                    # CRITICAL: HTTP 429 Quota Exceeded -> Immediately enter cooldown, DO NOT retry
                    state["failures"] += 1
                    state["status"] = "rate_limited"
                    state["last_error"] = str(qe)[:150]
                    state["last_failure_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
                    state["cooldown_until"] = time.time() + AI_PROVIDER_COOLDOWN_SECONDS
                    fallback_history.append(f"{provider.name}: HTTP 429 Quota Exhausted -> Switched immediately")
                    break # Break retry loop, switch to next provider

                except SchemaValidationError as sve:
                    # Malformed JSON schema -> Switch to next provider
                    state["failures"] += 1
                    state["last_error"] = str(sve)[:150]
                    state["last_failure_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
                    fallback_history.append(f"{provider.name}: Schema validation error -> Switched")
                    break

                except Exception as e:
                    state["failures"] += 1
                    state["last_error"] = str(e)[:150]
                    state["last_failure_time"] = time.strftime("%Y-%m-%d %H:%M:%S")
                    
                    err_str = str(e).lower()
                    if "429" in err_str or "quota" in err_str or "rate limit" in err_str or "resource exhausted" in err_str:
                        state["status"] = "rate_limited"
                        state["cooldown_until"] = time.time() + AI_PROVIDER_COOLDOWN_SECONDS
                        fallback_history.append(f"{provider.name}: Rate limit detected -> Cooldown {AI_PROVIDER_COOLDOWN_SECONDS}s")
                        break

                    # Temporary error: exponential backoff before retry
                    if current_attempt <= max_retries:
                        backoff_sec = (2 ** (current_attempt - 1)) + (random.uniform(0.1, 0.5))
                        time.sleep(min(backoff_sec, 2.0))
                    else:
                        fallback_history.append(f"{provider.name}: {str(e)[:80]}")

        # Final safety guarantee: Grounded Deterministic Engine
        grounded_provider = self.providers["grounded"]
        grounded_output = grounded_provider.analyze(comparison_data)
        return grounded_output, grounded_provider.name, True, fallback_history

# Global singleton router instance
ai_router = AIProviderRouter()
