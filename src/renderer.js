const ucdController = {
  ready: false,
  sendQuery: (query) => {
    window.api.send('search', query);
  },
  sendToClipboard: (item) => {
    window.api.send('clipboard', item);
  },
  receiveStatus: (data) => {
    const queryElement = document.getElementById('query');
    const statusbarElement = document.getElementById('statusbar');
    const {ready, message} = data;
    if (ready) {
      ucdController.ready = true;
      viewController.unsetBusy();
      queryElement.removeAttribute('disabled');
      statusbarElement.innerHTML = message;
    } else {
      ucdController.ready = false;
      viewController.setBusy();
      queryElement.setAttribute('disabled', 'disabled');
      statusbarElement.innerHTML = message;
    }
  },
  receiveSearchResult: (data) => {
    const queryElement = document.getElementById('query');
    const {result} = data;
    ucdController.ready = true;
    queryElement.removeAttribute('disabled');
    viewController.update(result);
  },
};

const kMaxHistoryLength = 256;

const viewController = {
  clear: () => {
    const resultElement = document.getElementById("result");
    while(resultElement.firstChild) {
      resultElement.removeChild(resultElement.firstChild);
    }
  },

  setBusy: () => {
    const resultElement = document.getElementById("result");
    const queryElement = document.getElementById('query');
    queryElement.setAttribute('disabled', 'disabled');
    viewController.clear();
    const spinner = document.createElement('div');
    spinner.setAttribute('class', 'spinner');
    spinner.setAttribute('id', 'spinner');
    resultElement.appendChild(spinner);
  }, //setBusy

  unsetBusy: () => {
    const resultElement = document.getElementById("result");
    const spinnerElement = document.getElementById('spinner');
    if (spinnerElement) {
      resultElement.removeChild(spinnerElement);
    }
  },

  addHistory: (ch, na) => {
    const historyElement = document.getElementById('history');
    for (child of historyElement.children) {
      if (child.innerText === ch) {
        historyElement.removeChild(child);
        historyElement.prepend(child);
        return;
      }
    }
    const item = document.createElement('div');
    item.innerText = ch;
    item.setAttribute('class', 'history-item');
    item.setAttribute('title', `${na} (\U+${ch.codePointAt(0).toString(16)})`);
    while (historyElement.children.length > kMaxHistoryLength) {
      historyElement.removeChild(historyElement.lastChild);
    }
    item.onclick = () => {
      ucdController.sendToClipboard(ch);
      viewController.addHistory(ch, na);
    };
    historyElement.prepend(item);
  },

  addRow: (tab, ch, na) => {
    const row = tab.insertRow(-1);
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    row.setAttribute('class', 'result-row');
    cell1.setAttribute('class', 'character-cell');
    cell2.setAttribute('class', 'name-cell');
    cell1.innerHTML = ch;
    cell2.innerHTML = na;
    row.onclick = () => {
      ucdController.sendToClipboard(ch);
      viewController.addHistory(ch, na);
    }
  }, // addRow


  update: (hits) => {
    const resultElement = document.getElementById("result");
    const statusbarElement = document.getElementById('statusbar');
    const tab = document.createElement('table', {id: 'result-table'});
    tab.setAttribute('id', 'result-table');
    let count = 0;
    for(item of hits) {
      try {
        const ch = String.fromCodePoint(item.cp);
        const na = item.na;
        viewController.addRow(tab, ch, na);
        ++count;
      } catch(err) {
        // console.log(`Error in update: ${err}`);
      }
    }
    viewController.clear();
    resultElement.appendChild(tab);
    statusbarElement.innerHTML = `Found ${count} results.`
  }, // update
  
  searchHandler: () => {
    if (!ucdController.ready) { return; }
    const queryElement = document.getElementById('query');
    const statusbarElement = document.getElementById('statusbar');

    const query = queryElement.value.trim();
    if (query.length >= 2) {
      statusbarElement.innerHTML = 'Searching...';
      viewController.setBusy();
      ucdController.sendQuery({query});
    } else {
      statusbarElement.innerHTML = 'Results cleared.';
    }
    return false;
  }, // searchHandler
}; // viewController

onload = () => {
  const queryElement = document.getElementById('query');
  queryElement.onkeyup = (e) => {
    if (e.key == 'Enter') {
      viewController.searchHandler();
    }
  };
  queryElement.focus();
};

onkeydown = (event) => {
  const queryElement = document.getElementById('query');
  queryElement.focus();
  if (event.key == 'Escape') {
    queryElement.value = "";
  }
};

window.api.receive("status", (data) => { ucdController.receiveStatus(data); });
window.api.receive("searchResult", (data) => { ucdController.receiveSearchResult(data); });
window.api.receive("cache", (data) => { window.api.send('cache', data); });

window.api.send('requestStatus', {});
window.api.send('cache', {force: false});
