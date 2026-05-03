export function normalizeCarrierForTrackingLink(carrier: string): string {
  return carrier
    .trim()
    .toUpperCase()
    .replaceAll(/[\s_-]+/g, "");
}

export function getCarrierTrackingHref(
  carrier: string | null,
  trackingNumber: string | null
): string | null {
  const trimmedCarrier = carrier?.trim();
  const trimmedTracking = trackingNumber?.trim();

  if (!(trimmedCarrier && trimmedTracking)) {
    return null;
  }

  const encodedTracking = encodeURIComponent(trimmedTracking);
  const normalizedCarrier = normalizeCarrierForTrackingLink(trimmedCarrier);

  if (
    normalizedCarrier === "USPS" ||
    normalizedCarrier === "UNITEDSTATESPOSTALSERVICE"
  ) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodedTracking}`;
  }

  if (normalizedCarrier === "UPS") {
    return `https://www.ups.com/track?tracknum=${encodedTracking}`;
  }

  if (normalizedCarrier === "FEDEX" || normalizedCarrier === "FEDERALEXPRESS") {
    return `https://www.fedex.com/fedextrack/?trknbr=${encodedTracking}`;
  }

  if (normalizedCarrier === "DHL" || normalizedCarrier === "DHLEXPRESS") {
    return `https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=${encodedTracking}`;
  }

  return null;
}
