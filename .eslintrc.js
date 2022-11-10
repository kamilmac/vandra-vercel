module.exports = {
  extends: [
    "airbnb",
    "eslint:recommended",
    "plugin:react-hooks/recommended",
    "../.eslintrc.js",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: [
      "./tsconfig.json",
    ],
    sourceType: "module",
  },
  root: false,
  plugins: [
    "react-hooks",
  ],
  rules: {
    "camelcase": [
      "error",
      {
        "properties": "never",
      },
    ],
    "react/jsx-filename-extension": "off",
    "import/extensions": "off",
    "import/prefer-default-export": "off",
    "no-prototype-builtins": "off",
    "react/button-has-type": "off",
    "react/function-component-definition": "off",
    "react/require-default-props": "off",
    "react/no-array-index-key": "off",
    "jsx-a11y/no-static-element-interactions": "off",
    "jsx-a11y/click-events-have-key-events": "off",
    "prefer-destructuring": "off",
    "no-bitwise": "off",
    "import/no-extraneous-dependencies": ["error", {"devDependencies": ["./webpack.config.ts"]}],
    // Temporary rules for v2 dev
    "no-undef": "off",
    "no-unused-vars": "off",
  },
  settings: {
    "import/resolver": {
      "typescript": {
        "alwaysTryTypes": true,
        "project": [
          "./tsconfig.json",
        ],
      },
    },
  },
  ignorePatterns: [
    "build/",
    "src/old_routes/",
    "src/components/three/",
    ".eslintrc.js",
  ],
};
