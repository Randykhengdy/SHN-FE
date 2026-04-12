const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message-from-renderer', message),
  onMessage: (callback) => ipcRenderer.on('message-from-main', (event, data) => callback(data)),
  onNavigate: (callback) => ipcRenderer.on('navigate-to', callback),
  onChangePassword: (callback) => ipcRenderer.on('change-password-modal', callback),
  showMenu: () => ipcRenderer.send('show-menu'),
  hideMenu: () => ipcRenderer.send('hide-menu'),
  saveCanvasFile: (dataUrl, filename) => ipcRenderer.invoke('save-canvas-file', { dataUrl, filename }),
  clearCanvasPreviews: () => ipcRenderer.invoke('clear-canvas-previews'),
  onShowAlert: (callback) => ipcRenderer.on('show-alert', (event, data) => callback(data)),
  setRolePermissionsData: (data) => ipcRenderer.send('role-permissions-data', data),
  // Updater APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  cancelDownloadUpdate: () => ipcRenderer.invoke('cancel-download-update'),
  onUpdateEvent: (callback) => ipcRenderer.on('update-event', (_event, data) => callback(data)),
  onReportSOTanggal: (callback) => ipcRenderer.on('open-report-so-tanggal', callback),
  onRequestConfirm: (callback) => ipcRenderer.on('request-confirm', (_event, data) => callback(data)),
  sendConfirmResult: (id, result) => ipcRenderer.send('confirm-result', { id, result }),
  // App info
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  getName: () => ipcRenderer.invoke('get-app-name')
});
