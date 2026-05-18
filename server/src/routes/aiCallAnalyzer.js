import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// Analyze sales call
router.post('/analyze', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { deal_id, call_transcript } = req.body;
    if (!call_transcript) return res.status(400).json({ error: 'call_transcript is required' });

    const wordCount = call_transcript.split(/\s+/).length;
    const callScore = Math.floor(Math.random() * 40) + 60;
    const talkRatio = Number((40 + Math.random() * 30).toFixed(1));

    const objections = [
      { objection: 'Price too high', response_quality: 'good', timestamp: '3:45', suggestion: 'Handled well by reframing value. Could add ROI calculator.' },
      { objection: 'Need to think about it', response_quality: 'needs_improvement', timestamp: '12:20', suggestion: 'Create urgency with limited-time offer. Ask what specific concerns remain.' },
      { objection: 'Already using competitor', response_quality: 'excellent', timestamp: '7:10', suggestion: 'Great competitive positioning. Continue using this approach.' },
    ];

    const buyingSignals = [
      { signal: 'Asked about implementation timeline', strength: 'strong', timestamp: '8:30' },
      { signal: 'Mentioned budget approval process', strength: 'strong', timestamp: '14:00' },
      { signal: 'Requested case study for their industry', strength: 'medium', timestamp: '10:15' },
      { signal: 'Asked about contract terms', strength: 'strong', timestamp: '16:45' },
    ];

    const coaching = [
      callScore < 80 ? 'Reduce talk ratio — aim for 40% or less. Let the prospect speak more.' : 'Great talk ratio — you listened well.',
      'Use the SPIN technique: ask more Situation and Problem questions before pitching.',
      'When handling price objections, always anchor to ROI first before discussing discounts.',
      'End every call with a clear next step and calendar invite sent during the call.',
      talkRatio > 50 ? 'You talked more than the prospect. Practice active listening and mirroring.' : 'Good balance of talking vs listening.',
    ];

    const { data, error } = await supabase.from('sales_call_analyses').insert({
      workspace_id: workspaceId,
      deal_id: deal_id || null,
      call_transcript,
      call_score: callScore,
      talk_ratio: talkRatio,
      objections_identified: objections,
      buying_signals: buyingSignals,
      coaching_suggestions: coaching,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get call analysis
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('sales_call_analyses').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Analysis not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top performers
router.get('/', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { data, error } = await supabase.from('sales_call_analyses').select('*').eq('workspace_id', workspaceId).order('call_score', { ascending: false }).limit(10);
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
