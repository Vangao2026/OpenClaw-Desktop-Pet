const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  move: (dx, dy) => ipcRenderer.invoke('pet-move', dx, dy),
  getPosition: () => ipcRenderer.invoke('pet-get-position'),
  setSize: (w, h) => ipcRenderer.invoke('pet-set-size', w, h),
  minimize: () => ipcRenderer.invoke('pet-minimize'),
  quit: () => ipcRenderer.invoke('pet-quit'),
  setIgnore: (ignore) => ipcRenderer.invoke('pet-set-ignore', ignore),
});
