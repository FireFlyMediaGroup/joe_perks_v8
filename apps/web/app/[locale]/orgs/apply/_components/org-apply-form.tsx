"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { submitOrgApplication } from "../_actions/submit-application";
import { STEP_LABELS } from "../_lib/schema";
import { StepDescription } from "./step-description";
import { StepOrgInfo } from "./step-org-info";
import { type ActiveRoaster, StepRoaster } from "./step-roaster";
import { type SlugStatus, StepStorefront } from "./step-storefront";
import { StepTerms } from "./step-terms";

const TOTAL_STEPS = STEP_LABELS.length;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface OrgApplyFormProps {
  readonly orgPctDefault: number;
  readonly orgPctMax: number;
  readonly orgPctMin: number;
  readonly roasters: ActiveRoaster[];
}

function isEmailValid(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function validateStepZero(
  orgName: string,
  contactName: string,
  email: string,
  phone: string
): Record<string, string> {
  const errs: Record<string, string> = {};
  if (orgName.trim().length < 2) {
    errs.orgName = "Organization name must be at least 2 characters.";
  }
  if (contactName.trim().length < 2) {
    errs.contactName = "Contact name must be at least 2 characters.";
  }
  if (!isEmailValid(email)) {
    errs.email = "Please enter a valid email address.";
  }
  if (phone && phone.length > 20) {
    errs.phone = "Phone number is too long.";
  }
  return errs;
}

function validateStepTwo(
  desiredSlug: string,
  slugStatus: string
): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!desiredSlug || desiredSlug.length < 3) {
    errs.desiredSlug = "Please enter a storefront URL (at least 3 characters).";
  } else if (slugStatus !== "available") {
    errs.desiredSlug =
      slugStatus === "checking"
        ? "Please wait — checking availability…"
        : "This URL is not available. Please choose another.";
  }
  return errs;
}

export function OrgApplyForm({
  roasters,
  orgPctMin,
  orgPctMax,
  orgPctDefault,
}: OrgApplyFormProps) {
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // Step 1 state
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2 state
  const [description, setDescription] = useState("");

  // Step 3 state
  const [desiredSlug, setDesiredSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");

  // Step 4 state (pct in percent units: 5–25)
  const defaultPct = Math.round(orgPctDefault * 100);
  const [primaryRoasterId, setPrimaryRoasterId] = useState("");
  const [backupRoasterId, setBackupRoasterId] = useState("");
  const [desiredOrgPctPct, setDesiredOrgPctPct] = useState(defaultPct);

  // Step 5 state
  const [termsAccepted, setTermsAccepted] = useState(false);

  function validateStep(s: number): Record<string, string> {
    if (s === 0) {
      return validateStepZero(orgName, contactName, email, phone);
    }
    if (s === 1 && description.length > 2000) {
      return { description: "Description must be 2000 characters or fewer." };
    }
    if (s === 2) {
      return validateStepTwo(desiredSlug, slugStatus);
    }
    if (s === 3 && !primaryRoasterId) {
      return { primaryRoasterId: "Please select at least one roaster." };
    }
    if (s === 4 && !termsAccepted) {
      return {
        termsAccepted: "You must agree to the terms of service to continue.",
      };
    }
    return {};
  }

  function goNext() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit() {
    const errs = validateStep(4);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitOrgApplication({
        orgName,
        contactName,
        email,
        phone: phone || undefined,
        description: description || undefined,
        desiredSlug,
        primaryRoasterId,
        backupRoasterId: backupRoasterId || undefined,
        desiredOrgPct: desiredOrgPctPct / 100,
        termsAccepted: true,
      });
      if (result.success) {
        setSubmitted(true);
      } else {
        setSubmitError(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
        <h2 className="mt-6 font-semibold text-2xl">Application submitted!</h2>
        <p className="mt-3 text-muted-foreground">
          Thanks for applying to run a fundraiser with Joe Perks. We&apos;ll
          review your application and reach out within{" "}
          <strong>2–3 business days</strong>.
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          A confirmation email has been sent to <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Progress indicator */}
      <nav aria-label="Application progress" className="mb-8">
        <ol className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => {
            const isCurrent = i === step;
            const isComplete = i < step;
            let barClass = "bg-muted";
            if (isComplete) {
              barClass = "bg-primary";
            } else if (isCurrent) {
              barClass = "bg-primary/50";
            }
            return (
              <li
                className="flex flex-1 flex-col items-center gap-1"
                key={label}
              >
                <div
                  className={`h-1.5 w-full rounded-full transition-colors ${barClass}`}
                />
                <span
                  className={`hidden text-xs sm:block ${
                    isCurrent
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-muted-foreground text-xs sm:hidden">
          Step {step + 1} of {TOTAL_STEPS}: {STEP_LABELS[step]}
        </p>
      </nav>

      <div className="space-y-8">
        {step === 0 && (
          <StepOrgInfo
            contactName={contactName}
            email={email}
            errors={errors}
            onContactName={setContactName}
            onEmail={setEmail}
            onOrgName={setOrgName}
            onPhone={setPhone}
            orgName={orgName}
            phone={phone}
          />
        )}
        {step === 1 && (
          <StepDescription
            description={description}
            errors={errors}
            onDescription={setDescription}
          />
        )}
        {step === 2 && (
          <StepStorefront
            desiredSlug={desiredSlug}
            errors={errors}
            onSlugChange={(slug, status) => {
              setDesiredSlug(slug);
              setSlugStatus(status);
            }}
            slugStatus={slugStatus}
          />
        )}
        {step === 3 && (
          <StepRoaster
            backupRoasterId={backupRoasterId}
            desiredOrgPctPct={desiredOrgPctPct}
            errors={errors}
            onBackupRoaster={setBackupRoasterId}
            onDesiredOrgPctPct={setDesiredOrgPctPct}
            onPrimaryRoaster={setPrimaryRoasterId}
            orgPctMax={orgPctMax}
            orgPctMin={orgPctMin}
            primaryRoasterId={primaryRoasterId}
            roasters={roasters}
          />
        )}
        {step === 4 && (
          <StepTerms
            errors={errors}
            onTermsAccepted={setTermsAccepted}
            termsAccepted={termsAccepted}
          />
        )}

        {submitError ? (
          <div
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm"
            role="alert"
          >
            {submitError}
          </div>
        ) : null}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button
            className="min-h-[44px] min-w-[44px]"
            disabled={step === 0 || isPending}
            onClick={goBack}
            type="button"
            variant="outline"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          {step < TOTAL_STEPS - 1 ? (
            <Button
              className="min-h-[44px] min-w-[44px]"
              onClick={goNext}
              type="button"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="min-h-[44px] min-w-[44px]"
              disabled={isPending}
              onClick={handleSubmit}
              type="button"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit application"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
