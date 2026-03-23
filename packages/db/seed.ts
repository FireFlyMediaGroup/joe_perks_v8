/**
 * Prisma seed — PlatformSettings + OrderSequence singletons.
 * Wire real creates after the 26-model Joe Perks schema is applied.
 *
 * Run: `cd packages/db && bunx prisma db seed`
 */
async function main(): Promise<void> {
  console.info(
    "[@joe-perks/db seed] Stub — add PlatformSettings + OrderSequence after schema migration."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
