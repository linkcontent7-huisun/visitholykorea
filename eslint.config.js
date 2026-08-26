import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // supabase/functions 는 Deno 런타임 코드라 이 설정(브라우저/Node)의 검사 대상이 아니다.
  {
    ignores: [
      'dist',
      'dev-dist',
      'android',
      'ios',
      'node_modules',
      'coverage',
      'supabase/functions',
      // 저장소에 섞여 들어온 구버전 앱 사본·학습자료. 우리 코드가 아니다 (ADR 0005).
      'supabase/visitholykorea_버전보관',
      'visitholykorea-학습자료',
      // 일회성 진단 스크립트. 한 번 돌려 보고 버린다.
      'scripts/tmp-*.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // TS 컴파일러가 이미 잡아주는 검사라 중복이고, 타입 전용 식별자에 오탐이 난다.
      'no-undef': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  // scripts/ 는 브라우저가 아니라 Node 에서 도는 일회성 유틸이다.
  {
    files: ['scripts/**/*.{js,mjs,ts}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
  prettier,
);
