import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "public/**",
      "**/*.js",
      "**/*.bak",
      ".env",
      ".env.*",
      "coverage/**",
      "logs/**",
      "*.log",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-namespace": "warn",

      // General JavaScript/Node.js rules
      "no-console": "off", // Allow console in Node.js server
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error",

      // Express/Node.js specific
      "no-process-exit": "warn", // Warn instead of error for process.exit
      "no-sync": "warn",

      // Code style
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "comma-dangle": [
        "error",
        {
          arrays: "always-multiline",
          objects: "always-multiline",
          imports: "always-multiline",
          exports: "always-multiline",
          functions: "never",
        },
      ],
      indent: ["error", 2],
      "eol-last": "error",
      "no-trailing-spaces": "error",
    },
  }
);
