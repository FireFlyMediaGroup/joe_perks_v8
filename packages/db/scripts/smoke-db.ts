import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";

neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing after load-env.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});

async function main(): Promise<void> {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: "singleton" },
  });
  const seq = await prisma.orderSequence.findUnique({
    where: { id: "singleton" },
  });
  const migrations = await prisma.$queryRaw<{ migration_name: string }[]>`
    SELECT migration_name FROM "_prisma_migrations"
    ORDER BY finished_at DESC NULLS LAST
    LIMIT 5
  `;

  const ok = Boolean(settings && seq !== null);
  console.log(
    JSON.stringify(
      {
        ok,
        platformSettingsSingleton: Boolean(settings),
        orderSequenceNextVal: seq?.nextVal ?? null,
        recentMigrations: migrations.map((m) => m.migration_name),
      },
      null,
      2
    )
  );

  if (!ok) {
    console.error(
      "Smoke test failed: missing PlatformSettings or OrderSequence. Run: bunx prisma db seed"
    );
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
