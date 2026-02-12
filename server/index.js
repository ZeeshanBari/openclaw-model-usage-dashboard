import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format, subDays, parseISO } from 'date-fns';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const DATA_DIR = path.join(__dirname, '..', '..', '..', 'obsidian-vault', 'ai-usage');
const DAILY_DIR = path.join(DATA_DIR, 'daily');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure data directories exist
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DAILY_DIR)) fs.mkdirSync(DAILY_DIR, { recursive: true });
  if (!fs.existsSync(USAGE_FILE)) {
    fs.writeFileSync(USAGE_FILE, JSON.stringify({ sessions: [], lastUpdated: new Date().toISOString() }));
  }
}

// API Routes

// Get all usage data
app.get('/api/usage', (req, res) => {
  ensureDataDir();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayFile = path.join(DAILY_DIR, `${today}.json`);
  
  // Today
  let todayData = { date: today, models: {}, totalTokens: 0, totalCost: 0 };
  if (fs.existsSync(todayFile)) {
    todayData = JSON.parse(fs.readFileSync(todayFile, 'utf8'));
  }
  
  // Last 7 days
  const weekData = [];
  for (let i = 0; i < 7; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const file = path.join(DAILY_DIR, `${date}.json`);
    if (fs.existsSync(file)) {
      weekData.unshift(JSON.parse(fs.readFileSync(file, 'utf8')));
    } else {
      weekData.unshift({ date, totalTokens: 0, totalCost: 0 });
    }
  }
  
  // All time
  let allTime = { totalTokens: 0, totalCost: 0, totalSessions: 0, models: {} };
  if (fs.existsSync(USAGE_FILE)) {
    const data = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
    allTime.totalSessions = data.sessions?.length || 0;
    data.sessions?.forEach(session => {
      Object.entries(session.models || {}).forEach(([model, stats]) => {
        if (!allTime.models[model]) {
          allTime.models[model] = { totalTokens: 0, totalCost: 0, calls: 0 };
        }
        allTime.models[model].totalTokens += stats.totalTokens;
        allTime.models[model].totalCost += stats.totalCost;
        allTime.models[model].calls += stats.calls;
      });
    });
    allTime.totalTokens = Object.values(allTime.models).reduce((sum, m) => sum + m.totalTokens, 0);
    allTime.totalCost = Object.values(allTime.models).reduce((sum, m) => sum + m.totalCost, 0);
  }
  
  res.json({ today: todayData, week: weekData, allTime });
});

// Export CSV
app.get('/api/export/csv', (req, res) => {
  ensureDataDir();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=model-usage.csv');
  
  let csv = 'Date,Model,Input Tokens,Output Tokens,Total Tokens,Cost,Calls\n';
  
  const files = fs.readdirSync(DAILY_DIR).filter(f => f.endsWith('.json')).sort();
  files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(DAILY_DIR, file), 'utf8'));
    Object.entries(data.models || {}).forEach(([model, stats]) => {
      csv += `${data.date},${model},${stats.inputTokens || 0},${stats.outputTokens || 0},${stats.totalTokens},${stats.cost},${stats.calls}\n`;
    });
  });
  
  res.send(csv);
});

// Weekly report
app.get('/api/export/weekly', (req, res) => {
  ensureDataDir();
  const weekData = [];
  let totalCost = 0, totalTokens = 0;
  
  for (let i = 0; i < 7; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const file = path.join(DAILY_DIR, `${date}.json`);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      weekData.unshift(data);
      totalCost += data.totalCost;
      totalTokens += data.totalTokens;
    }
  }
  
  const report = `# Weekly Model Usage Report\n\n`;
  report += `## Summary (Last 7 Days)\n\n`;
  report += `- **Total Cost:** $${totalCost.toFixed(2)}\n`;
  report += `- **Total Tokens:** ${totalTokens.toLocaleString()}\n`;
  report += `- **Avg Daily Cost:** $${(totalCost / 7).toFixed(2)}\n\n`;
  
  report += `## Daily Breakdown\n\n`;
  report += `| Date | Cost | Tokens |\n`;
  report += `|------|------|--------|\n`;
  weekData.forEach(day => {
    report += `| ${day.date} | $${day.totalCost.toFixed(2)} | ${day.totalTokens.toLocaleString()} |\n`;
  });
  
  report += `\n## Model Breakdown\n\n`;
  const models = {};
  weekData.forEach(day => {
    Object.entries(day.models || {}).forEach(([model, stats]) => {
      if (!models[model]) models[model] = { cost: 0, tokens: 0 };
      models[model].cost += stats.cost;
      models[model].tokens += stats.totalTokens;
    });
  });
  
  report += `| Model | Cost | Tokens |\n`;
  report += `|-------|------|--------|\n`;
  Object.entries(models).sort((a, b) => b[1].cost - a[1].cost).forEach(([model, stats]) => {
    report += `| ${model} | $${stats.cost.toFixed(2)} | ${stats.tokens.toLocaleString()} |\n`;
  });
  
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', 'attachment; filename=weekly-report.md');
  res.send(report);
});

// Obsidian daily note
app.get('/api/obsidian/daily', (req, res) => {
  ensureDataDir();
  const today = format(new Date(), 'yyyy-MM-dd');
  const dailyFile = path.join(DAILY_DIR, `${today}.json`);
  
  if (!fs.existsSync(dailyFile)) {
    return res.send(`# AI Usage - ${today}\n\nNo usage recorded today.`);
  }
  
  const data = JSON.parse(fs.readFileSync(dailyFile, 'utf8'));
  const budget = 20;
  const budgetUsed = (data.totalCost / budget) * 100;
  
  let note = `# AI Usage - ${today}\n\n`;
  note += `## Budget Status\n`;
  note += `- **Spent:** $${data.totalCost.toFixed(2)} / $${budget}\n`;
  note += `- **Remaining:** $${(budget - data.totalCost).toFixed(2)}\n`;
  note += `- **Usage:** ${budgetUsed.toFixed(1)}%\n\n`;
  
  note += `## Model Usage\n\n`;
  note += `| Model | Tokens | Cost | Calls |\n`;
  note += `|-------|--------|------|-------|\n`;
  
  Object.entries(data.models || {}).sort((a, b) => b[1].totalTokens - a[1].totalTokens).forEach(([model, stats]) => {
    note += `| ${model.split('/').pop()} | ${stats.totalTokens.toLocaleString()} | $${stats.cost.toFixed(4)} | ${stats.calls} |\n`;
  });
  
  note += `\n**Total:** ${data.totalTokens.toLocaleString()} tokens, $${data.totalCost.toFixed(4)}\n`;
  
  res.setHeader('Content-Type', 'text/markdown');
  res.send(note);
});

// Record usage (for cron job)
app.post('/api/usage/record', express.json(), (req, res) => {
  const { sessionData } = req.body;
  // This would integrate with OpenClaw's session data
  res.json({ success: true, message: 'Usage recording endpoint ready' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Usage Dashboard API running on port ${PORT}`);
});
