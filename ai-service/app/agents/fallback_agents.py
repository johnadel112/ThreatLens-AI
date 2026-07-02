from collections import Counter

from app.schemas.incident_context import IncidentContext
from app.services.summary_generator import _infer_attack_type


def _event_counts(context: IncidentContext) -> Counter:
    return Counter(e.event_type for e in context.events)


def _build_evidence_explanation(context: IncidentContext, findings: list[str]) -> dict:
    related_alert_ids = [a.alert_id for a in context.alerts if a.alert_id]
    related_event_ids = [e.event_id for e in context.events if e.event_id]

    reasoning_points = []
    assumptions = []

    failed = sum(1 for e in context.events if e.event_type == "login_failed")
    if failed >= 3:
        reasoning_points.append(f"{failed} failed login attempts indicate credential guessing activity")
    success_after_fail = any(e.event_type == "login_success" for e in context.events) and failed > 0
    if success_after_fail:
        reasoning_points.append("Successful login followed failed attempts — possible account takeover")
    downloads = sum(1 for e in context.events if e.event_type == "file_download")
    if downloads >= 5:
        reasoning_points.append(f"{downloads} file download events suggest potential data exfiltration")

    ips = {e.ip for e in context.events if e.ip}
    if len(ips) == 1 and context.ip:
        reasoning_points.append(f"Activity concentrated on source IP {context.ip}")

    if context.correlation_narrative:
        reasoning_points.append(context.correlation_narrative)

    if not context.events:
        assumptions.append("Limited event telemetry — conclusions based primarily on alerts")
    if not related_alert_ids:
        assumptions.append("No alert IDs linked — manual correlation may be required")

    missing = []
    if not related_event_ids:
        missing.append("No event IDs available for deep forensic review")
    if not context.threat_intel:
        missing.append("Threat intelligence enrichment not available for source IP")

    return {
        "evidenceUsed": findings,
        "relatedAlertIds": related_alert_ids,
        "relatedEventIds": related_event_ids[:25],
        "reasoningSummary": " ".join(reasoning_points) or "Analysis based on correlated alerts and available event telemetry.",
        "reasoningPoints": reasoning_points,
        "assumptions": assumptions,
        "missingEvidence": missing,
    }


def run_triage(context: IncidentContext) -> dict:
    priority_map = {"critical": "P1", "high": "P2", "medium": "P3", "low": "P4"}
    assessed = context.severity
    priority = priority_map.get(assessed, "P3")

    urgency_parts = []
    if assessed in ("critical", "high"):
        urgency_parts.append("Immediate analyst attention required.")
    if any(a.rule_id == "data_exfil_v1" for a in context.alerts):
        urgency_parts.append("Potential data exfiltration detected.")
    if any(a.rule_id == "suspicious_login_v1" for a in context.alerts):
        urgency_parts.append("Possible account compromise in progress.")
    if context.correlation_score and context.correlation_score >= 70:
        urgency_parts.append(f"High correlation score ({context.correlation_score}) indicates multi-stage attack.")

    knowledge_refs = [k.id for k in context.knowledge[:2]]

    return {
        "assessedSeverity": assessed,
        "priority": priority,
        "urgencyExplanation": " ".join(urgency_parts) or "Standard investigation queue.",
        "confidence": 0.8,
        "knowledgeSources": knowledge_refs,
    }


def run_investigation(context: IncidentContext) -> dict:
    timeline = []
    for entry in sorted(context.timeline, key=lambda t: t.timestamp):
        timeline.append({
            "timestamp": entry.timestamp,
            "source": entry.source,
            "title": entry.title,
            "description": entry.description,
        })

    counts = _event_counts(context)
    findings = []
    if counts.get("login_failed"):
        findings.append(f"{counts['login_failed']} failed authentication events")
    if counts.get("login_success"):
        findings.append("Successful login after failed attempts")
    if counts.get("file_download"):
        findings.append(f"{counts['file_download']} file download events")
    if counts.get("permission_change"):
        findings.append("Permission or role change detected")
    if counts.get("port_scan"):
        findings.append("Network reconnaissance / port scan activity")

    for alert in context.alerts:
        findings.append(f"Alert [{alert.rule_id}]: {alert.title}")

    explainability = _build_evidence_explanation(context, findings)
    knowledge_refs = [k.id for k in context.knowledge if k.category in ("detection", "mitre")][:3]

    return {
        "timeline": timeline,
        "evidenceSummary": "; ".join(findings) or "Limited event evidence available.",
        "keyFindings": findings,
        "confidence": 0.78,
        **explainability,
        "knowledgeSources": knowledge_refs,
    }


def run_classification(context: IncidentContext, investigation: dict) -> dict:
    attack_type, category = _infer_attack_type(context)
    mitre_tactic = category
    if context.mitre_tactics:
        mitre_tactic = context.mitre_tactics[0]

    rationale_parts = [investigation.get("evidenceSummary", "")]
    if investigation.get("reasoningPoints"):
        rationale_parts.extend(investigation["reasoningPoints"][:3])

    return {
        "attackType": attack_type,
        "category": category,
        "mitreTactic": mitre_tactic,
        "confidence": 0.76,
        "rationale": " ".join(rationale_parts),
        "evidenceUsed": investigation.get("evidenceUsed", []),
        "relatedAlertIds": investigation.get("relatedAlertIds", []),
        "relatedEventIds": investigation.get("relatedEventIds", []),
        "knowledgeSources": [k.id for k in context.knowledge if k.category == "mitre"][:2],
    }


def run_mitigation(context: IncidentContext, classification: dict) -> dict:
    playbook_refs = [k.id for k in context.knowledge if k.category == "playbook"]
    actions = [
        {
            "actionType": "lock_account",
            "description": f"Lock account {context.username or 'unknown'} pending verification",
            "justification": f"Associated with {classification.get('attackType', 'suspicious activity')}",
            "priority": "high",
            "knowledgeSource": playbook_refs[0] if playbook_refs else None,
        },
        {
            "actionType": "block_ip",
            "description": f"Block or isolate IP {context.ip or 'unknown'}",
            "justification": "Source IP linked to multiple suspicious events",
            "priority": "high",
            "knowledgeSource": playbook_refs[0] if playbook_refs else None,
        },
        {
            "actionType": "force_password_reset",
            "description": "Force credential reset and enable MFA",
            "justification": "Credential compromise indicators present",
            "priority": "medium",
            "knowledgeSource": playbook_refs[1] if len(playbook_refs) > 1 else None,
        },
    ]
    return {
        "actions": actions,
        "confidence": 0.77,
        "knowledgeSources": playbook_refs[:2],
        "basedOnEvidence": classification.get("relatedAlertIds", []),
    }


def run_report(context: IncidentContext, triage: dict, investigation: dict, classification: dict, mitigation: dict) -> dict:
    executive = (
        f"{context.title} ({context.severity}) affecting {context.username or 'unknown user'} "
        f"from {context.ip or 'unknown IP'}. Classification: {classification.get('attackType')}."
    )

    evidence_section = "\n".join(
        f"- {p}" for p in investigation.get("reasoningPoints", [])[:6]
    ) or investigation.get("reasoningSummary", "N/A")

    markdown = f"""# SOC Investigation Report

## Executive Summary
{executive}

## Triage
- **Priority:** {triage.get('priority')}
- **Assessed Severity:** {triage.get('assessedSeverity')}
- {triage.get('urgencyExplanation')}

## Investigation Timeline
{chr(10).join(f"- {t.get('timestamp', '')}: {t.get('title', '')}" for t in investigation.get('timeline', [])[:15])}

## Evidence Summary
{investigation.get('evidenceSummary', 'N/A')}

## Explainable AI Analysis
{evidence_section}

**Related Alerts:** {', '.join(investigation.get('relatedAlertIds', [])[:5]) or 'None'}
**Related Events:** {len(investigation.get('relatedEventIds', []))} events referenced

## Threat Classification
- **Attack Type:** {classification.get('attackType')}
- **Category:** {classification.get('category')}
- **MITRE Tactic:** {classification.get('mitreTactic')}

## Mitigation Recommendations
{chr(10).join(f"- **{a['actionType']}**: {a['description']}" for a in mitigation.get('actions', []))}

---
*ThreatLens AI — RAG-enhanced evidence-based report*
"""

    return {
        "executiveSummary": executive,
        "technicalDetails": investigation.get("evidenceSummary"),
        "timeline": investigation.get("timeline"),
        "recommendations": mitigation.get("actions"),
        "markdown": markdown,
        "confidence": 0.8,
        "explainability": {
            "reasoningSummary": investigation.get("reasoningSummary"),
            "relatedAlertIds": investigation.get("relatedAlertIds", []),
            "relatedEventIds": investigation.get("relatedEventIds", []),
        },
    }


def _score_report_quality(triage: dict, investigation: dict, classification: dict, report: dict, context: IncidentContext) -> dict:
    event_count = len(context.events)
    alert_count = len(context.alerts)
    timeline_len = len(investigation.get("timeline", []))
    findings_len = len(investigation.get("keyFindings", []))

    evidence_completeness = min(100, 30 + findings_len * 8 + min(event_count, 10) * 3 + min(alert_count, 5) * 5)
    timeline_quality = min(100, 20 + timeline_len * 6 + (20 if timeline_len >= 3 else 0))
    threat_conf = int((classification.get("confidence", 0.7) or 0.7) * 100)
    mitigation_quality = min(100, 50 + len(report.get("recommendations", [])) * 12)
    report_clarity = 85 if report.get("executiveSummary") and report.get("markdown") else 55

    missing = list(investigation.get("missingEvidence", []))
    warnings = []

    if evidence_completeness < 60:
        warnings.append("Evidence completeness is below recommended threshold.")
    if timeline_quality < 50:
        warnings.append("Timeline lacks sufficient chronological detail.")
    if not investigation.get("relatedEventIds"):
        missing.append("No event IDs cited in investigation output")
    if classification.get("confidence", 1) < 0.7:
        warnings.append("Threat classification confidence is moderate.")

    overall = round(
        evidence_completeness * 0.3
        + timeline_quality * 0.2
        + threat_conf * 0.2
        + mitigation_quality * 0.15
        + report_clarity * 0.15
    )

    return {
        "consistent": len(warnings) == 0,
        "warnings": warnings,
        "missingEvidence": missing,
        "confidence": overall / 100,
        "reportQuality": {
            "evidenceCompleteness": evidence_completeness,
            "timelineQuality": timeline_quality,
            "threatClassificationConfidence": threat_conf,
            "mitigationQuality": mitigation_quality,
            "reportClarity": report_clarity,
            "overallConfidence": overall,
            "missingEvidence": missing,
            "warnings": warnings,
        },
        "knowledgeSources": list({
            *(triage.get("knowledgeSources") or []),
            *(investigation.get("knowledgeSources") or []),
            *(classification.get("knowledgeSources") or []),
        }),
    }


def run_reviewer(triage: dict, investigation: dict, classification: dict, report: dict, context: IncidentContext | None = None) -> dict:
    return _score_report_quality(triage, investigation, classification, report, context or IncidentContext(
        incident_id="0", title="", severity="low", status="new"
    ))
