import {
  type Buyer,
  type Campaign,
  database,
  type Order,
  type Org,
  type PlatformSettings,
  type Roaster,
} from "@joe-perks/db";
import { keys as emailKeys } from "@joe-perks/email/keys";
import { sendEmail } from "@joe-perks/email/send";
import {
  SlaAdminAlertEmail,
  SlaBuyerDelayEmail,
  SlaRoasterReminderEmail,
  SlaRoasterUrgentEmail,
} from "@joe-perks/email/templates/sla";
import { isStripeConfigured, refundCharge } from "@joe-perks/stripe";

const HOUR_MS = 60 * 60 * 1000;

function hoursMs(hours: number): number {
  return hours * HOUR_MS;
}

function isSlaCriticalNote(payload: unknown): boolean {
  return (
    payload !== null &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    (payload as { code?: string }).code === "SLA_CRITICAL"
  );
}

function emailConfigured(): boolean {
  try {
    const { RESEND_TOKEN, RESEND_FROM } = emailKeys();
    return Boolean(RESEND_TOKEN && RESEND_FROM);
  } catch {
    return false;
  }
}

type OrderWithRelations = Order & {
  roaster: Roaster;
  buyer: Buyer | null;
  campaign: Campaign & { org: Org };
};

async function trySlaAutoRefund(
  order: OrderWithRelations,
  settings: PlatformSettings,
  now: number
): Promise<boolean> {
  const refundAt =
    order.fulfillBy.getTime() -
    hoursMs(settings.slaBreachHours) +
    hoursMs(settings.slaAutoRefundHours);
  if (now < refundAt) {
    return false;
  }

  const alreadyDone = await database.orderEvent.findFirst({
    where: {
      orderId: order.id,
      eventType: "REFUND_COMPLETED",
    },
  });
  if (alreadyDone || order.status === "REFUNDED") {
    return true;
  }
  if (!order.stripeChargeId) {
    console.error("sla-check: auto-refund skipped — missing charge", {
      order_id: order.id,
    });
    return true;
  }
  if (!isStripeConfigured()) {
    console.error("sla-check: auto-refund skipped — Stripe not configured", {
      order_id: order.id,
    });
    return true;
  }

  await refundCharge({
    chargeId: order.stripeChargeId,
    metadata: { order_id: order.id },
  });

  await database.$transaction([
    database.order.update({
      where: { id: order.id },
      data: { status: "REFUNDED", payoutStatus: "FAILED" },
    }),
    database.orderEvent.create({
      data: {
        orderId: order.id,
        eventType: "REFUND_COMPLETED",
        actorType: "SYSTEM",
        payload: { reason: "sla_auto_refund" },
      },
    }),
  ]);

  console.log("sla-check: auto-refund completed", { order_id: order.id });
  return true;
}

async function trySlaCritical(
  order: OrderWithRelations,
  settings: PlatformSettings,
  now: number,
  canEmail: boolean,
  adminEmail: string | undefined
): Promise<boolean> {
  const criticalAt =
    order.fulfillBy.getTime() -
    hoursMs(settings.slaBreachHours) +
    hoursMs(settings.slaCriticalHours);
  if (now < criticalAt) {
    return false;
  }

  const criticalNotes = await database.orderEvent.findMany({
    where: { orderId: order.id, eventType: "NOTE_ADDED" },
  });
  if (criticalNotes.some((e) => isSlaCriticalNote(e.payload))) {
    return true;
  }

  if (canEmail && adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `[Joe Perks] SLA critical — ${order.orderNumber}`,
      template: "sla_admin_critical",
      entityId: order.id,
      entityType: "order",
      react: (
        <SlaAdminAlertEmail
          orderId={order.id}
          orderNumber={order.orderNumber}
          stage="critical"
        />
      ),
    });
  }

  await database.orderEvent.create({
    data: {
      orderId: order.id,
      eventType: "NOTE_ADDED",
      actorType: "SYSTEM",
      payload: { code: "SLA_CRITICAL" },
    },
  });

  console.log("sla-check: critical tier recorded", { order_id: order.id });
  return true;
}

async function trySlaBreach(
  order: OrderWithRelations,
  settings: PlatformSettings,
  now: number,
  canEmail: boolean,
  adminEmail: string | undefined
): Promise<boolean> {
  const breachAt =
    order.fulfillBy.getTime() -
    hoursMs(settings.slaBreachHours) +
    hoursMs(settings.slaBreachHours);
  if (now < breachAt) {
    return false;
  }

  const hasBreach = await database.orderEvent.findFirst({
    where: { orderId: order.id, eventType: "SLA_BREACH" },
  });
  if (hasBreach) {
    return true;
  }

  const fulfillByIso = order.fulfillBy.toISOString();

  await database.orderEvent.create({
    data: {
      orderId: order.id,
      eventType: "SLA_BREACH",
      actorType: "SYSTEM",
      payload: {},
    },
  });

  if (canEmail) {
    await sendEmail({
      to: order.roaster.email,
      subject: `[Joe Perks] Urgent: SLA breach — ${order.orderNumber}`,
      template: "sla_roaster_urgent",
      entityId: order.id,
      entityType: "order",
      react: (
        <SlaRoasterUrgentEmail
          fulfillByIso={fulfillByIso}
          orderNumber={order.orderNumber}
        />
      ),
    });

    if (order.buyer?.email) {
      await sendEmail({
        to: order.buyer.email,
        subject: `Update on your Joe Perks order ${order.orderNumber}`,
        template: "sla_buyer_delay",
        entityId: order.id,
        entityType: "order",
        react: <SlaBuyerDelayEmail orderNumber={order.orderNumber} />,
      });
    }

    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `[Joe Perks] SLA breach — ${order.orderNumber}`,
        template: "sla_admin_breach",
        entityId: order.id,
        entityType: "order",
        react: (
          <SlaAdminAlertEmail
            orderId={order.id}
            orderNumber={order.orderNumber}
            stage="breach"
          />
        ),
      });
    }
  }

  console.log("sla-check: breach tier processed", { order_id: order.id });
  return true;
}

async function trySlaWarn(
  order: OrderWithRelations,
  settings: PlatformSettings,
  now: number,
  canEmail: boolean
): Promise<void> {
  const warnAt =
    order.fulfillBy.getTime() -
    hoursMs(settings.slaBreachHours) +
    hoursMs(settings.slaWarnHours);
  if (now < warnAt) {
    return;
  }

  const hasWarn = await database.orderEvent.findFirst({
    where: { orderId: order.id, eventType: "SLA_WARNING" },
  });
  if (hasWarn) {
    return;
  }

  const fulfillByIso = order.fulfillBy.toISOString();

  await database.orderEvent.create({
    data: {
      orderId: order.id,
      eventType: "SLA_WARNING",
      actorType: "SYSTEM",
      payload: {},
    },
  });

  if (canEmail) {
    await sendEmail({
      to: order.roaster.email,
      subject: `[Joe Perks] Reminder: ship order ${order.orderNumber}`,
      template: "sla_roaster_reminder",
      entityId: order.id,
      entityType: "order",
      react: (
        <SlaRoasterReminderEmail
          fulfillByIso={fulfillByIso}
          orderNumber={order.orderNumber}
        />
      ),
    });
  }

  console.log("sla-check: warning tier processed", { order_id: order.id });
}

/**
 * Hourly SLA pass: warn → breach → critical emails, then auto-refund past
 * `sla_auto_refund_hours` from payment (derived from `fulfillBy` + settings).
 */
export async function runSlaCheck(): Promise<void> {
  const settings = await database.platformSettings.findUniqueOrThrow({
    where: { id: "singleton" },
  });

  const orders = await database.order.findMany({
    where: {
      status: "CONFIRMED",
      shippedAt: null,
    },
    include: {
      roaster: true,
      buyer: true,
      campaign: { include: { org: true } },
    },
  });

  const canEmail = emailConfigured();
  const adminEmail = process.env.PLATFORM_ALERT_EMAIL?.trim();
  const now = Date.now();

  for (const order of orders) {
    const o = order as OrderWithRelations;
    if (await trySlaAutoRefund(o, settings, now)) {
      continue;
    }
    if (await trySlaCritical(o, settings, now, canEmail, adminEmail)) {
      continue;
    }
    if (await trySlaBreach(o, settings, now, canEmail, adminEmail)) {
      continue;
    }
    await trySlaWarn(o, settings, now, canEmail);
  }
}
