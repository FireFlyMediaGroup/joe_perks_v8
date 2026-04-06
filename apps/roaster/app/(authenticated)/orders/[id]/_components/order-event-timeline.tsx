import { Badge } from "@repo/design-system/components/ui/badge";

import {
  getOrderEventActorLabel,
  getOrderEventDetail,
  getRoasterOrderEventLabel,
} from "../_lib/order-history";
import type { RoasterOrderDetail } from "../_lib/queries";

export function OrderEventTimeline({
  events,
}: {
  readonly events: RoasterOrderDetail["events"];
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-muted-foreground text-sm">
        No order events recorded yet.
      </p>
    );
  }

  return (
    <ol className="space-y-4 border-l pl-4">
      {events.map((event) => {
        const detail = getOrderEventDetail(event.eventType, event.payload);

        return (
          <li className="relative" key={event.id}>
            <div className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full bg-primary" />
            <div className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">
                  {getRoasterOrderEventLabel(event.eventType)}
                </p>
                <Badge variant="outline">
                  {getOrderEventActorLabel(event.actorType)}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground text-sm">
                {event.createdAt.toLocaleString()}
              </p>
              {detail ? <p className="mt-2 text-sm">{detail}</p> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
