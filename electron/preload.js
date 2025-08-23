const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message-from-renderer', message),
  onMessage: (callback) => ipcRenderer.on('message-from-main', (event, data) => callback(data)),
  onNavigate: (callback) => ipcRenderer.on('navigate-to', callback),
  showMenu: () => ipcRenderer.send('show-menu'),
  hideMenu: () => ipcRenderer.send('hide-menu')
});
