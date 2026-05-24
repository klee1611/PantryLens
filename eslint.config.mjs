import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  // Next.js core-web-vitals flat config (single object, not an array)
  nextPlugin.configs['core-web-vitals'],

  // TypeScript support for .ts / .tsx files
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: { parser: tsParser },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Ignore build output and test fixtures
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**', '__tests__/e2e/fixtures/**'],
  },
];
