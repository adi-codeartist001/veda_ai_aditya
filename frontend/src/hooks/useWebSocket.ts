'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAssignmentStore } from '../store/assignmentStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export function useWebSocket(jobId?: string | null) {
  const ws = useRef<WebSocket | null>(null);
  const reconnect = useRef<NodeJS.Timeout>();
  const { setGenerationStatus, setWsConnected } = useAssignmentStore();

  const connect = useCallback(() => {
    try {
      const url = `${WS_URL}/ws${jobId ? `?jobId=${jobId}` : ''}`;
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => { setWsConnected(true); if (reconnect.current) clearTimeout(reconnect.current); };
      socket.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          switch (msg.type) {
            case 'JOB_STATUS':
            case 'JOB_PROGRESS':
              setGenerationStatus({ status: msg.status, progress: msg.progress || 0, message: msg.message || '' });
              break;
            case 'JOB_COMPLETE':
              setGenerationStatus({ status: 'completed', progress: 100, message: msg.message, result: msg.result });
              break;
            case 'JOB_ERROR':
              setGenerationStatus({ status: 'failed', error: msg.error });
              break;
          }
        } catch {}
      };
      socket.onclose = () => { setWsConnected(false); reconnect.current = setTimeout(connect, 3000); };
      socket.onerror = () => socket.close();
    } catch {}
  }, [jobId]);

  useEffect(() => {
    connect();
    return () => { if (reconnect.current) clearTimeout(reconnect.current); ws.current?.close(); };
  }, [connect]);
}
