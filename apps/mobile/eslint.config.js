import js from '@eslint/js';
import react from 'eslint-plugin-react';

const nodeGlobals = {
  module: 'readonly',
  require: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  process: 'readonly',
};

export default [
  {
    ignores: [
      'eslint.config.js',
      'node_modules',
      'dist',
      'build',
      '.expo',
      'android',
      'ios',
    ],
  },
  js.configs.recommended,
  {
    plugins: {
      react,
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        __DEV__: 'readonly',
        URL: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    files: ['metro.config.js', '*.config.js'],
    languageOptions: {
      sourceType: 'script',
      globals: nodeGlobals,
    },
  },
];
