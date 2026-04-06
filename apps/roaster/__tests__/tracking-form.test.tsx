import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { TrackingForm } from "../app/fulfill/[token]/_components/tracking-form";
import { submitTracking } from "../app/fulfill/[token]/_actions/submit-tracking";

const SUCCESS_MESSAGE = /Order JP-00042 is marked shipped\./i;

vi.mock("../app/fulfill/[token]/_actions/submit-tracking", () => ({
  submitTracking: vi.fn(),
}));

test("submits tracking with an optional fulfillment note", async () => {
  const submitTrackingMock = vi.mocked(submitTracking);
  submitTrackingMock.mockResolvedValue({ ok: true });

  render(<TrackingForm orderNumber="JP-00042" token="test-token" />);

  fireEvent.change(screen.getByLabelText("Tracking number"), {
    target: { value: "9405511899562860000000" },
  });
  fireEvent.click(screen.getByRole("button", { name: "FedEx" }));
  fireEvent.click(screen.getByRole("button", { name: "+ Add a note for the buyer" }));
  fireEvent.change(screen.getByLabelText("Optional note"), {
    target: { value: "Packed fresh this morning." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Mark as shipped" }));

  await waitFor(() => {
    expect(submitTrackingMock).toHaveBeenCalledWith(
      "test-token",
      "9405511899562860000000",
      "FedEx",
      "Packed fresh this morning."
    );
  });

  await waitFor(() => {
    expect(screen.getByText(SUCCESS_MESSAGE)).toBeDefined();
  });
});
