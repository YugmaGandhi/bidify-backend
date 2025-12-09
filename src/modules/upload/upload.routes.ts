import { Router } from 'express';
import { upload } from '../../config/multer'; // Reuse your existing multer config
import { uploadFile } from './upload.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();

// Only logged in users can upload files
router.post('/', authenticate, upload.single('image'), uploadFile);

export default router;