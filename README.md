# OpenClaw Model Usage Dashboard

Track your AI model usage with a beautiful dashboard, automated daily briefs, and Obsidian integration.

## Live Dashboard

**GitHub Pages:** https://zeeshanbari.github.io/openclaw-model-usage-dashboard/

## Quick Start

```bash
git clone https://github.com/ZeeshanBari/openclaw-model-usage-dashboard.git
cd openclaw-model-usage-dashboard
npm install
npm run dev
```

## Verification Commands

```bash
# Extract and view today's usage
npm run extract

# View today's JSON data
cat ~/obsidian-vault/ai-usage/daily/$(date +%Y-%m-%d).json

# Run the full cron job manually
npm run cron
```

## Live Data (Local Server)

```bash
# Terminal 1: API server
npm run server

# Terminal 2: Dashboard  
npm run dev
# Visit: http://localhost:3000
```

## Cron Job

Daily at 8:00 AM:
```bash
crontab -l              # Verify
cat ~/.openclaw/logs/usage-cron.log  # Logs
```

## Features

- 📊 Real-time dashboard
- 💰 $20/day budget alerts (75%/90%)
- 📈 Weekly trends chart
- 📝 Obsidian daily notes
- 🔄 Automated cron (8am)
- 📥 CSV/Markdown export
- 🚀 GitHub Pages

## Data Files

- `~/obsidian-vault/ai-usage/daily/YYYY-MM-DD.json`
- `~/obsidian-vault/daily-notes/YYYY-MM-DD.md`
- `~/.openclaw/logs/usage-cron.log`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/usage` | All usage data |
| `/api/export/csv` | Download CSV |
| `/api/export/weekly` | Weekly report |
| `/api/obsidian/daily` | Obsidian note |

MIT
