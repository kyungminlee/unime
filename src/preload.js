const { contextBridge, ipcRenderer } = require('electron');

const SEND_CHANNELS = Object.freeze(['search', 'requestStatus', 'clipboard', 'cache']);
const RECEIVE_CHANNELS = Object.freeze(['searchResult', 'status', 'cache', 'clearHistory']);

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    if (SEND_CHANNELS.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, listener) => {
    if (RECEIVE_CHANNELS.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => listener(...args));
    }
  },
});
