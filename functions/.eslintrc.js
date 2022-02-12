module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'google',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
  ],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // eslint-disable-next-line quote-props
    quotes: ['error', 'single'],
    'import/no-unresolved': 0,
    'object-curly-spacing': ['error', 'always'],

    // eslint-disable-next-line quote-props
    indent: ['error', 2],
    'max-len': 0,
    'require-jsdoc': 0,
  },
};
