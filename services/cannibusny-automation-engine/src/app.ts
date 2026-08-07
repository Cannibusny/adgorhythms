import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { leadCaptureRouter } from './routes/leadCapture';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json({ limit: '64kb' }));

  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1', leadCaptureRouter);

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
  });

  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  });

  return app;
}
