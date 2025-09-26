import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";

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
    plugins: {
      import: importPlugin,
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Import organization rules
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-namespace": [
        "warn",
        {
          allowDeclarations: true,
          allowDefinitionFiles: true,
        },
      ],

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
  },
  // Allow Express module augmentation in types directory
  {
    files: ["types/**/*.ts"],
    rules: {
      "@typescript-eslint/no-namespace": "off",
    },
  },
  // Allow process.exit in server startup files
  {
    files: ["bin/**/*.ts"],
    rules: {
      "no-process-exit": "off",
    },
  }
);
