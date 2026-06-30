from fastapi import APIRouter, HTTPException

from app.schemas.incident_context import IncidentContext, SummaryResponse
from app.schemas.workflow_response import WorkflowResponse
from app.services.investigate import generate_summary
from app.services.workflow_runner import run_investigation_workflow

router = APIRouter(prefix="/investigate", tags=["investigate"])


@router.post("/summary", response_model=SummaryResponse)
async def investigate_summary(context: IncidentContext):
    if not context.incident_id:
        raise HTTPException(status_code=400, detail="incident_id is required")

    return await generate_summary(context)


@router.post("/workflow", response_model=WorkflowResponse)
async def investigate_workflow(context: IncidentContext):
    if not context.incident_id:
        raise HTTPException(status_code=400, detail="incident_id is required")

    return await run_investigation_workflow(context)
