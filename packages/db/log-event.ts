import "server-only";

import { database } from "./database";
import type { ActorType, OrderEventType, Prisma } from "./generated/client";

/**
 * Append-only order audit log. Swallows errors so callers never throw from logging.
 * For events that must be atomic with other writes, use `database.orderEvent.create` inside `$transaction` instead.
 */
export async function logOrderEvent(
  orderId: string,
  eventType: OrderEventType,
  actorType: ActorType,
  actorId?: string | null,
  payload?: Record<string, unknown> | null,
  ipAddress?: string | null
): Promise<void> {
  try {
    await database.orderEvent.create({
      data: {
        orderId,
        eventType,
        actorType,
        ...(actorId != null && actorId !== "" ? { actorId } : {}),
        ...(payload != null
          ? { payload: payload as Prisma.InputJsonValue }
          : {}),
        ...(ipAddress != null && ipAddress !== "" ? { ipAddress } : {}),
      },
    });
  } catch (error) {
    console.error("logOrderEvent failed", {
      order_id: orderId,
      event_type: eventType,
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}
