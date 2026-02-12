#!/usr/bin/env node
/**
 * OpenClaw Usage Extractor
 * Parses OpenClaw session logs and updates the usage dashboard
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format, subDays, parseISO } from 'date-fns';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const SESSIONS_DIR = path.join(process.env.HOME || '/home/neo', '.openclaw', 'agents', 'main', 'sessions');
const DATA_DIR = path.join(process.env.HOME || '/home/neo', '.openclaw', 'workspace', 'obsidian-vault', 'ai-usage', 'daily');
const USAGE_FILE = path.join(DATA_DIR, '..', 'usage.json');

// Ensure directories exist
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USAGE_FILE)) {
    fs.writeFileSync(USAGE_FILE, JSON.stringify({ sessions: [], lastUpdated: new Date().toISOString() }, null, 2));
  }
}

// Extract usage from a single message entry
function extractUsageFromMessage(message) {
  if (!message || !message.message) return null;
  
  const msg = message.message;
  if (!msg.usage) return null;
  
  const usage = msg.usage;
  const model = msg.model || 'MiniMax-M2.1'; // Default
  
  // Use the cost that's already calculated in the message
  const cost = usage.cost?.total || 0;
  
  return {
    model,
    inputTokens: usage.input || 0,
    outputTokens: usage.output || 0,
    totalTokens: usage.totalTokens || 0,
    cost: cost,
    calls: 1
  };
}

// Calculate cost (fallback if not in message)
function calculateCost(model, usage) {
  // Don't count cache tokens in input/output for cost
  const inputOnly = usage.input || 0;
  const outputOnly = usage.output || 0;
  
  const pricing = {
    'MiniMax-M2.1': { input: 0.000015, output: 0.000060 }, // $15/$60 per 1M
    'MiniMax-M2': { input: 0.000010, output: 0.000040 },
  };
  
  const rates = pricing[model] || { input: 0.000015, output: 0.000060 };
  return (inputOnly * rates.input) + (outputOnly * rates.output);
}

// Parse session file
function parseSessionFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  
  const usageByDate = {};
  const allUsage = [];
  
  lines.forEach(line => {
    try {
      const entry = JSON.parse(line);
      
      // Skip non-message entries
      if (entry.type !== 'message') return;
      
      const usage = extractUsageFromMessage(entry);
      if (!usage) return;
      
      // Get date from timestamp
      const timestamp = entry.timestamp || new Date().toISOString();
      const date = format(parseISO(timestamp), 'yyyy-MM-dd');
      
      if (!usageByDate[date]) {
        usageByDate[date] = { date, models: {}, totalTokens: 0, totalCost: 0 };
      }
      
      // Aggregate by model
      if (!usageByDate[date].models[usage.model]) {
        usageByDate[date].models[usage.model] = {
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          cost: 0,
          calls: 0
        };
      }
      
      const m = usageByDate[date].models[usage.model];
      m.inputTokens += usage.inputTokens;
      m.outputTokens += usage.outputTokens;
      m.totalTokens += usage.totalTokens;
      m.cost += usage.cost;
      m.calls += usage.calls;
      
      usageByDate[date].totalTokens += usage.totalTokens;
      usageByDate[date].totalCost += usage.cost;
      
      allUsage.push({ date, ...usage });
    } catch (e) {
      // Skip invalid lines
    }
  });
  
  return { byDate: usageByDate, all: allUsage };
}

// Update daily summary files
function updateDailySummaries(dataByDate) {
  Object.values(dataByDate).forEach(dayData => {
    const filePath = path.join(DATA_DIR, `${dayData.date}.json`);
    fs.writeFileSync(filePath, JSON.stringify(dayData, null, 2));
    console.log(`Updated: ${dayData.date} - $${dayData.totalCost.toFixed(4)} (${dayData.totalTokens.toLocaleString()} tokens)`);
  });
}

// Main
async function main() {
  console.log('🔍 Extracting OpenClaw usage data...\n');
  
  ensureDataDir();
  
  // Find latest session file
  const files = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.endsWith('.jsonl') && !f.includes('.lock'))
    .sort();
  
  if (files.length === 0) {
    console.log('No session files found.');
    return;
  }
  
  const latestFile = path.join(SESSIONS_DIR, files[files.length - 1]);
  console.log(`📂 Processing: ${files[files.length - 1]}`);
  
  const { byDate, all } = parseSessionFile(latestFile);
  
  if (Object.keys(byDate).length === 0) {
    console.log('No usage data found in sessions.');
    return;
  }
  
  // Update daily summaries
  updateDailySummaries(byDate);
  
  // Print summary
  console.log('\n📊 Summary:');
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayData = byDate[today];
  
  if (todayData) {
    console.log(`\n  Today (${today}):`);
    console.log(`    💰 Cost: $${todayData.totalCost.toFixed(4)}`);
    console.log(`    📊 Tokens: ${todayData.totalTokens.toLocaleString()}`);
    
    const budget = 20;
    const percent = (todayData.totalCost / budget) * 100;
    console.log(`    📈 Budget: ${percent.toFixed(1)}% of $${budget}`);
    
    if (percent > 90) console.log(`    ⚠️  Near budget limit!`);
    else if (percent > 75) console.log(`    🔶 High usage`);
    else console.log(`    ✅ On track`);
  }
  
  // Print model breakdown
  if (todayData) {
    console.log('\n  By Model:');
    Object.entries(todayData.models)
      .sort((a, b) => b[1].totalTokens - a[1].totalTokens)
      .forEach(([model, stats]) => {
        console.log(`    • ${model}: ${stats.totalTokens.toLocaleString()} tokens, $${stats.cost.toFixed(4)}`);
      });
  }
  
  console.log('\n✅ Usage data extracted successfully!');
  console.log(`📁 Data saved to: ${DATA_DIR}`);
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { main as extractUsage };
