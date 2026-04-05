import type { ShippingFormValues } from "./schema";

export interface CheckoutOrderSnapshot {
  buyerEmail: string;
  shipToAddress1: string;
  shipToAddress2: string | null;
  shipToCity: string;
  shipToCountry: string;
  shipToName: string;
  shipToPostalCode: string;
  shipToState: string;
}

export function buildShippingPrefillFromOrderSnapshot(input: {
  defaultShippingRateId: string | null;
  order: CheckoutOrderSnapshot;
}): ShippingFormValues | null {
  if (!input.defaultShippingRateId) {
    return null;
  }

  return {
    buyerEmail: input.order.buyerEmail,
    buyerName: input.order.shipToName,
    city: input.order.shipToCity,
    country: input.order.shipToCountry,
    shippingRateId: input.defaultShippingRateId,
    state: input.order.shipToState,
    street: input.order.shipToAddress1,
    street2: input.order.shipToAddress2 ?? "",
    zip: input.order.shipToPostalCode,
  };
}
