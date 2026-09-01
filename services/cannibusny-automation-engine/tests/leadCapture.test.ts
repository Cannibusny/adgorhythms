import request from 'supertest';

jest.mock('../src/services/klaviyo', () => ({
  upsertProfile: jest.fn(),
  KlaviyoError: class KlaviyoError extends Error {},
}));

jest.mock('../src/services/sms', () => ({
  sendWelcomeSms: jest.fn(),
  SmsError: class SmsError extends Error {},
}));

import { createApp } from '../src/app';
import { WELCOME_SMS_BODY } from '../src/config';
import { upsertProfile } from '../src/services/klaviyo';
import { sendWelcomeSms } from '../src/services/sms';

const upsertProfileMock = upsertProfile as jest.MockedFunction<typeof upsertProfile>;
const sendWelcomeSmsMock = sendWelcomeSms as jest.MockedFunction<typeof sendWelcomeSms>;

const app = createApp();

const validLead = {
  firstName: 'Jamie',
  email: 'Jamie@Example.com',
  phone: '(845) 555-0123',
  source: 'grand-opening-landing',
};

beforeEach(() => {
  upsertProfileMock.mockResolvedValue('profile_123');
  sendWelcomeSmsMock.mockResolvedValue('SM123');
});

describe('POST /api/v1/lead-capture', () => {
  it('accepts a valid lead, upserts Klaviyo profile and sends the welcome SMS', async () => {
    const response = await request(app).post('/api/v1/lead-capture').send(validLead);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: 'Lead logged and SMS triggered' });
    expect(upsertProfileMock).toHaveBeenCalledWith({
      firstName: 'Jamie',
      email: 'jamie@example.com',
      phone: '+18455550123',
      source: 'grand-opening-landing',
    });
    expect(sendWelcomeSmsMock).toHaveBeenCalledWith('+18455550123');
  });

  it('defaults the source when it is omitted', async () => {
    const { source: _source, ...withoutSource } = validLead;

    const response = await request(app).post('/api/v1/lead-capture').send(withoutSource);

    expect(response.status).toBe(200);
    expect(upsertProfileMock).toHaveBeenCalledWith(expect.objectContaining({ source: 'website' }));
  });

  it.each([
    ['firstName', { email: validLead.email, phone: validLead.phone }],
    ['email', { firstName: validLead.firstName, phone: validLead.phone }],
    ['phone', { firstName: validLead.firstName, email: validLead.email }],
  ])('rejects a payload missing %s', async (field, payload) => {
    const response = await request(app).post('/api/v1/lead-capture').send(payload);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors.join(' ')).toContain(field);
    expect(upsertProfileMock).not.toHaveBeenCalled();
    expect(sendWelcomeSmsMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid email address', async () => {
    const response = await request(app)
      .post('/api/v1/lead-capture')
      .send({ ...validLead, email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.errors.join(' ')).toContain('email');
  });

  it.each(['12345', '+1 555', 'abcdefghij'])('rejects invalid phone format %s', async (phone) => {
    const response = await request(app).post('/api/v1/lead-capture').send({ ...validLead, phone });

    expect(response.status).toBe(400);
    expect(response.body.errors.join(' ')).toContain('phone');
    expect(sendWelcomeSmsMock).not.toHaveBeenCalled();
  });

  it('returns 502 when Klaviyo fails and never sends an SMS', async () => {
    upsertProfileMock.mockRejectedValue(new Error('klaviyo down'));

    const response = await request(app).post('/api/v1/lead-capture').send(validLead);

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ success: false, message: 'Failed to log lead in Klaviyo' });
    expect(sendWelcomeSmsMock).not.toHaveBeenCalled();
  });

  it('returns 502 when the SMS fails after the lead was logged', async () => {
    sendWelcomeSmsMock.mockRejectedValue(new Error('twilio down'));

    const response = await request(app).post('/api/v1/lead-capture').send(validLead);

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ success: false, message: 'Lead logged but SMS delivery failed' });
  });

  it('sends the exact approved welcome copy', () => {
    expect(WELCOME_SMS_BODY).toBe(
      "Welcome to Cannibus NY! You're locked in as a VIP Founding Member. We'll text you exclusive updates for our New Paltz grand opening.",
    );
  });
});

describe('health and routing', () => {
  it('exposes a health check', async () => {
    const response = await request(app).get('/healthz');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns 404 for unknown routes', async () => {
    const response = await request(app).get('/api/v1/unknown');
    expect(response.status).toBe(404);
  });
});
