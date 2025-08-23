#!/usr/bin/env node

import { spawn } from 'child_process';

// Set development environment
process.env.NODE_ENV = 'development';
process.env.ELECTRON_IS_DEV = 'true';

console.log('🚀 Starting Electron + Vite Development Server...');
console.log('📱 Environment: Development');
console.log('🔧 DevTools will open automatically');

let viteProcess = null;
let electronProcess = null;

// Function to start Vite
function startVite() {
  console.log('🔥 Starting Vite dev server...');
  
  viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  viteProcess.on('error', (error) => {
    console.error('❌ Vite error:', error.message);
  });

  viteProcess.on('close', (code) => {
    console.log(`Vite process exited with code ${code}`);
    if (electronProcess) {
      electronProcess.kill();
    }
    process.exit(code);
  });
}

// Function to start Electron
function startElectron() {
  console.log('⚡ Launching Electron...');
  
  electronProcess = spawn('npm', ['run', 'electron'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_IS_DEV: 'true'
    }
  });

  electronProcess.on('error', (error) => {
    console.error('❌ Electron error:', error.message);
  });

  electronProcess.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    if (viteProcess) {
      viteProcess.kill();
    }
    process.exit(code);
  });
}

// Start Vite first
startVite();

// Wait for Vite to be ready, then start Electron
setTimeout(() => {
  startElectron();
}, 5000); // Wait 5 seconds

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  if (viteProcess) viteProcess.kill();
  if (electronProcess) electronProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development server...');
  if (viteProcess) viteProcess.kill();
  if (electronProcess) electronProcess.kill();
  process.exit(0);
});
