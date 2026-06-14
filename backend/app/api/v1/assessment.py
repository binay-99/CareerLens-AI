from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from ...tools.skill_extractor import SkillExtractorTool
from ...tools.role_matcher import RoleMatcherTool
from ...services.cache import save_user_profile, get_user_profile
import json

router = APIRouter()

class ExtractSkillsRequest(BaseModel):
    raw_text: str

class MatchRolesRequest(BaseModel):
    skills: List[Dict[str, Any]]

class SaveProfileRequest(BaseModel):
    session_id: str
    skills: List[Dict[str, Any]]
    goals: Dict[str, Any] = {}
    selected_role: Dict[str, Any] = {}

@router.post("/assessment/extract-skills")
async def extract_skills(request: ExtractSkillsRequest):
    try:
        extractor = SkillExtractorTool()
        skills_json = extractor._run(request.raw_text)
        return json.loads(skills_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract skills: {str(e)}")

@router.post("/assessment/match-roles")
async def match_roles(request: MatchRolesRequest):
    try:
        matcher = RoleMatcherTool()
        skills_str = json.dumps(request.skills)
        roles_json = matcher._run(skills_str)
        return json.loads(roles_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to match roles: {str(e)}")

@router.post("/assessment/save-profile")
async def save_profile(request: SaveProfileRequest):
    try:
        profile_data = {
            "skills": request.skills,
            "goals": request.goals,
            "selected_role": request.selected_role
        }
        print("=" * 50)
        print("PROFILE SAVED")
        print(profile_data)
        print("=" * 50)
        await save_user_profile(request.session_id, profile_data)
        return {"status": "success", "message": "Profile saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save profile: {str(e)}")

@router.get("/assessment/profile/{session_id}")
async def get_profile(session_id: str):
    profile = await get_user_profile(session_id)
    if not profile:
        return {"skills": [], "goals": {}}
    return profile
