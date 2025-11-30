const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object
// If you don't, the window will be closed automatically when the JavaScript object is garbage collected
let mainWindow = null;
let rolePermissionsDataCache = null;

function hasAnyPermission(menuCode, permissionNames = []) {
  const data = rolePermissionsDataCache;
  if (!data || !Array.isArray(data.menus)) return false;
  const m = String(menuCode || '').toLowerCase();
  const menu = data.menus.find(x => String(x.menu_code || '').toLowerCase() === m);
  if (!menu || !Array.isArray(menu.permissions)) return false;
  const names = (permissionNames || []).map(v => String(v).toLowerCase());
  if (!names.length) return menu.permissions.length > 0;
  return menu.permissions.some(r => names.includes(String(r.nama_permission || '').toLowerCase()));
}

function canShow(menuCode) {
  if (!rolePermissionsDataCache) return true;
  return hasAnyPermission(menuCode);
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../src/assets/logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      devTools: true,
      allowRunningInsecureContent: true,
      // Memory management
      backgroundThrottling: false,
      // Increase memory limit and add crash prevention
      maxMemory: 4096,
      // Crash prevention
      enableRemoteModule: false,
      // Better error handling
      worldSafeExecuteJavaScript: true
    },
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // Development mode
    console.log('Development mode - loading URL:', process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools(); // Disabled automatic DevTools opening
  } else {
    // Production mode
    console.log('Production mode - loading local file');
    
    // Check if we're in a packaged app
    const isPackaged = app.isPackaged;
    console.log('Is packaged:', isPackaged);
    
    let indexPath;
    if (isPackaged) {
      // In packaged app, resources are in app.asar
      indexPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'index.html');
      if (!fs.existsSync(indexPath)) {
        indexPath = path.join(__dirname, '..', 'dist', 'index.html');
      }
    } else {
      // In development, use relative path
      indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    }
    
    console.log('Trying to load:', indexPath);
    console.log('File exists:', fs.existsSync(indexPath));
    
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath).catch(err => {
        console.error('Failed to load index.html:', err);
        dialog.showErrorBox('Load Error', `Failed to load application: ${err.message}`);
      });
    } else {
      console.error('index.html not found at:', indexPath);
      
      // Try alternative paths
      const alternativePaths = [
        path.join(process.cwd(), 'dist', 'index.html'),
        path.join(__dirname, 'dist', 'index.html'),
        path.join(app.getAppPath(), 'dist', 'index.html')
      ];
      
      let found = false;
      for (const altPath of alternativePaths) {
        if (fs.existsSync(altPath)) {
          console.log('Found at alternative path:', altPath);
          mainWindow.loadFile(altPath).catch(err => {
            console.error('Failed to load from alternative path:', err);
            dialog.showErrorBox('Load Error', `Failed to load application: ${err.message}`);
          });
          found = true;
          break;
        }
      }
      
      if (!found) {
        const errorMsg = `Application files not found.\n\nSearched paths:\n- ${indexPath}\n- ${alternativePaths.join('\n- ')}\n\nPlease reinstall the application.`;
        console.error(errorMsg);
        dialog.showErrorBox('File Not Found', errorMsg);
        app.quit();
      }
    }
  }

  // Disable zoom
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomLevel(0);
    mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
    mainWindow.webContents.setZoomFactor(1);
    
         // Simple memory management
     setInterval(() => {
       try {
         if (global.gc) {
           global.gc();
         }
       } catch (error) {
         // Silent fail - don't log to avoid spam
       }
     }, 120000); // Every 2 minutes
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control || input.meta) {
      const blocked = ['+', '-', '=', '0', 'Add', 'Subtract'];
      if (blocked.includes(input.key) || blocked.includes(input.code)) {
        event.preventDefault();
      }
    }
  });

  // Add keyboard shortcuts for all environments
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Ctrl+Shift+I to toggle DevTools
    if (input.control && input.shift && input.key === 'I') {
      event.preventDefault();
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
    
    // Ctrl+R to reload
    if (input.control && input.key === 'r') {
      event.preventDefault();
      if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      } else {
        mainWindow.reload();
      }
    }
    
    // Ctrl+Shift+R to hard reload
    if (input.control && input.shift && input.key === 'R') {
      event.preventDefault();
      if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      } else {
        mainWindow.webContents.reloadIgnoringCache();
      }
    }
  });

  const buildMenuTemplate = () => [
    {
      label: 'File',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+D',
          click: () => mainWindow.webContents.send('navigate-to', '/dashboard')
        },
        {
          label: 'Dashboard Workshop',
          accelerator: 'CmdOrCtrl+Shift+D',
          click: () => mainWindow.webContents.send('navigate-to', '/dashboard/workshop')
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    ...(canShow('MASTER_DATA') ? [
      {
        label: 'Masterdata',
        submenu: [
          { label: 'Jenis Barang', accelerator: 'CmdOrCtrl+1', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/jenis-barang') },
          { label: 'Bentuk Barang', accelerator: 'CmdOrCtrl+2', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/bentuk-barang') },
          { label: 'Grade Barang', accelerator: 'CmdOrCtrl+3', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/grade-barang') },
          { label: 'Item Barang', accelerator: 'CmdOrCtrl+4', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/item-barang') },
          { label: 'Jenis Mutasi Stock', accelerator: 'CmdOrCtrl+5', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/jenis-mutasi-stock') },
          { type: 'separator' },
          { label: 'Suppliers', accelerator: 'CmdOrCtrl+6', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/supplier') },
          { label: 'Pelanggan', accelerator: 'CmdOrCtrl+7', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/pelanggan') },
          { label: 'Gudang', accelerator: 'CmdOrCtrl+8', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/gudang') },
          { label: 'Pelaksana', accelerator: 'CmdOrCtrl+9', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/pelaksana') },
          { label: 'Jenis Transaksi Kas', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/jenis-transaksi-kas') },
        ]
      }
    ] : []),
    ...(canShow('USER_MANAGEMENT') ? [
      {
        label: 'User Management',
        submenu: [
          { label: 'Users', accelerator: 'CmdOrCtrl+U', click: () => mainWindow.webContents.send('navigate-to', '/users') },
          { label: 'Role', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/role') },
        ]
      }
    ] : []),
    {
      label: 'Transaksi',
      submenu: [
        ...(canShow('PURCHASE_ORDER') ? [{ label: 'Purchase Order', accelerator: 'CmdOrCtrl+P', click: () => mainWindow.webContents.send('navigate-to', '/purchase-order') }] : []),
        ...(canShow('SALES_ORDER') ? [{ label: 'Sales Order', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('navigate-to', '/sales-order') }] : []),
        ...(canShow('WORK_ORDER_PLANNING') ? [{ label: 'Work Order', accelerator: 'CmdOrCtrl+W', click: () => mainWindow.webContents.send('navigate-to', '/work-order') }] : []),
        ...(canShow('WORK_ORDER_ACTUAL') ? [{ label: 'WO Actual', accelerator: 'CmdOrCtrl+Shift+W', click: () => mainWindow.webContents.send('navigate-to', '/wo-actual') }] : []),
        { label: 'Surat Jalan Invoicing', accelerator: 'CmdOrCtrl+F', click: () => mainWindow.webContents.send('navigate-to', '/finance-invoice-pod') },
        { label: 'Pembayaran', click: () => mainWindow.webContents.send('navigate-to', '/pembayaran') },
        { label: 'Financial Report', click: () => mainWindow.webContents.send('navigate-to', '/financial-report') },
        { type: 'separator' },
        { label: 'Mutasi Stock', accelerator: 'CmdOrCtrl+M', click: () => mainWindow.webContents.send('navigate-to', '/mutasi-stock') },
        { label: 'Item Barang Request', accelerator: 'CmdOrCtrl+I', click: () => mainWindow.webContents.send('navigate-to', '/item-barang-request') },
        { label: 'Approval', accelerator: 'CmdOrCtrl+Shift+A', click: () => mainWindow.webContents.send('navigate-to', '/approval') },
        { type: 'separator' },
        { label: 'Konversi Barang', accelerator: 'CmdOrCtrl+K', click: () => mainWindow.webContents.send('navigate-to', '/konversi-barang')},
        { label: 'Split Barang', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send('navigate-to', '/split-barang')},
        { label: 'Merge Barang', accelerator: 'CmdOrCtrl+Shift+M', click: () => mainWindow.webContents.send('navigate-to', '/merge-barang')}
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            mainWindow.webContents.send('show-alert', {
              title: 'About',
              message: 'SHN React App v1.0.0\n\nAplikasi manajemen untuk Surya Logam Jaya',
              type: 'info'
            });
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: () => {
            if (mainWindow.webContents.isDevToolsOpened()) {
              mainWindow.webContents.closeDevTools();
            } else {
              mainWindow.webContents.openDevTools();
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(buildMenuTemplate());
  console.log('Menu created:', menu);
  ipcMain.on('show-menu', () => {
    if (mainWindow) {
      Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate()));
      console.log('Menu shown');
    }
  });
  ipcMain.on('hide-menu', () => {
    if (mainWindow) {
      Menu.setApplicationMenu(null);
      console.log('Menu hidden');
    }
  });
  // Set menu for all environments
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate()));
  console.log('Menu set for all environments');

  // Listen for role permissions data from renderer
  ipcMain.on('role-permissions-data', (_event, data) => {
    rolePermissionsDataCache = data;
    try {
      Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate()));
    } catch (e) {}
  });

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// Simple crash handler - just log, don't crash
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
  
  // Log to file
  try {
    const fs = require('fs');
    const logPath = path.join(__dirname, '../logs/electron-crash.log');
    const logDir = path.dirname(logPath);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logEntry = `[${new Date().toISOString()}] Uncaught Exception: ${error.message}\nStack: ${error.stack}\n\n`;
    fs.appendFileSync(logPath, logEntry);
  } catch (logError) {
    console.error('Failed to log error:', logError);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  
  // Log to file
  try {
    const fs = require('fs');
    const logPath = path.join(__dirname, '../logs/electron-crash.log');
    const logDir = path.dirname(logPath);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logEntry = `[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n\n`;
    fs.appendFileSync(logPath, logEntry);
  } catch (logError) {
    console.error('Failed to log rejection:', logError);
  }
});

// Memory management
app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript('localStorage.clear(); sessionStorage.clear();');
  }
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC messages from renderer
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-name', () => {
  return app.getName();
});

// Handle canvas file saving
ipcMain.handle('save-canvas-file', async (event, { dataUrl, filename }) => {
  try {
    console.log('=== SAVE CANVAS FILE DEBUG ===');
    console.log('Received filename:', filename);
    console.log('DataURL length:', dataUrl ? dataUrl.length : 'null');
    
    // Create canvas-previews directory in public folder
    const publicDir = path.join(__dirname, '..', 'public');
    const canvasPreviewsDir = path.join(publicDir, 'canvas-previews');
    
    console.log('Public dir:', publicDir);
    console.log('Canvas previews dir:', canvasPreviewsDir);
    console.log('Canvas previews dir exists:', fs.existsSync(canvasPreviewsDir));
    
    // Ensure directory exists
    if (!fs.existsSync(canvasPreviewsDir)) {
      console.log('Creating canvas-previews directory...');
      fs.mkdirSync(canvasPreviewsDir, { recursive: true });
      console.log('Directory created successfully');
    }
    
    // Convert dataURL to buffer
    const base64Data = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log('Buffer size:', buffer.length);
    
    // Save file
    const filePath = path.join(canvasPreviewsDir, filename);
    console.log('Saving to file path:', filePath);
    
    fs.writeFileSync(filePath, buffer);
    
    console.log(`✅ CANVAS PREVIEW SAVED SUCCESSFULLY!`);
    console.log(`📁 Full file path: ${filePath}`);
    console.log(`📄 Filename: ${filename}`);
    console.log(`📊 File size: ${buffer.length} bytes`);
    console.log(`🔍 File exists after save: ${fs.existsSync(filePath)}`);
    
    // Get file stats for verification
    try {
      const stats = fs.statSync(filePath);
      console.log(`📅 File created: ${stats.birthtime}`);
      console.log(`📏 File size on disk: ${stats.size} bytes`);
    } catch (statError) {
      console.error('Error getting file stats:', statError);
    }
    
    return {
      success: true,
      message: 'File saved successfully',
      path: `/canvas-previews/${filename}`,
      fullPath: filePath,
      fileSize: buffer.length
    };
    
  } catch (error) {
    console.error('Error saving canvas preview:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: 'Failed to save file',
      details: error.message
    };
  }
});

// Handle clearing canvas-previews folder
ipcMain.handle('clear-canvas-previews', async () => {
  try {
    console.log('=== CLEAR CANVAS PREVIEWS DEBUG ===');
    
    // Get canvas-previews directory path
    const publicDir = path.join(__dirname, '..', 'public');
    const canvasPreviewsDir = path.join(publicDir, 'canvas-previews');
    
    console.log('Canvas previews dir:', canvasPreviewsDir);
    console.log('Canvas previews dir exists:', fs.existsSync(canvasPreviewsDir));
    
    if (!fs.existsSync(canvasPreviewsDir)) {
      console.log('Canvas previews directory does not exist, nothing to clear');
      return {
        success: true,
        message: 'Directory does not exist, nothing to clear',
        filesDeleted: 0
      };
    }
    
    // Read directory contents
    const files = fs.readdirSync(canvasPreviewsDir);
    console.log('Files in canvas-previews:', files);
    
    let deletedCount = 0;
    const errors = [];
    
    // Delete each file
    for (const file of files) {
      try {
        const filePath = path.join(canvasPreviewsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isFile()) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`✅ Deleted file: ${file}`);
        } else {
          console.log(`⚠️ Skipping non-file: ${file}`);
        }
      } catch (fileError) {
        console.error(`❌ Error deleting file ${file}:`, fileError);
        errors.push(`${file}: ${fileError.message}`);
      }
    }
    
    console.log(`✅ CANVAS PREVIEWS CLEARED SUCCESSFULLY!`);
    console.log(`📊 Files deleted: ${deletedCount}`);
    console.log(`❌ Errors: ${errors.length}`);
    
    return {
      success: true,
      message: `Cleared ${deletedCount} files from canvas-previews`,
      filesDeleted: deletedCount,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    console.error('Error clearing canvas previews:', error);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      error: 'Failed to clear canvas previews',
      details: error.message
    };
  }
});
