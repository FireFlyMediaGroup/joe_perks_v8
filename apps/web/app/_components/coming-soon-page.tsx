interface ComingSoonPageProps {
  readonly title: string;
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <div className="container max-w-3xl py-16">
      <h1 className="mb-4 font-extrabold text-4xl tracking-tight">{title}</h1>
      <p className="text-lg text-muted-foreground">Coming soon.</p>
    </div>
  );
}
