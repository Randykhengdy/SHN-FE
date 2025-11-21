#!/usr/bin/env node

// Fix problematic package.json files in node_modules before electron-builder analyzes them
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixDependencies(context = {}) {
  console.log('🔧 Fixing problematic dependencies...');
  
  const projectDir = context?.projectDir || (typeof context === 'object' && context !== null ? path.join(__dirname, '..') : path.join(__dirname, '..'));
  const nodeModulesPath = path.join(projectDir, 'node_modules');
  const packageLockPath = path.join(projectDir, 'package-lock.json');
  
  // For optional dependencies that aren't installed, create a minimal stub package
  // to prevent electron-builder from encountering undefined paths
  const oxideWasmPath = path.join(nodeModulesPath, '@tailwindcss', 'oxide-wasm32-wasi');
  if (!fs.existsSync(oxideWasmPath)) {
    console.log('⚠️  Optional package @tailwindcss/oxide-wasm32-wasi is not installed');
    console.log('🔧 Creating stub package to prevent build errors...');
    
    try {
      // Create directory structure
      fs.mkdirSync(oxideWasmPath, { recursive: true });
      
      // Create minimal package.json
      const stubPackageJson = {
        name: '@tailwindcss/oxide-wasm32-wasi',
        version: '4.1.11',
        description: 'Optional stub package',
        optional: true,
        dependencies: {}
      };
      
      fs.writeFileSync(
        path.join(oxideWasmPath, 'package.json'),
        JSON.stringify(stubPackageJson, null, 2)
      );
      
      console.log('✅ Created stub package for @tailwindcss/oxide-wasm32-wasi');
    } catch (error) {
      console.warn('⚠️  Could not create stub package:', error.message);
    }
  }
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('⚠️  node_modules not found, skipping dependency fixes');
    return;
  }
  
  console.log(`📁 Checking node_modules at: ${nodeModulesPath}`);
  
  // Check all @tailwindcss/oxide packages
  const tailwindDir = path.join(nodeModulesPath, '@tailwindcss');
  if (!fs.existsSync(tailwindDir)) {
    console.log('⚠️  @tailwindcss directory not found');
  } else {
    console.log(`📦 Checking @tailwindcss packages...`);
    const entries = fs.readdirSync(tailwindDir);
    let foundOxidePackages = false;
    
    for (const entry of entries) {
      if (entry.startsWith('oxide-')) {
        foundOxidePackages = true;
        const oxidePath = path.join(tailwindDir, entry);
        const packageJsonPath = path.join(oxidePath, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
          try {
            console.log(`🔍 Checking ${entry}...`);
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            let hasChanges = false;
            
            // Remove all @emnapi/* dependencies from package.json
            // This is safe because Vite bundles everything, so electron-builder doesn't need these
            if (packageJson.dependencies) {
              const emnapiDeps = Object.keys(packageJson.dependencies).filter(key => 
                key.includes('emnapi') || key.startsWith('@emnapi/')
              );
              
              for (const dep of emnapiDeps) {
                console.warn(`  ⚠️  Removing dependency: ${dep} from ${entry}`);
                delete packageJson.dependencies[dep];
                hasChanges = true;
              }
            }
            
            // Also check optionalDependencies and peerDependencies
            if (packageJson.optionalDependencies) {
              const emnapiOptDeps = Object.keys(packageJson.optionalDependencies).filter(key => 
                key.includes('emnapi') || key.startsWith('@emnapi/')
              );
              for (const dep of emnapiOptDeps) {
                console.warn(`  ⚠️  Removing optional dependency: ${dep} from ${entry}`);
                delete packageJson.optionalDependencies[dep];
                hasChanges = true;
              }
            }
            
            if (packageJson.peerDependencies) {
              const emnapiPeerDeps = Object.keys(packageJson.peerDependencies).filter(key => 
                key.includes('emnapi') || key.startsWith('@emnapi/')
              );
              for (const dep of emnapiPeerDeps) {
                console.warn(`  ⚠️  Removing peer dependency: ${dep} from ${entry}`);
                delete packageJson.peerDependencies[dep];
                hasChanges = true;
              }
            }
            
            // Write back if we made changes
            if (hasChanges) {
              fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
              console.log(`  ✅ Fixed ${entry} package.json - removed @emnapi dependencies`);
            } else {
              console.log(`  ✓ ${entry} - no @emnapi dependencies found`);
            }
          } catch (error) {
            console.warn(`  ⚠️  Could not fix ${entry}:`, error.message);
          }
        }
      }
    }
    
    if (!foundOxidePackages) {
      console.log('⚠️  No @tailwindcss/oxide-* packages found');
    }
  }
  
  // Check @emnapi/core
  const emnapiCorePath = path.join(nodeModulesPath, '@emnapi', 'core');
  if (fs.existsSync(emnapiCorePath)) {
    const packageJsonPath = path.join(emnapiCorePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        let hasChanges = false;
        
        if (!packageJson.name) {
          packageJson.name = '@emnapi/core';
          hasChanges = true;
        }
        if (!packageJson.version) {
          packageJson.version = '1.0.0';
          hasChanges = true;
        }
        
        if (hasChanges) {
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
          console.log('✅ Fixed @emnapi/core package.json');
        }
      } catch (error) {
        console.warn('⚠️  Could not fix @emnapi/core:', error.message);
      }
    }
  }
  
  console.log('✅ Dependency fixes complete');
}

// Export for electron-builder hook
export default fixDependencies;

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('fix-dependencies.js');
if (isMainModule) {
  fixDependencies({ projectDir: path.join(__dirname, '..') }).catch(console.error);
}

