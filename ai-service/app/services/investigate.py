import json

from openai import OpenAI

from app.config import settings
from app.schemas.incident_context import IncidentContext, SummaryResponse
from app.services.summary_generator import generate_fallback_summary


def _build_prompt(context: IncidentContext) -> str:
    payload = context.model_dump()
    return f"""You are a SOC analyst assistant. Analyze this security incident and respond with JSON only.

Incident data:
{json.dumps(payload, indent=2)}

Return JSON with this exact structure:
{{
  "summary": "2-3 sentence executive summary grounded in the evidence",
  "markdown": "Full markdown SOC report with sections: Overview, Key Findings, Threat Classification, Recommendations",
  "key_findings": ["finding 1", "finding 2"],
  "threat_classification": {{"attackType": "...", "category": "...", "confidence": 0.0-1.0}},
  "recommendations": [{{"actionType": "lock_account|block_ip|force_password_reset", "description": "...", "priority": "high|medium|low"}}],
  "confidence": 0.0-1.0
}}

Rules:
- Base every claim on the provided alerts and events only
- Do not invent systems or data not in the context
- Use professional SOC language
"""


async def generate_llm_summary(context: IncidentContext) -> SummaryResponse:
    client = OpenAI(api_key=settings.openai_api_key)

    response = client.chat.completions.create(
        model=settings.model_name,
        messages=[
            {"role": "system", "content": "You are a cybersecurity SOC analyst. Respond with valid JSON only."},
            {"role": "user", "content": _build_prompt(context)},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    data = json.loads(raw)

    return SummaryResponse(
        summary=data.get("summary", ""),
        markdown=data.get("markdown", data.get("summary", "")),
        key_findings=data.get("key_findings", []),
        threat_classification=data.get("threat_classification", {}),
        recommendations=data.get("recommendations", []),
        confidence=float(data.get("confidence", 0.8)),
        source="openai",
    )


async def generate_summary(context: IncidentContext) -> SummaryResponse:
    if settings.openai_api_key and settings.openai_api_key.startswith("sk-"):
        try:
            return await generate_llm_summary(context)
        except Exception:
            pass

    return generate_fallback_summary(context)
