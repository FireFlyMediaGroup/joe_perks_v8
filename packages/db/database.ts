import "./load-env-bootstrap";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./generated/client";
import { keys } from "./keys";

if (!process.env.VERCEL) {
  neonConfig.webSocketConstructor = (await import("ws")).default;
}

const adapter = new PrismaNeon({ connectionString: keys().DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const database = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = database;
}
