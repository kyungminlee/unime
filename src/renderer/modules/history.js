import { elements } from './dom.js';

const MAX_UNPINNED = 256;
const STORAGE_PINNED = 'history-pinned';
const STORAGE_UNPINNED = 'history-unpinned';

const onSelectListeners = new Set();

export function onSelect(listener) {
  onSelectListeners.add(listener);
  return () => onSelectListeners.delete(listener);
}

function emitSelect(ch, na) {
  for (const listener of onSelectListeners) {
    listener({ ch, na });
  }
}

function isPinned(ch) {
  const { pinned } = elements();
  return Array.from(pinned.children).some((child) => child.dataset.ch === ch);
}

function findExistingItem(ch) {
  const { pinned, unpinned } = elements();
  for (const list of [pinned, unpinned]) {
    for (const item of list.children) {
      if (item.dataset.ch === ch) {
        item.remove();
        return item;
      }
    }
  }
  return null;
}

function createItem(ch, na) {
  const item = document.createElement('div');
  item.textContent = ch;
  item.classList.add('history-item');
  item.title = `${na} (U+${ch.codePointAt(0).toString(16).toUpperCase()})\nRight click to pin/unpin.`;
  item.dataset.ch = ch;
  item.dataset.na = na;

  item.addEventListener('click', () => emitSelect(ch, na));

  item.addEventListener('contextmenu', () => {
    const { pinned, unpinned } = elements();
    if (isPinned(item.dataset.ch)) {
      pinned.removeChild(item);
      unpinned.prepend(item);
      trimUnpinned();
    } else {
      unpinned.removeChild(item);
      pinned.append(item);
    }
    persist();
  });

  return item;
}

function getOrCreateItem(ch, na) {
  return findExistingItem(ch) ?? createItem(ch, na);
}

function appendPinned(ch, na) {
  elements().pinned.append(getOrCreateItem(ch, na));
}

function trimUnpinned() {
  const { unpinned } = elements();
  while (unpinned.children.length > MAX_UNPINNED) {
    unpinned.removeChild(unpinned.lastChild);
  }
}

function prependUnpinned(ch, na) {
  const { unpinned } = elements();
  const item = getOrCreateItem(ch, na);
  unpinned.prepend(item);
  trimUnpinned();
}

function persist() {
  const serialize = (element) => Array.from(element.children).map((item) => ({
    ch: item.dataset.ch,
    na: item.dataset.na,
  }));
  const { pinned, unpinned } = elements();
  localStorage.setItem(STORAGE_PINNED, JSON.stringify(serialize(pinned)));
  localStorage.setItem(STORAGE_UNPINNED, JSON.stringify(serialize(unpinned)));
}

export function add(ch, na) {
  if (isPinned(ch)) { return; }
  prependUnpinned(ch, na);
  persist();
}

export function clearPinned() {
  elements().pinned.replaceChildren();
  persist();
}

export function clearUnpinned() {
  elements().unpinned.replaceChildren();
  persist();
}

export function clear(types) {
  for (const type of types) {
    if (type === 'pinned') { clearPinned(); }
    else if (type === 'unpinned') { clearUnpinned(); }
  }
}

export function load() {
  const pinnedJson = localStorage.getItem(STORAGE_PINNED);
  if (pinnedJson) {
    for (const { ch, na } of JSON.parse(pinnedJson)) {
      appendPinned(ch, na);
    }
  }
  const unpinnedJson = localStorage.getItem(STORAGE_UNPINNED);
  if (unpinnedJson) {
    for (const { ch, na } of JSON.parse(unpinnedJson)) {
      prependUnpinned(ch, na);
    }
  }
}
