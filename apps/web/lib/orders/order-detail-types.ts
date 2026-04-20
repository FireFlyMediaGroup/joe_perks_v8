export interface OrderDetailItem {
  readonly id: string;
  readonly lineTotal: number;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly variantDesc: string;
}

export interface OrderDetailView {
  readonly buyerEmail: string;
  readonly carrier: string | null;
  readonly deliveredAt: Date | null;
  readonly fulfillBy: Date;
  readonly fundraiserName: string;
  readonly grossAmount: number;
  readonly id: string;
  readonly items: readonly OrderDetailItem[];
  readonly orderNumber: string;
  readonly orgAmount: number;
  readonly orgPctSnapshot: number;
  readonly placedAt: Date;
  readonly productSubtotal: number;
  readonly shipToAddress1: string;
  readonly shipToAddress2: string | null;
  readonly shipToCity: string;
  readonly shipToCountry: string;
  readonly shipToName: string;
  readonly shipToPostalCode: string;
  readonly shipToState: string;
  readonly shippedAt: Date | null;
  readonly shippingAmount: number;
  readonly status: import("@joe-perks/db").OrderStatus;
  readonly trackingNumber: string | null;
}
