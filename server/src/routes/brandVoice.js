import { Router } from 'express';
import { supabase, DEFAULT_WORKSPACE_ID } from '../supabase.js';

const router = Router();

// Get workspace brand voice settings
router.get('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { data, error } = await supabase
      .from('ai_brand_voice')
      .select('*')
      .eq('workspace_id', workspace_id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.json(null);
    }
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update brand voice (upsert)
router.put('/', async (req, res) => {
  try {
    const workspace_id = req.headers['x-workspace-id'] || DEFAULT_WORKSPACE_ID;
    const { tone, industry, target_audience, key_values, avoid_words, sample_content } = req.body;

    const { data: existing } = await supabase
      .from('ai_brand_voice')
      .select('id')
      .eq('workspace_id', workspace_id)
      .single();

    const payload = {
      workspace_id,
      tone: tone || 'professional',
      industry,
      target_audience,
      key_values: key_values || [],
      avoid_words: avoid_words || [],
      sample_content,
      updated_at: new Date().toISOString(),
    };

    let data, error;
    if (existing) {
      ({ data, error } = await supabase
        .from('ai_brand_voice')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('ai_brand_voice')
        .insert(payload)
        .select()
        .single());
    }

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analyze sample content to suggest brand voice
router.post('/analyze', async (req, res) => {
  try {
    const { sample_content } = req.body;
    if (!sample_content) {
      return res.status(400).json({ error: 'sample_content is required' });
    }

    // Simulated analysis (would call Claude API in production)
    const words = sample_content.toLowerCase().split(/\s+/);
    const wordCount = words.length;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / wordCount;
    const hasExclamations = sample_content.includes('!');
    const hasQuestions = sample_content.includes('?');
    const hasEmoji = /[\u{1F600}-\u{1F64F}]/u.test(sample_content);

    let suggestedTone = 'professional';
    if (hasEmoji || hasExclamations) suggestedTone = 'playful';
    else if (avgWordLength > 6) suggestedTone = 'authoritative';
    else if (hasQuestions) suggestedTone = 'friendly';
    else if (avgWordLength < 4.5) suggestedTone = 'casual';

    res.json({
      analysis: {
        word_count: wordCount,
        avg_word_length: Math.round(avgWordLength * 10) / 10,
        has_exclamations: hasExclamations,
        has_questions: hasQuestions,
        has_emoji: hasEmoji,
      },
      suggestions: {
        tone: suggestedTone,
        key_values: ['quality', 'innovation', 'trust'],
        avoid_words: ['cheap', 'discount', 'free'],
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
