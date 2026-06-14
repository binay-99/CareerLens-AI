import json
from langchain_openai import ChatOpenAI
from ..config import get_settings




class RoadmapAgent:
    def __init__(self):
        self.settings = get_settings()

    def generate_roadmap(
    self,
    user_skills: list,
    target_role: dict,
    gaps: dict,
    hours_per_week: int = 15
) -> dict:

        return self._generate_mock_roadmap(
            user_skills,
            target_role,
            gaps,
            hours_per_week
        )
    

    def _generate_mock_roadmap(self, user_skills: list, target_role: dict, gaps: dict, hours_per_week: int) -> dict:
        print("🔥🔥🔥 NEW ROADMAP GENERATOR RUNNING 🔥🔥🔥")
        print("=" * 50)
        print("NEW ROADMAP GENERATOR RUNNING")
        print("ROLE:", target_role)
        print("=" * 50)
        role_title = target_role.get("title", "Software Engineer")
        role_lower = role_title.lower()

        if "backend" in role_lower:

            themes = [
                "Python Backend Fundamentals",
                "SQL & Database Design",
                "REST API Development",
                "Authentication & Security",
                "Docker Fundamentals",
                "Testing & CI/CD",
                "System Design Basics",
                "Backend Portfolio Project",
                "Advanced Backend Features",
                "Deployment & Monitoring",
                "Resume Optimization",
                "Interview Preparation"
            ]

            tasks_map = [
                ["Review Python OOP", "Master Git & GitHub"],
                ["Learn SQL Joins", "Design Relational Databases"],
                ["Build CRUD APIs", "Learn FastAPI/Flask"],
                ["JWT Authentication", "Password Hashing"],
                ["Docker Basics", "Docker Compose"],
                ["Pytest Fundamentals", "GitHub Actions"],
                ["Caching with Redis", "Load Balancing Basics"],
                ["Design Backend Project", "Setup Project Structure"],
                ["Add Authentication", "Implement Database Integration"],
                ["Deploy to Railway/Render", "Application Monitoring"],
                ["Update Resume", "Optimize LinkedIn"],
                ["Backend Interview Questions", "Mock Interviews"]
            ]

        elif "data scientist" in role_lower or "data science" in role_lower:

            themes = [
                "Python & NumPy",
                "Pandas Fundamentals",
                "Statistics Basics",
                "Probability & Hypothesis Testing",
                "Data Visualization",
                "Machine Learning Basics",
                "Feature Engineering",
                "Model Evaluation",
                "Data Science Portfolio Project",
                "Kaggle Project",
                "Resume Optimization",
                "Interview Preparation"
            ]

            tasks_map = [
                ["Python Refresher", "NumPy Arrays"],
                ["DataFrames", "Data Cleaning"],
                ["Descriptive Statistics", "Inferential Statistics"],
                ["Probability", "Hypothesis Testing"],
                ["Matplotlib", "Seaborn"],
                ["Regression", "Classification"],
                ["Feature Scaling", "Encoding Techniques"],
                ["Cross Validation", "Performance Metrics"],
                ["EDA Project", "Business Insights Report"],
                ["Kaggle Competition", "Project Documentation"],
                ["Update Resume", "Optimize LinkedIn"],
                ["Data Science Interview Questions", "Mock Interviews"]
            ]

        elif "frontend" in role_lower:

            themes = [
                "HTML & CSS Foundations",
                "JavaScript Fundamentals",
                "Advanced JavaScript",
                "React Basics",
                "React State Management",
                "API Integration",
                "Frontend Testing",
                "Frontend Portfolio Project",
                "Advanced React Features",
                "Deployment",
                "Resume Optimization",
                "Interview Preparation"
            ]

            tasks_map = [
                ["Semantic HTML", "Responsive CSS"],
                ["JavaScript Basics", "DOM Manipulation"],
                ["ES6+", "Async JavaScript"],
                ["React Components", "Props & State"],
                ["Context API", "Hooks"],
                ["REST APIs", "Axios"],
                ["Jest", "React Testing Library"],
                ["Portfolio Website", "UI Improvements"],
                ["Performance Optimization", "Routing"],
                ["Deploy to Vercel", "SEO Basics"],
                ["Update Resume", "Optimize LinkedIn"],
                ["Frontend Interview Questions", "Mock Interviews"]
            ]
        elif "machine learning" in role_lower:

            themes = [
                "Python for ML",
                "NumPy & Pandas",
                "Statistics for ML",
                "Machine Learning Fundamentals",
                "Supervised Learning",
                "Unsupervised Learning",
                "Feature Engineering",
                "Model Evaluation",
                "ML Portfolio Project",
                "MLOps Basics",
                "Resume Optimization",
                "Interview Preparation"
            ]

            tasks_map = [
                ["Python Refresher", "Data Structures"],
                ["NumPy Arrays", "Pandas DataFrames"],
                ["Probability", "Statistics"],
                ["Linear Regression", "Classification"],
                ["Decision Trees", "Random Forest"],
                ["Clustering", "Dimensionality Reduction"],
                ["Feature Scaling", "Feature Selection"],
                ["Cross Validation", "Metrics"],
                ["Build ML Project", "Document Results"],
                ["Docker for ML", "Model Deployment"],
                ["Update Resume", "Optimize LinkedIn"],
                ["ML Interview Questions", "Mock Interviews"]
            ]
        elif "devops" in role_lower:

            themes = [
                "Linux Fundamentals",
                "Networking Basics",
                "Git & GitHub",
                "Docker",
                "CI/CD Pipelines",
                "Cloud Fundamentals",
                "AWS Core Services",
                "Infrastructure as Code",
                "DevOps Portfolio Project",
                "Monitoring & Logging",
                "Resume Optimization",
                "Interview Preparation"
            ]

            tasks_map = [
                ["Linux Commands", "Shell Scripting"],
                ["TCP/IP", "DNS Fundamentals"],
                ["Git Workflows", "GitHub Actions"],
                ["Docker Basics", "Docker Compose"],
                ["Jenkins", "GitHub Actions CI"],
                ["Cloud Concepts", "Virtual Machines"],
                ["EC2", "S3"],
                ["Terraform Basics", "IaC Practice"],
                ["Deploy Project", "Automate Deployment"],
                ["Prometheus", "Grafana"],
                ["Update Resume", "Optimize LinkedIn"],
                ["DevOps Interview Questions", "Mock Interviews"]
            ]

        else:

            themes = [
                "Career Foundation",
                "Core Skills",
                "Project Development",
                "Interview Preparation"
            ] * 3

            tasks_map = [
                ["Learn Fundamentals", "Practice Concepts"]
            ] * 12

        weeks = []

        for week_number in range(1, 13):

            current_tasks = []

            for task in tasks_map[week_number - 1]:

                current_tasks.append({
                    "title": task,
                    "hours": max(2, hours_per_week // 2),
                    "resource": None
                })

            weeks.append({
                "week_number": week_number,
                "theme": themes[week_number - 1],
                "tasks": current_tasks,
                "milestone": f"Complete {themes[week_number - 1]}"
            })

        return {
            "target_role": role_title,
            "overall_readiness": gaps.get("overall_readiness", 0.5),
            "weeks": weeks
        }