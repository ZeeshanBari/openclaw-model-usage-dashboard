#!/bin/bash
# OpenClaw Model Usage Dashboard - Setup Script
# Run this to initialize the dashboard and set up cron jobs

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Setting up Model Usage Dashboard..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Create data directory
mkdir -p ../obsidian-vault/ai-usage/daily
echo "📁 Data directory: ../obsidian-vault/ai-usage/"

# Set up daily brief cron job (8:00 AM daily)
CRON_CMD="0 8 * * * cd $SCRIPT_DIR && node -e \"require('./server/index.js').runDailyBrief()\""
CRON_ID="model-usage-daily"

echo "⏰ Setting up daily brief cron job (8:00 AM)..."
# Remove existing cron job
(crontab -l 2>/dev/null | grep -v "$CRON_ID") | crontab - 2>/dev/null || true

# Add new cron job
(crontab -l 2>/dev/null; echo "# $CRON_ID"; echo "$CRON_CMD") | crontab -

echo "✅ Cron job installed:"
crontab -l | grep "$CRON_ID"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the dashboard:"
echo "  npm run dev          # Development (http://localhost:3000)"
echo "  npm run server       # Production API only"
echo ""
echo "To view your data:"
echo "  npm run server && open http://localhost:3001/api/usage"
