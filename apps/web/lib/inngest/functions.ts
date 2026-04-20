import { serve } from "inngest/next";

import { inngest } from "./client";
import { runCartCleanup } from "./run-cart-cleanup";
import { runPayoutRelease } from "./run-payout-release";
import { runSlaCheck } from "./run-sla-check";

const slaCheck = inngest.createFunction(
  {
    id: "sla-check",
    name: "SLA check",
    triggers: [{ cron: "0 * * * *" }],
  },
  async ({ step }) => {
    await step.run("run-sla-check", runSlaCheck);
  }
);

const payoutRelease = inngest.createFunction(
  {
    id: "payout-release",
    name: "Payout release",
    triggers: [{ cron: "0 9 * * *" }],
  },
  async ({ step }) => {
    await step.run("run-payout-release", runPayoutRelease);
  }
);

const cartCleanup = inngest.createFunction(
  {
    id: "cart-cleanup",
    name: "Cart cleanup",
    triggers: [{ cron: "0 2 * * *" }],
  },
  async ({ step }) => {
    await step.run("run-cart-cleanup", () => {
      runCartCleanup();
    });
  }
);

const functions = [slaCheck, payoutRelease, cartCleanup];

export const inngestServeHandlers = serve({
  client: inngest,
  functions,
});
