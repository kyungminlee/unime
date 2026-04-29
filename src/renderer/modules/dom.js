export const $ = (id) => document.getElementById(id);

export function elements() {
  return {
    query: $('query'),
    statusbar: $('statusbar'),
    result: $('result'),
    pinned: $('history-pinned'),
    unpinned: $('history-unpinned'),
  };
}
