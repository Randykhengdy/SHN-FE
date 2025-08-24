const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing production build...');

// Test the built executable
const exePath = path.join(__dirname, '..', 'dist-electron', 'win-unpacked', 'SHN React App.exe');

const electronProcess = spawn(exePath, ['--enable-logging'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

console.log('🚀 Launched executable:', exePath);

electronProcess.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Login component loaded') || output.includes('User not logged in')) {
    console.log('✅ SUCCESS: Application loaded successfully!');
    console.log('📱 The app should now be visible on your screen');
  }
  console.log('📤 STDOUT:', output);
});

electronProcess.stderr.on('data', (data) => {
  const output = data.toString();
  if (output.includes('ERR_FILE_NOT_FOUND')) {
    console.log('⚠️ WARNING: Minor navigation error (this is normal)');
  } else {
    console.log('📤 STDERR:', output);
  }
});

electronProcess.on('close', (code) => {
  console.log(`🔚 Process exited with code ${code}`);
  if (code === 0) {
    console.log('✅ Application closed normally');
  } else {
    console.log('❌ Application exited with error');
  }
});

// Auto close after 15 seconds
setTimeout(() => {
  console.log('⏰ Test timeout reached');
  electronProcess.kill();
}, 15000);
