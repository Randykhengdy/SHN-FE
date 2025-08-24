const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

let win;
let isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_IS_DEV;

function createWindow () {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../src/assets/logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false, // penting demi keamanan
      webSecurity: false, // Allow loading local resources in dev
      devTools: true,
      allowRunningInsecureContent: true
    }
  });

  win.maximize();

  if (isDev) {
    // Development mode
    win.loadURL('http://localhost:5173');
    
    // Open DevTools automatically
    win.webContents.openDevTools();
    
    // Enable hot reload for development
    win.webContents.on('did-finish-load', () => {
      console.log('Development server loaded successfully');
    });
    
    // Handle development server errors
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load development server:', errorDescription);
      // Retry after 2 seconds
      setTimeout(() => {
        if (isDev) {
          win.loadURL('http://localhost:5173');
        }
      }, 2000);
    });
    
  } else {
    // Production mode
    const htmlPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading HTML from:', htmlPath);
    win.loadFile(htmlPath);
    
    // Add error handling for renderer
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('Failed to load renderer:', errorDescription);
      console.error('Error code:', errorCode);
      console.error('URL:', validatedURL);
    });
    
    win.webContents.on('crashed', (event) => {
      console.error('Renderer process crashed');
    });
    
    win.webContents.on('unresponsive', () => {
      console.error('Renderer process unresponsive');
    });
  }

  // Disable zoom
  win.webContents.on('did-finish-load', () => {
    win.webContents.setZoomLevel(0);
    win.webContents.setVisualZoomLevelLimits(1, 1);
    win.webContents.setZoomFactor(1);
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.control || input.meta) {
      const blocked = ['+', '-', '=', '0', 'Add', 'Subtract'];
      if (blocked.includes(input.key) || blocked.includes(input.code)) {
        event.preventDefault();
      }
    }
  });

  // Add keyboard shortcuts for all environments
  win.webContents.on('before-input-event', (event, input) => {
    // Ctrl+Shift+I to toggle DevTools
    if (input.control && input.shift && input.key === 'I') {
      event.preventDefault();
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win.webContents.openDevTools();
      }
    }
    
    // Ctrl+R to reload
    if (input.control && input.key === 'r') {
      event.preventDefault();
      if (isDev) {
        win.loadURL('http://localhost:5173');
      } else {
        win.reload();
      }
    }
    
    // Ctrl+Shift+R to hard reload
    if (input.control && input.shift && input.key === 'R') {
      event.preventDefault();
      if (isDev) {
        win.loadURL('http://localhost:5173');
      } else {
        win.webContents.reloadIgnoringCache();
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
          click: () => win.webContents.send('navigate-to', '/dashboard')
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
        { label: 'Jenis Barang', accelerator: 'CmdOrCtrl+1', click: () => win.webContents.send('navigate-to', '/masterdata/jenis-barang') },
        { label: 'Bentuk Barang', accelerator: 'CmdOrCtrl+2', click: () => win.webContents.send('navigate-to', '/masterdata/bentuk-barang') },
        { label: 'Grade Barang', accelerator: 'CmdOrCtrl+3', click: () => win.webContents.send('navigate-to', '/masterdata/grade-barang') },
        { label: 'Item Barang', accelerator: 'CmdOrCtrl+4', click: () => win.webContents.send('navigate-to', '/masterdata/item-barang') },
        { label: 'Jenis Mutasi Stock', accelerator: 'CmdOrCtrl+5', click: () => win.webContents.send('navigate-to', '/masterdata/jenis-mutasi-stock') },
        { type: 'separator' },
        { label: 'Suppliers', accelerator: 'CmdOrCtrl+6', click: () => win.webContents.send('navigate-to', '/masterdata/supplier') },
        { label: 'Pelanggan', accelerator: 'CmdOrCtrl+7', click: () => win.webContents.send('navigate-to', '/masterdata/pelanggan') },
        { label: 'Gudang', accelerator: 'CmdOrCtrl+8', click: () => win.webContents.send('navigate-to', '/masterdata/gudang') },
        { label: 'Pelaksana', accelerator: 'CmdOrCtrl+9', click: () => win.webContents.send('navigate-to', '/masterdata/pelaksana') },
        { label: 'Jenis Transaksi Kas', accelerator: 'CmdOrCtrl+0', click: () => win.webContents.send('navigate-to', '/masterdata/jenis-transaksi-kas') },
      ]
    },
    {
      label: 'Transaksi',
      submenu: [
        { label: 'Purchase Order', accelerator: 'CmdOrCtrl+P', click: () => win.webContents.send('navigate-to', '/purchase-order') },
        { label: 'Sales Order', accelerator: 'CmdOrCtrl+S', click: () => win.webContents.send('navigate-to', '/sales-order') },
        { label: 'Work Order', accelerator: 'CmdOrCtrl+W', click: () => win.webContents.send('navigate-to', '/work-order') },
        { type: 'separator' },
        { label: 'AR / AP', accelerator: 'CmdOrCtrl+A', click: () => win.webContents.send('navigate-to', '/ar-ap') },
        { label: 'Mutasi Stock', accelerator: 'CmdOrCtrl+M', click: () => win.webContents.send('navigate-to', '/mutasi-stock') }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'FUI', accelerator: 'CmdOrCtrl+F', click: () => win.webContents.send('navigate-to', '/tools/fui') },
        { label: 'Workshop', accelerator: 'CmdOrCtrl+Shift+W', click: () => win.webContents.send('navigate-to', '/tools/workshop') },
        { label: 'Report', accelerator: 'CmdOrCtrl+R', click: () => win.webContents.send('navigate-to', '/tools/report') }
      ]
    },
    {
      label: 'Data',
      submenu: [
        {
          label: 'Clear All Data',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => win.webContents.executeJavaScript('localStorage.clear(); alert("Semua data dihapus.")')
        },
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            win.webContents.executeJavaScript(`
              const data = {};
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = localStorage.getItem(key);
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'data-export-' + new Date().toISOString().split('T')[0] + '.json';
              a.click();
              URL.revokeObjectURL(url);
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
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => win.webContents.executeJavaScript(`alert('Surya Logam Jaya\\nVersion 1.0.0');`)
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+Shift+K',
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  console.log('Menu created:', menu);
  
  ipcMain.on('show-menu', () => {
    if (win) {
      Menu.setApplicationMenu(menu);
      console.log('Menu shown');
    }
  });
  
  ipcMain.on('hide-menu', () => {
    if (win) {
      Menu.setApplicationMenu(null);
      console.log('Menu hidden');
    }
  });
  
  // Set menu for production
  Menu.setApplicationMenu(menu);
  console.log('Menu set for all environments');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle app window all closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app before quit
app.on('before-quit', () => {
  console.log('Application is quitting...');
});

// Handle app quit
app.on('quit', () => {
  console.log('Application has quit');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't quit the app, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't quit the app, just log the error
});
