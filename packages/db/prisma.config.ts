import { defineConfig } from "prisma/config";

import { loadDbEnv } from "./load-env";

loadDbEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun run ./seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
