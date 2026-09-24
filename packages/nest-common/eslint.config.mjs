import { createConfig } from "@ridgeline/eslint-config/nest";

export default [
  {
    ignores: ["eslint.config.mjs"],
  },
  ...createConfig(import.meta.dirname),
];
