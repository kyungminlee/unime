'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// NOTE: Sandboxed preload scripts cannot require local modules, so the
// channel list is duplicated here. Parity with `src/shared/channels.js`
// is enforced by `tests/channels.test.js`.
const SEND_CHANNELS = Object.freeze(['search', 'requestStatus', 'clipboard']);
const RECEIVE_CHANNELS = Object.freeze(['searchResult', 'status', 'clearHistory']);

contextBridge.exposeInMainWorld('api', {
  send(channel, data) {
    if (SEND_CHANNELS.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive(channel, listener) {
    if (!RECEIVE_CHANNELS.includes(channel)) { return () => {}; }
    const wrapped = (_event, ...args) => listener(...args);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },
});
