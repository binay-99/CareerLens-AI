from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import List

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini" # we can use gpt-4o or gpt-4o-mini
    openai_embedding_model: str = "text-embedding-3-small"
    openai_temperature: float = 0.3

    # Vector store
    pinecone_api_key: str = ""
    pinecone_index: str = "career-roles"
    chroma_persist_dir: str = "./chroma_db"
    use_pinecone: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:///./career_counselor.db"  # Fallback to local SQLite to make setup trivial
    redis_url: str = ""  # Let's make this optional too to avoid crash

    # Observability
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    otel_exporter_endpoint: str = ""

    # App
    environment: str = "development"
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    max_tokens_per_session: int = 20000
    
    # Tavily Search
    tavily_api_key: str = ""

    
    # Mock settings
    mock_mode: bool = False

    @property
    def is_mock_enabled(self) -> bool:
        return self.mock_mode or not self.openai_api_key
@lru_cache
def get_settings() -> Settings:
    return Settings()
