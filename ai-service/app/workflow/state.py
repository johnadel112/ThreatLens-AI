from typing import Any, TypedDict

from app.schemas.incident_context import IncidentContext


class InvestigationState(TypedDict, total=False):
    context: IncidentContext
    triage: dict[str, Any]
    investigation: dict[str, Any]
    classification: dict[str, Any]
    mitigation: dict[str, Any]
    report: dict[str, Any]
    reviewer: dict[str, Any]
    knowledge_sources: list[str]
    errors: list[str]
    source: str
