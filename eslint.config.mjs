import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const withoutLegacyReactRules = (configs) =>
  configs.map((config) => {
    if (!config.rules) return config;

    return {
      ...config,
      rules: Object.fromEntries(
        Object.entries(config.rules).filter(([rule]) => !rule.startsWith("react/"))
      ),
    };
  });

const eslintConfig = defineConfig([
  ...withoutLegacyReactRules(nextVitals),
  ...nextTs,
]);

export default eslintConfig;
