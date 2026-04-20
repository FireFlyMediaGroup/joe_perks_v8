export function NoRoasterProfile({ title = "Products" }: { title?: string }) {
  return (
    <div className="p-6">
      <h1 className="font-semibold text-2xl">{title}</h1>
      <p className="mt-2 max-w-lg text-muted-foreground">
        No roaster profile is linked to this account. If you were recently
        approved, try signing out and signing back in. Otherwise contact
        support.
      </p>
    </div>
  );
}
