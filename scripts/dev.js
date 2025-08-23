#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

// Set development environment
process.env.NODE_ENV = 'development';
process.env.ELECTRON_IS_DEV = 'true';

console.log('🚀 Starting Electron + Vite Development Server...');
console.log('📱 Environment: Development');
console.log('🔧 DevTools will open automatically');

// Start Vite dev server
const vite = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait a bit for Vite to start, then launch Electron
setTimeout(() => {
  console.log('⚡ Launching Electron...');
  
  const electron = spawn('npm', ['run', 'electron'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      ELECTRON_IS_DEV: 'true'
    }
  });

  electron.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    vite.kill();
    process.exit(code);
  });
}, 3000);

vite.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  vite.kill();
  process.exit(0);
});
