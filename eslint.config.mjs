import antfu from '@antfu/eslint-config'

export default antfu(
  {
    unocss: false,
    ignores: [
      'dist/**',
      '.vscode/**',
      '.idea/**',
      'node_modules/**',
      'generated/**',
      'eslint.config.mjs',
      '**/*.md',
    ],
  },
  {
    languageOptions: {
      globals: {
        NodeJS: 'readonly',
      },
    },
    rules: {
      // 需要尾随逗号
      'comma-dangle': ['error', 'only-multiline'],
      // 允许 console
      'no-console': 'off',
      // 需要分号
      '@stylistic/semi': ['error', 'never'],
      // 块内的空行
      'padded-blocks': ['error', 'never'],
      // 顶级函数应使用 function 关键字声明
      'antfu/top-level-function': 'off',
      // 全局的 process 可以用
      'node/prefer-global/process': 'off',
      // 禁止未使用的捕获组
      'regexp/no-unused-capturing-group': 'off',
      // 允许接口和类型别名中的成员之间使用分号分隔符
      '@stylistic/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'semi',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
        multilineDetection: 'brackets',
      }],
      'object-curly-newline': 'off',
      // if 语句后需要换行
      'antfu/if-newline': 'off',
      // 关闭变量在使用前定义检查
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      // 允许 any 类型（后端常用）
      '@typescript-eslint/no-explicit-any': 'off',
      // 关闭导入排序规则，避免和编辑器自动排序冲突
      'perfectionist/sort-imports': 'off',
    },
  },
)
