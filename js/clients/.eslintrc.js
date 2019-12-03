module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    BigInt: 'readable',
    BigInt64Array: 'readable',
    BigUint64Array: 'readable',
    queueMicrotask: 'readable',
    SharedArrayBuffer: 'readable',
    TextEncoder: 'readable',
    TextDecoder: 'readable',
    mocha: true
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    "comma-dangle": 'off',
    "no-bitwise": 'off',
    'no-use-before-define': ['error', { functions: false }],
    curly: ["error", "all"],
    'no-underscore-dangle': ['error', { 'allowAfterThis': true }],
    'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }]
  },
  overrides: [
    {
      files: ["**/*-test.js"],
      env: { jest: true }
    }
  ]
};
