'use strict';

const SEND = Object.freeze({
  SEARCH: 'search',
  REQUEST_STATUS: 'requestStatus',
  CLIPBOARD: 'clipboard',
  CACHE: 'cache',
});

const RECEIVE = Object.freeze({
  SEARCH_RESULT: 'searchResult',
  STATUS: 'status',
  CACHE: 'cache',
  CLEAR_HISTORY: 'clearHistory',
});

const CHANNELS = Object.freeze({
  SEND,
  RECEIVE,
  SEND_LIST: Object.freeze(Object.values(SEND)),
  RECEIVE_LIST: Object.freeze(Object.values(RECEIVE)),
});

module.exports = CHANNELS;
