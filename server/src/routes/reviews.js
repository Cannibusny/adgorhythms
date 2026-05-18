import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();
const WS = '00000000-0000-0000-0000-000000000001';

// --- REVIEW MONITORING ---

// Add business URL to monitor
router.post('/monitor', async (req, res) => {
  try {
    const { platform, business_url } = req.body;
    if (!platform || !business_url) return res.status(400).json({ error: 'platform and business_url required' });
    const { data, error } = await supabase.from('review_monitoring').insert({ workspace_id: WS, platform, business_url }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List monitored sources
router.get('/monitor', async (req, res) => {
  try {
    const { data, error } = await supabase.from('review_monitoring').select('*').eq('workspace_id', WS).order('last_checked', { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop monitoring
router.delete('/monitor/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('review_monitoring').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually sync reviews (simulated)
router.post('/sync', async (req, res) => {
  try {
    const { data: monitors } = await supabase.from('review_monitoring').select('*').eq('workspace_id', WS).eq('active', true);
    if (!monitors || monitors.length === 0) return res.json({ synced: 0 });

    const platforms = monitors.map((m) => m.platform);
    const names = ['Alex M.', 'Jordan T.', 'Sam K.', 'Taylor R.', 'Morgan B.', 'Casey L.', 'Riley P.', 'Drew H.'];
    const positiveTexts = [
      'Absolutely amazing service! Will definitely be back.',
      'Best experience I\'ve had. The team is incredibly professional.',
      'Exceeded all expectations. Highly recommend to everyone.',
      'Outstanding quality and fantastic customer support.',
    ];
    const neutralTexts = [
      'Decent experience overall. Some room for improvement.',
      'It was okay. Nothing special but not bad either.',
    ];
    const negativeTexts = [
      'Very disappointed with the service. Expected much better.',
      'Poor communication and long wait times. Needs improvement.',
    ];
    const newReviews = [];
    for (const platform of platforms) {
      const count = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < count; i++) {
        const rating = Math.floor(Math.random() * 5) + 1;
        let text;
        let sentiment;
        if (rating >= 4) { text = positiveTexts[Math.floor(Math.random() * positiveTexts.length)]; sentiment = 'positive'; }
        else if (rating === 3) { text = neutralTexts[Math.floor(Math.random() * neutralTexts.length)]; sentiment = 'neutral'; }
        else { text = negativeTexts[Math.floor(Math.random() * negativeTexts.length)]; sentiment = 'negative'; }

        newReviews.push({
          workspace_id: WS,
          platform,
          platform_review_id: `${platform}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          reviewer_name: names[Math.floor(Math.random() * names.length)],
          rating,
          review_text: text,
          review_date: new Date().toISOString().split('T')[0],
          sentiment,
        });
      }
    }
    if (newReviews.length > 0) {
      const { error } = await supabase.from('reviews').insert(newReviews);
      if (error) throw error;
    }
    await supabase.from('review_monitoring').update({ last_checked: new Date().toISOString() }).eq('workspace_id', WS).eq('active', true);
    res.json({ synced: newReviews.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REVIEWS ---

// List all reviews with filters
router.get('/', async (req, res) => {
  try {
    const { platform, rating, responded, sentiment } = req.query;
    let query = supabase.from('reviews').select('*').eq('workspace_id', WS).order('created_at', { ascending: false });
    if (platform) query = query.eq('platform', platform);
    if (rating) query = query.eq('rating', parseInt(rating));
    if (responded === 'true') query = query.eq('responded', true);
    if (responded === 'false') query = query.eq('responded', false);
    if (sentiment) query = query.eq('sentiment', sentiment);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI RESPONSE GENERATION ---

// Generate AI response draft (simulated)
router.post('/:id/generate-response', async (req, res) => {
  try {
    const { data: review, error: rErr } = await supabase.from('reviews').select('*').eq('id', req.params.id).single();
    if (rErr || !review) return res.status(404).json({ error: 'Review not found' });

    let draft;
    if (review.rating >= 4) {
      draft = `Thank you so much for your wonderful ${review.rating}-star review, ${review.reviewer_name || 'valued customer'}! We're thrilled to hear about your positive experience. Your kind words mean the world to our team, and we look forward to serving you again soon. - The Team`;
    } else if (review.rating === 3) {
      draft = `Thank you for your feedback, ${review.reviewer_name || 'valued customer'}. We appreciate you taking the time to share your experience. We'd love to learn more about how we can improve. Please don't hesitate to reach out to us directly so we can make your next visit exceptional. - The Team`;
    } else {
      draft = `We sincerely apologize for your experience, ${review.reviewer_name || 'valued customer'}. This is not the standard we hold ourselves to, and we take your feedback very seriously. We'd like to make this right - please contact us directly so we can resolve this for you. - The Team`;
    }

    const { data, error } = await supabase.from('review_responses').insert({
      review_id: review.id,
      ai_draft: draft,
    }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post response to platform (simulated)
router.post('/:id/post-response', async (req, res) => {
  try {
    const { response_text } = req.body;
    if (!response_text) return res.status(400).json({ error: 'response_text required' });

    const { error: rErr } = await supabase.from('reviews').update({
      responded: true,
      response_text,
      responded_at: new Date().toISOString(),
    }).eq('id', req.params.id);
    if (rErr) throw rErr;

    const { data: existing } = await supabase.from('review_responses').select('id').eq('review_id', req.params.id).order('created_at', { ascending: false }).limit(1).single();
    if (existing) {
      await supabase.from('review_responses').update({ final_response: response_text, posted: true, posted_at: new Date().toISOString() }).eq('id', existing.id);
    }
    res.json({ success: true, message: 'Response posted to platform (simulated)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REVIEW RECOVERY ---

// Trigger recovery campaign
router.post('/:id/recover', async (req, res) => {
  try {
    const { customer_email, offer_text } = req.body;
    if (!customer_email) return res.status(400).json({ error: 'customer_email required' });

    const { data: review } = await supabase.from('reviews').select('*').eq('id', req.params.id).single();
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const defaultOffer = review.rating <= 2
      ? '20% off your next visit as our sincere apology'
      : '10% off your next purchase - we want to make it right';

    const { data, error } = await supabase.from('review_recovery_campaigns').insert({
      review_id: req.params.id,
      customer_email,
      campaign_type: review.rating <= 2 ? 'urgent_recovery' : 'standard_recovery',
      offer_text: offer_text || defaultOffer,
      sent_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    res.status(201).json({ ...data, message: 'Recovery email sent (simulated)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recovery stats
router.get('/recovery-stats', async (req, res) => {
  try {
    const { data, error } = await supabase.from('review_recovery_campaigns').select('*');
    if (error) throw error;
    const total = (data || []).length;
    const recovered = (data || []).filter((c) => c.recovered).length;
    res.json({
      total_campaigns: total,
      recovered,
      recovery_rate: total > 0 ? Math.round((recovered / total) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- REVIEW REQUESTS ---

// Send review request (simulated)
router.post('/request', async (req, res) => {
  try {
    const { customer_email, customer_name, template } = req.body;
    if (!customer_email) return res.status(400).json({ error: 'customer_email required' });
    res.json({
      success: true,
      message: `Review request sent to ${customer_email} (simulated)`,
      customer_name: customer_name || 'Customer',
      template: template || 'default',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request stats (simulated)
router.get('/request-stats', async (_req, res) => {
  res.json({
    total_sent: Math.floor(Math.random() * 200) + 50,
    opened: Math.floor(Math.random() * 150) + 30,
    reviews_posted: Math.floor(Math.random() * 40) + 10,
    conversion_rate: (Math.random() * 20 + 5).toFixed(1),
  });
});

// --- REPUTATION DASHBOARD ---

// Overall stats
router.get('/stats', async (req, res) => {
  try {
    const { data, error } = await supabase.from('reviews').select('*').eq('workspace_id', WS);
    if (error) throw error;
    const reviews = data || [];
    const total = reviews.length;
    const avgRating = total > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1) : '0.0';
    const responded = reviews.filter((r) => r.responded).length;
    const positive = reviews.filter((r) => r.sentiment === 'positive').length;
    const neutral = reviews.filter((r) => r.sentiment === 'neutral').length;
    const negative = reviews.filter((r) => r.sentiment === 'negative').length;
    res.json({
      total_reviews: total,
      avg_rating: parseFloat(avgRating),
      response_rate: total > 0 ? Math.round((responded / total) * 100) : 0,
      sentiment: { positive, neutral, negative },
      by_platform: reviews.reduce((acc, r) => { acc[r.platform] = (acc[r.platform] || 0) + 1; return acc; }, {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rating trends (simulated)
router.get('/trends', async (_req, res) => {
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      avg_rating: (3.5 + Math.random() * 1.5).toFixed(1),
      review_count: Math.floor(Math.random() * 20) + 5,
    });
  }
  res.json({ trends: months });
});

// Competitor comparison (simulated)
router.get('/competitors', async (_req, res) => {
  res.json({
    competitors: [
      { name: 'Competitor A', avg_rating: (3.5 + Math.random()).toFixed(1), total_reviews: Math.floor(Math.random() * 300) + 50, response_rate: Math.floor(Math.random() * 40) + 30 },
      { name: 'Competitor B', avg_rating: (3.0 + Math.random() * 1.5).toFixed(1), total_reviews: Math.floor(Math.random() * 200) + 30, response_rate: Math.floor(Math.random() * 50) + 20 },
      { name: 'Competitor C', avg_rating: (2.5 + Math.random() * 2).toFixed(1), total_reviews: Math.floor(Math.random() * 150) + 20, response_rate: Math.floor(Math.random() * 60) + 10 },
    ],
  });
});

export default router;
