"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/design-system/components/ui/button";
import { Form } from "@repo/design-system/components/ui/form";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { submitRoasterApplication } from "../_actions/submit-application";
import {
  type ApplicationFormData,
  applicationSchema,
  STEP_LABELS,
} from "../_lib/schema";
import { StepBusiness } from "./step-business";
import { StepCoffee } from "./step-coffee";
import { StepContact } from "./step-contact";
import { StepLocation } from "./step-location";
import { StepTerms } from "./step-terms";

const TOTAL_STEPS = STEP_LABELS.length;

const STEP_FIELDS: (keyof ApplicationFormData)[][] = [
  ["email", "contactName", "phone"],
  ["businessName", "website", "description"],
  ["city", "state"],
  ["coffeeInfo"],
  ["termsAccepted"],
];

function getProgressBarClassName(
  isComplete: boolean,
  isCurrent: boolean
): string {
  if (isComplete) {
    return "bg-primary";
  }

  if (isCurrent) {
    return "bg-primary/50";
  }

  return "bg-muted";
}

export function RoasterApplyForm() {
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      email: "",
      contactName: "",
      phone: "",
      businessName: "",
      website: "",
      description: "",
      city: "",
      state: undefined,
      coffeeInfo: "",
      termsAccepted: undefined as unknown as true,
    },
    mode: "onTouched",
  });

  const goNext = useCallback(async () => {
    const fields = STEP_FIELDS[step];
    const valid = await form.trigger(fields);
    if (valid) {
      setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
    }
  }, [form, step]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const onSubmit = useCallback((data: ApplicationFormData) => {
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitRoasterApplication(data);
      if (result.success) {
        setSubmitted(true);
      } else {
        setSubmitError(result.error);
      }
    });
  }, []);

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
        <h2 className="mt-6 font-semibold text-2xl">Application submitted</h2>
        <p className="mt-3 text-muted-foreground">
          Thanks for applying to be a Joe Perks roaster partner. We&apos;ll
          review your application and get back to you within{" "}
          <strong>2–3 business days</strong>.
        </p>
        <p className="mt-2 text-muted-foreground text-sm">
          A confirmation email has been sent to the address you provided.
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
            return (
              <li className="flex flex-1 items-center gap-2" key={label}>
                <div className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`h-1.5 w-full rounded-full transition-colors ${getProgressBarClassName(isComplete, isCurrent)}`}
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
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-muted-foreground text-xs sm:hidden">
          Step {step + 1} of {TOTAL_STEPS}: {STEP_LABELS[step]}
        </p>
      </nav>

      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
          {step === 0 && <StepContact form={form} />}
          {step === 1 && <StepBusiness form={form} />}
          {step === 2 && <StepLocation form={form} />}
          {step === 3 && <StepCoffee form={form} />}
          {step === 4 && <StepTerms form={form} />}

          {submitError && (
            <div
              className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive text-sm"
              role="alert"
            >
              {submitError}
            </div>
          )}

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
                type="submit"
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
        </form>
      </Form>
    </div>
  );
}
