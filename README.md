# unime

*unime* is a unicode input assistant.

## Installation

Download the latest version from [Releases](https://github.com/kyungminlee/unime/releases).

## How to use

There are multiple ways to search for a unicode character:
- Type in the latex command of the character starting with a backslash `\`, such as `\alpha`, `\otimes`, or even subscripts and superscripts `\^2`, `\_x`.
- Type in the Unicode code of the character, starting with `\u` or `\U`, followed by the hex digits of the code. (e.g. `\u3b1`)
- Type in the HTML entity of the character, starting with `&#` and ending with `;`. (e.g. `&alpha;`, `&#945;`, `&#x3b1;`)
- Type in the name of the character. It is not case sensitive, and it does not have to be exact.

You can click an entry to copy the character to your clipboard.

## Development

```sh
npm install
npm start          # launch the Electron app
npm run lint       # ESLint
npm test           # node:test suite
npm run app:dist   # build distributables via electron-builder
```

### Project layout

```
src/
  main/        # Electron main process (window, menu, IPC, UCD worker)
    ucd/       # Pure Unicode-search logic (database, cache, search, config)
  preload/     # Sandboxed preload bridge
  renderer/    # Renderer UI (ES modules)
    modules/   # Renderer feature modules (api, history, results, search, status)
  shared/      # Constants shared by main/preload/renderer
  data/        # UCD JSON, alias config, alias cache
tests/         # node:test suites for the pure modules
```

The renderer ships as ES modules (`<script type="module">`). Channel names
are defined in `src/shared/channels.js`; the sandboxed preload duplicates the
list because sandboxed preloads cannot `require` local files.
