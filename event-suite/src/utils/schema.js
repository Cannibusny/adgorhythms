/**
 * Schema.org structured-data helpers.
 * Each function returns a plain object ready to be JSON.stringify'd
 * into a <script type="application/ld+json"> tag.
 */

const BASE_URL = process.env.BASE_URL || 'https://adgorhythms-event-suite.vercel.app';

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ADgorhythms',
    url: BASE_URL,
    logo: `${BASE_URL}/logo-full.png`,
    description:
      'AI-powered event management and marketing automation platform for promoters.',
    sameAs: [
      'https://www.instagram.com/cannibus_ny',
      'https://www.facebook.com/cannibusny',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: BASE_URL,
    },
  };
}

function eventSchema(event) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || event.name,
    startDate: new Date(event.event_date).toISOString(),
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        name: event.location,
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'ADgorhythms',
      url: BASE_URL,
    },
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };

  if (event.ticket_price > 0) {
    schema.offers = {
      '@type': 'Offer',
      price: String(event.ticket_price),
      priceCurrency: event.currency || 'USD',
      availability: 'https://schema.org/InStock',
      url: `${BASE_URL}/events/${event.id}`,
      validFrom: new Date().toISOString(),
    };
  }

  if (event.max_capacity) {
    schema.maximumAttendeeCapacity = event.max_capacity;
  }

  return schema;
}

function socialMediaPostingSchema(campaign) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    headline: campaign.name || campaign.headline,
    articleBody: campaign.description || campaign.body || '',
    datePublished: campaign.created_at
      ? new Date(campaign.created_at).toISOString()
      : new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'ADgorhythms',
      url: BASE_URL,
    },
    sharedContent: campaign.url
      ? { '@type': 'WebPage', url: campaign.url }
      : undefined,
  };
}

function injectSchemas(schemas) {
  return schemas
    .map(
      (s) =>
        `<script type="application/ld+json">${JSON.stringify(s)}</script>`
    )
    .join('\n  ');
}

module.exports = {
  organizationSchema,
  eventSchema,
  socialMediaPostingSchema,
  injectSchemas,
};
