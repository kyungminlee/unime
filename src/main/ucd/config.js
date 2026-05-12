'use strict';

const fs = require('node:fs');

/**
 * @typedef {{
 *   maxHits: number,
 *   aliases: Record<string, string>,
 *   shortcut: string | null,
 * }} UnimeConfig
 */

const DEFAULT_CONFIG = Object.freeze({
  maxHits: 2000,
  aliases: Object.freeze({}),
  shortcut: 'CommandOrControl+Alt+U',
});

function fallback() {
  return {
    maxHits: DEFAULT_CONFIG.maxHits,
    aliases: {},
    shortcut: DEFAULT_CONFIG.shortcut,
  };
}

/**
 * @param {string} filename
 * @returns {UnimeConfig}
 */
function loadConfig(filename) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch (err) {
    console.error(`Failed to load config from ${filename}; using defaults.`, err);
    return fallback();
  }
  let shortcut = DEFAULT_CONFIG.shortcut;
  if (parsed.shortcut === null || typeof parsed.shortcut === 'string') {
    shortcut = parsed.shortcut;
  }
  return {
    maxHits: typeof parsed.maxHits === 'number' ? parsed.maxHits : DEFAULT_CONFIG.maxHits,
    aliases: parsed.aliases && typeof parsed.aliases === 'object' ? parsed.aliases : {},
    shortcut,
  };
}

module.exports = { DEFAULT_CONFIG, loadConfig };
