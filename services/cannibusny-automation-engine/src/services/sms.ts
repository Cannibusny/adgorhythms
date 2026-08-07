import twilio from 'twilio';
import { WELCOME_SMS_BODY, loadConfig } from '../config';

export class SmsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmsError';
  }
}

export async function sendWelcomeSms(toPhone: string): Promise<string> {
  const config = loadConfig();
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
    throw new SmsError('Twilio is not configured');
  }

  const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
  const message = await client.messages.create({
    body: WELCOME_SMS_BODY,
    from: config.twilioPhoneNumber,
    to: toPhone,
  });

  return message.sid;
}
