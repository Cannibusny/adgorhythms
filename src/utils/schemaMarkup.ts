import type { Client, Campaign, AgencySettings } from '../types';

export function buildOrganizationSchema(client: Client): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: client.businessName,
    description: `${client.businessType} business`,
  };

  if (client.website) {
    schema.url = client.website;
  }

  const sameAs: string[] = [];
  if (client.website) sameAs.push(client.website);
  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  return schema;
}

export function buildAgencySchema(agency: AgencySettings): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: agency.name || 'ADgorhythms',
    description: 'AI-Powered Marketing Agency',
  };

  if (agency.website) {
    schema.url = agency.website;
  }
  if (agency.email) {
    schema.email = agency.email;
  }
  if (agency.phone) {
    schema.telephone = agency.phone;
  }
  if (agency.location) {
    schema.address = {
      '@type': 'PostalAddress',
      name: agency.location,
    };
  }

  return schema;
}

export function buildSocialMediaPostingSchema(
  campaign: Campaign,
  client: Client,
  deliverableDescription: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline: deliverableDescription,
    articleBody: deliverableDescription,
    datePublished: campaign.startDate || new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Organization',
      name: client.businessName,
    },
  };
}

export function buildBlogPostingSchema(
  headline: string,
  body: string,
  clientName: string,
  publishDate?: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    articleBody: body,
    datePublished: publishDate || new Date().toISOString().split('T')[0],
    author: {
      '@type': 'Organization',
      name: clientName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ADgorhythms',
    },
  };
}

export function buildEmailMessageSchema(
  subject: string,
  bodyText: string,
  senderName: string,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'EmailMessage',
    about: subject,
    text: bodyText,
    sender: {
      '@type': 'Organization',
      name: senderName,
    },
  };
}

export function buildCampaignSchemas(
  campaign: Campaign,
  client: Client,
): Record<string, unknown>[] {
  const schemas: Record<string, unknown>[] = [];

  schemas.push(buildOrganizationSchema(client));

  for (const d of campaign.deliverables.slice(0, 20)) {
    schemas.push(buildSocialMediaPostingSchema(campaign, client, d.description));
  }

  return schemas;
}
