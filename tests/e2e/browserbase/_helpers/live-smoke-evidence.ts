import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface LiveSmokeEvidence {
  autoRefunded: boolean;
  baseURL: string;
  browserbaseSessionUrl: string;
  chargeId?: string;
  completedAt: string;
  fulfillmentCarrier?: string;
  fulfillmentEmailLogId?: string;
  fulfillmentEmailSentTo?: string;
  fulfillmentMagicLinkId?: string;
  fulfillmentSubmitted: boolean;
  fulfillmentTrackingNumber?: string;
  fulfillUrlRedacted?: string;
  grossAmount?: number;
  orderId?: string;
  orderNumber?: string;
  orderStatus: string;
  orgSlug: string;
  paymentIntentId: string;
  refundId?: string;
  refundStatus?: string;
  roasterAppOrigin?: string;
  testName: string;
}

const EVIDENCE_PATH = resolve(
  process.cwd(),
  "test-results/live-money-path-evidence.json"
);

export function redactFulfillUrl(fulfillUrl: string): string {
  const match = fulfillUrl.match(/^(.*\/fulfill\/)[^/?#]+(.*)$/);
  if (!match) {
    return fulfillUrl;
  }
  return `${match[1]}<redacted>${match[2] ?? ""}`;
}

export function writeLiveSmokeEvidence(evidence: LiveSmokeEvidence): string {
  mkdirSync(resolve(process.cwd(), "test-results"), { recursive: true });
  writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(`Live smoke evidence: ${EVIDENCE_PATH}`);
  console.log(JSON.stringify(evidence, null, 2));
  return EVIDENCE_PATH;
}
