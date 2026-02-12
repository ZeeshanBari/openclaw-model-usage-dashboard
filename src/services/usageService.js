// Usage data service - reads from JSON storage
import fs from 'fs';
import path from 'path';
import { format, startOfDay, parseISO } from 'date-fns';

const DATA_DIR = path.join(process.cwd(), '..', '..', '..', 'obsidian-vault', 'ai-usage');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');
const DAILY_DIR = path.join(DATA_DIR, 'daily');

// Ensure directories exist
export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DAILY_DIR)) {
    fs.mkdirSync(DAILY_DIR, { recursive: true });
  }
  if (!fs.existsSync(USAGE_FILE)) {
    fs.writeFileSync(USAGE_FILE, JSON.stringify({ sessions: [], lastUpdated: new Date().toISOString() }));
  }
}

// Extract usage from OpenClaw session data
export function extractUsageFromSession(sessionData) {
  const messages = sessionData.messages || [];
  const usage = {
    timestamp: new Date().toISOString(),
    date: format(new Date(), 'yyyy-MM-dd'),
    models: {},
    totalTokens: 0,
    totalCost: 0,
    sessionDuration: 0
  };

  messages.forEach(msg => {
    if (msg.model && msg.tokens) {
      const modelId = msg.model;
      if (!usage.models[modelId]) {
        usage.models[modelId] = {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: 0,
          calls: 0
        };
      }
      usage.models[modelId].inputTokens += msg.tokens.input || 0;
      usage.models[modelId].outputTokens += msg.tokens.output || 0;
      usage.models[modelId].totalTokens += (msg.tokens.input || 0) + (msg.tokens.output || 0);
      usage.models[modelId].calls += 1;
      usage.models[modelId].cost += calculateCost(modelId, msg.tokens);
      usage.totalTokens += (msg.tokens.input || 0) + (msg.tokens.output || 0);
      usage.totalCost += calculateCost(modelId, msg.tokens);
    }
  });

  return usage;
}

// Calculate cost based on model pricing (MiniMax M2.1 as default)
const MODEL_PRICING = {
  'minimax/MiniMax-M2.1': { input: 0.000015, output: 0.000060 }, // $15/$60 per 1M tokens
  'minimax/MiniMax-M2': { input: 0.000010, output: 0.000040 },
  'default': { input: 0.000010, output: 0.000050 }
};

function calculateCost(modelId, tokens) {
  const pricing = MODEL_PRICING[modelId] || MODEL_PRICING['default'];
  return (tokens.input * pricing.input) + (tokens.output * pricing.output);
}

// Record a new usage session
export function recordUsage(sessionData) {
  ensureDataDir();
  const usage = extractUsageFromSession(sessionData);
  
  // Update main usage file
  let usageData = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
  usageData.sessions.push(usage);
  usageData.lastUpdated = new Date().toISOString();
  fs.writeFileSync(USAGE_FILE, JSON.stringify(usageData, null, 2));

  // Create daily summary file
  const dailyFile = path.join(DAILY_DIR, `${usage.date}.json`);
  updateDailySummary(dailyFile, usage);

  return usage;
}

// Update or create daily summary
function updateDailySummary(filePath, newUsage) {
  let daily = { date: newUsage.date, models: {}, totalTokens: 0, totalCost: 0 };
  
  if (fs.existsSync(filePath)) {
    daily = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  // Merge new usage into daily
  Object.entries(newUsage.models).forEach(([model, data]) => {
    if (!daily.models[model]) {
      daily.models[model] = { ...data };
    } else {
      daily.models[model].inputTokens += data.inputTokens;
      daily.models[model].outputTokens += data.outputTokens;
      daily.models[model].totalTokens += data.totalTokens;
      daily.models[model].cost += data.cost;
      daily.models[model].calls += data.calls;
    }
  });

  daily.totalTokens = Object.values(daily.models).reduce((sum, m) => sum + m.totalTokens, 0);
  daily.totalCost = Object.values(daily.models).reduce((sum, m) => sum + m.cost, 0);

  fs.writeFileSync(filePath, JSON.stringify(daily, null, 2));
  return daily;
}

// Get today's usage
export function getTodayUsage() {
  ensureDataDir();
  const today = format(new Date(), 'yyyy-MM-dd');
  const dailyFile = path.join(DAILY_DIR, `${today}.json`);
  
  if (fs.existsSync(dailyFile)) {
    return JSON.parse(fs.readFileSync(dailyFile, 'utf8'));
  }
  
  return { date: today, models: {}, totalTokens: 0, totalCost: 0 };
}

// Get usage for date range
export function getUsageRange(startDate, endDate) {
  ensureDataDir();
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  const dailyFiles = fs.readdirSync(DAILY_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const date = parseISO(f.replace('.json', ''));
      return { file: f, date };
    })
    .filter(f => f.date >= start && f.date <= end)
    .sort((a, b) => a.date - b.date);

  return dailyFiles.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(DAILY_DIR, f.file), 'utf8'));
    return data;
  });
}

// Get all-time stats
export function getAllTimeStats() {
  ensureDataDir();
  const usageData = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
  
  const stats = {
    totalSessions: usageData.sessions.length,
    totalTokens: 0,
    totalCost: 0,
    models: {},
    firstDate: null,
    lastDate: null
  };

  usageData.sessions.forEach(session => {
    if (!stats.firstDate || session.date < stats.firstDate) {
      stats.firstDate = session.date;
    }
    if (!stats.lastDate || session.date > stats.lastDate) {
      stats.lastDate = session.date;
    }

    Object.entries(session.models).forEach(([model, data]) => {
      if (!stats.models[model]) {
        stats.models[model] = { totalTokens: 0, totalCost: 0, calls: 0 };
      }
      stats.models[model].totalTokens += data.totalTokens;
      stats.models[model].totalCost += data.cost;
      stats.models[model].calls += data.calls;
    });
  });

  stats.totalTokens = Object.values(stats.models).reduce((sum, m) => sum + m.totalTokens, 0);
  stats.totalCost = Object.values(stats.models).reduce((sum, m) => sum + m.totalCost, 0);

  return stats;
}
