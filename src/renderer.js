const MAX_HISTORY_LENGTH = 256;

const $ = (id) => document.getElementById(id);

const ucdController = {
  ready: false,

  sendQuery(query) {
    window.api.send('search', query);
  },

  sendToClipboard(item) {
    window.api.send('clipboard', item);
  },

  receiveStatus({ ready, message }) {
    const queryElement = $('query');
    const statusbarElement = $('statusbar');
    ucdController.ready = ready;
    if (ready) {
      viewController.unsetBusy();
      queryElement.removeAttribute('disabled');
    } else {
      viewController.setBusy();
      queryElement.setAttribute('disabled', 'disabled');
    }
    statusbarElement.textContent = message;
  },

  receiveSearchResult({ result }) {
    ucdController.ready = true;
    $('query').removeAttribute('disabled');
    viewController.update(result);
  },
};

const viewController = {
  clear() {
    $('result').replaceChildren();
  },

  setBusy() {
    const resultElement = $('result');
    $('query').setAttribute('disabled', 'disabled');
    const spinner = document.createElement('div');
    spinner.classList.add('spinner');
    spinner.id = 'spinner';
    resultElement.replaceChildren(spinner);
  },

  unsetBusy() {
    $('spinner')?.remove();
  },

  _findExistingHistoryItem(ch) {
    for (const item of $('history-pinned').children) {
      if (item.dataset.ch === ch) {
        item.remove();
        return item;
      }
    }
    for (const item of $('history-unpinned').children) {
      if (item.dataset.ch === ch) {
        item.remove();
        return item;
      }
    }
    return null;
  },

  _getHistoryItem(ch, na) {
    return viewController._findExistingHistoryItem(ch) ?? viewController._createHistoryItem(ch, na);
  },

  _createHistoryItem(ch, na) {
    const item = document.createElement('div');
    item.textContent = ch;
    item.classList.add('history-item');
    item.title = `${na} (U+${ch.codePointAt(0).toString(16).toUpperCase()})\nRight click to pin/unpin.`;
    item.dataset.ch = ch;
    item.dataset.na = na;

    item.addEventListener('click', () => {
      ucdController.sendToClipboard(ch);
      viewController.addHistory(ch, na);
    });

    item.addEventListener('contextmenu', () => {
      const pinned = $('history-pinned');
      const unpinned = $('history-unpinned');
      if (viewController.isPinned(item.dataset.ch)) {
        pinned.removeChild(item);
        unpinned.prepend(item);
      } else {
        unpinned.removeChild(item);
        pinned.append(item);
      }
      viewController.storeHistory();
    });

    return item;
  },

  _addPinnedHistory(ch, na) {
    const item = viewController._getHistoryItem(ch, na);
    $('history-pinned').append(item);
  },

  _addUnpinnedHistory(ch, na) {
    const unpinned = $('history-unpinned');
    const item = viewController._getHistoryItem(ch, na);
    while (unpinned.children.length >= MAX_HISTORY_LENGTH) {
      unpinned.removeChild(unpinned.lastChild);
    }
    unpinned.prepend(item);
  },

  isPinned(ch) {
    for (const child of $('history-pinned').children) {
      if (child.dataset.ch === ch) {
        return true;
      }
    }
    return false;
  },

  addHistory(ch, na) {
    if (viewController.isPinned(ch)) { return; }
    viewController._addUnpinnedHistory(ch, na);
    viewController.storeHistory();
  },

  storeHistory() {
    const serialize = (element) =>
      Array.from(element.children).map((item) => ({
        ch: item.dataset.ch,
        na: item.dataset.na,
      }));
    localStorage.setItem('history-pinned', JSON.stringify(serialize($('history-pinned'))));
    localStorage.setItem('history-unpinned', JSON.stringify(serialize($('history-unpinned'))));
  },

  clearPinnedHistory() {
    $('history-pinned').replaceChildren();
    viewController.storeHistory();
  },

  clearUnpinnedHistory() {
    $('history-unpinned').replaceChildren();
    viewController.storeHistory();
  },

  loadPinnedHistory() {
    const json = localStorage.getItem('history-pinned');
    if (!json) { return; }
    for (const { ch, na } of JSON.parse(json)) {
      viewController._addPinnedHistory(ch, na);
    }
  },

  loadUnpinnedHistory() {
    const json = localStorage.getItem('history-unpinned');
    if (!json) { return; }
    for (const { ch, na } of JSON.parse(json)) {
      viewController._addUnpinnedHistory(ch, na);
    }
  },

  addRow(tab, ch, na) {
    const row = tab.insertRow(-1);
    row.classList.add('result-row');
    const charCell = row.insertCell(0);
    const nameCell = row.insertCell(1);
    charCell.classList.add('character-cell');
    nameCell.classList.add('name-cell');
    charCell.textContent = ch;
    nameCell.textContent = na;
    row.addEventListener('click', () => {
      ucdController.sendToClipboard(ch);
      viewController.addHistory(ch, na);
    });
  },

  update(hits) {
    const statusbarElement = $('statusbar');
    const tab = document.createElement('table');
    tab.id = 'result-table';
    let count = 0;
    for (const item of hits) {
      try {
        const ch = String.fromCodePoint(item.cp);
        viewController.addRow(tab, ch, item.na);
        ++count;
      } catch {
        // Invalid code point — skip silently.
      }
    }
    $('result').replaceChildren(tab);
    statusbarElement.textContent = `Found ${count} results.`;
  },

  searchHandler() {
    if (!ucdController.ready) { return false; }
    const queryElement = $('query');
    const statusbarElement = $('statusbar');

    const query = queryElement.value.trim();
    if (query.length >= 2) {
      statusbarElement.textContent = 'Searching...';
      viewController.setBusy();
      ucdController.sendQuery({ query });
    } else {
      statusbarElement.textContent = 'Results cleared.';
    }
    return false;
  },
};

window.addEventListener('load', () => {
  viewController.loadPinnedHistory();
  viewController.loadUnpinnedHistory();
  const queryElement = $('query');
  queryElement.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      viewController.searchHandler();
    }
  });
  queryElement.focus();
});

window.addEventListener('keydown', (event) => {
  const queryElement = $('query');
  queryElement.focus();
  if (event.key === 'Escape') {
    queryElement.value = '';
  }
});

window.api.receive('status', (data) => ucdController.receiveStatus(data));
window.api.receive('searchResult', (data) => ucdController.receiveSearchResult(data));
window.api.receive('cache', (data) => window.api.send('cache', data));
window.api.receive('clearHistory', (data) => {
  for (const type of data.type) {
    if (type === 'unpinned') {
      viewController.clearUnpinnedHistory();
    } else if (type === 'pinned') {
      viewController.clearPinnedHistory();
    }
  }
});

window.api.send('requestStatus', {});
window.api.send('cache', { force: false });
