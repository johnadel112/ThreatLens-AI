from typing import Any

from pydantic import BaseModel, Field


class AgentResult(BaseModel):
    agent_name: str
    status: str = "completed"
    output: dict[str, Any] = Field(default_factory=dict)
    confidence: float = 0.0


class ReportQualityScore(BaseModel):
    evidence_completeness: int = 0
    timeline_quality: int = 0
    threat_classification_confidence: int = 0
    mitigation_quality: int = 0
    report_clarity: int = 0
    overall_confidence: int = 0
    missing_evidence: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class WorkflowResponse(BaseModel):
    incident_id: str
    agents: list[AgentResult]
    source: str = "fallback"
    summary: str = ""
    markdown: str = ""
    threat_classification: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[dict[str, str]] = Field(default_factory=list)
    report_quality: ReportQualityScore = Field(default_factory=ReportQualityScore)
    knowledge_sources: list[str] = Field(default_factory=list)
