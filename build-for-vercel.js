#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Vercel Build Script ===');
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);

// Check if shared package exists
const sharedPath = path.join(process.cwd(), 'packages', 'shared');
console.log('Checking shared package at:', sharedPath);
if (fs.existsSync(sharedPath)) {
  console.log('✅ Shared package directory exists');
} else {
  console.log('❌ Shared package directory not found');
  process.exit(1);
}

console.log('\n=== Building shared package ===');
try {
  execSync('npm run build:shared', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Shared package built successfully');
} catch (error) {
  console.error('❌ Failed to build shared package:', error.message);
  process.exit(1);
}

// Check if shared package dist exists
const sharedDistPath = path.join(sharedPath, 'dist');
if (fs.existsSync(sharedDistPath)) {
  console.log('✅ Shared package dist directory exists');
  const distFiles = fs.readdirSync(sharedDistPath);
  console.log('Dist files:', distFiles);
} else {
  console.log('❌ Shared package dist directory not found');
  process.exit(1);
}

console.log('\n=== Testing shared package import ===');
try {
  const shared = require('@crmdemo/shared');
  console.log('✅ Successfully imported @crmdemo/shared');
  console.log('Available exports:', Object.keys(shared));
} catch (error) {
  console.log('❌ Failed to import @crmdemo/shared:', error.message);
  process.exit(1);
}

console.log('\n=== Building frontend ===');
const frontendPath = path.join(process.cwd(), 'frontend');
try {
  execSync('npm run build:only', { stdio: 'inherit', cwd: frontendPath });
  console.log('✅ Frontend built successfully');
} catch (error) {
  console.error('❌ Failed to build frontend:', error.message);
  process.exit(1);
}

console.log('\n=== Build completed successfully ===');