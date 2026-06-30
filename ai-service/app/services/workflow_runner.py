from app.schemas.incident_context import IncidentContext
from app.schemas.workflow_response import AgentResult, WorkflowResponse
from app.workflow.graph import build_investigation_graph

AGENT_ORDER = ["triage", "investigation", "classification", "mitigation", "report", "reviewer"]


def _confidence(output: dict) -> float:
    return float(output.get("confidence", 0.75))


async def run_investigation_workflow(context: IncidentContext) -> WorkflowResponse:
    graph = build_investigation_graph()
    initial = {"context": context, "source": "fallback"}
    final_state = graph.invoke(initial)

    agents = []
    for name in AGENT_ORDER:
        output = final_state.get(name) or {}
        agents.append(
            AgentResult(
                agent_name=name,
                status="completed",
                output=output,
                confidence=_confidence(output),
            )
        )

    report = final_state.get("report") or {}
    classification = final_state.get("classification") or {}
    mitigation = final_state.get("mitigation") or {}
    triage = final_state.get("triage") or {}

    recommendations = mitigation.get("actions", [])
    summary = report.get("executiveSummary") or triage.get("urgencyExplanation", "")

    return WorkflowResponse(
        incident_id=context.incident_id,
        agents=agents,
        source=final_state.get("source", "fallback"),
        summary=summary,
        markdown=report.get("markdown", ""),
        threat_classification={
            "attackType": classification.get("attackType"),
            "category": classification.get("category"),
            "confidence": classification.get("confidence"),
        },
        recommendations=recommendations,
    )
