import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';

import authRouter from './routes/auth';
import menuRouter from './routes/menu';
import ordersRouter from './routes/orders';
import tablesRouter from './routes/tables';
import adminRouter from './routes/admin';
import kdsRouter from './routes/kds';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json({ limit: '1mb' }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin/tables', tablesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/kds', kdsRouter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  // PostgreSQL unique constraint violation
  const pgErr = err as { code?: string; constraint?: string };
  if (pgErr.code === '23505') {
    const constraint = pgErr.constraint ?? '';
    if (constraint.includes('email')) {
      res.status(409).json({ error: 'EMAIL_TAKEN', message: 'An account with that email already exists.' });
      return;
    }
    if (constraint.includes('slug')) {
      res.status(409).json({ error: 'SLUG_TAKEN', message: 'That restaurant URL is already taken.' });
      return;
    }
    res.status(409).json({ error: 'DUPLICATE_ENTRY', message: 'A record with these details already exists.' });
    return;
  }

  res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
});

app.listen(PORT, () => {
  console.log(`OpenDiningApp API running on http://localhost:${PORT}`);
});

export default app;
