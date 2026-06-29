import process from "node:process";

import "../load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../generated/client";

neonConfig.webSocketConstructor = ws;

const TRAILING_SLASH = /\/$/;

const orderId = process.argv[2];
if (!orderId) {
  console.error("Usage: bun run ./scripts/get-fulfillment-link-for-order.ts <orderId>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: url }),
});

async function main() {
  const dedupeKey = `order_fulfillment:${orderId}`;
  const link = await prisma.magicLink.findUnique({
    where: { dedupeKey },
    select: {
      expiresAt: true,
      id: true,
      token: true,
      usedAt: true,
    },
  });

  if (!link) {
    process.exit(2);
  }

  const emailLog = await prisma.emailLog.findFirst({
    where: {
      entityId: orderId,
      entityType: "order",
      template: "magic_link_fulfillment",
    },
    orderBy: { sentAt: "desc" },
    select: {
      id: true,
      providerId: true,
      sentAt: true,
      to: true,
    },
  });

  const roasterOrigin = (
    process.env.ROASTER_APP_ORIGIN ?? "https://roasters.joeperks.com"
  ).replace(TRAILING_SLASH, "");

  process.stdout.write(
    `${JSON.stringify({
      emailLog: emailLog
        ? {
            id: emailLog.id,
            providerId: emailLog.providerId,
            sentAt: emailLog.sentAt.toISOString(),
            to: emailLog.to,
          }
        : null,
      expiresAt: link.expiresAt.toISOString(),
      fulfillUrl: `${roasterOrigin}/fulfill/${link.token}`,
      magicLinkId: link.id,
      token: link.token,
      usedAt: link.usedAt?.toISOString() ?? null,
    })}\n`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
