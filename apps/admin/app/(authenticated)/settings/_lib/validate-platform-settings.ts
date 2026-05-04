/** Shared input validation for PlatformSettings singleton updates (US-07-02). */

export const PLATFORM_SETTINGS_SINGLETON_ID = "singleton" as const;

const INTEGER_STRING = /^\d+$/;

export interface ValidatedPlatformSettings {
  disputeFeeCents: number;
  orgPctDefault: number;
  orgPctMax: number;
  orgPctMin: number;
  payoutHoldDays: number;
  platformFeeFloor: number;
  platformFeePct: number;
  slaAutoRefundHours: number;
  slaBreachHours: number;
  slaCriticalHours: number;
  slaWarnHours: number;
}

export type ValidatePlatformSettingsResult =
  | { errors: string[]; ok: false }
  | { ok: true; values: ValidatedPlatformSettings };

function push(errors: string[], message: string) {
  errors.push(message);
}

function parseRequiredInt(
  raw: string,
  label: string,
  errors: string[],
  opts: { max: number; min: number }
): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    push(errors, `${label} is required.`);
    return null;
  }
  if (!INTEGER_STRING.test(trimmed)) {
    push(errors, `${label} must be a whole number.`);
    return null;
  }
  const n = Number.parseInt(trimmed, 10);
  if (n < opts.min || n > opts.max) {
    push(errors, `${label} must be between ${opts.min} and ${opts.max}.`);
    return null;
  }
  return n;
}

function parseRequiredPercent(
  raw: string,
  label: string,
  errors: string[]
): number | null {
  if (raw === "") {
    push(errors, `${label} is required.`);
    return null;
  }
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) {
    push(errors, `${label} must be a number.`);
    return null;
  }
  if (n < 0 || n > 100) {
    push(errors, `${label} must be between 0 and 100.`);
    return null;
  }
  return n / 100;
}

function parseRequiredMoneyToCents(
  raw: string,
  label: string,
  errors: string[],
  opts: { maxCents: number }
): number | null {
  if (raw === "") {
    push(errors, `${label} is required.`);
    return null;
  }
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) {
    push(errors, `${label} must be a number.`);
    return null;
  }
  if (n < 0) {
    push(errors, `${label} cannot be negative.`);
    return null;
  }
  const cents = Math.round(n * 100);
  if (Math.abs(n * 100 - cents) > 1e-6) {
    push(errors, `${label} must use at most two decimal places.`);
    return null;
  }
  if (cents > opts.maxCents) {
    push(errors, `${label} is too large.`);
    return null;
  }
  return cents;
}

function validateOrgPercents(
  errors: string[],
  orgPctMin: number | null,
  orgPctMax: number | null,
  orgPctDefault: number | null
) {
  if (orgPctMin !== null && orgPctMax !== null && orgPctMin > orgPctMax) {
    push(errors, "Org share minimum cannot exceed org share maximum.");
  }
  if (
    orgPctMin !== null &&
    orgPctMax !== null &&
    orgPctDefault !== null &&
    (orgPctDefault < orgPctMin || orgPctDefault > orgPctMax)
  ) {
    push(errors, "Org share default must be between the minimum and maximum.");
  }
}

function validateSlaProgression(
  errors: string[],
  slaWarnHours: number | null,
  slaBreachHours: number | null,
  slaCriticalHours: number | null,
  slaAutoRefundHours: number | null
) {
  if (
    slaWarnHours !== null &&
    slaBreachHours !== null &&
    slaWarnHours >= slaBreachHours
  ) {
    push(
      errors,
      "SLA reminder hours must be strictly less than the SLA breach window (hours)."
    );
  }

  if (
    slaBreachHours !== null &&
    slaCriticalHours !== null &&
    slaBreachHours > slaCriticalHours
  ) {
    push(
      errors,
      "SLA breach window cannot be greater than the critical threshold (inconsistent progression)."
    );
  }

  if (
    slaCriticalHours !== null &&
    slaAutoRefundHours !== null &&
    slaCriticalHours > slaAutoRefundHours
  ) {
    push(
      errors,
      "Critical threshold cannot be after the auto-refund threshold (inconsistent progression)."
    );
  }
}

export function validatePlatformSettingsForm(
  formData: FormData
): ValidatePlatformSettingsResult {
  const errors: string[] = [];

  const ack = formData.get("ackFutureImpact");
  if (ack !== "on") {
    push(
      errors,
      "Confirm that you understand these changes apply to future orders and background jobs."
    );
  }

  const platformFeePct = parseRequiredPercent(
    String(formData.get("platformFeePctPercent") ?? ""),
    "Platform fee (%)",
    errors
  );
  const platformFeeFloor = parseRequiredMoneyToCents(
    String(formData.get("platformFeeFloorDollars") ?? ""),
    "Platform fee minimum ($)",
    errors,
    { maxCents: 100_000_000 }
  );

  const orgPctMin = parseRequiredPercent(
    String(formData.get("orgPctMinPercent") ?? ""),
    "Org share minimum (%)",
    errors
  );
  const orgPctMax = parseRequiredPercent(
    String(formData.get("orgPctMaxPercent") ?? ""),
    "Org share maximum (%)",
    errors
  );
  const orgPctDefault = parseRequiredPercent(
    String(formData.get("orgPctDefaultPercent") ?? ""),
    "Org share default (%)",
    errors
  );

  const slaWarnHours = parseRequiredInt(
    String(formData.get("slaWarnHours") ?? ""),
    "SLA reminder (hours from order start)",
    errors,
    { max: 8760, min: 1 }
  );
  const slaBreachHours = parseRequiredInt(
    String(formData.get("slaBreachHours") ?? ""),
    "SLA breach window (hours)",
    errors,
    { max: 8760, min: 1 }
  );
  const slaCriticalHours = parseRequiredInt(
    String(formData.get("slaCriticalHours") ?? ""),
    "SLA critical threshold (hours from order start)",
    errors,
    { max: 8760, min: 1 }
  );
  const slaAutoRefundHours = parseRequiredInt(
    String(formData.get("slaAutoRefundHours") ?? ""),
    "SLA auto-refund threshold (hours from order start)",
    errors,
    { max: 8760, min: 1 }
  );

  const payoutHoldDays = parseRequiredInt(
    String(formData.get("payoutHoldDays") ?? ""),
    "Payout hold (days after delivery)",
    errors,
    { max: 365, min: 0 }
  );

  const disputeFeeCents = parseRequiredMoneyToCents(
    String(formData.get("disputeFeeDollars") ?? ""),
    "Dispute fee ($)",
    errors,
    { maxCents: 100_000_000 }
  );

  validateOrgPercents(errors, orgPctMin, orgPctMax, orgPctDefault);
  validateSlaProgression(
    errors,
    slaWarnHours,
    slaBreachHours,
    slaCriticalHours,
    slaAutoRefundHours
  );

  if (errors.length > 0) {
    return { errors, ok: false };
  }

  if (
    platformFeePct === null ||
    platformFeeFloor === null ||
    orgPctMin === null ||
    orgPctMax === null ||
    orgPctDefault === null ||
    slaWarnHours === null ||
    slaBreachHours === null ||
    slaCriticalHours === null ||
    slaAutoRefundHours === null ||
    payoutHoldDays === null ||
    disputeFeeCents === null
  ) {
    return { errors: ["Internal validation error."], ok: false };
  }

  return {
    ok: true,
    values: {
      disputeFeeCents,
      orgPctDefault,
      orgPctMax,
      orgPctMin,
      payoutHoldDays,
      platformFeeFloor,
      platformFeePct,
      slaAutoRefundHours,
      slaBreachHours,
      slaCriticalHours,
      slaWarnHours,
    },
  };
}
