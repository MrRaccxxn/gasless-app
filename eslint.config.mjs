import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
        },
      ],
      // Make no-explicit-any a warning instead of error so --fix can continue
      "@typescript-eslint/no-explicit-any": "warn",
      // Auto-fixable rules
      "no-trailing-spaces": "error",
      "no-multiple-empty-lines": ["error", { "max": 1 }],
      "eol-last": "error",
      "comma-dangle": ["error", "always-multiline"],
      "quotes": ["error", "double", { "allowTemplateLiterals": true }],
      "semi": ["error", "always"],
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      "indent": ["error", 2, { "SwitchCase": 1 }],
    },
  },
];

export default eslintConfig;
