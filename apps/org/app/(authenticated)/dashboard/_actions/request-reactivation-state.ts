export interface RequestReactivationState {
  error: string | null;
  message: string | null;
  ok: boolean;
}

export const initialRequestReactivationState: RequestReactivationState = {
  error: null,
  message: null,
  ok: false,
};
