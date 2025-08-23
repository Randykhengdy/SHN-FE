const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');


let win;

function createWindow () {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../src/assets/logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false // penting demi keamanan
    }
  });

  win.maximize();

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
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
        {
          label: 'Input PO',
          accelerator: 'CmdOrCtrl+P',
          click: () => win.webContents.send('navigate-to', '/input-po')
        },
        {
          label: 'AR / AP',
          accelerator: 'CmdOrCtrl+A',
          click: () => win.webContents.send('navigate-to', '/ar-ap')
        },
        {
          label: 'Mutasi',
          accelerator: 'CmdOrCtrl+M',
          click: () => win.webContents.send('navigate-to', '/mutasi')
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
        { label: 'Supplier', accelerator: 'CmdOrCtrl+6', click: () => win.webContents.send('navigate-to', '/masterdata/supplier') },
        { label: 'Pelanggan', accelerator: 'CmdOrCtrl+7', click: () => win.webContents.send('navigate-to', '/masterdata/pelanggan') },
        { label: 'Gudang', accelerator: 'CmdOrCtrl+8', click: () => win.webContents.send('navigate-to', '/masterdata/gudang') },
        { label: 'Pelaksana', accelerator: 'CmdOrCtrl+9', click: () => win.webContents.send('navigate-to', '/masterdata/pelaksana') },
        { label: 'Jenis Transaksi Kas', accelerator: 'CmdOrCtrl+0', click: () => win.webContents.send('navigate-to', '/masterdata/jenis-transaksi-kas') },
      ]
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'FUI', accelerator: 'CmdOrCtrl+F', click: () => win.webContents.send('navigate-to', '/tools/fui') },
        { label: 'Workshop', accelerator: 'CmdOrCtrl+W', click: () => win.webContents.send('navigate-to', '/tools/workshop') },
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
  ipcMain.on('show-menu', () => {
    if (win) {
      Menu.setApplicationMenu(menu);
    }
  });
  
  ipcMain.on('hide-menu', () => {
    if (win) {
      Menu.setApplicationMenu(null);
    }
  });
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
