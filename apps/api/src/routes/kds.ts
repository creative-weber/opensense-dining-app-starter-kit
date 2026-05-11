import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { addKdsClient } from '../services/sseManager';

const router = Router();

// GET /api/kds/orders/stream — SSE live order feed for KDS screens
// Auth: same JWT used by admin (PIN-based KDS auth is Sprint 2)
router.get('/orders/stream', requireAuth, (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const remove = addKdsClient(req.auth!.restaurantId, res);

  // Keep-alive ping every 25 s
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { clearInterval(ping); remove(); }
  }, 25_000);

  req.on('close', () => { clearInterval(ping); remove(); });
});

export default router;
