export const MAX_FULFILLMENT_NOTE_LENGTH = 200;

export const portalShipmentCarriers = [
  "USPS",
  "UPS",
  "FedEx",
  "DHL",
  "Other",
] as const;

export type PortalShipmentCarrier = (typeof portalShipmentCarriers)[number];
