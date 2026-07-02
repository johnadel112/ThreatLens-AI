from typing import Any, Optional

from pydantic import BaseModel, Field


class TimelineEntry(BaseModel):
    timestamp: str
    source: str
    title: str
    description: Optional[str] = None


class AlertContext(BaseModel):
    alert_id: Optional[str] = None
    title: str
    severity: str
    rule_id: str
    summary: Optional[str] = None
    mitre_tactic: Optional[str] = None
    risk_score: Optional[int] = None


class EventContext(BaseModel):
    event_id: Optional[str] = None
    event_type: str
    username: Optional[str] = None
    ip: Optional[str] = None
    source: Optional[str] = None
    timestamp: str
    severity: Optional[str] = None
    risk_score: Optional[int] = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class KnowledgeChunk(BaseModel):
    id: str
    title: str
    category: str
    content: str


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
    correlation_score: Optional[int] = None
    correlation_narrative: Optional[str] = None
    mitre_tactics: list[str] = Field(default_factory=list)
    risk_score: Optional[int] = None
    threat_intel: dict[str, Any] = Field(default_factory=dict)
    knowledge: list[KnowledgeChunk] = Field(default_factory=list)


class SummaryResponse(BaseModel):
    summary: str
    markdown: str
    key_findings: list[str] = Field(default_factory=list)
    threat_classification: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[dict[str, str]] = Field(default_factory=list)
    confidence: float = 0.0
    source: str = "fallback"
