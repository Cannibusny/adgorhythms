import { Router } from 'express';
import { upsertProfile } from '../services/klaviyo';
import { sendWelcomeSms } from '../services/sms';
import { ValidationError, parseLead } from '../utils/leadSchema';

export const leadCaptureRouter = Router();

leadCaptureRouter.post('/lead-capture', async (req, res) => {
  let lead;
  try {
    lead = parseLead(req.body);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ success: false, message: 'Invalid lead payload', errors: error.details });
    }
    throw error;
  }

  try {
    await upsertProfile(lead);
  } catch (error) {
    console.error('Klaviyo profile upsert failed', error);
    return res.status(502).json({ success: false, message: 'Failed to log lead in Klaviyo' });
  }

  try {
    await sendWelcomeSms(lead.phone);
  } catch (error) {
    console.error('Twilio welcome SMS failed', error);
    return res.status(502).json({ success: false, message: 'Lead logged but SMS delivery failed' });
  }

  return res.status(200).json({ success: true, message: 'Lead logged and SMS triggered' });
});
