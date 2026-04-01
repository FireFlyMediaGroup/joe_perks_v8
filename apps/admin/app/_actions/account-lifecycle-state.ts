export interface AccountLifecycleState {
  error: string | null;
  message: string | null;
  ok: boolean;
}

export const initialAccountLifecycleState: AccountLifecycleState = {
  error: null,
  message: null,
  ok: false,
};
