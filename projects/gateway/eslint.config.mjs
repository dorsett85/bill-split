import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintConfigPrettier,
  // Keep this object separate
  {
    ignores: ['dist'],
  },
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
      'react/react-in-jsx-scope': 'off',
    },
  },
];
