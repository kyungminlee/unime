const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  "api", {
    send: (channel, data) => {
      const validChannels = ['search', 'requestStatus', 'clipboard', 'cache'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      const validChannels = ['searchResult', 'status', 'cache'];
      if (validChannels.includes(channel)) {
      	ipcRenderer.on(channel, (_event, ...args) => func(...args));
      }
    }
  }
);
