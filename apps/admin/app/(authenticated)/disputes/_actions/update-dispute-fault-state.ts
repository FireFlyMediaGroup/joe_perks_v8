export type UpdateDisputeFaultState =
  | { ok: true; message: string }
  | { ok: false; error: string };

export const initialUpdateDisputeFaultState: UpdateDisputeFaultState = {
  error: "",
  ok: false,
};
