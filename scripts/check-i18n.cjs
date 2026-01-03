#!/usr/bin/env node

/**
 * Script to check for hardcoded user-facing strings in client/src
 * 
 * This script scans TypeScript/JSX files for hardcoded strings that should be
 * internationalized, while ignoring allowed patterns like:
 * - className, id, data-testid, aria-* attributes
 * - API paths (/api/...)
 * - CSS values
 * - Non-user-facing logs
 */

const fs = require('fs');
const path = require('path');

// Patterns to ALLOW (these are OK to be hardcoded)
const ALLOWED_PATTERNS = [
  /className\s*=\s*["'][^"']*["']/g,
  /id\s*=\s*["'][^"']*["']/g,
  /data-testid\s*=\s*["'][^"']*["']/g,
  /data-\w+\s*=\s*["'][^"']*["']/g,
  /aria-\w+\s*=\s*["'][^"']*["']/g,
  /key\s*=\s*["'][^"']*["']/g,
  /path:\s*["']\/[^"']*["']/g,
  /href\s*=\s*["']\/[^"']*["']/g,
  /to\s*=\s*["']\/[^"']*["']/g,
  /from\s*=\s*["'][^"']*["']/g,
  /gradient\s*=\s*["'][^"']*["']/g,
  /console\.(log|warn|error|info)/g,
  /import.*["'][^"']*["']/g,
  /export.*["'][^"']*["']/g,
  /alt\s*=\s*["'][^"']*Logo[^"']*["']/gi, // Logo alt texts
  /\w+Icon/g, // Icon names
];

// Pattern to find strings that might be user-facing
const STRING_PATTERN = /["']([^"']{2,})["']/g;

// Words that suggest user-facing strings
const USER_FACING_INDICATORS = [
  /\b(new|add|create|edit|delete|save|cancel|submit|close|open|view|search|filter|export|import)\b/i,
  /\b(loading|error|success|warning|info|failed|completed|pending)\b/i,
  /\b(welcome|hello|goodbye|thanks?|please)\b/i,
  /\b(customer|user|employee|service|product|order|appointment|booking)\b/i,
  /\b(click|select|enter|choose|pick)\b/i,
];

function isLikelyUserFacing(str) {
  // Skip very short strings
  if (str.length < 3) return false;
  
  // Skip CSS values, hex colors, etc.
  if (/^[\d\s\-_.#%px:;]+$/.test(str)) return false;
  if (/^[a-f0-9]{3,8}$/i.test(str)) return false; // hex colors
  
  // Skip file paths
  if (str.includes('/') && !str.includes(' ')) return false;
  
  // Skip variable names (camelCase, snake_case, etc.)
  if (/^[a-z][a-zA-Z0-9_]*$/.test(str)) return false;
  
  // Check if it contains spaces (more likely to be user-facing)
  if (/\s/.test(str)) return true;
  
  // Check for user-facing keywords
  for (const pattern of USER_FACING_INDICATORS) {
    if (pattern.test(str)) return true;
  }
  
  return false;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const violations = [];
  
  // Remove allowed patterns
  let cleanContent = content;
  for (const pattern of ALLOWED_PATTERNS) {
    cleanContent = cleanContent.replace(pattern, '');
  }
  
  // Find remaining strings
  let match;
  STRING_PATTERN.lastIndex = 0;
  while ((match = STRING_PATTERN.exec(cleanContent)) !== null) {
    const str = match[1];
    if (isLikelyUserFacing(str)) {
      // Get line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      violations.push({
        line: lineNumber,
        string: str,
        context: content.split('\n')[lineNumber - 1]?.trim() || ''
      });
    }
  }
  
  return violations;
}

function scanDirectory(dir) {
  const results = {};
  
  function walk(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const fullPath = path.join(directory, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, dist, etc.
        if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
          walk(fullPath);
        }
      } else if (/\.(tsx?|jsx?)$/.test(file)) {
        const violations = checkFile(fullPath);
        if (violations.length > 0) {
          const relativePath = path.relative(process.cwd(), fullPath);
          results[relativePath] = violations;
        }
      }
    }
  }
  
  walk(dir);
  return results;
}

// Main execution
const clientSrcDir = path.join(process.cwd(), 'client', 'src');

if (!fs.existsSync(clientSrcDir)) {
  console.error('Error: client/src directory not found');
  process.exit(1);
}

console.log('Scanning for hardcoded user-facing strings in client/src...\n');

const results = scanDirectory(clientSrcDir);
const fileCount = Object.keys(results).length;
const totalViolations = Object.values(results).reduce((sum, v) => sum + v.length, 0);

if (fileCount === 0) {
  console.log('✓ No hardcoded strings found! All strings are internationalized.');
  process.exit(0);
}

console.log(`Found ${totalViolations} potential hardcoded strings in ${fileCount} files:\n`);

// Sort by violation count
const sortedFiles = Object.entries(results)
  .sort(([, a], [, b]) => b.length - a.length);

for (const [filePath, violations] of sortedFiles.slice(0, 20)) {
  console.log(`${filePath} (${violations.length} strings):`);
  for (const violation of violations.slice(0, 3)) {
    console.log(`  Line ${violation.line}: "${violation.string}"`);
  }
  if (violations.length > 3) {
    console.log(`  ... and ${violations.length - 3} more`);
  }
  console.log('');
}

if (fileCount > 20) {
  console.log(`... and ${fileCount - 20} more files\n`);
}

console.log(`\nTotal: ${totalViolations} potential violations in ${fileCount} files`);
process.exit(1);
