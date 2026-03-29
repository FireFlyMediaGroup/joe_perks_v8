import { z } from "zod";

export const CURRENT_TERMS_VERSION = "1.0";

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
] as const;

// ── Step 1: Contact ──────────────────────────────────────────────────

export const contactSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  contactName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be 100 characters or fewer"),
  phone: z
    .string()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
});

// ── Step 2: Business ─────────────────────────────────────────────────

export const businessSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(200, "Business name must be 200 characters or fewer"),
  website: z
    .string()
    .url("Please enter a valid URL (e.g. https://example.com)")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

// ── Step 3: Location ─────────────────────────────────────────────────

export const locationSchema = z.object({
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must be 100 characters or fewer"),
  state: z.enum(US_STATES, {
    error: "Please select a state",
  }),
});

// ── Step 4: Coffee ───────────────────────────────────────────────────

export const coffeeSchema = z.object({
  coffeeInfo: z
    .string()
    .max(3000, "Coffee info must be 3000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

// ── Step 5: Terms ────────────────────────────────────────────────────

export const termsSchema = z.object({
  termsAccepted: z.literal(true, {
    error: "You must agree to the terms of service to continue",
  }),
});

// ── Full application schema ──────────────────────────────────────────

export const applicationSchema = contactSchema
  .merge(businessSchema)
  .merge(locationSchema)
  .merge(coffeeSchema)
  .merge(termsSchema);

export type ApplicationFormData = z.infer<typeof applicationSchema>;

export const STEP_SCHEMAS = [
  contactSchema,
  businessSchema,
  locationSchema,
  coffeeSchema,
  termsSchema,
] as const;

export const STEP_LABELS = [
  "Contact",
  "Business",
  "Location",
  "Coffee",
  "Terms",
] as const;
