import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { PortalFulfillmentForm } from "../app/(authenticated)/orders/[id]/_components/portal-fulfillment-form";
import { TrackingCorrectionForm } from "../app/(authenticated)/orders/[id]/_components/tracking-correction-form";
import { shipOrder } from "../app/(authenticated)/orders/[id]/_actions/ship-order";
import { updateTracking } from "../app/(authenticated)/orders/[id]/_actions/update-tracking";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

vi.mock("../app/(authenticated)/orders/[id]/_actions/ship-order", () => ({
  shipOrder: vi.fn(),
}));

vi.mock("../app/(authenticated)/orders/[id]/_actions/update-tracking", () => ({
  updateTracking: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

test("submits the portal fulfillment form with an optional note", async () => {
  refresh.mockReset();
  const shipOrderMock = vi.mocked(shipOrder);
  shipOrderMock.mockResolvedValue({ ok: true });

  render(<PortalFulfillmentForm orderId="order_123" orderNumber="JP-00077" />);

  fireEvent.change(screen.getByLabelText("Tracking number"), {
    target: { value: "9405511899562860000000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "+ Add a note for the buyer" }));
  fireEvent.change(screen.getByLabelText("Optional note"), {
    target: { value: "Packed fresh this afternoon." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Mark as shipped" }));

  await waitFor(() => {
    expect(shipOrderMock).toHaveBeenCalledWith(
      "order_123",
      "9405511899562860000000",
      "USPS",
      "Packed fresh this afternoon."
    );
  });

  await waitFor(() => {
    expect(refresh).toHaveBeenCalled();
  });
});

test("submits the tracking correction form with updated shipment data", async () => {
  refresh.mockReset();
  const updateTrackingMock = vi.mocked(updateTracking);
  updateTrackingMock.mockResolvedValue({ ok: true });

  render(
    <TrackingCorrectionForm
      carrier="UPS"
      orderId="order_789"
      trackingNumber="1Z999AA10123456784"
    />
  );

  fireEvent.change(screen.getByLabelText("Tracking number"), {
    target: { value: "1Z999AA10123456785" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save tracking update" }));

  await waitFor(() => {
    expect(updateTrackingMock).toHaveBeenCalledWith(
      "order_789",
      "1Z999AA10123456785",
      "UPS"
    );
  });

  await waitFor(() => {
    expect(refresh).toHaveBeenCalled();
  });
});
