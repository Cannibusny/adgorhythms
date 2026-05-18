import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cron from 'node-cron';

import contactsRouter from './routes/contacts.js';
import dealsRouter from './routes/deals.js';
import activitiesRouter from './routes/activities.js';
import campaignsRouter from './routes/campaigns.js';
import sequencesRouter from './routes/sequences.js';
import workflowsRouter from './routes/workflows.js';
import socialAccountsRouter from './routes/socialAccounts.js';
import socialPostsRouter from './routes/socialPosts.js';
import socialInboxRouter from './routes/socialInbox.js';
import hashtagsRouter from './routes/hashtags.js';
import competitorsRouter from './routes/competitors.js';
import { runSequenceAutomation } from './jobs/sequenceRunner.js';
import { publishScheduledPosts } from './jobs/postPublisher.js';
import aiGenerateRouter from './routes/aiGenerate.js';
import contentLibraryRouter from './routes/contentLibrary.js';
import brandVoiceRouter from './routes/brandVoice.js';
import contentTemplatesRouter from './routes/contentTemplates.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/contacts', contactsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/sequences', sequencesRouter);
app.use('/api/workflows', workflowsRouter);
app.use('/api/social/accounts', socialAccountsRouter);
app.use('/api/social/posts', socialPostsRouter);
app.use('/api/social/inbox', socialInboxRouter);
app.use('/api/hashtags', hashtagsRouter);
app.use('/api/competitors', competitorsRouter);
app.use('/api/ai', aiGenerateRouter);
app.use('/api/content/library', contentLibraryRouter);
app.use('/api/brand-voice', brandVoiceRouter);
app.use('/api/templates', contentTemplatesRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'adgorhythms', version: '3.0.0' });
});

// Sequence automation cron - daily at 9 AM UTC
cron.schedule('0 9 * * *', async () => {
  console.log('[CRON] Running sequence automation...');
  try {
    await runSequenceAutomation();
    console.log('[CRON] Sequence automation complete.');
  } catch (err) {
    console.error('[CRON] Sequence automation failed:', err);
  }
});

// Post publisher cron - every minute
cron.schedule('* * * * *', async () => {
  try {
    await publishScheduledPosts();
  } catch (err) {
    console.error('[CRON] Post publisher failed:', err);
  }
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ADgorhythms CRM server running on port ${PORT}`);
});

export default app;
