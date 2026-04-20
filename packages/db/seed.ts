import "./load-env-bootstrap";

import { database } from "./database";

/**
 * Foundational singleton rows. Run: `cd packages/db && bunx prisma db seed`
 */
async function main(): Promise<void> {
  await database.platformSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  await database.orderSequence.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", nextVal: 0 },
    update: {},
  });

  console.info(
    "[@joe-perks/db seed] PlatformSettings and OrderSequence singletons are ready."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
