import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

const SCHEMA_TYPES = ['Product', 'LocalBusiness', 'Article', 'FAQ', 'Review', 'Event'];

function generateSchemaFromType(type, data) {
  const base = { '@context': 'https://schema.org' };
  switch (type) {
    case 'Product':
      return { ...base, '@type': 'Product', name: data.name || '', description: data.description || '', image: data.image || '', brand: { '@type': 'Brand', name: data.brand || '' }, offers: { '@type': 'Offer', price: data.price || '0', priceCurrency: data.currency || 'USD', availability: 'https://schema.org/InStock' } };
    case 'LocalBusiness':
      return { ...base, '@type': 'LocalBusiness', name: data.name || '', description: data.description || '', address: { '@type': 'PostalAddress', streetAddress: data.street || '', addressLocality: data.city || '', addressRegion: data.state || '', postalCode: data.zip || '' }, telephone: data.phone || '', url: data.url || '' };
    case 'Article':
      return { ...base, '@type': 'Article', headline: data.headline || data.name || '', author: { '@type': 'Person', name: data.author || '' }, datePublished: data.datePublished || new Date().toISOString().split('T')[0], description: data.description || '', image: data.image || '' };
    case 'FAQ':
      return { ...base, '@type': 'FAQPage', mainEntity: (data.questions || []).map(q => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })) };
    case 'Review':
      return { ...base, '@type': 'Review', itemReviewed: { '@type': 'Thing', name: data.itemName || '' }, author: { '@type': 'Person', name: data.author || '' }, reviewRating: { '@type': 'Rating', ratingValue: data.rating || '5', bestRating: '5' }, reviewBody: data.body || '' };
    case 'Event':
      return { ...base, '@type': 'Event', name: data.name || '', startDate: data.startDate || '', endDate: data.endDate || '', location: { '@type': 'Place', name: data.location || '', address: data.address || '' }, description: data.description || '', organizer: { '@type': 'Organization', name: data.organizer || '' } };
    default:
      return { ...base, '@type': type, ...data };
  }
}

// Generate schema from type and data
router.post('/generate', (req, res) => {
  try {
    const { schema_type, data } = req.body;
    if (!schema_type || !SCHEMA_TYPES.includes(schema_type)) {
      return res.status(400).json({ error: `Invalid schema type. Must be one of: ${SCHEMA_TYPES.join(', ')}` });
    }
    const schema = generateSchemaFromType(schema_type, data || {});
    const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
    res.json({ schema, script_tag: scriptTag, schema_type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI auto-fill from URL (simulated)
router.post('/auto-fill', (req, res) => {
  try {
    const { url, schema_type } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    // Simulated extraction
    const domain = new URL(url).hostname.replace('www.', '');
    const autoData = {
      Product: { name: `Product from ${domain}`, description: `Premium product offered by ${domain}`, brand: domain, price: '99.99', currency: 'USD', image: `${url}/image.jpg` },
      LocalBusiness: { name: domain, description: `Local business at ${domain}`, phone: '(555) 123-4567', url, street: '123 Main St', city: 'New York', state: 'NY', zip: '10001' },
      Article: { headline: `Latest Article from ${domain}`, author: 'Editorial Team', datePublished: new Date().toISOString().split('T')[0], description: `In-depth article published by ${domain}`, image: `${url}/article-image.jpg` },
      FAQ: { questions: [{ question: `What does ${domain} offer?`, answer: `${domain} provides premium services and products.` }, { question: 'How do I get started?', answer: 'Visit our website and sign up for a free trial.' }, { question: 'What is your pricing?', answer: 'We offer plans starting at $29/month.' }] },
      Review: { itemName: `${domain} Service`, author: 'Verified Customer', rating: '5', body: `Excellent experience with ${domain}. Highly recommended!` },
      Event: { name: `${domain} Annual Conference`, startDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], endDate: new Date(Date.now() + 31 * 86400000).toISOString().split('T')[0], location: 'Convention Center', address: 'New York, NY', description: `Join us at the ${domain} annual event.`, organizer: domain },
    };
    const data = autoData[schema_type || 'Product'] || autoData.Product;
    const schema = generateSchemaFromType(schema_type || 'Product', data);
    res.json({ data, schema, schema_type: schema_type || 'Product' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate schema (simulated Google API validation)
router.post('/validate', (req, res) => {
  try {
    const { schema } = req.body;
    if (!schema) return res.status(400).json({ error: 'Schema JSON is required' });
    const errors = [];
    const warnings = [];
    if (!schema['@context']) errors.push('Missing @context property');
    if (!schema['@type']) errors.push('Missing @type property');
    if (schema['@type'] === 'Product' && !schema.name) warnings.push('Product should have a name');
    if (schema['@type'] === 'Product' && !schema.offers) warnings.push('Product should have offers/pricing');
    if (schema['@type'] === 'Article' && !schema.headline) warnings.push('Article should have a headline');
    if (schema['@type'] === 'Article' && !schema.author) warnings.push('Article should have an author');
    if (schema['@type'] === 'Event' && !schema.startDate) warnings.push('Event should have a startDate');
    res.json({ valid: errors.length === 0, errors, warnings, schema });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save schema to library
router.post('/library', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { name, schema_type, schema_data, script_tag } = req.body;
    if (!name || !schema_type) return res.status(400).json({ error: 'Name and schema_type are required' });
    const { data, error } = await supabase.from('schema_library').insert({ workspace_id: workspaceId, name, schema_type, schema_data, script_tag }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List saved schemas
router.get('/library', async (req, res) => {
  try {
    const workspaceId = req.headers['x-workspace-id'];
    const { data, error } = await supabase.from('schema_library').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete saved schema
router.delete('/library/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('schema_library').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get schema types
router.get('/types', (_req, res) => {
  res.json({ types: SCHEMA_TYPES.map(t => ({ type: t, description: `${t} structured data for Google rich snippets` })) });
});

export default router;
