from collections import Counter

from app.schemas.incident_context import IncidentContext
from app.services.summary_generator import _infer_attack_type


def _event_counts(context: IncidentContext) -> Counter:
    return Counter(e.event_type for e in context.events)


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

    return {
        "assessedSeverity": assessed,
        "priority": priority,
        "urgencyExplanation": " ".join(urgency_parts) or "Standard investigation queue.",
        "confidence": 0.8,
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

    return {
        "timeline": timeline,
        "evidenceSummary": "; ".join(findings) or "Limited event evidence available.",
        "keyFindings": findings,
        "confidence": 0.78,
    }


def run_classification(context: IncidentContext, investigation: dict) -> dict:
    attack_type, category = _infer_attack_type(context)
    return {
        "attackType": attack_type,
        "category": category,
        "mitreTactic": category,
        "confidence": 0.76,
        "rationale": investigation.get("evidenceSummary", ""),
    }


def run_mitigation(context: IncidentContext, classification: dict) -> dict:
    actions = [
        {
            "actionType": "lock_account",
            "description": f"Lock account {context.username or 'unknown'} pending verification",
            "justification": f"Associated with {classification.get('attackType', 'suspicious activity')}",
            "priority": "high",
        },
        {
            "actionType": "block_ip",
            "description": f"Block or isolate IP {context.ip or 'unknown'}",
            "justification": "Source IP linked to multiple suspicious events",
            "priority": "high",
        },
        {
            "actionType": "force_password_reset",
            "description": "Force credential reset and enable MFA",
            "justification": "Credential compromise indicators present",
            "priority": "medium",
        },
    ]
    return {"actions": actions, "confidence": 0.77}


def run_report(context: IncidentContext, triage: dict, investigation: dict, classification: dict, mitigation: dict) -> dict:
    executive = (
        f"{context.title} ({context.severity}) affecting {context.username or 'unknown user'} "
        f"from {context.ip or 'unknown IP'}. Classification: {classification.get('attackType')}."
    )

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

## Threat Classification
- **Attack Type:** {classification.get('attackType')}
- **Category:** {classification.get('category')}

## Mitigation Recommendations
{chr(10).join(f"- **{a['actionType']}**: {a['description']}" for a in mitigation.get('actions', []))}

---
*ThreatLens AI — evidence-based report*
"""

    return {
        "executiveSummary": executive,
        "technicalDetails": investigation.get("evidenceSummary"),
        "timeline": investigation.get("timeline"),
        "recommendations": mitigation.get("actions"),
        "markdown": markdown,
        "confidence": 0.8,
    }


def run_reviewer(triage: dict, investigation: dict, classification: dict, report: dict) -> dict:
    warnings = []
    if not investigation.get("keyFindings"):
        warnings.append("Limited key findings — verify event ingestion coverage.")
    if classification.get("confidence", 0) < 0.7:
        warnings.append("Threat classification confidence is moderate.")

    return {
        "consistent": len(warnings) == 0,
        "warnings": warnings,
        "missingEvidence": [] if investigation.get("timeline") else ["No timeline entries available"],
        "confidence": 0.82,
    }
