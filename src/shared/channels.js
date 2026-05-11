'use strict';

// Channels are named from the renderer's perspective:
//   SEND    — renderer → main
//   RECEIVE — main → renderer
const SEND = Object.freeze({
  SEARCH: 'search',
  REQUEST_STATUS: 'requestStatus',
  CLIPBOARD: 'clipboard',
});

const RECEIVE = Object.freeze({
  SEARCH_RESULT: 'searchResult',
  STATUS: 'status',
  CLEAR_HISTORY: 'clearHistory',
});

const CHANNELS = Object.freeze({
  SEND,
  RECEIVE,
  SEND_LIST: Object.freeze(Object.values(SEND)),
  RECEIVE_LIST: Object.freeze(Object.values(RECEIVE)),
});

module.exports = CHANNELS;
