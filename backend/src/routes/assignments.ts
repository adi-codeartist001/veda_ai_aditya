import { Router } from 'express';
import multer from 'multer';
import {
  createAssignment, getAssignment, listAssignments,
  regenerateAssignment, generateVariants, calibrateDifficulty,
  deleteAssignment, getSharedAssignment,
  createTemplate, listTemplates, deleteTemplate,
} from '../controllers/assignmentController';
import { protect } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Static routes FIRST (before /:id)
router.get('/shared/:token', getSharedAssignment);
router.get('/templates/list', protect, listTemplates);
router.post('/templates', protect, createTemplate);
router.delete('/templates/:id', protect, deleteTemplate);
router.post('/calibrate', protect, upload.single('file'), calibrateDifficulty);

// Main CRUD
router.post('/', protect, upload.single('file'), createAssignment);
router.get('/', protect, listAssignments);
router.get('/:id', protect, getAssignment);
router.delete('/:id', protect, deleteAssignment);
router.post('/:id/regenerate', protect, regenerateAssignment);
router.post('/:id/variants', protect, generateVariants);

export default router;
