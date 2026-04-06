import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { CantFulfillForm } from "../app/fulfill/[token]/_components/cant-fulfill-form";
import { reportCantFulfill } from "../app/fulfill/[token]/_actions/report-cant-fulfill";

const NOTE_LABEL = /Note for Joe Perks/i;
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

vi.mock("../app/fulfill/[token]/_actions/report-cant-fulfill", () => ({
  reportCantFulfill: vi.fn(),
}));

test("submits the structured cant-fulfill flow", async () => {
  refresh.mockReset();
  const reportCantFulfillMock = vi.mocked(reportCantFulfill);
  reportCantFulfillMock.mockResolvedValue({ ok: true });

  render(<CantFulfillForm token="flag-token" />);

  fireEvent.click(screen.getByRole("button", { name: "Report a fulfillment issue" }));
  fireEvent.change(screen.getByLabelText("What's the main issue?"), {
    target: { value: "Inventory shortage" },
  });
  fireEvent.change(screen.getByLabelText("How should Joe Perks help next?"), {
    target: { value: "Please review for refund or cancellation" },
  });
  fireEvent.change(screen.getByLabelText(NOTE_LABEL), {
    target: { value: "We are out of this roast until next week." },
  });

  fireEvent.click(screen.getByRole("button", { name: "Report issue" }));

  await waitFor(() => {
    expect(reportCantFulfillMock).toHaveBeenCalledWith(
      "flag-token",
      "Inventory shortage",
      "Please review for refund or cancellation",
      "We are out of this roast until next week."
    );
  });

  await waitFor(() => {
    expect(refresh).toHaveBeenCalled();
  });
});
