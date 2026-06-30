import json

from openai import OpenAI

from app.config import settings


def _llm_json(system: str, user: str) -> dict:
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.chat.completions.create(
        model=settings.model_name,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content or "{}"
    return json.loads(raw)


def llm_agent(agent_name: str, context_payload: dict, prior: dict, schema_hint: str) -> dict | None:
    if not settings.openai_api_key or not settings.openai_api_key.startswith("sk-"):
        return None

    try:
        prompt = f"""Agent: {agent_name}
Incident context:
{json.dumps(context_payload, indent=2)}

Prior agent outputs:
{json.dumps(prior, indent=2)}

Return JSON only matching: {schema_hint}
Base all conclusions strictly on the provided evidence."""
        return _llm_json(
            "You are a SOC specialist agent. Respond with valid JSON only.",
            prompt,
        )
    except Exception:
        return None
