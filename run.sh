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

# Load environment variables from .env
export $(grep -v '^#' .env | xargs)

if [ -z "$GROQ_API_KEY" ]; then
    echo "❌ Error: GROQ_API_KEY is not set in the .env file."
    echo "Please set your Groq API key in: $CWD/.env"
    exit 1
fi

# Check if python3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed or not in PATH."
    exit 1
fi

# Start the uvicorn development server
echo "📡 Launching backend server on http://127.0.0.1:8001..."
python3 -m uvicorn app:app --host 127.0.0.1 --port 8001 --reload
