import type { Response } from 'express';

interface SseClient {
  restaurantId: string;
  res: Response;
}

const adminClients = new Set<SseClient>();
const kdsClients   = new Set<SseClient>();

function writeSse(client: SseClient, event: string, data: unknown): boolean {
  try {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

/** Register an admin SSE connection. Returns a cleanup function. */
export function addAdminClient(restaurantId: string, res: Response): () => void {
  const client: SseClient = { restaurantId, res };
  adminClients.add(client);
  return () => adminClients.delete(client);
}

/** Register a KDS SSE connection. Returns a cleanup function. */
export function addKdsClient(restaurantId: string, res: Response): () => void {
  const client: SseClient = { restaurantId, res };
  kdsClients.add(client);
  return () => kdsClients.delete(client);
}

/** Push an event to all admin connections for a restaurant. */
export function broadcastToAdmins(restaurantId: string, event: string, data: unknown): void {
  for (const client of adminClients) {
    if (client.restaurantId === restaurantId) {
      if (!writeSse(client, event, data)) adminClients.delete(client);
    }
  }
}

/** Push an event to all KDS connections for a restaurant. */
export function broadcastToKds(restaurantId: string, event: string, data: unknown): void {
  for (const client of kdsClients) {
    if (client.restaurantId === restaurantId) {
      if (!writeSse(client, event, data)) kdsClients.delete(client);
    }
  }
}

/** Push an event to both admin and KDS connections for a restaurant. */
export function broadcast(restaurantId: string, event: string, data: unknown): void {
  broadcastToAdmins(restaurantId, event, data);
  broadcastToKds(restaurantId, event, data);
}
