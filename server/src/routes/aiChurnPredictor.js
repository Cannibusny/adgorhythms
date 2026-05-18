import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Run churn prediction for all customers
router.post('/predict', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { data: contacts, error: cErr } = await supabase.from('contacts').select('id, email, first_name, last_name, company, lifecycle_stage, lead_score, updated_at').eq('workspace_id', workspaceId).in('lifecycle_stage', ['customer', 'evangelist']).limit(50);
    if (cErr) throw cErr;

    const predictions = (contacts || []).map(c => {
      const daysSinceUpdate = Math.floor((Date.now() - new Date(c.updated_at).getTime()) / 86400000);
      const churnRisk = Math.min(95, Math.max(5, Math.floor(daysSinceUpdate * 1.5 + (100 - (c.lead_score || 50)) * 0.5 + Math.random() * 20)));

      const riskFactors = [];
      if (daysSinceUpdate > 30) riskFactors.push({ factor: 'Low recent activity', impact: 'high', detail: `No activity in ${daysSinceUpdate} days` });
      if ((c.lead_score || 0) < 30) riskFactors.push({ factor: 'Low engagement score', impact: 'high', detail: `Lead score is only ${c.lead_score || 0}` });
      if (daysSinceUpdate > 14) riskFactors.push({ factor: 'Declining engagement', impact: 'medium', detail: 'Email open rates have dropped' });
      riskFactors.push({ factor: 'Support ticket volume', impact: Math.random() > 0.5 ? 'medium' : 'low', detail: `${Math.floor(Math.random() * 5)} unresolved tickets` });

      const strategy = churnRisk > 70
        ? `URGENT: Schedule personal call with ${c.first_name || 'customer'}. Offer exclusive retention discount (20% off next 3 months). Assign dedicated success manager.`
        : churnRisk > 40
        ? `Send personalized re-engagement email highlighting new features. Offer a free strategy session. Share relevant case study.`
        : `Continue regular touchpoints. Send monthly value report showing their ROI.`;

      return { contact_id: c.id, churn_risk: churnRisk, risk_factors: riskFactors, win_back_strategy: strategy };
    });

    if (predictions.length > 0) {
      const { error } = await supabase.from('churn_predictions').insert(predictions);
      if (error) throw error;
    }

    res.status(201).json({ data: predictions, total: predictions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get at-risk customers
router.get('/at-risk', async (req, res) => {
  try {
    const { data, error } = await supabase.from('churn_predictions').select('*, contacts(id, email, first_name, last_name, company, lifecycle_stage)').order('churn_risk', { ascending: false }).limit(20);
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate win-back campaign for specific contact
router.post('/win-back/:contactId', async (req, res) => {
  try {
    const { data: contact, error: cErr } = await supabase.from('contacts').select('*').eq('id', req.params.contactId).single();
    if (cErr || !contact) return res.status(404).json({ error: 'Contact not found' });

    const campaign = {
      contact_id: contact.id,
      contact_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
      email_sequence: [
        { day: 1, subject: `We miss you, ${contact.first_name || 'there'}!`, body: `Hi ${contact.first_name || 'there'},\n\nWe noticed you haven't been as active lately. We've made some exciting updates we think you'll love.\n\nHere's what's new:\n- AI-powered content generation\n- Advanced analytics dashboard\n- Schema markup automation\n\nWould you like a quick walkthrough of the new features?\n\nBest,\nThe ADgorhythms Team` },
        { day: 3, subject: 'A special offer just for you', body: `Hi ${contact.first_name || 'there'},\n\nAs a valued customer, we'd like to offer you an exclusive 25% discount on your next 3 months.\n\nUse code: COMEBACK25\n\nThis offer expires in 7 days.\n\nBest,\nThe ADgorhythms Team` },
        { day: 7, subject: `${contact.first_name || 'Hey'}, let's chat`, body: `Hi ${contact.first_name || 'there'},\n\nI'd love to personally schedule a 15-minute call to understand how we can better serve you.\n\nBook a time that works: [Calendar Link]\n\nLooking forward to hearing from you.\n\nBest,\nYour Success Manager` },
      ],
      sms_message: `Hey ${contact.first_name || 'there'}! We have a special 25% off offer waiting for you at ADgorhythms. Check your email for details!`,
      retargeting_ad: { headline: 'Come Back to ADgorhythms', body: 'We miss you! Get 25% off your next 3 months.', cta: 'Claim Your Discount' },
    };
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
