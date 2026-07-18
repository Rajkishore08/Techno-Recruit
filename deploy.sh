#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Starting deployment sequence for Techno Recruit (Frontend) ==="

PROJECT_ID="techno-recruit"
echo "Target Firebase Project: $PROJECT_ID"

# Deploy to Firebase Hosting
echo "🚀 Deploying frontend static files to Firebase Hosting..."
npx -y firebase-tools@latest use "$PROJECT_ID"
npx -y firebase-tools@latest deploy --only hosting

echo "=== Frontend deployment completed successfully! ==="
