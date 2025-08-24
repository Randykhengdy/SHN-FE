const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  if (fs.existsSync('dist-electron')) {
    fs.rmSync('dist-electron', { recursive: true, force: true });
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build React app
  console.log('🔨 Building React app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Verify build output
  console.log('✅ Verifying build output...');
  if (!fs.existsSync('dist/index.html')) {
    throw new Error('dist/index.html not found after build');
  }
  console.log('✅ Build verification passed');

  // Build Electron app
  console.log('⚡ Building Electron app...');
  execSync('npm run dist:win', { stdio: 'inherit' });

  console.log('🎉 Production build completed successfully!');
  console.log('📁 Output location: dist-electron/');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
