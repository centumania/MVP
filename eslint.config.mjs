import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone CommonJS dev tooling — not part of the app bundle.
    "scripts/**",
    // Plain ES5 script injected into third-party HTML study-map iframes —
    // not compiled by Next.js/TypeScript, not part of the app bundle.
    "public/**/*.js",
  ]),
]);

export default eslintConfig;
