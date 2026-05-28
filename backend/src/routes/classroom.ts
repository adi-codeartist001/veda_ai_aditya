import { Router } from 'express';
import { startSession, teachMessage } from '../controllers/classroomController';
import { protect } from '../middleware/auth';

const router = Router();
router.post('/start', protect, startSession);
router.post('/teach', protect, teachMessage);
export default router;
