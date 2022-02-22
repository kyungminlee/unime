const path = require('path')
const {clipboard} = require('electron')
const cp = require('child_process')

let ucdWorker = cp.fork(path.join(__dirname, 'lib', 'ucd_worker.js'), {silent: 'true'})

const ucdController = {
  ready: false,

  send: function(query) {
    ucdWorker.send({type: 'search', query: query.trim()})
  },

  receive: function(msg) {
    const queryElement = document.getElementById('query')
    const statusbarElement = document.getElementById('statusbar')
    const {type} = msg
    switch(type) {
      case 'status': {
        const {ready} = msg
        viewController.clear()
        if (ready) {
          ucdController.ready = true
          const {message} = msg
          queryElement.removeAttribute('disabled')
          statusbarElement.innerHTML = message
        } else {
          ucdController.ready = false
          viewController.setBusy()
          queryElement.setAttribute('disabled', 'disabled')
          const {message} = msg
          statusbarElement.innerHTML = message
        }
      }
      break;
      case 'result': {
        ucdController.ready = true
        queryElement.removeAttribute('disabled')
        const {result} = msg
        viewController.update(result)
      }
      break;
      default:
    }
  },
}

ucdWorker.stdout && ucdWorker.stdout.on('data', (buf) => {
  console.log(String(buf))
})
ucdWorker.stderr && ucdWorker.stderr.on('data', (buf) => {
  console.log(String(buf))
})
ucdWorker.on('message', ucdController.receive)

const viewController = {
  clear: function () {
    const resultElement = document.getElementById("result")
    while(resultElement.firstChild) {
      resultElement.removeChild(resultElement.firstChild)
    }
  },

  setBusy: function () {
    const resultElement = document.getElementById("result")
    const queryElement = document.getElementById('query')
    queryElement.setAttribute('disabled', 'disabled')
    viewController.clear()
    let spinner = document.createElement('div')
    spinner.setAttribute('class', 'spinner')
    resultElement.appendChild(spinner)
  }, //setBusy

  addRow: function(tab, ch, na) {
    let row = tab.insertRow(-1)
    let cell1 = row.insertCell(0)
    let cell2 = row.insertCell(1)
    row.setAttribute('class', 'result-row')
    cell1.setAttribute('class', 'character-cell')
    cell2.setAttribute('class', 'name-cell')
    cell1.innerHTML = ch
    cell2.innerHTML = na
    row.onclick = () => { 
      clipboard.writeText(ch)
      const statusbarElement = document.getElementById('statusbar')
      statusbarElement.innerHTML = `Character ${ch} copied to clipboard.`
    }
  }, // addRow

  update: function(hits) {
    const resultElement = document.getElementById("result")
    const statusbarElement = document.getElementById('statusbar')
    let tab = document.createElement('table', {id: 'result-table'})
    tab.setAttribute('id', 'result-table')

    let count = 0
    for(item of hits) {
      try {
        const ch = String.fromCodePoint(item.cp)
        const na = item.na
        viewController.addRow(tab, ch, na)
        ++count
      } catch(err) {
      }
    }
    viewController.clear()
    resultElement.appendChild(tab)
    statusbarElement.innerHTML = `Found ${count} results.`
  }, // update
  
  searchHandler: function() {
    if (!ucdController.ready) { return; }
    const queryElement = document.getElementById('query')
    const statusbarElement = document.getElementById('statusbar')
    const resultElement = document.getElementById("result")

    query = queryElement.value
    if (query.length >= 2) {
      statusbarElement.innerHTML = 'Searching...'    
      viewController.setBusy()
      ucdController.send(query)
    } else {
      statusbarElement.innerHTML = 'Results cleared.'
    }
    return false
  }, // searchHandler
} // viewController

onload = () => {
  const queryElement = document.getElementById("query")
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
