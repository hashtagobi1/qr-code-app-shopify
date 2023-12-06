/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  root: true,
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "prettier",
  ],
  globals: {
    shopify: "readonly"
  },
  rules: {
    "no-unused-vars": "off",
    '@typescript-eslint/no-unused-vars': ['error', { 'varsIgnorePattern': '^', "argsIgnorePattern": "^" }],
  }
};