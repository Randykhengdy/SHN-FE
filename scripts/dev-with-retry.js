#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('🚀 Starting SHN React App with Auto-Reconnect...');

let viteProcess = null;
let electronProcess = null;
let retryCount = 0;
const maxRetries = 5;

function startVite() {
  console.log('📦 Starting Vite dev server...');
  
  viteProcess = spawn('npm', ['run', 'dev:vite'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  viteProcess.on('error', (error) => {
    console.error('❌ Vite failed to start:', error);
    retryVite();
  });

  viteProcess.on('close', (code) => {
    console.log(`📦 Vite exited with code ${code}`);
    if (code !== 0) {
      retryVite();
    }
  });

  // Wait a bit then start Electron
  setTimeout(() => {
    startElectron();
  }, 3000);
}

function startElectron() {
  console.log('⚡ Starting Electron...');
  
  electronProcess = spawn('npm', ['run', 'dev:electron'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  electronProcess.on('error', (error) => {
    console.error('❌ Electron failed to start:', error);
    retryElectron();
  });

  electronProcess.on('close', (code) => {
    console.log(`⚡ Electron exited with code ${code}`);
    if (code !== 0) {
      retryElectron();
    }
  });
}

function retryVite() {
  if (retryCount < maxRetries) {
    retryCount++;
    console.log(`🔄 Retrying Vite (${retryCount}/${maxRetries})...`);
    setTimeout(() => {
      startVite();
    }, 2000);
  } else {
    console.error('❌ Max retries reached for Vite');
    process.exit(1);
  }
}

function retryElectron() {
  if (retryCount < maxRetries) {
    retryCount++;
    console.log(`🔄 Retrying Electron (${retryCount}/${maxRetries})...`);
    setTimeout(() => {
      startElectron();
    }, 2000);
  } else {
    console.error('❌ Max retries reached for Electron');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping all processes...');
  if (viteProcess) viteProcess.kill('SIGINT');
  if (electronProcess) electronProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping all processes...');
  if (viteProcess) viteProcess.kill('SIGTERM');
  if (electronProcess) electronProcess.kill('SIGTERM');
  process.exit(0);
});

// Start the process
startVite();
