const path = require('path');
const { clipboard } = require('electron');
const cp = require('child_process');

const ucdWorker = cp.fork(
    path.join(__dirname, 'lib', 'ucd_worker.js'),
    {silent: 'true'}
  );

const ucdController = {
  ready: false,
  send: (query) => {
    ucdWorker.send({type: 'search', query: query.trim()});
  },
  receive: (msg) => {
    const queryElement = document.getElementById('query');
    const statusbarElement = document.getElementById('statusbar');
    const { type } = msg;
    switch(type) {
      case 'status': {
        // const {ready} = msg;
        viewController.clear();
        if (msg.ready) {
          ucdController.ready = true;
          // const {message} = msg;
          queryElement.removeAttribute('disabled');
          statusbarElement.innerHTML = msg.message;
        } else {
          ucdController.ready = false;
          viewController.setBusy();
          queryElement.setAttribute('disabled', 'disabled');
          // const {message} = msg;
          statusbarElement.innerHTML = msg.message;
        }
      }
      break;
      case 'result': {
        ucdController.ready = true;
        queryElement.removeAttribute('disabled');
        const {result} = msg;
        viewController.update(result);
      }
      break;
      default:
    }
  },
}

ucdWorker.stdout && ucdWorker.stdout.on('data', (buf) => {
  console.log(String(buf));
});
ucdWorker.stderr && ucdWorker.stderr.on('data', (buf) => {
  console.log(String(buf));
});
ucdWorker.on('message', ucdController.receive);

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
    resultElement.appendChild(spinner);
  }, //setBusy

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
      clipboard.writeText(ch);
      const statusbarElement = document.getElementById('statusbar');
      statusbarElement.innerHTML = `Character ${ch} copied to clipboard.`;
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
      }
    }
    viewController.clear();
    resultElement.appendChild(tab);
    statusbarElement.innerHTML = `Found ${count} results.`;
  }, // update
  
  searchHandler: () => {
    if (!ucdController.ready) { return; }
    const queryElement = document.getElementById('query');
    const statusbarElement = document.getElementById('statusbar');
    const resultElement = document.getElementById("result");
    const query = queryElement.value;
    if (query.length >= 2) {
      statusbarElement.innerHTML = 'Searching...';
      viewController.setBusy();
      ucdController.send(query);
    } else {
      statusbarElement.innerHTML = 'Results cleared.';
    }
    return false;
  }, // searchHandler
} // viewController

onload = () => {
  const queryElement = document.getElementById("query");
  queryElement.onkeyup = (e) => { if (e.key == "Enter") { viewController.searchHandler() } }
  queryElement.focus();
}

onkeydown = (event) => {
  const queryElement = document.getElementById("query");
  queryElement.focus();
  if (event.key == "Escape") {
    queryElement.value = "";
  }
};
