import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: globals.browser },
  },
  ...tseslint.config({
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      'prototype/approval_client/app/dist/**/*',
      'prototype/approval_server/app/dist/**/*',
      'node_modules/**/*',
      'prototype/approval_client/node_modules/**/*',
      'prototype/approval_server/node_modules/**/*',
      './logger_config.js',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-unused-vars': 'off', // typescript 사용 시 버그가 있어 off로 하고 아래 extension 사용
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/extensions': ['off'],
      'import/no-unresolved': 'off',
      'import/prefer-default-export': 'off',
      'no-shadow': 'off', // typescript 사용 시 버그가 있어 off로 하고 아래 extension 사용
      '@typescript-eslint/no-shadow': ['error'],
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      'lines-between-class-members': 'off',
      'no-underscore-dangle': ['off'],
      'max-classes-per-file': ['off'],
      'class-methods-use-this': ['off'],
      'no-useless-constructor': 'off', // 클래스 생성자에서 클래스 속성 파라미터로 초기화 필요 시 사용
      '@typescript-eslint/no-useless-constructor': 'off', // 클래스 생성자에서 클래스 속성 파라미터로 초기화 필요 시 사용
      // 다른 규칙들...
      '@typescript-eslint/no-non-null-assertion': 'off',
      // 또는
      '@typescript-eslint/strict-property-initialization': 'off',
    },
  }),
]);
