# 🤖 Techno Recruit: Autonomous Multi-Agent Screening Assistant

An advanced, portfolio-grade AI screening assistant powered by an autonomous multi-agent ReAct orchestration loop. It parses job descriptions, compiles technical curriculum syllabi, generates questions and grading rubrics, evaluates mock candidate responses, and exports printable guide templates.

---

## 🌟 Key Features

*   **Multi-Agent Collaborative Orchestration**: Built a modular pipeline separating roles across agents:
    *   **JD Parser Agent**: Extracts technical requirements and candidate personas.
    *   **Syllabus Agent**: Outlines core competency areas to assess.
    *   **Question Generator Agent**: Drafts initial question sets matching the syllabus.
    *   **Interviewer Critic Agent**: Performs self-critique reflexion checks on style and seniority level.
    *   **Question Refiner Agent**: Regenerates rejected draft questions in-place.
    *   **Scorecard Agent**: Structures rubrics (1/3/5 scale) and detailed ideal model answers.
*   **Live Node Flowchart Visualizer**: Displays a dynamic flowchart UI highlighting which agent is executing, flashing red during Critic correction cycles.
*   **Candidate Assessment Sandbox (Grading Tool)**: Enter or dictate a candidate's answer to any question. The agent grades it 1-5, listing strengths, weaknesses, warning red flags, and suggestions for follow-up questions.
*   **Browser Voice Dictation (Speech-to-Text)**: Features native browser SpeechRecognition API dictation inside the sandbox.
*   **Single-Question Tweak Controls**: Allows tweaking individual questions (making them harder, easier, or specifying custom instructions) in-place.
*   **LLMOps Metrics Dashboard**: Computes total latency, token count, and estimated API transaction cost dynamically.
*   **A4 Print Optimization**: Print or export clean evaluation scorecard PDFs directly.

---

## 🛠️ Tech Stack

*   **Backend**: Python, FastAPI, Uvicorn, Python-dotenv
*   **Frontend**: Vanilla HTML5/CSS3 (Modern glassmorphic neon aesthetic), Vanilla JS, Lucide Icons
*   **LLM Engine**: Groq API (`llama-3.3-70b-versatile`)

---

## 📈 System Architecture

```mermaid
graph TD
    UI[Frontend Client Web App] -->|POST /api/generate| API[FastAPI Server]
    UI -->|POST /api/tweak| TweakAPI[/api/tweak]
    UI -->|POST /api/evaluate| EvalAPI[/api/evaluate]
    
    API -->|1. Run Orchestrated Agents| Loop[agent.py Loop]
    Loop -->|Step 1| JD[JD Parser Agent]
    Loop -->|Step 2| Syl[Syllabus Agent]
    Loop -->|Step 3| QGen[Question Writer Agent]
    
    Loop -->|Step 4: Critique Loop| Critic[Interviewer Critic Agent]
    Critic -->|Rejects / Feedback| Refiner[Question Refiner Agent]
    Refiner -->|Updated drafts| Critic
    Critic -->|Accepts| Builder[Scorecard Architect Agent]
    
    Builder -->|Step 5| Logger[DB Logger Agent]
    Logger -->|Step 6| DB[(Cloud Firestore Database)]
```

---

## 🚀 Setup & Execution

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/techno-recruit.git
cd techno-recruit
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Run the Server
Use the provided startup script:
```bash
./run.sh
```
Or execute manual commands:
```bash
# Install dependencies
pip3 install -r requirements.txt

# Run the app
python3 -m uvicorn app:app --host 127.0.0.1 --port 8001 --reload
```
Open **`http://127.0.0.1:8001`** in your browser.
