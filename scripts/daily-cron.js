/**
 * Cron job script - runs daily at 8am to extract and report usage
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { format } from 'date-fns';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCRIPT_PATH = path.join(__dirname, 'extract-usage.js');
const OBSIDIAN_DAILY = path.join(process.env.HOME || '/home/neo', '.openclaw', 'workspace', 'obsidian-vault', 'daily-notes');

function runExtract() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [SCRIPT_PATH], { cwd: path.dirname(SCRIPT_PATH) });
    
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(error || `Exit code: ${code}`));
      }
    });
  });
}

async function createObsidianNote() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const dailyDir = OBSIDIAN_DAILY;
  
  if (!fs.existsSync(dailyDir)) {
    fs.mkdirSync(dailyDir, { recursive: true });
  }
  
  const notePath = path.join(dailyDir, `${today}.md`);
  
  // Read today's data
  const dataFile = path.join(__dirname, '..', '..', 'obsidian-vault', 'ai-usage', 'daily', `${today}.json`);
  
  if (!fs.existsSync(dataFile)) {
    console.log('No usage data for today yet.');
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const budget = 20;
  const budgetPercent = (data.totalCost / budget) * 100;
  
  let note = `# AI Usage - ${today}\n\n`;
  note += `## Budget Status\n`;
  note += `- **Spent:** $${data.totalCost.toFixed(4)} / $${budget}\n`;
  note += `- **Remaining:** $${(budget - data.totalCost).toFixed(4)}\n`;
  note += `- **Usage:** ${budgetPercent.toFixed(1)}%\n\n`;
  
  note += `## Model Usage\n\n`;
  note += `| Model | Tokens | Cost | Calls |\n`;
  note += `|-------|--------|------|-------|\n`;
  
  Object.entries(data.models || {})
    .sort((a, b) => b[1].totalTokens - a[1].totalTokens)
    .forEach(([model, stats]) => {
      note += `| ${model.split('/').pop()} | ${stats.totalTokens.toLocaleString()} | $${stats.cost.toFixed(4)} | ${stats.calls} |\n`;
    });
  
  note += `\n**Total:** ${data.totalTokens.toLocaleString()} tokens, $${data.totalCost.toFixed(4)}\n`;
  
  // Add summary
  note += `\n## Summary\n`;
  if (budgetPercent > 90) {
    note += `⚠️ **Near budget limit!**\n`;
  } else if (budgetPercent > 75) {
    note += `🔶 High usage.\n`;
  } else {
    note += `✅ Within budget.\n`;
  }
  
  fs.writeFileSync(notePath, note);
  console.log(`📝 Created Obsidian note: ${notePath}`);
}

async function main() {
  console.log('⏰ Daily Usage Cron Job');
  console.log(`🕐 ${new Date().toISOString()}`);
  console.log('');
  
  try {
    console.log('📊 Extracting usage data...');
    await runExtract();
    
    console.log('\n📝 Creating Obsidian daily note...');
    await createObsidianNote();
    
    console.log('\n✅ Daily job completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
