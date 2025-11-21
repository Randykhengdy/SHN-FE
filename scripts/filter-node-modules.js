#!/usr/bin/env node

// Filter out problematic node modules during electron-builder dependency collection
export default async function(context) {
  return async function(file) {
    // Skip @emnapi/* modules if they cause path issues
    if (file && file.path) {
      const pathStr = String(file.path);
      
      // Skip @emnapi modules that are referenced but not properly installed
      if (pathStr.includes('@emnapi') || pathStr.includes('emnapi')) {
        // Only skip if the path doesn't exist or is invalid
        const fs = await import('fs');
        try {
          if (!fs.existsSync(file.path)) {
            console.warn(`⚠️  Skipping missing module: ${file.path}`);
            return null; // Skip this module
          }
        } catch (error) {
          console.warn(`⚠️  Skipping invalid module path: ${file.path}`);
          return null; // Skip on error
        }
      }
      
      // Skip @tailwindcss/oxide-wasm32-wasi if it's not installed
      if (pathStr.includes('oxide-wasm32-wasi')) {
        const fs = await import('fs');
        if (!fs.existsSync(file.path)) {
          console.warn(`⚠️  Skipping optional package: ${file.path}`);
          return null; // Skip this module
        }
      }
    }
    
    // Return the file to include it
    return file;
  };
}

