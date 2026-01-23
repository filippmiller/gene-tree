import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

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
      "playwright-report/**",
      "test-results/**",
    ],
  },
  // TypeScript ESLint base config
  ...tseslint.configs.recommended,
  // Next.js plugin
  {
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // Relax for stabilization
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-wrapper-object-types": "off"
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
