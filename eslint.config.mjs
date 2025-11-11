import { dirname } from "path";
import { fileURLToPath } from "url";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  // Global ignores FIRST
  {
    ignores: [
      ".next/**",
      "**/.next/**",
      "out/**",
      "build/**",
      "dist/**",
      "node_modules/**",
      "**/node_modules/**",
      "next-env.d.ts",
      "gene-tree_frommssqlda/**",
      "src/lib/types/supabase.ts", // Generated Supabase types
    ],
  },
  // TypeScript ESLint base config
  ...tseslint.configs.recommended,
  // Next.js plugin
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // Relax for stabilization
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Allow CommonJS in scripts and tests
  {
    files: ["scripts/**/*.js", "*.config.ts", "*.config.js", "tests/**/*.ts", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
