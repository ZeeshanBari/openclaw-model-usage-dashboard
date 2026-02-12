// Daily brief generator for Obsidian
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

const DAILY_DIR = path.join(process.cwd(), '..', '..', '..', 'obsidian-vault', 'ai-usage', 'daily');
const TEMPLATES_DIR = path.join(process.cwd(), '..', '..', '..', 'obsidian-vault', 'templates');

export function generateDailyBrief(date = new Date()) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dailyFile = path.join(DAILY_DIR, `${dateStr}.json`);
  
  if (!fs.existsSync(dailyFile)) {
    return `# AI Usage - ${dateStr}\n\nNo usage recorded for today.`;
  }

  const data = JSON.parse(fs.readFileSync(dailyFile, 'utf8'));
  
  let brief = `# AI Usage - ${dateStr}\n\n`;
  
  // Budget status
  const budgetUsed = data.totalCost;
  const budgetRemaining = Math.max(0, 20 - budgetUsed);
  const budgetPercent = Math.min(100, (budgetUsed / 20) * 100);
  
  brief += `## Budget Status\n`;
  brief += `- **Spent:** $${budgetUsed.toFixed(2)}\n`;
  brief += `- **Remaining:** $${budgetRemaining.toFixed(2)}\n`;
  brief += `- **Usage:** ${budgetPercent.toFixed(1)}%\n\n`;
  
  // Model breakdown
  brief += `## Model Usage\n\n`;
  brief += `| Model | Tokens | Cost | Calls |\n`;
  brief += `|-------|--------|------|-------|\n`;
  
  Object.entries(data.models)
    .sort((a, b) => b[1].totalTokens - a[1].totalTokens)
    .forEach(([model, stats]) => {
      const modelShort = model.split('/').pop();
      brief += `| ${modelShort} | ${stats.totalTokens.toLocaleString()} | $${stats.cost.toFixed(4)} | ${stats.calls} |\n`;
    });
  
  brief += `\n**Total:** ${data.totalTokens.toLocaleString()} tokens, $${data.totalCost.toFixed(4)}\n`;
  
  // Summary
  brief += `\n## Summary\n`;
  if (budgetPercent > 90) {
    brief += `⚠️ Approaching daily budget limit!\n`;
  } else if (budgetPercent > 75) {
    brief += `🔶 Budget usage is high.\n`;
  } else {
    brief += `✅ Within budget.\n`;
  }
  
  return brief;
}

// Create Obsidian daily note
export function createDailyNote(date = new Date()) {
  const obsidianVault = path.join(process.cwd(), '..', '..', '..', 'obsidian-vault');
  const dailyNotesDir = path.join(obsidianVault, 'daily-notes');
  
  if (!fs.existsSync(dailyNotesDir)) {
    fs.mkdirSync(dailyNotesDir, { recursive: true });
  }
  
  const dateStr = format(date, 'yyyy-MM-dd');
  const notePath = path.join(dailyNotesDir, `${dateStr}.md`);
  
  if (fs.existsSync(notePath)) {
    console.log(`Daily note already exists: ${notePath}`);
    return notePath;
  }
  
  const content = generateDailyBrief(date);
  fs.writeFileSync(notePath, content);
  
  return notePath;
}

// Run daily brief (for cron job)
export function runDailyBrief() {
  const brief = generateDailyBrief();
  console.log(brief);
  return brief;
}
