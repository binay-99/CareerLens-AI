from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ...agents.roadmap_agent import RoadmapAgent
from ...services.cache import get_user_profile, save_user_roadmap, get_user_roadmap
from ...services.vector_store import VectorStoreService
import json

router = APIRouter()

class RoadmapRequest(BaseModel):
    session_id: str
    target_role_id: str
    hours_per_week: int = 15

class SaveRoadmapRequest(BaseModel):
    session_id: str
    roadmap: Dict[str, Any]

@router.post("/roadmap/generate")
async def generate_roadmap_endpoint(request: RoadmapRequest):
    profile = await get_user_profile(request.session_id)
    if not profile:
        # If no profile, mock initial skills list
        user_skills = [
            {"skill": "Python", "proficiency": 0.5},
            {"skill": "JavaScript", "proficiency": 0.4}
        ]
    else:
        user_skills = profile.get("skills", [])
        
    vs = VectorStoreService()
    role = vs.get_role_by_id(request.target_role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Target role not found")
        
    # Analyze gaps first
    from ...tools.gap_analyser import GapAnalyserTool
    analyser = GapAnalyserTool()
    gaps_json = analyser._run(json.dumps(user_skills), request.target_role_id)
    gaps = json.loads(gaps_json)
    
    agent = RoadmapAgent()
    try:
        roadmap = agent.generate_roadmap(
            user_skills=user_skills,
            target_role=role,
            gaps=gaps,
            hours_per_week=request.hours_per_week
        )
        # Store in cache
        await save_user_roadmap(request.session_id, roadmap)
        return roadmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate study roadmap: {str(e)}")

@router.get("/roadmap/get/{session_id}")
async def get_roadmap(session_id: str):
    roadmap = await get_user_roadmap(session_id)
    if not roadmap:
        return {"weeks": [], "target_role": "", "overall_readiness": 0.0}
    return roadmap

@router.post("/roadmap/save")
async def save_roadmap(request: SaveRoadmapRequest):
    try:
        await save_user_roadmap(request.session_id, request.roadmap)
        return {"status": "success", "message": "Roadmap saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save roadmap: {str(e)}")
