export type UpdatePlatformSettingsState =
  | { errors: string[]; ok: false }
  | { message: string; ok: true };

export const initialUpdatePlatformSettingsState: UpdatePlatformSettingsState = {
  errors: [],
  ok: false,
};
