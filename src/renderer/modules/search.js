import { send, SEND } from './api.js';
import * as status from './status.js';

const MIN_QUERY_LENGTH = 2;

export function submit(query) {
  if (!status.isReady()) { return false; }
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) {
    status.setMessage('Results cleared.');
    return false;
  }
  status.setBusy('Searching...');
  send(SEND.SEARCH, { query: trimmed });
  return true;
}
