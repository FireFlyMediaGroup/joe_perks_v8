/**
 * Story 04 smoke test: `EmailLog` dedupe + optional Resend send.
 *
 * Run from repo root: `pnpm --filter @joe-perks/email smoke`
 * Requires `DATABASE_URL` (e.g. `packages/db/.env`). For full send path,
 * also `RESEND_TOKEN` and `RESEND_FROM` in root `.env`.
 */

import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const monorepoRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
config({ path: resolve(monorepoRoot, ".env") });
config({ path: resolve(monorepoRoot, "packages/db/.env") });

async function main(): Promise<void> {
  const { database } = await import("@joe-perks/db/database");
  const { Prisma } = await import("@joe-perks/db/generated/client");
  const { sendEmail } = await import("../send-email");
  const { createElement } = await import("react");
  const { Text } = await import("@react-email/components");

  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      "FAIL: DATABASE_URL is not set (e.g. packages/db/.env or root .env)."
    );
    process.exit(1);
  }

  const hasResend =
    Boolean(process.env.RESEND_TOKEN?.trim()) &&
    Boolean(process.env.RESEND_FROM?.trim());

  const entityType = "smoke_test";
  const template = "smoke";
  const entityId = `smoke-${randomUUID()}`;

  if (hasResend) {
    const from = process.env.RESEND_FROM?.trim() as string;

    await sendEmail({
      entityId,
      entityType,
      react: createElement(
        Text,
        null,
        "Joe Perks email pipeline smoke (first send)."
      ),
      subject: "Joe Perks smoke: email pipeline (1/2)",
      template,
      to: from,
    });

    await sendEmail({
      entityId,
      entityType,
      react: createElement(
        Text,
        null,
        "Joe Perks email pipeline smoke (deduped — should not send)."
      ),
      subject: "Joe Perks smoke: email pipeline (2/2)",
      template,
      to: from,
    });

    const count = await database.emailLog.count({
      where: { entityType, entityId, template },
    });
    if (count !== 1) {
      console.error(
        `FAIL: expected 1 EmailLog row for dedupe triple, got ${count}.`
      );
      process.exit(1);
    }

    await database.emailLog.deleteMany({
      where: { entityType, entityId, template },
    });

    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "resend_plus_db",
          message:
            "sendEmail twice with same dedupe keys → one EmailLog row; cleanup done.",
        },
        null,
        2
      )
    );
    return;
  }

  await database.emailLog.create({
    data: {
      to: "smoke@example.com",
      template,
      entityType,
      entityId,
    },
  });

  let duplicateRejected = false;
  try {
    await database.emailLog.create({
      data: {
        to: "smoke@example.com",
        template,
        entityType,
        entityId,
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      duplicateRejected = true;
    } else {
      throw e;
    }
  }

  if (!duplicateRejected) {
    console.error(
      "FAIL: second EmailLog insert should violate unique constraint."
    );
    process.exit(1);
  }

  await database.emailLog.deleteMany({
    where: { entityType, entityId, template },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "db_dedupe_only",
        message:
          "RESEND_TOKEN/RESEND_FROM not set — verified EmailLog @@unique (entityType, entityId, template) only.",
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { database } = await import("@joe-perks/db/database");
    await database.$disconnect();
  });
