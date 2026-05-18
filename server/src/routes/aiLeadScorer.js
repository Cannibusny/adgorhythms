import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Score a lead with AI (simulated)
router.post('/score-lead/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { data: contact, error: cErr } = await supabase.from('contacts').select('*').eq('id', contactId).single();
    if (cErr || !contact) return res.status(404).json({ error: 'Contact not found' });

    const score = Math.floor(Math.random() * 60) + 40;
    const factors = [];
    if (contact.email) factors.push('Has valid email (+10)');
    if (contact.phone) factors.push('Has phone number (+8)');
    if (contact.company) factors.push('Company identified (+12)');
    if (contact.job_title) factors.push('Job title known (+10)');
    if (contact.lead_score > 50) factors.push('High engagement score (+15)');
    if (contact.lifecycle_stage === 'sql' || contact.lifecycle_stage === 'opportunity') factors.push('Advanced lifecycle stage (+20)');

    const actions = [
      score > 80 ? 'Schedule immediate demo call' : score > 60 ? 'Send personalized case study' : 'Add to nurture sequence',
      score > 70 ? 'Assign to senior sales rep' : 'Continue automated outreach',
      'Send relevant content based on industry',
    ];

    const probability = Math.min(95, score + Math.floor(Math.random() * 10));
    const closeDate = new Date(Date.now() + (100 - score) * 86400000 * 0.5).toISOString().split('T')[0];

    const { data, error } = await supabase.from('ai_lead_insights').insert({
      contact_id: contactId,
      score,
      score_explanation: `AI Score: ${score}/100. Factors: ${factors.join('; ')}`,
      predicted_conversion_probability: probability,
      predicted_close_date: closeDate,
      suggested_actions: actions,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get latest lead insights
router.get('/lead-insights/:contactId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('ai_lead_insights').select('*').eq('contact_id', req.params.contactId).order('calculated_at', { ascending: false }).limit(1).single();
    if (error) return res.status(404).json({ error: 'No insights found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get high-value leads
router.get('/high-value-leads', async (req, res) => {
  try {
    const { data, error } = await supabase.from('ai_lead_insights').select('*, contacts(id, email, first_name, last_name, company, lifecycle_stage)').order('score', { ascending: false }).limit(20);
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
