import { send, receive, SEND, RECEIVE } from './modules/api.js';
import { elements } from './modules/dom.js';
import * as history from './modules/history.js';
import * as results from './modules/results.js';
import * as status from './modules/status.js';
import { submit } from './modules/search.js';

function copyToClipboard(ch, na) {
  send(SEND.CLIPBOARD, ch);
  history.add(ch, na);
}

function bindUi() {
  const { query } = elements();

  query.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      submit(query.value);
    }
  });

  window.addEventListener('keydown', (event) => {
    query.focus();
    if (event.key === 'Escape') {
      query.value = '';
    }
  });

  history.onSelect(({ ch, na }) => copyToClipboard(ch, na));
  results.onSelect(({ ch, na }) => copyToClipboard(ch, na));
}

function bindIpc() {
  receive(RECEIVE.STATUS, ({ ready, message }) => {
    if (ready) { status.clearBusy(); }
    status.setReady(ready, message);
  });

  receive(RECEIVE.SEARCH_RESULT, ({ result }) => {
    status.setReady(true);
    results.render(result);
  });

  receive(RECEIVE.CACHE, (data) => {
    send(SEND.CACHE, data);
  });

  receive(RECEIVE.CLEAR_HISTORY, ({ type }) => {
    history.clear(type);
  });
}

window.addEventListener('load', () => {
  history.load();
  bindUi();
  bindIpc();
  elements().query.focus();
  send(SEND.REQUEST_STATUS, {});
  send(SEND.CACHE, { force: false });
});
