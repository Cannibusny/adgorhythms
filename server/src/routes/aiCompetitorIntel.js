import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

const UPDATE_TYPES = ['pricing_change', 'new_feature', 'ad_campaign', 'content_published', 'social_activity'];

// Enable monitoring for competitor (generates simulated intel)
router.post('/monitor', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { competitor_name } = req.body;
    if (!competitor_name) return res.status(400).json({ error: 'competitor_name is required' });

    const updates = [
      { workspace_id: workspaceId, competitor_name, update_type: 'pricing_change', details: `${competitor_name} reduced their Pro plan from $99/mo to $79/mo, likely to gain market share.`, ai_recommendation: 'Consider adding a limited-time promotion or highlighting unique features that justify your pricing.', detected_at: new Date(Date.now() - 2 * 86400000).toISOString() },
      { workspace_id: workspaceId, competitor_name, update_type: 'new_feature', details: `${competitor_name} launched an AI chatbot feature on their website for lead qualification.`, ai_recommendation: 'Accelerate your own chatbot development or emphasize your superior human touch in sales materials.', detected_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { workspace_id: workspaceId, competitor_name, update_type: 'ad_campaign', details: `${competitor_name} launched Google Ads campaign targeting "marketing automation for agencies" with estimated $5K/mo spend.`, ai_recommendation: 'Bid on the same keywords with differentiated ad copy. Highlight features they lack.', detected_at: new Date(Date.now() - 3 * 86400000).toISOString() },
      { workspace_id: workspaceId, competitor_name, update_type: 'content_published', details: `${competitor_name} published a comparison blog post positioning against your product. Getting significant social shares.`, ai_recommendation: 'Publish a detailed response comparison showing your advantages. Create a dedicated landing page.', detected_at: new Date(Date.now() - 1 * 86400000).toISOString() },
      { workspace_id: workspaceId, competitor_name, update_type: 'social_activity', details: `${competitor_name} gained 2,500 followers on LinkedIn this week, posting daily thought leadership content.`, ai_recommendation: 'Increase LinkedIn posting frequency. Share customer success stories and behind-the-scenes content.', detected_at: new Date().toISOString() },
    ];

    const { data, error } = await supabase.from('competitor_intel_updates').insert(updates).select();
    if (error) throw error;
    res.status(201).json({ data, message: `AI monitoring enabled for ${competitor_name}. ${updates.length} intel updates generated.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get competitor intel updates
router.get('/updates', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { competitor_name, update_type, limit = 20 } = req.query;
    let query = supabase.from('competitor_intel_updates').select('*').eq('workspace_id', workspaceId).order('detected_at', { ascending: false }).limit(Number(limit));
    if (competitor_name) query = query.eq('competitor_name', competitor_name);
    if (update_type) query = query.eq('update_type', update_type);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analyze competitor activity (simulated)
router.post('/analyze', async (req, res) => {
  try {
    const { competitor_name } = req.body;
    if (!competitor_name) return res.status(400).json({ error: 'competitor_name is required' });
    const analysis = {
      competitor_name,
      overall_threat_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      strengths: ['Strong brand recognition', 'Lower pricing tier', 'Active content marketing'],
      weaknesses: ['Limited AI features', 'No voice-to-content capability', 'Poor mobile experience'],
      opportunities: ['They lack appointment scheduling', 'No schema markup automation', 'Weak email analytics'],
      market_position: `${competitor_name} is positioned as a ${Math.random() > 0.5 ? 'budget' : 'mid-range'} alternative. Their recent moves suggest expansion into enterprise market.`,
      recommended_actions: [
        'Emphasize AI content generation as key differentiator',
        'Create comparison landing page targeting their brand keywords',
        'Offer migration incentive for their customers',
      ],
    };
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
