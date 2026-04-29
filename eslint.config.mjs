import globals from 'globals';

const COMMON_RULES = {
  'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  'no-var': 'error',
  'prefer-const': 'error',
  'eqeqeq': ['error', 'smart'],
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  'no-implicit-coercion': 'warn',
  'object-shorthand': 'warn',
  'prefer-template': 'warn',
};

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'release/**',
      'build/**',
      'src/data/**',
      'package-lock.json',
    ],
  },
  // Main + preload (CommonJS, Node + Electron)
  {
    files: ['src/main/**/*.js', 'src/preload/**/*.js', 'src/shared/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: COMMON_RULES,
  },
  // Renderer (ES modules, browser)
  {
    files: ['src/renderer/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: COMMON_RULES,
  },
  // Tests (CommonJS, Node)
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: { ...COMMON_RULES, 'no-console': 'off' },
  },
];
