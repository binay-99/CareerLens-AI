import json
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from ..services.vector_store import VectorStoreService

class GapAnalyserInput(BaseModel):
    user_skills_json: str = Field(description="User's extracted skills JSON")
    target_role_id: str = Field(description="Role ID from role_matcher results")

class GapAnalyserTool(BaseTool):
    name: str = "gap_analyser"
    description: str = (
        "Analyse skill gaps between the user's current skills and a target role's requirements. "
        "Returns critical gaps, nice-to-have gaps, and strengths. Quantifies how close they are."
    )
    args_schema: type = GapAnalyserInput

    def _run(self, user_skills_json: str, target_role_id: str) -> str:
        try:
            user_skills_list = json.loads(user_skills_json)
            user_skills = {s["skill"].lower(): s["proficiency"] for s in user_skills_list}
        except Exception:
            return json.dumps({"error": "Invalid user_skills JSON string provided"})
            
        vs = VectorStoreService()
        role = vs.get_role_by_id(target_role_id)
        print("=" * 60)
        print("ROLE ID:", target_role_id)
        print("ROLE TITLE:", role.get("title"))
        print("REQUIRED SKILLS:", role.get("required_skills"))
        print("=" * 60)
        if not role:
            return json.dumps({"error": f"Role '{target_role_id}' not found in database"})
            
        gaps = []
        strengths = []
        
        # Analyze required skills
        for req in role.get("required_skills", []):
            req_skill = req["skill"]
            req_weight = req["weight"]
            
            user_level = user_skills.get(req_skill.lower(), 0.0)
            gap = req_weight - user_level
            
            if gap > 0.1:
                gaps.append({
                    "skill": req_skill,
                    "current": round(user_level, 2),
                    "required": req_weight,
                    "gap_severity": "critical" if gap > 0.4 else "moderate",
                    "estimated_weeks_to_close": max(1, int(gap * 12))
                })
            else:
                strengths.append({
                    "skill": req_skill,
                    "user_level": round(user_level, 2),
                    "required_level": req_weight
                })
                
        # Analyze nice-to-haves
        nice_to_have_gaps = []
        for nice_skill in role.get("nice_to_have", []):
            user_level = user_skills.get(nice_skill.lower(), 0.0)
            if user_level < 0.4:
                nice_to_have_gaps.append({
                    "skill": nice_skill,
                    "current": round(user_level, 2),
                    "required": 0.5,
                    "gap_severity": "nice-to-have",
                    "estimated_weeks_to_close": 2
                })
                
        total_gaps_count = len(gaps)
        total_strengths_count = len(strengths)
        
        if total_gaps_count + total_strengths_count > 0:
            overall_readiness = total_strengths_count / (total_gaps_count + total_strengths_count)
        else:
            overall_readiness = 0.0
            
        estimated_weeks = sum(g["estimated_weeks_to_close"] for g in gaps if g["gap_severity"] == "critical")
        if estimated_weeks == 0:
            estimated_weeks = max(1, sum(g["estimated_weeks_to_close"] for g in gaps))
            
        return json.dumps({
            "target_role_id": target_role_id,
            "target_role": role.get("title", "Unknown Role"),
            "overall_readiness": round(overall_readiness, 2),
            "critical_gaps": [g for g in gaps if g["gap_severity"] == "critical"],
            "moderate_gaps": [g for g in gaps if g["gap_severity"] == "moderate"],
            "nice_to_have_gaps": nice_to_have_gaps,
            "strengths": strengths,
            "estimated_ready_in_weeks": estimated_weeks
        }, indent=2)
        print("\nGAP RESULT:")
        print(json.dumps(result, indent=2))
        return json.dumps(result, indent=2)
