from pydantic import BaseModel, Field
from typing import Any, Optional


class TimelineEntry(BaseModel):
    timestamp: str
    source: str
    title: str
    description: Optional[str] = None


class AlertContext(BaseModel):
    title: str
    severity: str
    rule_id: str
    summary: Optional[str] = None


class EventContext(BaseModel):
    event_type: str
    username: Optional[str] = None
    ip: Optional[str] = None
    source: Optional[str] = None
    timestamp: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class IncidentContext(BaseModel):
    incident_id: str
    title: str
    severity: str
    status: str
    username: Optional[str] = None
    ip: Optional[str] = None
    alerts: list[AlertContext] = Field(default_factory=list)
    events: list[EventContext] = Field(default_factory=list)
    timeline: list[TimelineEntry] = Field(default_factory=list)


class SummaryResponse(BaseModel):
    summary: str
    markdown: str
    key_findings: list[str] = Field(default_factory=list)
    threat_classification: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[dict[str, str]] = Field(default_factory=list)
    confidence: float = 0.0
    source: str = "fallback"
