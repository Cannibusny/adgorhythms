import { VIP_LIST_TAG, loadConfig } from '../config';
import type { SanitizedLead } from '../utils/leadSchema';

const KLAVIYO_PROFILES_URL = 'https://a.klaviyo.com/api/profiles/';

export class KlaviyoError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'KlaviyoError';
    this.status = status;
  }
}

interface KlaviyoProfileResponse {
  data?: { id?: string };
}

/**
 * Creates or updates a Klaviyo profile for the lead, tagging it as a VIP founding member.
 * Klaviyo returns 409 when the profile already exists; the duplicate id is patched instead.
 */
export async function upsertProfile(lead: SanitizedLead): Promise<string | undefined> {
  const config = loadConfig();
  const attributes = {
    email: lead.email,
    phone_number: lead.phone,
    first_name: lead.firstName,
    properties: {
      membership_tier: VIP_LIST_TAG,
      lead_source: lead.source,
      location: 'New Paltz, NY',
    },
  };

  const response = await fetch(KLAVIYO_PROFILES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${config.klaviyoApiKey}`,
      revision: config.klaviyoRevision,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ data: { type: 'profile', attributes } }),
  });

  if (response.status === 409) {
    const conflict = (await response.json()) as {
      errors?: { meta?: { duplicate_profile_id?: string } }[];
    };
    const duplicateId = conflict.errors?.[0]?.meta?.duplicate_profile_id;
    if (!duplicateId) {
      throw new KlaviyoError(409, 'Klaviyo reported a duplicate profile without an id');
    }
    return patchProfile(duplicateId, attributes);
  }

  if (!response.ok) {
    throw new KlaviyoError(response.status, `Klaviyo profile create failed: ${await response.text()}`);
  }

  const created = (await response.json()) as KlaviyoProfileResponse;
  return created.data?.id;
}

async function patchProfile(
  profileId: string,
  attributes: Record<string, unknown>,
): Promise<string> {
  const config = loadConfig();
  const response = await fetch(`${KLAVIYO_PROFILES_URL}${profileId}/`, {
    method: 'PATCH',
    headers: {
      Authorization: `Klaviyo-API-Key ${config.klaviyoApiKey}`,
      revision: config.klaviyoRevision,
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ data: { type: 'profile', id: profileId, attributes } }),
  });

  if (!response.ok) {
    throw new KlaviyoError(response.status, `Klaviyo profile update failed: ${await response.text()}`);
  }

  return profileId;
}
