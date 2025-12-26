#!/usr/bin/env node
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';

const PUBLIC_DIR = join(process.cwd(), 'client/public');

// Target sizes for specific images based on PageSpeed report
const TARGET_SIZES = {
  'screenshot-calendar.webp': { width: 580, height: 324 },
  'stylora-logo.webp': { width: 80, height: 80 }, // 2x for retina
  'video-thumbnail.webp': { width: 1024, height: 571 },
};

async function optimizeImage(filePath, targetSize) {
  const fileName = filePath.split('/').pop();
  const backupPath = filePath.replace('.webp', '.original.webp');
  
  try {
    // Get original size
    const originalStats = await stat(filePath);
    const originalSizeKB = (originalStats.size / 1024).toFixed(2);
    
    // Create backup
    await sharp(filePath).toFile(backupPath);
    
    // Optimize and resize
    await sharp(filePath)
      .resize(targetSize.width, targetSize.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85, effort: 6 })
      .toFile(filePath.replace('.webp', '.optimized.webp'));
    
    // Replace original with optimized
    await sharp(filePath.replace('.webp', '.optimized.webp'))
      .toFile(filePath);
    
    // Get new size
    const newStats = await stat(filePath);
    const newSizeKB = (newStats.size / 1024).toFixed(2);
    const savings = ((originalStats.size - newStats.size) / 1024).toFixed(2);
    
    console.log(`✅ ${fileName}: ${originalSizeKB}KB → ${newSizeKB}KB (saved ${savings}KB)`);
    
  } catch (error) {
    console.error(`❌ Error optimizing ${fileName}:`, error.message);
  }
}

async function main() {
  console.log('🖼️  Starting image optimization...\n');
  
  for (const [fileName, size] of Object.entries(TARGET_SIZES)) {
    const filePath = join(PUBLIC_DIR, fileName);
    await optimizeImage(filePath, size);
  }
  
  console.log('\n✨ Image optimization complete!');
}

main().catch(console.error);
