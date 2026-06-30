from typing import Any, TypedDict

from app.schemas.incident_context import IncidentContext


class InvestigationState(TypedDict, total=False):
    context: IncidentContext
    triage: dict[str, Any]
    investigation: dict[str, Any]
    classification: dict[str, Any]
    mitigation: dict[str, Any]
    report: dict[str, Any]
    review: dict[str, Any]
    errors: list[str]
    source: str
