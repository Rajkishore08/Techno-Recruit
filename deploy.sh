#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Starting deployment sequence for Techno Recruit (React Frontend) ==="

PROJECT_ID="techno-recruit"
echo "Target Firebase Project: $PROJECT_ID"

echo "⚡ Building React Vite production bundle..."
npm run build

# Deploy to Firebase Hosting
echo "🚀 Deploying React static build artifacts (dist/) to Firebase Hosting..."
npx -y firebase-tools@latest use "$PROJECT_ID"
npx -y firebase-tools@latest deploy --only hosting

echo "=== React Frontend deployment completed successfully! ==="
