import json
import hashlib
from typing import List, Dict, Any
from langchain_openai import OpenAIEmbeddings
from ..config import get_settings

class EmbeddingService:
    def __init__(self):
        self.settings = get_settings()
        
        # Load skills taxonomy to map skills to unique dimensions in mock mode
        try:
            with open("data/skills_taxonomy.json", "r") as f:
                self.taxonomy = json.load(f)
        except Exception:
            try:
                with open("backend/data/skills_taxonomy.json", "r") as f:
                    self.taxonomy = json.load(f)
            except Exception:
                self.taxonomy = {"mappings": {}, "canonical_skills": []}
                
        self.canonical_skills = self.taxonomy.get("canonical_skills", [])
        self.mappings = self.taxonomy.get("mappings", {})
        
        # Initialize real embeddings if enabled
        if not self.settings.is_mock_enabled:
            self.embeddings_client = OpenAIEmbeddings(
                api_key=self.settings.openai_api_key,
                model=self.settings.openai_embedding_model
            )
        else:
            self.embeddings_client = None

    def normalize_skill(self, skill_name: str) -> str:
        s = skill_name.strip().lower()
        if s in self.mappings:
            return self.mappings[s]
        # Direct lookup (case insensitive)
        for canon in self.canonical_skills:
            if canon.lower() == s:
                return canon
        return skill_name

    def embed_text(self, text: str) -> List[float]:
        """Embed a generic text string."""
        if self.embeddings_client:
            try:
                return self.embeddings_client.embed_query(text)
            except Exception:
                # Fallback to mock if API call fails
                pass
        
        # Deterministic Mock Embedding (1536 dimensions)
        vector = [0.0] * 1536
        # Find which canonical skills are mentioned in the text
        normalized_text = text.lower()
        
        # Set weights based on mentions
        for i, skill in enumerate(self.canonical_skills[:1000]):
            if skill.lower() in normalized_text:
                vector[i] = 0.8
        
        # Add simple hash-based dispersion to avoid zero vectors for arbitrary texts
        sha = hashlib.sha256(text.encode("utf-8")).digest()
        for idx in range(32):
            val = sha[idx] / 255.0
            pos = (int(sha[idx]) * (idx + 1)) % 1536
            vector[pos] += val * 0.2
            
        # Normalize vector to unit length
        magnitude = sum(x*x for x in vector) ** 0.5
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        return vector

    def embed_weighted(self, skills: List[Dict[str, Any]]) -> List[float]:
        """
        Embed a weighted skills profile.
        skills is a list of {"skill": str, "proficiency": float}
        """
        if self.embeddings_client:
            try:
                # In real mode, join skills to a text description and embed
                desc = ", ".join([f"{s['skill']} with proficiency {s['proficiency']:.2f}" for s in skills])
                return self.embeddings_client.embed_query(desc)
            except Exception:
                pass
                
        # Deterministic Mock Embedding
        vector = [0.0] * 1536
        for item in skills:
            skill_name = self.normalize_skill(item.get("skill", ""))
            proficiency = item.get("proficiency", 0.5)
            
            if skill_name in self.canonical_skills:
                idx = self.canonical_skills.index(skill_name)
                # Map to index
                if idx < 1536:
                    vector[idx] = float(proficiency)
            else:
                # For non-taxonomy skills, hash to a deterministic index [100 - 1535]
                h = int(hashlib.sha256(skill_name.encode("utf-8")).hexdigest(), 16)
                idx = 100 + (h % 1436)
                vector[idx] = float(proficiency)
                
        # Normalize vector to unit length
        magnitude = sum(x*x for x in vector) ** 0.5
        if magnitude > 0:
            vector = [x / magnitude for x in vector]
        return vector
