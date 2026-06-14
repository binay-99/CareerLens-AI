import json
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from ..services.vector_store import VectorStoreService
from ..services.embedding_service import EmbeddingService

class RoleMatcherInput(BaseModel):
    skills_json: str = Field(description="JSON array of extracted skills with proficiency scores")
    top_k: int = Field(default=5, description="Number of top roles to return")

class RoleMatcherTool(BaseTool):
    name: str = "role_matcher"
    description: str = (
        "Given extracted skills JSON, find the top matching career roles using vector similarity "
        "search. Returns roles with match scores, salary ranges, and fit rationale."
    )
    args_schema: type = RoleMatcherInput

    def _run(self, skills_json: str, top_k: int = 5) -> str:
        try:
            skills = json.loads(skills_json)
        except Exception:
            return json.dumps({"error": "Invalid skills JSON string provided"})
            
        # Get query embedding using embedding service
        embedding_svc = EmbeddingService()
        query_embedding = embedding_svc.embed_weighted(skills)
        
        # Query vector store
        vs = VectorStoreService()
        matches = vs.query(query_embedding, top_k=top_k)
        
        return json.dumps(matches, indent=2)
