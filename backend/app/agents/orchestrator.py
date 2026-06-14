import json
import asyncio
from typing import AsyncGenerator, Dict, Any, List
from langchain.agents import create_agent
from langchain_classic.agents import AgentExecutor
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langfuse.langchain import CallbackHandler as LangfuseHandler
from ..tools.skill_extractor import SkillExtractorTool
from ..tools.role_matcher import RoleMatcherTool
from ..tools.gap_analyser import GapAnalyserTool
from ..tools.course_fetcher import CourseFetcherTool
from ..tools.github_analyser import GitHubAnalyserTool
from ..config import get_settings

SYSTEM_PROMPT = """You are Aria, an expert AI career counselor at Career Lens. 
Your mission is to help students discover roles aligned with their actual skills, 
identify what's missing, and create a realistic, week-by-week plan to get there.

IMPORTANT GUIDELINES:
- You suggest and guide — you do not guarantee outcomes or salaries
- Always acknowledge uncertainty: "Based on your profile, this role seems like a strong fit — though final hiring decisions depend on many factors."
- Never be dismissive of unconventional paths. A self-taught developer with a great portfolio can beat a CS graduate.
- If you lack information, ask one focused question rather than assuming.
- Reference specific evidence from the user's portfolio/experience when making claims.

You have access to these tools:
{tools}

Use this format:
Thought: What do I need to figure out?
Action: tool_name
Action Input: the input to the tool
Observation: the result
... (repeat as needed)
Thought: I now have enough to answer
Final Answer: [your response to the user]

Current conversation:
{chat_history}

User: {input}
{agent_scratchpad}
"""

class MockAction:
    def __init__(self, tool_name: str):
        self.tool = tool_name

class MockStep:
    def __init__(self, tool_name: str):
        self.action = MockAction(tool_name)

class AriaAgentExecutor:
    def __init__(self, tools: list):
        self.tools = tools
        self.settings = get_settings()

        self.llm = ChatOpenAI(
            model="gemini-2.5-flash",
            temperature=0.2,
            api_key=self.settings.openai_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )

    async def astream(self, inputs):

        user_input = inputs.get("input", "")
        history = inputs.get("chat_history", "")

        query = user_input.lower()

        tool_result = ""

        try:

            # Skill Gap Queries
            if any(word in query for word in [
                "gap",
                "missing skill",
                "sql gap",
                "weakness"
            ]):

                yield {
                    "steps": [MockStep("gap_analyser")]
                }

                analyser = GapAnalyserTool()

                tool_result = analyser._run(
                    '{"skills":["Python","SQL"]}',
                    "data-scientist"
                )

            # Role Matching
            elif any(word in query for word in [
                "role",
                "career",
                "job",
                "fit"
            ]):

                yield {
                    "steps": [MockStep("role_matcher")]
                }

                matcher = RoleMatcherTool()

                tool_result = matcher._run(
                    '{"skills":["Python","SQL"]}'
                )

            # GitHub Analysis
            elif "github" in query:

                yield {
                    "steps": [MockStep("github_analyser")]
                }

                tool_result = "GitHub analysis requested."

            prompt = f"""
    You are Aria, an AI Career Counselor.

    User Question:
    {user_input}

    Tool Output:
    {tool_result}

    Give a helpful, detailed response.
    """

            response = await self.llm.ainvoke(prompt)

            yield {
                "output": response.content
            }

        except Exception as e:

            yield {
                "output": f"Error: {str(e)}"
            }

def build_agent(session_id: str, langfuse_enabled: bool = True):
    settings = get_settings()

    print("Mock Enabled:", settings.is_mock_enabled)
    print("Mock Mode:", settings.mock_mode)
    print("API Key Exists:", bool(settings.openai_api_key))

    tools = [
        SkillExtractorTool(),
        RoleMatcherTool(),
        GapAnalyserTool(),
        CourseFetcherTool(),
        GitHubAnalyserTool(),
    ]

    try:
        llm = ChatOpenAI(
            model="gemini-2.5-flash",
            temperature=0.2,
            api_key=settings.openai_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )

       
        return AriaAgentExecutor(tools)

    except Exception as e:
        print(f"Failed to initialize Gemini: {e}")
        return AriaAgentExecutor(tools)