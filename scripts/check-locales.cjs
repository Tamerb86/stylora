#!/usr/bin/env node

/**
 * Script to validate locale JSON files for:
 * 1. Duplicate keys within the same object
 * 2. Valid JSON syntax
 * 
 * This script ensures locale files have integrity and can be safely parsed.
 */

const fs = require('fs');
const path = require('path');

/**
 * Check for duplicate keys in a JSON file
 * Standard JSON.parse() silently overwrites duplicates, so we need a custom parser
 */
function findDuplicateKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const duplicates = [];
  let depth = 0;
  const keysSeen = new Map(); // depth -> Set of keys at that depth
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Track depth by counting braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    // Extract key if this is a key-value line
    // Note: This simple regex works for standard JSON keys without escaped quotes
    const keyMatch = line.match(/^\s*"([^"]+)"\s*:/);
    if (keyMatch) {
      const key = keyMatch[1];
      const depthKey = `d${depth}`;
      
      if (!keysSeen.has(depthKey)) {
        keysSeen.set(depthKey, new Set());
      }
      
      if (keysSeen.get(depthKey).has(key)) {
        duplicates.push({
          key: key,
          line: lineNum,
          depth: depth
        });
      } else {
        keysSeen.get(depthKey).add(key);
      }
    }
    
    // Clear keys when closing a brace (before updating depth)
    if (closeBraces > 0) {
      const oldDepth = depth;
      for (let i = oldDepth; i > oldDepth - closeBraces; i--) {
        keysSeen.delete(`d${i}`);
      }
    }
    
    // Update depth after clearing keys
    depth += openBraces - closeBraces;
  });
  
  return duplicates;
}

/**
 * Validate JSON syntax
 */
function validateJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      line: error.message.match(/line (\d+)/)?.[1] || 'unknown'
    };
  }
}

/**
 * Check a single locale file
 */
function checkLocaleFile(filePath) {
  const fileName = path.basename(filePath);
  const errors = [];
  
  // Check JSON validity first
  const jsonValidation = validateJSON(filePath);
  if (!jsonValidation.valid) {
    errors.push({
      type: 'invalid_json',
      message: `Invalid JSON syntax: ${jsonValidation.error}`
    });
    return { fileName, errors };
  }
  
  // Check for duplicate keys
  const duplicates = findDuplicateKeys(filePath);
  if (duplicates.length > 0) {
    duplicates.forEach(dup => {
      errors.push({
        type: 'duplicate_key',
        key: dup.key,
        line: dup.line,
        depth: dup.depth,
        message: `Duplicate key "${dup.key}" at line ${dup.line} (depth ${dup.depth})`
      });
    });
  }
  
  return { fileName, errors };
}

// Main execution
const localesDir = path.join(process.cwd(), 'client', 'src', 'i18n', 'locales');

if (!fs.existsSync(localesDir)) {
  console.error('Error: client/src/i18n/locales directory not found');
  process.exit(1);
}

console.log('Checking locale files for integrity...\n');

const localeFiles = fs.readdirSync(localesDir)
  .filter(file => file.endsWith('.json'))
  .map(file => path.join(localesDir, file));

if (localeFiles.length === 0) {
  console.error('Error: No locale JSON files found in client/src/i18n/locales');
  process.exit(1);
}

let hasErrors = false;
const results = [];

for (const filePath of localeFiles) {
  const result = checkLocaleFile(filePath);
  results.push(result);
  
  if (result.errors.length === 0) {
    console.log(`✓ ${result.fileName} - OK`);
  } else {
    hasErrors = true;
    console.log(`✗ ${result.fileName} - ${result.errors.length} error(s):`);
    result.errors.forEach(error => {
      console.log(`  ${error.message}`);
    });
  }
}

console.log('');

if (hasErrors) {
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  console.log(`❌ Found ${totalErrors} error(s) in locale files`);
  console.log('\nPlease fix these errors before committing.');
  process.exit(1);
} else {
  console.log('✅ All locale files are valid!');
  process.exit(0);
}
