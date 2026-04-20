import "server-only";

import { database } from "./database";

/**
 * Atomic `JP-XXXXX` order numbers via `OrderSequence` singleton (see docs/AGENTS.md).
 */
export async function generateOrderNumber(): Promise<string> {
  const result = await database.$queryRaw<[{ nextVal: number }]>`
    UPDATE "OrderSequence"
    SET "nextVal" = "nextVal" + 1
    WHERE id = 'singleton'
    RETURNING "nextVal"
  `;
  const n = result[0].nextVal;
  return `JP-${String(n).padStart(5, "0")}`;
}
