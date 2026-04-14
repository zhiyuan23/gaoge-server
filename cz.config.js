/** @type {import('cz-git').CommitizenGitOptions} */
export default {
  // 快捷提交
  alias: {
    feat: 'feat: 🎸新增功能',
    fix: 'fix: 🐛修复问题',
    ref: 'refactor: 💡代码重构',
    style: 'style: 💄样式调整',
    docs: 'docs: ✏️文档更新',
  },

  // 交互提示
  messages: {
    type: '选择提交类型:',
    scope: '选择影响范围（可选）:',
    customScope: '请输入自定义范围:',
    subject: '填写本次提交的中文描述:',
    confirmCommit: '确认提交？',
  },

  // 提交类型
  types: [
    { value: 'feat', name: 'feat:     新增功能' },
    { value: 'fix', name: 'fix:      修复问题' },
    { value: 'refactor', name: 'refactor: 代码重构' },
    { value: 'chore', name: 'chore:    其他修改' },
    { value: 'style', name: 'style:    样式调整' },
    { value: 'docs', name: 'docs:     文档更新' },
    { value: 'perf', name: 'perf:     性能提升' },
    { value: 'ci', name: 'ci:       持续集成' },
  ],

  useEmoji: false,
  useAI: false,

  skipQuestions: ['body', 'breaking', 'footer'],

  upperCaseSubject: false,

  minSubjectLength: 4,

  allowBreakingChanges: [],

  defaultSubject: '',
  defaultScope: '',
}
