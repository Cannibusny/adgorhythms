import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { z } from 'zod';

export const leadSchema = z.object({
  firstName: z.string().trim().min(1, 'firstName is required').max(100),
  email: z.string().trim().toLowerCase().email('email must be a valid email address'),
  phone: z.string().trim().min(1, 'phone is required'),
  source: z.string().trim().max(200).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export interface SanitizedLead {
  firstName: string;
  email: string;
  phone: string;
  source: string;
}

export class ValidationError extends Error {
  readonly details: string[];

  constructor(details: string[]) {
    super(details.join('; '));
    this.name = 'ValidationError';
    this.details = details;
  }
}

/** Normalizes a phone number to E.164, defaulting to the US region for local formats. */
export function toE164(phone: string): string | null {
  const parsed = parsePhoneNumberFromString(phone, 'US');
  if (!parsed || !parsed.isValid()) {
    return null;
  }
  return parsed.number;
}

export function parseLead(body: unknown): SanitizedLead {
  const result = leadSchema.safeParse(body);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`),
    );
  }

  const phone = toE164(result.data.phone);
  if (!phone) {
    throw new ValidationError(['phone: must be a valid phone number in E.164 format (e.g. +18455550123)']);
  }

  return {
    firstName: result.data.firstName,
    email: result.data.email,
    phone,
    source: result.data.source ?? 'website',
  };
}
