interface ShippingCardProps {
  readonly buyerEmail: string;
  readonly shipToAddress1: string;
  readonly shipToAddress2: string | null;
  readonly shipToCity: string;
  readonly shipToCountry: string;
  readonly shipToName: string;
  readonly shipToPostalCode: string;
  readonly shipToState: string;
}

export function ShippingCard({
  buyerEmail,
  shipToAddress1,
  shipToAddress2,
  shipToCity,
  shipToCountry,
  shipToName,
  shipToPostalCode,
  shipToState,
}: ShippingCardProps) {
  return (
    <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="space-y-2">
        <h2 className="font-semibold text-foreground text-xl tracking-tight">
          Shipping details
        </h2>
        <p className="text-muted-foreground text-sm leading-6">
          This is the delivery snapshot saved with the order.
        </p>
      </div>

      <address className="mt-5 not-italic">
        <div className="rounded-2xl bg-muted/60 p-4 text-sm leading-7">
          <p className="font-medium text-foreground">{shipToName}</p>
          <p className="text-muted-foreground">{buyerEmail}</p>
          <p className="mt-3 text-muted-foreground">{shipToAddress1}</p>
          {shipToAddress2 ? (
            <p className="text-muted-foreground">{shipToAddress2}</p>
          ) : null}
          <p className="text-muted-foreground">
            {shipToCity}, {shipToState} {shipToPostalCode}
          </p>
          <p className="text-muted-foreground">{shipToCountry}</p>
        </div>
      </address>
    </section>
  );
}
