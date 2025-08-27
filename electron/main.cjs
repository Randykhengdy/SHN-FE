const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../src/assets/logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
      devTools: true,
      allowRunningInsecureContent: true
    },
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
    win.maximize();
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // Development mode
    console.log('Development mode - loading URL:', process.env.VITE_DEV_SERVER_URL);
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
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
      win.loadFile(indexPath).catch(err => {
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
          win.loadFile(altPath).catch(err => {
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
      if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
      } else {
        win.reload();
      }
    }
    
    // Ctrl+Shift+R to hard reload
    if (input.control && input.shift && input.key === 'R') {
      event.preventDefault();
      if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
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
        { label: 'Role', accelerator: 'CmdOrCtrl+Shift+R', click: () => win.webContents.send('navigate-to', '/masterdata/role') },
      ]
    },
    {
      label: 'User Management',
      submenu: [
        { label: 'Users', accelerator: 'CmdOrCtrl+U', click: () => win.webContents.send('navigate-to', '/users') },
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
            win.webContents.executeJavaScript(`
              alert('SHN React App v1.0.0\\n\\nAplikasi manajemen untuk Surya Logam Jaya');
            `);
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'F12',
          click: () => {
            if (win.webContents.isDevToolsOpened()) {
              win.webContents.closeDevTools();
            } else {
              win.webContents.openDevTools();
            }
          }
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
  // Set menu for all environments
  Menu.setApplicationMenu(menu);
  console.log('Menu set for all environments');
}

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
