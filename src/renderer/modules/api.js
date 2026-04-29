// Channel constants exposed to the renderer. Mirrors src/shared/channels.js.
export const SEND = Object.freeze({
  SEARCH: 'search',
  REQUEST_STATUS: 'requestStatus',
  CLIPBOARD: 'clipboard',
  CACHE: 'cache',
});

export const RECEIVE = Object.freeze({
  SEARCH_RESULT: 'searchResult',
  STATUS: 'status',
  CACHE: 'cache',
  CLEAR_HISTORY: 'clearHistory',
});

export const api = window.api;

export function send(channel, payload) {
  api.send(channel, payload);
}

export function receive(channel, listener) {
  return api.receive(channel, listener);
}
