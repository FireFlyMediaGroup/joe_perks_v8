import { database } from "@joe-perks/db";

import { PlatformSettingsForm } from "./_components/platform-settings-form";
import { PLATFORM_SETTINGS_SINGLETON_ID } from "./_lib/validate-platform-settings";

export default async function AdminSettingsPage() {
  const settings = await database.platformSettings.findUnique({
    where: { id: PLATFORM_SETTINGS_SINGLETON_ID },
  });

  if (!settings) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <h1 className="font-semibold text-2xl">Platform settings</h1>
        <p className="mt-4 text-red-600 text-sm dark:text-red-400">
          No PlatformSettings row found (expected id &quot;
          {PLATFORM_SETTINGS_SINGLETON_ID}&quot;). Run database migrations and
          seed.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <header className="mb-8 space-y-2">
        <h1 className="font-semibold text-2xl">Platform settings</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Edit live business rules for fees, fundraiser percentages, SLA timing,
          payout hold, and dispute-related amounts. Values are read from the
          database at runtime by checkout, webhooks, and background jobs.
        </p>
      </header>

      <PlatformSettingsForm
        key={settings.updatedAt.toISOString()}
        settings={settings}
      />
    </main>
  );
}
