import { z } from "zod";

export const CURRENT_ORG_TERMS_VERSION = "1.0";

// ── Step 1: Organization info ─────────────────────────────────────────

export const orgInfoSchema = z.object({
  orgName: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(200, "Organization name must be 200 characters or fewer"),
  contactName: z
    .string()
    .trim()
    .min(2, "Contact name must be at least 2 characters")
    .max(100, "Contact name must be 100 characters or fewer"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
});

// ── Step 2: Description ───────────────────────────────────────────────

export const descriptionSchema = z.object({
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

// ── Step 3: Storefront slug ───────────────────────────────────────────

export const storefrontSchema = z.object({
  desiredSlug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(63, "Slug must be 63 characters or fewer")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Slug must be lowercase letters, numbers, and hyphens only"
    ),
});

// ── Step 4: Roaster selection & split percentage ─────────────────────
// desiredOrgPct stored as decimal (0.05 – 0.25); the form works in percent
// units (5–25) and converts before submitting.

export const roasterSplitSchema = z.object({
  primaryRoasterId: z.string().min(1, "Please select a roaster"),
  backupRoasterId: z.string().optional(),
  /** Decimal form: 0.05 – 0.25 */
  desiredOrgPct: z.number().positive(),
});

// ── Step 5: Terms ─────────────────────────────────────────────────────

export const termsSchema = z.object({
  termsAccepted: z.literal(true, {
    error: "You must agree to the terms of service to continue",
  }),
});

// ── Full schema (server action) ───────────────────────────────────────

export const orgApplicationSchema = orgInfoSchema
  .merge(descriptionSchema)
  .merge(storefrontSchema)
  .merge(roasterSplitSchema)
  .merge(termsSchema);

export type OrgApplicationData = z.infer<typeof orgApplicationSchema>;

export const STEP_LABELS = [
  "Your org",
  "Description",
  "Storefront",
  "Roaster",
  "Terms",
] as const;
