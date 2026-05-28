// Load env FIRST before anything else
const dotenv = require('dotenv');
dotenv.config();

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { generateAssessment } from '../services/aiService';
import { AssignmentModel } from '../models/Assignment';
import mongoose from 'mongoose';
import { wsManager } from '../utils/websocket';
import http from 'http';

const MONGODB_URI = process.env.MONGODB_URI!;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'assessment-generation';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

const server = http.createServer();
wsManager.init(server);

interface JobData {
  assignmentId: string;
  input: any;
}

async function processJob(job: Job<JobData>) {
  const { assignmentId, input } = job.data;

  const broadcast = (type: string, extra: any) => {
    try {
      wsManager.broadcast(job.id!, { type: type as any, jobId: job.id!, assignmentId, ...extra });
    } catch {}
  };

  try {
    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'processing' });
    broadcast('JOB_STATUS', { status: 'processing', progress: 5, message: 'Starting...' });

    const result = await generateAssessment(input, async (progress: number, message: string) => {
      await job.updateProgress(progress);
      broadcast('JOB_PROGRESS', { status: 'processing', progress, message });
    });

    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'completed', result });
    broadcast('JOB_COMPLETE', { status: 'completed', progress: 100, message: 'Paper ready!', result });
    return result;
  } catch (err: any) {
    const msg = err.message || 'Unknown error';
    await AssignmentModel.findByIdAndUpdate(assignmentId, { status: 'failed', error: msg });
    broadcast('JOB_ERROR', { status: 'failed', error: msg });
    throw err;
  }
}

async function start() {
  console.log('MONGODB_URI:', MONGODB_URI ? 'Found ✅' : 'Missing ❌');
  
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Worker MongoDB connected');

  const worker = new Worker<JobData>(QUEUE_NAME, processJob, {
    connection: connection as any,
    concurrency: 3,
  });

  worker.on('completed', j => console.log(`✅ Job ${j.id} done`));
  worker.on('failed', (j, e) => console.error(`❌ Job ${j?.id} failed:`, e.message));
  
  console.log('🚀 Worker started and waiting for jobs...');
}

start().catch(err => {
  console.error('Worker start failed:', err.message);
  process.exit(1);
});