const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔍 Starting production debug...');

// Check if dist folder exists
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist folder not found!');
  process.exit(1);
}

console.log('✅ dist folder found');

// Check if index.html exists
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ dist/index.html not found!');
  process.exit(1);
}

console.log('✅ dist/index.html found');

// Check if assets folder exists
const assetsPath = path.join(distPath, 'assets');
if (!fs.existsSync(assetsPath)) {
  console.error('❌ dist/assets folder not found!');
  process.exit(1);
}

console.log('✅ dist/assets folder found');

// List assets
const assets = fs.readdirSync(assetsPath);
console.log('📁 Assets found:', assets);

// Check if main.js exists in assets
const mainJsExists = assets.some(asset => asset.includes('index-') && asset.endsWith('.js'));
if (!mainJsExists) {
  console.error('❌ Main JavaScript file not found in assets!');
  process.exit(1);
}

console.log('✅ Main JavaScript file found');

// Try to run electron in production mode
console.log('🚀 Testing Electron production mode...');

const electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
const appPath = path.join(__dirname, '..');

const electronProcess = spawn(electronPath, [appPath, '--enable-logging', '--v=1'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'production' }
});

electronProcess.stdout.on('data', (data) => {
  console.log('📤 STDOUT:', data.toString());
});

electronProcess.stderr.on('data', (data) => {
  console.log('📤 STDERR:', data.toString());
});

electronProcess.on('close', (code) => {
  console.log(`🔚 Electron process exited with code ${code}`);
  process.exit(code);
});

// Kill after 10 seconds
setTimeout(() => {
  console.log('⏰ Timeout reached, killing process...');
  electronProcess.kill();
}, 10000);
