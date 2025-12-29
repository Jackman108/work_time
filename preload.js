// Preload-скрипт для организации безопасного взаимодействия между Renderer и Main процессами
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, listener) => ipcRenderer.on(channel, listener),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args)
});

