'use strict';

const fs = require('node:fs');

/**
 * @typedef {{
 *   maxHits: number,
 *   aliases: Record<string, string>,
 * }} UnimeConfig
 */

const DEFAULT_CONFIG = Object.freeze({
  maxHits: 2000,
  aliases: Object.freeze({}),
});

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
    return { maxHits: DEFAULT_CONFIG.maxHits, aliases: {} };
  }
  return {
    maxHits: typeof parsed.maxHits === 'number' ? parsed.maxHits : DEFAULT_CONFIG.maxHits,
    aliases: parsed.aliases && typeof parsed.aliases === 'object' ? parsed.aliases : {},
  };
}

module.exports = { DEFAULT_CONFIG, loadConfig };
