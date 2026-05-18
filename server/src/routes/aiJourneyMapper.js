import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Map customer journey (simulated AI analysis)
router.post('/map-journey/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { data: contact, error: cErr } = await supabase.from('contacts').select('*').eq('id', contactId).single();
    if (cErr || !contact) return res.status(404).json({ error: 'Contact not found' });

    const journeyMap = [
      { stage: 'Awareness', channel: 'Organic Search', action: 'Visited blog post', date: new Date(Date.now() - 30 * 86400000).toISOString(), engagement: 'low' },
      { stage: 'Awareness', channel: 'Social Media', action: 'Clicked LinkedIn ad', date: new Date(Date.now() - 25 * 86400000).toISOString(), engagement: 'medium' },
      { stage: 'Interest', channel: 'Email', action: 'Opened welcome email', date: new Date(Date.now() - 20 * 86400000).toISOString(), engagement: 'medium' },
      { stage: 'Interest', channel: 'Website', action: 'Viewed pricing page', date: new Date(Date.now() - 15 * 86400000).toISOString(), engagement: 'high' },
      { stage: 'Consideration', channel: 'Email', action: 'Downloaded case study', date: new Date(Date.now() - 10 * 86400000).toISOString(), engagement: 'high' },
      { stage: 'Decision', channel: 'Direct', action: 'Booked demo call', date: new Date(Date.now() - 5 * 86400000).toISOString(), engagement: 'high' },
    ];

    const dropOffPoints = [
      { stage: 'Interest → Consideration', percentage: 35, reason: 'No follow-up after pricing page visit', suggestion: 'Trigger automated email with pricing comparison within 2 hours' },
      { stage: 'Consideration → Decision', percentage: 25, reason: 'Case study not tailored to industry', suggestion: 'Create industry-specific case studies and match to contact industry' },
    ];

    const improvements = [
      'Add retargeting pixel on pricing page to show ads within 24 hours',
      'Create an exit-intent popup with a special offer on the pricing page',
      'Send a personalized video from sales rep after case study download',
      'Reduce time between demo request and actual demo to under 24 hours',
    ];

    const { data, error } = await supabase.from('customer_journeys').insert({
      contact_id: contactId,
      journey_map: journeyMap,
      drop_off_points: dropOffPoints,
      suggested_improvements: improvements,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer journey
router.get('/journeys/:contactId', async (req, res) => {
  try {
    const { data, error } = await supabase.from('customer_journeys').select('*').eq('contact_id', req.params.contactId).order('analyzed_at', { ascending: false }).limit(1).single();
    if (error) return res.status(404).json({ error: 'No journey found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Drop-off analysis across all customers
router.get('/drop-off-analysis', async (req, res) => {
  try {
    const { data, error } = await supabase.from('customer_journeys').select('drop_off_points').order('analyzed_at', { ascending: false }).limit(50);
    if (error) throw error;
    const allDropOffs = (data || []).flatMap(d => d.drop_off_points || []);
    const aggregated = {};
    allDropOffs.forEach(dp => {
      if (!aggregated[dp.stage]) aggregated[dp.stage] = { stage: dp.stage, count: 0, totalPercentage: 0, reasons: [], suggestions: [] };
      aggregated[dp.stage].count++;
      aggregated[dp.stage].totalPercentage += dp.percentage;
      if (!aggregated[dp.stage].reasons.includes(dp.reason)) aggregated[dp.stage].reasons.push(dp.reason);
      if (!aggregated[dp.stage].suggestions.includes(dp.suggestion)) aggregated[dp.stage].suggestions.push(dp.suggestion);
    });
    const result = Object.values(aggregated).map(a => ({ ...a, avgPercentage: Math.round(a.totalPercentage / a.count) }));
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
