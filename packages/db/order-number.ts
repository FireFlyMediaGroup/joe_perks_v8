import "server-only";

/**
 * Atomic `JP-XXXXX` order numbers via `OrderSequence` singleton.
 * Implement with `$queryRaw` against Postgres when the Joe Perks schema lands (AGENTS.md).
 */
export async function generateOrderNumber(): Promise<string> {
  throw new Error(
    "generateOrderNumber: implement after OrderSequence model exists in schema.prisma"
  );
}
