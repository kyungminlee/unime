import { elements } from './dom.js';

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

function buildRow(table, ch, na) {
  const row = table.insertRow(-1);
  row.classList.add('result-row');
  const charCell = row.insertCell(0);
  const nameCell = row.insertCell(1);
  charCell.classList.add('character-cell');
  nameCell.classList.add('name-cell');
  charCell.textContent = ch;
  nameCell.textContent = na;
  row.addEventListener('click', () => emitSelect(ch, na));
}

export function render(hits) {
  const { result, statusbar } = elements();
  const table = document.createElement('table');
  table.id = 'result-table';
  let count = 0;
  for (const item of hits) {
    try {
      const ch = String.fromCodePoint(item.cp);
      buildRow(table, ch, item.na ?? '');
      count += 1;
    } catch {
      // Invalid code point — skip.
    }
  }
  result.replaceChildren(table);
  statusbar.textContent = `Found ${count} results.`;
}
