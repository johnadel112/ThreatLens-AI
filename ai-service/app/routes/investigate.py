from fastapi import APIRouter, HTTPException

from app.schemas.incident_context import IncidentContext, SummaryResponse
from app.services.investigate import generate_summary

router = APIRouter(prefix="/investigate", tags=["investigate"])


@router.post("/summary", response_model=SummaryResponse)
async def investigate_summary(context: IncidentContext):
    if not context.incident_id:
        raise HTTPException(status_code=400, detail="incident_id is required")

    return await generate_summary(context)
