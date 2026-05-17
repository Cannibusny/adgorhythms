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
import { runSequenceAutomation } from './jobs/sequenceRunner.js';

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'adgorhythms-crm', version: '1.0.0' });
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

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`ADgorhythms CRM server running on port ${PORT}`);
});

export default app;
