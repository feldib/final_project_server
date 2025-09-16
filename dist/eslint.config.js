import js from "@eslint/js";
import tseslint from "typescript-eslint";
export default tseslint.config({
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
}, js.configs.recommended, ...tseslint.configs.recommended, {
    files: ["**/*.ts"],
    languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
            project: "./tsconfig.json",
            tsconfigRootDir: import.meta.dirname,
        },
    },
    rules: {
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
        "no-console": "off",
        "prefer-const": "error",
        "no-var": "error",
        "object-shorthand": "error",
        "prefer-template": "error",
        "no-process-exit": "warn",
        "no-sync": "warn",
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
}, {
    files: ["types/**/*.ts"],
    rules: {
        "@typescript-eslint/no-namespace": "off",
    },
}, {
    files: ["bin/**/*.ts"],
    rules: {
        "no-process-exit": "off",
    },
});
//# sourceMappingURL=eslint.config.js.map