# Career Lens AI Career Counselor

Career Lens is a comprehensive AI-powered career advisor that extracts skills, matches profiles to roles, analyzes gaps, generates study roadmaps, and conducts portfolio reviews.

## Option 1: Running with Docker Compose (Recommended)

From the root directory (`career-counselor/`), run:

```bash
docker-compose up --build
```

This spins up the frontend (port `3000`), backend (port `8000`), vector store database, Redis cache, and Chroma.

---

## Option 2: Running Services Locally (Manual Development)

### 1. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. (Optional) Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Setup (Next.js 16)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install node dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your web browser.
