from typing import Any

from pydantic import BaseModel, Field


class AgentResult(BaseModel):
    agent_name: str
    status: str = "completed"
    output: dict[str, Any] = Field(default_factory=dict)
    confidence: float = 0.0


class WorkflowResponse(BaseModel):
    incident_id: str
    agents: list[AgentResult]
    source: str = "fallback"
    summary: str = ""
    markdown: str = ""
    threat_classification: dict[str, Any] = Field(default_factory=dict)
    recommendations: list[dict[str, str]] = Field(default_factory=list)
