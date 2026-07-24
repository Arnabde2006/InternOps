module.exports = [
  {
    ignores: ['coverage/**', 'node_modules/**'],
  },
  {
    // 1. Base configuration for ALL backend JS files
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      // ... keep any existing rules here
    },
  },
  {
    // 2. Override configuration specifically for k6 load test files
    files: ['tests/load/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      ecmaVersion: 'latest',
      globals: {
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
      },
    },
  },
];