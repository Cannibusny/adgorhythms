import dotenv from 'dotenv';

dotenv.config();

export interface AppConfig {
  port: number;
  klaviyoApiKey: string;
  klaviyoRevision: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
}

export const VIP_LIST_TAG = 'VIP-Founding-Member';

export const WELCOME_SMS_BODY =
  "Welcome to Cannibus NY! You're locked in as a VIP Founding Member. " +
  "We'll text you exclusive updates for our New Paltz grand opening.";

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    klaviyoApiKey: process.env.KLAVIYO_API_KEY ?? '',
    klaviyoRevision: process.env.KLAVIYO_API_REVISION ?? '2024-10-15',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? '',
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? '',
  };
}
