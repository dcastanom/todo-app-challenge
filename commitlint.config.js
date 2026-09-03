/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'],
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
