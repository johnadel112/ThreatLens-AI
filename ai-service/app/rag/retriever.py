"""Lightweight keyword-based RAG retriever for security knowledge."""

import json
import re
from pathlib import Path

_KB_PATH = Path(__file__).resolve().parent.parent / "knowledge" / "security_kb.json"
_CACHE: list[dict] | None = None


def _load_kb() -> list[dict]:
    global _CACHE
    if _CACHE is None:
        with open(_KB_PATH, encoding="utf-8") as f:
            _CACHE = json.load(f)
    return _CACHE


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-z0-9_]+", text.lower()))


def retrieve_knowledge(context: dict, limit: int = 4) -> list[dict]:
    """Score knowledge chunks by keyword overlap with incident context."""
    kb = _load_kb()
    query_parts = [
        context.get("title", ""),
        context.get("severity", ""),
        context.get("username", "") or "",
        context.get("ip", "") or "",
        str(context.get("correlation_narrative", "")),
        " ".join(context.get("mitre_tactics", []) or []),
    ]

    for alert in context.get("alerts", []):
        query_parts.extend([
            alert.get("rule_id", ""),
            alert.get("title", ""),
            alert.get("summary", "") or "",
        ])

    for event in context.get("events", []):
        query_parts.append(event.get("event_type", ""))

    query_tokens = _tokenize(" ".join(query_parts))

    scored = []
    for chunk in kb:
        chunk_tokens = set(chunk.get("tags", [])) | _tokenize(chunk.get("title", "")) | _tokenize(chunk.get("content", ""))
        overlap = len(query_tokens & chunk_tokens)
        if overlap > 0:
            scored.append((overlap, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = [c for _, c in scored[:limit]]

    if not results:
        results = kb[:2]

    return [
        {
            "id": r["id"],
            "title": r["title"],
            "category": r["category"],
            "content": r["content"],
        }
        for r in results
    ]


def format_knowledge_for_prompt(chunks: list[dict]) -> str:
    if not chunks:
        return "No knowledge base matches."
    lines = []
    for c in chunks:
        lines.append(f"[{c['id']}] {c['title']}: {c['content']}")
    return "\n\n".join(lines)
