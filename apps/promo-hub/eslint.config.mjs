import { createConfig } from "@ridgeline/eslint-config/nest";

export default [
  {
    ignores: ["eslint.config.mjs", "dist/**", "src/database/generated/**"],
  },
  ...createConfig(import.meta.dirname),
  {
    files: ["src/**/*.controller.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@nestjs/swagger",
              message:
                "Use ApiControllerDocs and ApiEndpoint from @ridgeline/nest-common.",
            },
          ],
        },
      ],
    },
  },
];
