import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from ...tools.github_analyser import GitHubAnalyserTool
from ...tools.resume_parser import ResumeParserTool
from ...config import get_settings
import json
import shutil

router = APIRouter()

class GithubRequest(BaseModel):
    username: str

class FeedbackRequest(BaseModel):
    session_id: str
    target_role_id: str
    portfolio_text: Optional[str] = ""
    github_username: Optional[str] = ""

PORTFOLIO_FEEDBACK_PROMPT = """
Analyse this candidate's portfolio/resume and provide specific, actionable feedback.

Portfolio content:
{portfolio_text}

Target role: {target_role}

Provide feedback ONLY as a structured JSON object with these keys:
1. "evidence_quality": list of objects, each with {{"project": string, "strength": string, "missing": string, "suggestion": string}}
2. "storytelling": string summary of their career narrative strength
3. "gaps_in_presentation": list of strings detailing skills that exist but aren't well-evidenced
4. "quick_wins": list of 3-4 changes they could make in 1 hour that would meaningfully improve their application
5. "longer_projects": list of objects, each with {{"name": string, "description": string}}

IMPORTANT: Be specific. Reference actual projects from their portfolio. Frame feedback constructively.
"""

@router.post("/portfolio/analyze-github")
async def analyze_github(request: GithubRequest):
    try:
        analyser = GitHubAnalyserTool()
        result_json = analyser._run(request.username)
        return json.loads(result_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze GitHub: {str(e)}")

@router.post("/portfolio/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    # Save file to a temporary directory in workspace
    temp_dir = "./temp_resumes"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        parser = ResumeParserTool()
        skills_json = parser._run(temp_path)
        
        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        return json.loads(skills_json)
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@router.post("/portfolio/feedback")
async def get_portfolio_feedback(request: FeedbackRequest):
    settings = get_settings()
    
    # Retrieve target role from DB
    from ...services.vector_store import VectorStoreService
    vs = VectorStoreService()
    role = vs.get_role_by_id(request.target_role_id)
    role_title = role.get("title", "Software Engineer")
    
    if not settings.is_mock_enabled:
        try:
            llm = ChatOpenAI(
            model="gemini-2.5-flash",
            temperature=0.2,
            api_key=settings.openai_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
            prompt = PORTFOLIO_FEEDBACK_PROMPT.format(
                portfolio_text=request.portfolio_text or "No resume uploaded yet.",
                target_role=role_title
            )
            res = llm.invoke(prompt)
            content = res.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            return json.loads(content)
        except Exception as e:
            print(f"OpenAI feedback generation failed: {e}")
            pass
            
    # Mock fallback feedback tailored to the target role
    mock_feedback = {
        "evidence_quality": [
            {
                "project": "Personal Web Server",
                "strength": "Clean implementation of HTTP query parser in Python.",
                "missing": "Lacks comprehensive integration tests or validation for bad requests.",
                "suggestion": f"Add PyTest suites mocking standard API responses and verify boundary conditions for {role_title} requirements."
            },
            {
                "project": "React Task Tracker",
                "strength": "Good responsive design using standard browser layout.",
                "missing": "State is lost on reload (no persistent browser storage integration).",
                "suggestion": "Save items to localStorage or integrate an indexDB database cache."
            }
        ],
        "storytelling": f"Your portfolio demonstrates core programming competencies, but fails to highlight the database management and system integration skills necessary for a {role_title} role.",
        "gaps_in_presentation": [
            "SQL databases are mentioned in your skills list, but none of the showcase projects contain SQL schemas or migrations.",
            "Containerization (Docker) is missing from repository description details."
        ],
        "quick_wins": [
            "Add a short, 3-sentence professional bio at the top of your resume emphasizing your system design passion.",
            "Link your GitHub repositories directly in the project headers so recruiters can inspect code instantly.",
            "Add badges for test coverage percentage in your GitHub README headers."
        ],
        "longer_projects": [
            {
                "name": "Distributed Job Scheduler",
                "description": f"Create a multi-service scheduling engine in Python that routes tasks to workers. Leverage SQLite, Redis queues, and write Dockerfiles. This directly closes the critical backend and DevOps engineering gaps."
            }
        ]
    }
    return mock_feedback
