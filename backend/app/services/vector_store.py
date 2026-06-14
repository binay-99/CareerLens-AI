import os
import json
import numpy as np
from typing import List, Dict, Any
from .embedding_service import EmbeddingService
from ..config import get_settings

class VectorStoreService:
    def __init__(self):
        self.settings = get_settings()
        self.embedding_svc = EmbeddingService()
        self.roles: List[Dict[str, Any]] = []
        self._load_and_index_roles()

    def _load_and_index_roles(self):
        # Locate roles seed file
        seed_paths = [
            "data/roles_seed.json",
            "backend/data/roles_seed.json",
            "../data/roles_seed.json"
        ]
        
        data_loaded = False
        for path in seed_paths:
            if os.path.exists(path):
                try:
                    with open(path, "r") as f:
                        self.roles = json.load(f)
                    data_loaded = True
                    break
                except Exception as e:
                    print(f"Error loading {path}: {e}")
                    
        if not data_loaded:
            # Fallback mock empty roles
            self.roles = []
            
        # Calculate description/skills embeddings for roles
        for role in self.roles:
            # We want to embed the role's skills requirements
            skills_rep = [{"skill": s["skill"], "proficiency": s["weight"]} for s in role.get("required_skills", [])]
            role["embedding"] = self.embedding_svc.embed_weighted(skills_rep)

    def query(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """Query vector store for top matching roles."""
        if not self.roles:
            return []
            
        q_vec = np.array(query_embedding)
        q_norm = np.linalg.norm(q_vec)
        
        matches = []
        for role in self.roles:
            role_vec = np.array(role.get("embedding", [0.0] * 1536))
            role_norm = np.linalg.norm(role_vec)
            
            if q_norm > 0 and role_norm > 0:
                similarity = float(np.dot(q_vec, role_vec) / (q_norm * role_norm))
            else:
                similarity = 0.0
                
            # Copy role data without embedding vectors to return
            match_data = {k: v for k, v in role.items() if k != "embedding"}
            match_data["match_score"] = round(similarity, 3)
            
            # Simple fit rationale based on skills overlap
            required = {s["skill"].lower() for s in role.get("required_skills", [])}
            match_data["fit_rationale"] = f"Matches required skills including: {', '.join(list(required)[:3])}"
            
            matches.append(match_data)
            
        # Sort by similarity score descending
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        return matches[:top_k]

    def get_role_by_id(self, role_id: str) -> Dict[str, Any]:
        for role in self.roles:
            if role["id"] == role_id:
                return {k: v for k, v in role.items() if k != "embedding"}
        return {}
