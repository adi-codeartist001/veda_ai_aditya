import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { WSMessage } from '../types';

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<WebSocket>> = new Map();

  init(server: import('http').Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      const jobId = url.searchParams.get('jobId') || 'global';

      if (!this.clients.has(jobId)) this.clients.set(jobId, new Set());
      this.clients.get(jobId)!.add(ws);

      ws.on('close', () => {
        this.clients.get(jobId)?.delete(ws);
        if (this.clients.get(jobId)?.size === 0) this.clients.delete(jobId);
      });
      ws.on('error', () => ws.close());

      // Keepalive ping
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.ping();
        else clearInterval(ping);
      }, 25000);
    });

    console.log('✅ WebSocket server ready');
  }

  broadcast(jobId: string, message: WSMessage) {
    const msg = JSON.stringify(message);
    const send = (clients?: Set<WebSocket>) =>
      clients?.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg); });
    send(this.clients.get(jobId));
    send(this.clients.get('global'));
  }
}

export const wsManager = new WebSocketManager();
