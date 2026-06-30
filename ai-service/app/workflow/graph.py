from app.agents.fallback_agents import (
    run_classification,
    run_investigation,
    run_mitigation,
    run_report,
    run_reviewer,
    run_triage,
)
from app.agents.llm import llm_agent
from app.workflow.state import InvestigationState


def triage_node(state: InvestigationState) -> InvestigationState:
    context = state["context"]
    payload = context.model_dump()
    llm = llm_agent(
        "triage",
        payload,
        {},
        '{"assessedSeverity":"...","priority":"P1-P4","urgencyExplanation":"...","confidence":0.0-1.0}',
    )
    result = llm or run_triage(context)
    return {"triage": result, "source": "openai" if llm else state.get("source", "fallback")}


def investigation_node(state: InvestigationState) -> InvestigationState:
    context = state["context"]
    llm = llm_agent(
        "investigation",
        context.model_dump(),
        {"triage": state.get("triage")},
        '{"timeline":[],"evidenceSummary":"...","keyFindings":[],"confidence":0.0-1.0}',
    )
    result = llm or run_investigation(context)
    return {"investigation": result}


def classification_node(state: InvestigationState) -> InvestigationState:
    context = state["context"]
    inv = state.get("investigation") or {}
    llm = llm_agent(
        "classification",
        context.model_dump(),
        {"investigation": inv},
        '{"attackType":"...","category":"...","mitreTactic":"...","confidence":0.0-1.0,"rationale":"..."}',
    )
    result = llm or run_classification(context, inv)
    return {"classification": result}


def mitigation_node(state: InvestigationState) -> InvestigationState:
    context = state["context"]
    cls = state.get("classification") or {}
    llm = llm_agent(
        "mitigation",
        context.model_dump(),
        {"classification": cls},
        '{"actions":[{"actionType":"...","description":"...","justification":"...","priority":"high|medium|low"}],"confidence":0.0-1.0}',
    )
    result = llm or run_mitigation(context, cls)
    return {"mitigation": result}


def report_node(state: InvestigationState) -> InvestigationState:
    context = state["context"]
    triage = state.get("triage") or {}
    inv = state.get("investigation") or {}
    cls = state.get("classification") or {}
    mit = state.get("mitigation") or {}
    llm = llm_agent(
        "report",
        context.model_dump(),
        {"triage": triage, "investigation": inv, "classification": cls, "mitigation": mit},
        '{"executiveSummary":"...","technicalDetails":"...","markdown":"...","confidence":0.0-1.0}',
    )
    result = llm or run_report(context, triage, inv, cls, mit)
    return {"report": result}


def reviewer_node(state: InvestigationState) -> InvestigationState:
    triage = state.get("triage") or {}
    inv = state.get("investigation") or {}
    cls = state.get("classification") or {}
    rep = state.get("report") or {}
    result = run_reviewer(triage, inv, cls, rep)
    return {"review": result}


def build_investigation_graph():
    from langgraph.graph import END, StateGraph

    graph = StateGraph(InvestigationState)
    graph.add_node("triage_agent", triage_node)
    graph.add_node("investigation_agent", investigation_node)
    graph.add_node("classification_agent", classification_node)
    graph.add_node("mitigation_agent", mitigation_node)
    graph.add_node("report_agent", report_node)
    graph.add_node("reviewer_agent", reviewer_node)

    graph.set_entry_point("triage_agent")
    graph.add_edge("triage_agent", "investigation_agent")
    graph.add_edge("investigation_agent", "classification_agent")
    graph.add_edge("classification_agent", "mitigation_agent")
    graph.add_edge("mitigation_agent", "report_agent")
    graph.add_edge("report_agent", "reviewer_agent")
    graph.add_edge("reviewer_agent", END)

    return graph.compile()
