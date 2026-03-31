"use client";

import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";

interface StepOrgInfoProps {
  readonly contactName: string;
  readonly email: string;
  readonly errors: Record<string, string>;
  readonly onContactName: (v: string) => void;
  readonly onEmail: (v: string) => void;
  readonly onOrgName: (v: string) => void;
  readonly onPhone: (v: string) => void;
  readonly orgName: string;
  readonly phone: string;
}

export function StepOrgInfo({
  orgName,
  contactName,
  email,
  phone,
  errors,
  onOrgName,
  onContactName,
  onEmail,
  onPhone,
}: StepOrgInfoProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-lg">Organization information</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Tell us about your organization and the best person to contact.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-name">Organization name *</Label>
        <Input
          className="min-h-[44px]"
          id="org-name"
          onChange={(e) => onOrgName(e.target.value)}
          placeholder="Lincoln Elementary PTA"
          value={orgName}
        />
        {errors.orgName ? (
          <p className="text-destructive text-sm">{errors.orgName}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-name">Contact name *</Label>
        <Input
          className="min-h-[44px]"
          id="contact-name"
          onChange={(e) => onContactName(e.target.value)}
          placeholder="Jordan Lee"
          value={contactName}
        />
        {errors.contactName ? (
          <p className="text-destructive text-sm">{errors.contactName}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-email">Email address *</Label>
        <Input
          className="min-h-[44px]"
          id="org-email"
          onChange={(e) => onEmail(e.target.value)}
          placeholder="jordan@lincolnpta.org"
          type="email"
          value={email}
        />
        {errors.email ? (
          <p className="text-destructive text-sm">{errors.email}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-phone">Phone number</Label>
        <Input
          className="min-h-[44px]"
          id="org-phone"
          onChange={(e) => onPhone(e.target.value)}
          placeholder="(555) 123-4567"
          type="tel"
          value={phone}
        />
        {errors.phone ? (
          <p className="text-destructive text-sm">{errors.phone}</p>
        ) : null}
      </div>
    </div>
  );
}
