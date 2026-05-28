# VedaAI — AI Assessment Creator

> Full Stack Engineering Assignment | Built with Next.js 14 + Node.js + Groq AI

---

## Features

### Core (Assignment Requirements)
- ✅ JWT Authentication — Login / Register (multi-step, professional UI)
- ✅ Assignment creation — 2-step wizard, Figma-matched light UI
- ✅ File upload (PDF/TXT) with AI content extraction
- ✅ AI question generation (Groq llama3-70b) — structured JSON, no raw LLM output
- ✅ WebSocket real-time progress updates
- ✅ BullMQ background jobs + Redis caching
- ✅ MongoDB persistence (Atlas free tier)
- ✅ Proper validation (Zod backend, client-side checks)
- ✅ Redux/Zustand state management

### Bonus Features
- ✅ **Set A / Set B paper variants** — shuffled questions + MCQ options
- ✅ **Answer Key Toggle** — Student View vs Teacher View
- ✅ **Bloom's Taxonomy tags** — 6-level cognitive classification per question
- ✅ **Topic Gap Detector** — AI identifies uncovered syllabus areas
- ✅ **Assignment Templates** — save/reuse form settings (MongoDB + Zustand persist)
- ✅ **Auto-difficulty Calibration** — upload past paper → AI sets difficulty %
- ✅ **Student Share Link** — public read-only URL (WhatsApp-friendly)
- ✅ **Multilingual** — Hindi / English / Hinglish paper generation
- ✅ **Typewriter reveal animation** — sections animate in on result page
- ✅ **PDF Download** — clean @media print CSS, A4 paper look

### AI Mock Classroom (Unique Feature)
- ✅ **25 AI-powered virtual students** with real archetypes (bright, confused, bored, backbencher, overachiever...)
- ✅ **Voice input** — teacher speaks (Hindi/English/Hinglish via Web Speech API)
- ✅ **Animated expressions** — students show emotions based on teaching quality
- ✅ **Speech bubbles** — students ask questions and make comments in real time
- ✅ **Real-time engagement meter** — class mood tracked live
- ✅ **AI coaching feedback** — Groq analyses teaching and suggests improvements
- ✅ **Conversation memory** — multi-turn teaching session

---

## Setup Instructions

### 1. Prerequisites
- Node.js 20+
- Docker (for Redis) or local Redis
- Groq API key: [console.groq.com](https://console.groq.com) — free
- MongoDB Atlas: [cloud.mongodb.com](https://cloud.mongodb.com) — free M0

### 2. Quick Start

```bash
# Start Redis
docker run -d -p 6379:6379 redis:alpine

# Backend
cd backend
cp .env.example .env
# Set GROQ_API_KEY, MONGODB_URI, JWT_SECRET in .env
npm install
npm run dev       # Terminal 1 — API server (port 4000)
npm run worker    # Terminal 2 — BullMQ worker

# Frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev       # Terminal 3 — Next.js (port 3000)
```

### 3. Environment Variables

**Backend `.env`:**
```env
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vedaai
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---

## Architecture

```
┌──────────────────────────────────────────────┐
│              FRONTEND (Next.js 14)            │
│  /login  /register  (JWT auth)               │
│  /assignment  (list, create)                 │
│  /generate/:id  (WebSocket progress)         │
│  /assignment/:id/result  (structured paper)  │
│  /toolkit  (AI Mock Classroom + voice)       │
│  /share/:token  (public student view)        │
│                                              │
│  State: Zustand (authStore + assignmentStore)│
└──────────────┬───────────────────────────────┘
               │ HTTP + WebSocket
┌──────────────▼───────────────────────────────┐
│           BACKEND (Express + TypeScript)      │
│  POST /api/auth/register|login               │
│  GET  /api/auth/me                           │
│  POST /api/assignments  → BullMQ job         │
│  GET  /api/assignments/:id  → Redis cache    │
│  POST /api/classroom/start|teach             │
│  WS   /ws?jobId=xxx  → real-time updates     │
└──────┬──────────────┬────────────────────────┘
       │              │
┌──────▼──┐    ┌──────▼──────────────────────┐
│ MongoDB │    │  Redis + BullMQ Worker       │
│ Atlas   │    │  → Groq API (llama3-70b)     │
│ (data)  │    │  → Parse + validate JSON     │
└─────────┘    │  → WebSocket broadcast       │
               └──────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Zustand, Tailwind CSS |
| Auth | JWT + bcryptjs |
| Backend | Node.js, Express, TypeScript |
| AI | Groq (llama3-70b-8192) |
| Queue | BullMQ |
| Cache | Redis (ioredis) |
| Database | MongoDB Atlas + Mongoose |
| Realtime | WebSocket (ws library) |
| Voice | Web Speech API (built-in browser) |

---

## Future Roadmap

**AI Mock Classroom v2** — 3D animated student avatars, emotion detection from teacher's voice tone, classroom analytics dashboard, session recordings, and multiplayer mode where multiple teacher trainees practice simultaneously.
