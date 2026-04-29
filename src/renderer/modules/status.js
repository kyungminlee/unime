import { elements } from './dom.js';

const state = {
  ready: true,
};

export function isReady() {
  return state.ready;
}

export function setMessage(message) {
  elements().statusbar.textContent = message;
}

export function setReady(ready, message) {
  const { query, statusbar } = elements();
  state.ready = ready;
  if (ready) {
    query.removeAttribute('disabled');
  } else {
    query.setAttribute('disabled', 'disabled');
  }
  if (typeof message === 'string') {
    statusbar.textContent = message;
  }
}

export function setBusy(message = 'Searching...') {
  const { query, result } = elements();
  query.setAttribute('disabled', 'disabled');
  state.ready = false;
  const spinner = document.createElement('div');
  spinner.classList.add('spinner');
  spinner.id = 'spinner';
  result.replaceChildren(spinner);
  if (message) { setMessage(message); }
}

export function clearBusy() {
  document.getElementById('spinner')?.remove();
}
