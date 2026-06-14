import json
from typing import List, Dict, Any, Optional
from ..config import get_settings

# Simple thread-safe in-memory session store
_SESSION_HISTORIES: Dict[str, List[Dict[str, Any]]] = {}
_USER_PROFILES: Dict[str, Dict[str, Any]] = {}
_GENERATED_ROADMAPS: Dict[str, Dict[str, Any]] = {}

async def get_session_history(session_id: str) -> List[Dict[str, Any]]:
    """Get chat message objects for a given session."""
    return _SESSION_HISTORIES.get(session_id, [])

async def save_session_message(session_id: str, role: str, content: str):
    """Save a chat message in the session history."""
    if session_id not in _SESSION_HISTORIES:
        _SESSION_HISTORIES[session_id] = []
    _SESSION_HISTORIES[session_id].append({
        "role": role,
        "content": content
    })

async def get_user_profile(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve user skills profile."""
    return _USER_PROFILES.get(session_id)

async def save_user_profile(session_id: str, profile: Dict[str, Any]):
    """Save user skills profile."""
    _USER_PROFILES[session_id] = profile

async def get_user_roadmap(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve generated weekly roadmap."""
    return _GENERATED_ROADMAPS.get(session_id)

async def save_user_roadmap(session_id: str, roadmap: Dict[str, Any]):
    """Save user's roadmap."""
    _GENERATED_ROADMAPS[session_id] = roadmap
