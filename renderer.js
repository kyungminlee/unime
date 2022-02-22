const ucdController = {
  ready: false,
  sendQuery: function(query) {
    window.api.send('query', query)
  },
  sendToClipboard: function(item) {
    window.api.send('clipboard', item)
  },
  receiveStatus: function(data) {
    const queryElement = document.getElementById('query')
    const statusbarElement = document.getElementById('statusbar')
    const {ready, message} = data
    // viewController.clear()
    if (ready) {
      ucdController.ready = true
      queryElement.removeAttribute('disabled')
      statusbarElement.innerHTML = message
    } else {
      ucdController.ready = false
      viewController.setBusy()
      queryElement.setAttribute('disabled', 'disabled')
      statusbarElement.innerHTML = message
    }
  },
  receiveSearchResult: function(data) {
    const queryElement = document.getElementById('query')
    const statusbarElement = document.getElementById('statusbar')
    const {result} = data;
    ucdController.ready = true
    queryElement.removeAttribute('disabled')
    viewController.update(result)
  },
}


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
      ucdController.sendToClipboard(ch)
      // const statusbarElement = document.getElementById('statusbar')
      // statusbarElement.innerHTML = `Character ${ch} copied to clipboard.`
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

    query = queryElement.value.trim()
    if (query.length >= 2) {
      statusbarElement.innerHTML = 'Searching...'    
      viewController.setBusy()
      ucdController.sendQuery({query})
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

window.api.send("requestStatus", {});



window.api.receive("status", (data) => {
  const {ready, message} = data;
  console.log(`Got message ${message}`);
  ucdController.receiveStatus(data);
})

window.api.receive("searchResult", (data) => {
  console.log(`Got searchResult ${data}`);
  ucdController.receiveSearchResult(data);
})
