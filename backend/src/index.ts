import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { wsManager } from './utils/websocket';
import assignmentRoutes from './routes/assignments';
import authRoutes from './routes/auth';
import classroomRoutes from './routes/classroom';

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'VedaAI', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/classroom', classroomRoutes);

app.use('*', (_, res) => res.status(404).json({ success: false, error: 'Route not found' }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('✅ MongoDB connected');
  wsManager.init(server);
  server.listen(PORT, () => {
    console.log(`🚀 VedaAI running on :${PORT}`);
    console.log(`📡 WebSocket ready on ws://localhost:${PORT}/ws`);
  });
}
start().catch(err => { console.error(err); process.exit(1); });
