import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";
import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for NestJS (Node.js) applications.
 *
 * Type-checked linting rules (e.g. no-floating-promises) require the
 * consuming app's own tsconfig, so this is a factory rather than a flat
 * config array — call it with `import.meta.dirname` from the app's
 * eslint.config.mjs.
 *
 * @param {string} tsconfigRootDir
 * @returns {import("eslint").Linter.Config[]}
 */
export function createConfig(tsconfigRootDir) {
  return [
    ...baseConfig,
    js.configs.recommended,
    eslintConfigPrettier,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.jest,
        },
        sourceType: "commonjs",
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
    },
    {
      rules: {
        "@typescript-eslint/no-floating-promises": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
      },
    },
  ];
}
