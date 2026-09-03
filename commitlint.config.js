/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Scope strongly encouraged (CLAUDE.md convention) but not blocking
    // for repo-wide changes like `ci:` or `chore:`.
    'scope-empty': [1, 'never'],
    'body-max-line-length': [0, 'always'],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'test',
        'docs',
        'refactor',
        'perf',
        'chore',
        'ci',
        'build',
        'style',
        'revert',
      ],
    ],
  },
};
