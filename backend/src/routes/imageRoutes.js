import express from 'express';
import {
  uploadImage,
  getAllImages,
  getImageById,
  getImageFile,
  deleteImage,
} from '../controllers/imageController.js';
import { handleUploadMiddleware } from '../middleware/upload.js';

const router = express.Router();

// Upload image and store in GridFS
router.post('/', handleUploadMiddleware, uploadImage);

// List all images metadata
router.get('/', getAllImages);

// Get single image metadata
router.get('/:id', getImageById);

// Stream binary image file directly from GridFS
router.get('/:id/file', getImageFile);

// Delete image from GridFS and metadata
router.delete('/:id', deleteImage);

export default router;
