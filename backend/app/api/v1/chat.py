from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from ...agents.orchestrator import build_agent
from ...services.cache import get_session_history, save_session_message
import asyncio
import json

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: str
    context: dict = {}

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        agent_executor = build_agent(request.session_id)
        history = await get_session_history(request.session_id)
        
        # Save user message to history
        await save_session_message(request.session_id, "user", request.message)
        
        full_response = ""
        try:
            async for chunk in agent_executor.astream({
                "input": request.message,
                "chat_history": history,
            }):
                if "output" in chunk:
                    token = chunk["output"]
                    full_response += token
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                elif "steps" in chunk:
                    for step in chunk["steps"]:
                        # Yield intermediate thinking states to show on frontend
                        yield f"data: {json.dumps({'type': 'tool_call', 'tool': step.action.tool, 'status': 'running'})}\n\n"
                        await asyncio.sleep(0.1)
        except Exception as e:
            err_msg = f"Error generating stream output: {str(e)}"
            yield f"data: {json.dumps({'type': 'error', 'content': err_msg})}\n\n"
            
        # Save final agent message to history
        if full_response:
            await save_session_message(request.session_id, "assistant", full_response)
            
        yield "data: {\"type\": \"done\"}\n\n"
        
    return StreamingResponse(generate(), media_type="text/event-stream")
