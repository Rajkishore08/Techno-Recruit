#!/bin/bash

# Navigate to the script's directory
CWD="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$CWD"

echo "================================================================="
echo "🚀 Starting Techno Recruit (Autonomous Screening Agent)"
echo "================================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️ Warning: .env file not found. Creating a default one..."
    echo "GROQ_API_KEY=" > .env
fi

# Launch full-stack application (FastAPI backend + Vite React frontend)
echo "📡 Launching Techno Recruit (Backend: http://localhost:8001 | Frontend: http://localhost:3000)..."
npm run dev

