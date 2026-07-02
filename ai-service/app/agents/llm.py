import json

from openai import OpenAI

from app.config import settings
from app.rag.retriever import format_knowledge_for_prompt


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
        knowledge = context_payload.get("knowledge", [])
        kb_text = format_knowledge_for_prompt(knowledge) if knowledge else "No knowledge retrieved."

        prompt = f"""Agent: {agent_name}

Security knowledge base (cite relevant IDs in knowledgeSources when applicable):
{kb_text}

Incident context:
{json.dumps({k: v for k, v in context_payload.items() if k != 'knowledge'}, indent=2)}

Prior agent outputs:
{json.dumps(prior, indent=2)}

Return JSON only matching: {schema_hint}

Requirements:
- Base all conclusions strictly on provided evidence (alerts, events, timeline).
- Include relatedAlertIds and relatedEventIds when available in context.
- Include reasoningSummary explaining why conclusions were reached.
- List knowledgeSources array with KB chunk IDs used."""
        return _llm_json(
            "You are a SOC specialist agent. Respond with valid JSON only. Never invent evidence IDs.",
            prompt,
        )
    except Exception:
        return None
