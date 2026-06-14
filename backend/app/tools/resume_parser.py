import os
from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from pypdf import PdfReader
from .skill_extractor import SkillExtractorTool

class ResumeParserInput(BaseModel):
    file_path: str = Field(description="Local file path to the resume PDF to parse")

class ResumeParserTool(BaseTool):
    name: str = "resume_parser"
    description: str = (
        "Reads a local PDF resume, extracts the plain text, and processes it to extract "
        "skills, proficiencies, and evidence. Returns the normalized skills JSON list."
    )
    args_schema: type = ResumeParserInput

    def _run(self, file_path: str) -> str:
        if not os.path.exists(file_path):
            return f"{{\"error\": \"File not found at path '{file_path}'\"}}"
            
        try:
            # Load PDF text using pypdf
            reader = PdfReader(file_path)
            full_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
                    
            if not full_text.strip():
                return "{\"error\": \"Could not extract any text from the PDF file.\"}"
                
            # Run extracted text through the skill extractor
            extractor = SkillExtractorTool()
            skills_json = extractor._run(full_text)
            return skills_json
            
        except Exception as e:
            return f"{{\"error\": \"Failed to parse PDF: {str(e)}\"}}"
