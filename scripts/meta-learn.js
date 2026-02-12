#!/usr/bin/env node
/**
 * Meta-Learning Analyzer
 * Runs every 5 hours to analyze memories, find patterns,
 * create rules, and iterate on understanding.
 * 
 * Based on Integral Theory: AQAL framework + meta-levels
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  workspace: '/home/neo/.openclaw/workspace',
  patterns: {
    corrections: /(correction|fixed|error|wrong|incorrect|mistake|was wrong)/gi,
    agreements: /(agreed|prefers|wants|likes|dislikes|preferred)/gi,
    learnings: /(learned|understood|discovered|realized|figured out)/gi,
    patterns: /(pattern|keeps happening|repeated|occurrence|again)/gi,
    rules: /(rule|always|must|should|never)/gi,
  },
  thresholds: {
    minOccurrences: 2,
    significantChange: 3,
  }
};

// Sources to analyze
const SOURCES = [
  'memory/*.md',
  'MEMORY.md',
  'obsidian-vault/learning/**/*.md',
  'obsidian-vault/skills/**/*.md',
];

function gather() {
  console.log('\n🔍 PHASE 1: GATHER');
  console.log('═'.repeat(50));
  
  const allContent = {};
  
  for (const pattern of SOURCES) {
    const files = globSync(pattern, { cwd: CONFIG.workspace });
    
    for (const file of files) {
      try {
        const filePath = path.join(CONFIG.workspace, file);
        const content = fs.readFileSync(filePath, 'utf8');
        allContent[file] = {
          content,
          corrections: extractMatches(content, CONFIG.patterns.corrections),
          agreements: extractMatches(content, CONFIG.patterns.agreements),
          learnings: extractMatches(content, CONFIG.patterns.learnings),
          patterns: extractMatches(content, CONFIG.patterns.patterns),
          rules: extractMatches(content, CONFIG.patterns.rules),
        };
        console.log(`  ✓ ${file}: ${content.split(' ').length} words`);
      } catch (e) {
        console.log(`  ✗ ${file}: ${e.message}`);
      }
    }
  }
  
  return allContent;
}

function extractMatches(content, regex) {
  const matches = [];
  const regexClone = new RegExp(regex);
  let match;
  while ((match = regexClone.exec(content)) !== null) {
    matches.push({
      text: match[0],
      context: content.substring(Math.max(0, match.index - 50), match.index + 50),
    });
  }
  return matches;
}

function analyze(allContent) {
  console.log('\n📊 PHASE 2: ANALYZE');
  console.log('═'.repeat(50));
  
  const corrections = {};
  const agreements = {};
  const learnings = {};
  
  // Count occurrences
  for (const [file, data] of Object.entries(allContent)) {
    for (const item of data.corrections) {
      const key = extractTopic(item.context);
      corrections[key] = (corrections[key] || 0) + 1;
    }
    for (const item of data.agreements) {
      const key = extractTopic(item.context);
      agreements[key] = (agreements[key] || 0) + 1;
    }
    for (const item of data.learnings) {
      const key = extractTopic(item.context);
      learnings[key] = (learnings[key] || 0) + 1;
    }
  }
  
  // Sort by frequency
  const sortedCorrections = Object.entries(corrections)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  const sortedAgreements = Object.entries(agreements)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('\nTop Corrections:');
  for (const [topic, count] of sortedCorrections) {
    console.log(`  ${count}x ${topic}`);
  }
  
  console.log('\nUser Preferences:');
  for (const [topic, count] of sortedAgreements) {
    console.log(`  ${count}x ${topic}`);
  }
  
  return { corrections: sortedCorrections, agreements: sortedAgreements };
}

function extractTopic(context) {
  const cleaned = context
    .replace(/[#*`\n]/g, ' ')
    .trim()
    .split(' ')
    .slice(-5, -1)
    .join(' ')
    .trim();
  return cleaned || 'general';
}

function generalize(corrections, agreements) {
  console.log('\n🧠 PHASE 3: GENERALIZE');
  console.log('═'.repeat(50));
  
  const newRules = [];
  
  for (const [topic, count] of corrections) {
    if (count >= CONFIG.thresholds.minOccurrences) {
      const rule = generateRule(topic, count);
      if (rule) newRules.push(rule);
    }
  }
  
  const preferences = agreements
    .filter(([_, count]) => count >= 2)
    .map(([topic]) => generatePreference(topic));
  
  console.log(`\nGenerated ${newRules.length} rules:`);
  for (const rule of newRules) {
    console.log(`  • ${rule}`);
  }
  
  return { newRules, preferences };
}

function generateRule(topic, count) {
  const templates = [
    `FOR ${topic}: Verify before deploying`,
    `WHEN working with ${topic}: Check configuration first`,
    `${topic.toUpperCase()}: Requires testing before push`,
  ];
  return templates[count % templates.length];
}

function generatePreference(topic) {
  return `User prefers ${topic.toLowerCase()}`;
}

function iterate(newRules, preferences) {
  console.log('\n🔄 PHASE 4: ITERATE');
  console.log('═'.repeat(50));
  
  const skillsDir = path.join(CONFIG.workspace, 'obsidian-vault', 'skills');
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }
  
  const skillPath = path.join(skillsDir, 'meta-rules.md');
  
  let existing = '';
  if (fs.existsSync(skillPath)) {
    existing = fs.readFileSync(skillPath, 'utf8');
  }
  
  if (newRules.length > 0) {
    const timestamp = new Date().toISOString();
    const newSection = `\n\n## Generated ${timestamp}\n${newRules.map(r => `- ${r}`).join('\n')}\n`;
    
    fs.writeFileSync(skillPath, existing + newSection);
    console.log(`  ✓ Updated: ${skillPath}`);
  }
  
  if (newRules.length >= CONFIG.thresholds.significantChange) {
    console.log('\n⚠️ SIGNIFICANT UPDATE DETECTED');
    console.log('  Consider notifying user or creating new skill');
  }
  
  console.log('\n📈 Meta-Analysis:');
  console.log(`  Rules created: ${newRules.length}`);
  console.log(`  Preferences: ${preferences.length}`);
  console.log(`  Next analysis: In 5 hours`);
}

async function main() {
  const startTime = Date.now();
  
  console.log('\n' + '═'.repeat(50));
  console.log('🧠 META-LEARNING ANALYZER');
  console.log('═'.repeat(50));
  console.log(`\n🕐 Started: ${new Date().toISOString()}`);
  
  try {
    const allContent = gather();
    const { corrections, agreements } = analyze(allContent);
    const { newRules, preferences } = generalize(corrections, agreements);
    iterate(newRules, preferences);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Completed in ${duration}s`);
    console.log(`📁 Results: obsidian-vault/skills/meta-rules.md\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { gather, analyze, generalize, iterate };
