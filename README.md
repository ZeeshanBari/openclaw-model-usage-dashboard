# OpenClaw Model Usage Dashboard

Track your AI model usage with a beautiful dashboard, automated daily briefs, and Obsidian integration.

![Dashboard Preview](docs/dashboard.png)

## Features

- 📊 **Real-time Dashboard** - Live view of today's spend, token usage, and model breakdown
- 💰 **Budget Alerts** - $20/day budget with warnings at 75% and 90% usage
- 📈 **Weekly Trends** - 7-day cost and token charts
- 📝 **Obsidian Integration** - Auto-generated daily notes with usage tables
- 🔄 **Automated Cron Jobs** - Daily briefs at 8:00 AM
- 📥 **Export Options** - CSV and Markdown reports
- 🚀 **GitHub Pages Hosting** - Free, automatic deployment

## Quick Start

```bash
# Clone and install
git clone https://github.com/ZeeshanBari/openclaw-model-usage-dashboard.git
cd openclaw-model-usage-dashboard
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000

## Production Deployment

### GitHub Pages (Automatic)

1. Push to main branch
2. GitHub Actions automatically builds and deploys
3. Visit: https://zeeshanbari.github.io/openclaw-model-usage-dashboard/

### Local Production

```bash
npm run server  # API on port 3001
npm run build  # Static files in dist/
```

## Configuration

| Setting | Value |
|---------|-------|
| Daily Budget | $20.00 |
| Alert Thresholds | 75% (warning), 90% (critical) |
| Daily Brief | 8:00 AM |
| Data Storage | `obsidian-vault/ai-usage/` |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/usage` | All usage data |
| `GET /api/export/csv` | Download CSV |
| `GET /api/export/weekly` | Weekly markdown report |
| `GET /api/obsidian/daily` | Today's Obsidian note |

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── services/      # Usage tracking service
│   └── utils/         # Helpers
├── server/
│   └── index.js       # Express API server
├── .github/workflows/ # GitHub Pages deployment
└── setup.sh          # Cron job setup
```

## License

MIT
