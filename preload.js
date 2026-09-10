const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-updates'),
  restartAndUpdate: () => ipcRenderer.invoke('restart-and-update'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  saveUserData: (key, value) => ipcRenderer.invoke('save-user-data', key, value),
  loadUserData: (key) => ipcRenderer.invoke('load-user-data', key),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (event, data) => callback(data))
});
