from app.schemas.incident_context import IncidentContext
from app.schemas.workflow_response import AgentResult, ReportQualityScore, WorkflowResponse
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
    reviewer = final_state.get("reviewer") or {}

    recommendations = mitigation.get("actions", [])
    summary = report.get("executiveSummary") or triage.get("urgencyExplanation", "")

    quality_raw = reviewer.get("reportQuality") or {}
    report_quality = ReportQualityScore(
        evidence_completeness=quality_raw.get("evidenceCompleteness", 0),
        timeline_quality=quality_raw.get("timelineQuality", 0),
        threat_classification_confidence=quality_raw.get("threatClassificationConfidence", 0),
        mitigation_quality=quality_raw.get("mitigationQuality", 0),
        report_clarity=quality_raw.get("reportClarity", 0),
        overall_confidence=quality_raw.get("overallConfidence", int(_confidence(reviewer) * 100)),
        missing_evidence=quality_raw.get("missingEvidence", reviewer.get("missingEvidence", [])),
        warnings=quality_raw.get("warnings", reviewer.get("warnings", [])),
    )

    knowledge_sources = list({
        *(final_state.get("knowledge_sources") or []),
        *(reviewer.get("knowledgeSources") or []),
    })

    return WorkflowResponse(
        incident_id=context.incident_id,
        agents=agents,
        source=final_state.get("source", "fallback"),
        summary=summary,
        markdown=report.get("markdown", ""),
        threat_classification={
            "attackType": classification.get("attackType"),
            "category": classification.get("category"),
            "mitreTactic": classification.get("mitreTactic"),
            "confidence": classification.get("confidence"),
            "techniqueId": classification.get("techniqueId"),
        },
        recommendations=recommendations,
        report_quality=report_quality,
        knowledge_sources=knowledge_sources,
    )
