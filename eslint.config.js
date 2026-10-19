import js from "@eslint/js";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import unused from "eslint-plugin-unused-imports";
import globals from "globals";
export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "src/data/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.es2022 } },
    plugins: { "react-hooks": hooks, "unused-imports": unused },
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "react-hooks/rules-of-hooks": "error",
      "no-constant-condition": "error",
      "no-debugger": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.{js,ts}"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  },
);
