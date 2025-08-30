const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep a global reference of the window object
// If you don't, the window will be closed automatically when the JavaScript object is garbage collected
let mainWindow = null;

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

  // Build native menu, but trigger React navigation
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+D',
          click: () => mainWindow.webContents.send('navigate-to', '/dashboard')
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
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
        { label: 'Role', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.send('navigate-to', '/masterdata/role') },
      ]
    },
          {
        label: 'User Management',
        submenu: [
          { label: 'Users', accelerator: 'CmdOrCtrl+U', click: () => mainWindow.webContents.send('navigate-to', '/users') },
        ]
      },
          {
        label: 'Transaksi',
        submenu: [
          { label: 'Purchase Order', accelerator: 'CmdOrCtrl+P', click: () => mainWindow.webContents.send('navigate-to', '/purchase-order') },
          { label: 'Sales Order', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('navigate-to', '/sales-order') },
          { label: 'Work Order', accelerator: 'CmdOrCtrl+W', click: () => mainWindow.webContents.send('navigate-to', '/work-order') },
          { type: 'separator' },
          { label: 'AR / AP', accelerator: 'CmdOrCtrl+A', click: () => mainWindow.webContents.send('navigate-to', '/ar-ap') },
          { label: 'Mutasi Stock', accelerator: 'CmdOrCtrl+M', click: () => mainWindow.webContents.send('navigate-to', '/mutasi-stock') }
        ]
      },
          {
        label: 'Tools',
        submenu: [
          { label: 'FUI', accelerator: 'CmdOrCtrl+F', click: () => mainWindow.webContents.send('navigate-to', '/tools/fui') },
          { label: 'Workshop', accelerator: 'CmdOrCtrl+Shift+W', click: () => mainWindow.webContents.send('navigate-to', '/tools/workshop') },
          { label: 'Report', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.webContents.send('navigate-to', '/tools/report') }
        ]
      },
    {
      label: 'Data',
      submenu: [
        {
          label: 'Clear All Data',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => mainWindow.webContents.executeJavaScript('localStorage.clear(); alert("Semua data dihapus.")')
        },
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              const data = {};
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = localStorage.getItem(key);
              }
              console.log('Exported data:', data);
              alert('Data exported to console');
            `);
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              alert('SHN React App v1.0.0\\n\\nAplikasi manajemen untuk Surya Logam Jaya');
            `);
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

  const menu = Menu.buildFromTemplate(template);
  console.log('Menu created:', menu);
  ipcMain.on('show-menu', () => {
    if (mainWindow) {
      Menu.setApplicationMenu(menu);
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
  Menu.setApplicationMenu(menu);
  console.log('Menu set for all environments');

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
