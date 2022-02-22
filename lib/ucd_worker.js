const path = require('path');
const UCD = require(path.join(__dirname, 'ucd.js'));
const fs = require('fs');
const { ipcMain, clipboard } = require('electron');

let status = {ready: false, message: 'Initializing...'};

const cachedUCD = new UCD.CachedUnicodeDatabase(
  path.join(__dirname, '..', 'ucd.nounihan.simplified.json'),
  path.join(__dirname, '..', 'config.json'),
  path.join(__dirname, '..', 'cache.json')
)

// process.on('message', (msg) => {
//   try {
//     const {query} = msg
//     const result = cachedUCD.search(query)
//     process.send({type: 'result', result: result})
//   } catch (err) {
//     process.send({type: 'status', ready: true, message: 'Search failed.'})
//   }
// })

ipcMain.on("query", (event, args) => {
  // console.log(`replying to ${args}`);
  try {
    const { query } = args;
    // console.log("")
    const result = cachedUCD.search(query);
    // console.log(`Got ${query}`)
    event.reply("searchResult", {result});
  } catch (err) {
    status = { ready: true, message: "Search failed."};
    event.reply("status", status);
  }
});

ipcMain.on("requestStatus", (event, _args) => {
  event.reply("status", status);
})

ipcMain.on("clipboard", (event, args) => {
  clipboard.writeText(args);
  status = {ready: true, message: `Character ${args} copied to clipboard.`};
  event.reply("status", status);
})

status = {ready: false, message: 'Caching...'};

cachedUCD.cacheAliases();
cachedUCD.dump(path.join(__dirname, '..', 'cache.json'));

status = {ready: true, message: 'Ready.'};
