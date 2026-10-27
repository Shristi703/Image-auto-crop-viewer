import mongoose from 'mongoose';
import { Readable } from 'stream';
import sizeOf from 'image-size';
import { ImageMeta } from '../models/ImageMeta.js';
import { getBucket } from '../config/db.js';

/**
 * Helper to calculate greatest common divisor
 */
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Determine best matching or calculated aspect ratio representation
 */
function calculateAspectRatio(width, height) {
  if (!width || !height) return { label: 'Unknown', decimal: 1 };
  const decimal = parseFloat((width / height).toFixed(2));

  // Check known standard ratios with small tolerance
  if (Math.abs(decimal - 1.0) < 0.03) return { label: '1:1', decimal };
  if (Math.abs(decimal - 1.333) < 0.04) return { label: '4:3', decimal };
  if (Math.abs(decimal - 1.777) < 0.04) return { label: '16:9', decimal };
  if (Math.abs(decimal - 1.5) < 0.04) return { label: '3:2', decimal };
  if (Math.abs(decimal - 0.75) < 0.04) return { label: '3:4', decimal };
  if (Math.abs(decimal - 0.5625) < 0.04) return { label: '9:16', decimal };

  const divisor = gcd(Math.round(width), Math.round(height));
  const wRatio = Math.round(width / divisor);
  const hRatio = Math.round(height / divisor);

  if (wRatio <= 20 && hRatio <= 20) {
    return { label: `${wRatio}:${hRatio}`, decimal };
  }
  return { label: `${decimal}:1`, decimal };
}

/**
 * Upload an image to MongoDB GridFS & store metadata
 * @route POST /api/images
 */
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file was provided. Please choose a JPG, PNG, or WebP image.',
      });
    }

    const { buffer, originalname, mimetype, size } = req.file;

    // Detect image dimensions on the server
    let width = 0;
    let height = 0;
    try {
      const dimensions = sizeOf(buffer);
      width = dimensions.width || 0;
      height = dimensions.height || 0;
    } catch (dimErr) {
      console.warn('Could not extract dimensions via image-size:', dimErr.message);
      // Fallback: accept client provided width/height if available
      width = parseInt(req.body.width, 10) || 800;
      height = parseInt(req.body.height, 10) || 600;
    }

    const { label: aspectRatio, decimal: aspectRatioDecimal } = calculateAspectRatio(width, height);

    // Sanitize filename & create unique name for GridFS
    const timestamp = Date.now();
    const sanitizedName = originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const gridFsFilename = `${timestamp}-${sanitizedName}`;

    const bucket = getBucket();

    // Create GridFS upload stream
    const uploadStream = bucket.openUploadStream(gridFsFilename, {
      contentType: mimetype,
      metadata: {
        originalName: originalname,
        size,
        width,
        height,
        aspectRatio,
      },
    });

    // Pipe the in-memory buffer into GridFS
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    await new Promise((resolve, reject) => {
      readableStream
        .pipe(uploadStream)
        .on('error', (err) => reject(err))
        .on('finish', () => resolve());
    });

    // Save image metadata document in MongoDB
    const imageDoc = await ImageMeta.create({
      filename: gridFsFilename,
      originalName: originalname,
      mimeType: mimetype,
      size,
      width,
      height,
      aspectRatio,
      aspectRatioDecimal,
      gridFsFileId: uploadStream.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Image uploaded and stored in GridFS successfully.',
      data: {
        id: imageDoc._id,
        filename: imageDoc.filename,
        originalName: imageDoc.originalName,
        mimeType: imageDoc.mimeType,
        size: imageDoc.size,
        width: imageDoc.width,
        height: imageDoc.height,
        aspectRatio: imageDoc.aspectRatio,
        aspectRatioDecimal: imageDoc.aspectRatioDecimal,
        gridFsFileId: imageDoc.gridFsFileId,
        fileUrl: `/api/images/${imageDoc._id}/file`,
        createdAt: imageDoc.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in uploadImage:', error);
    next(error);
  }
};

/**
 * Get all stored image metadata records
 * @route GET /api/images
 */
export const getAllImages = async (req, res, next) => {
  try {
    const images = await ImageMeta.find().sort({ createdAt: -1 });

    const formatted = images.map((img) => ({
      id: img._id,
      filename: img.filename,
      originalName: img.originalName,
      mimeType: img.mimeType,
      size: img.size,
      width: img.width,
      height: img.height,
      aspectRatio: img.aspectRatio,
      aspectRatioDecimal: img.aspectRatioDecimal,
      gridFsFileId: img.gridFsFileId,
      fileUrl: `/api/images/${img._id}/file`,
      createdAt: img.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error('Error in getAllImages:', error);
    next(error);
  }
};

/**
 * Get single image metadata by ID
 * @route GET /api/images/:id
 */
export const getImageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID format.',
      });
    }

    const image = await ImageMeta.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image metadata not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: image._id,
        filename: image.filename,
        originalName: image.originalName,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,
        aspectRatio: image.aspectRatio,
        aspectRatioDecimal: image.aspectRatioDecimal,
        gridFsFileId: image.gridFsFileId,
        fileUrl: `/api/images/${image._id}/file`,
        createdAt: image.createdAt,
      },
    });
  } catch (error) {
    console.error('Error in getImageById:', error);
    next(error);
  }
};

/**
 * Stream binary image file directly from MongoDB GridFS
 * @route GET /api/images/:id/file
 */
export const getImageFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID format.',
      });
    }

    const imageMeta = await ImageMeta.findById(id);
    if (!imageMeta) {
      return res.status(404).json({
        success: false,
        message: 'Image record not found in database.',
      });
    }

    const bucket = getBucket();

    // Verify file exists in GridFS
    const files = await bucket.find({ _id: imageMeta.gridFsFileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Binary image file not found in GridFS storage.',
      });
    }

    // Set streaming headers
    res.setHeader('Content-Type', imageMeta.mimeType);
    res.setHeader('Content-Length', imageMeta.size);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(imageMeta.originalName)}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day client cache

    // Open download stream from GridFS and pipe to client response
    const downloadStream = bucket.openDownloadStream(imageMeta.gridFsFileId);

    downloadStream.on('error', (streamErr) => {
      console.error('Error streaming from GridFS:', streamErr);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Error streaming image from storage.',
        });
      }
      res.end();
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error in getImageFile:', error);
    next(error);
  }
};

/**
 * Delete image from GridFS and delete metadata
 * @route DELETE /api/images/:id
 */
export const deleteImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image ID format.',
      });
    }

    const imageMeta = await ImageMeta.findById(id);
    if (!imageMeta) {
      return res.status(404).json({
        success: false,
        message: 'Image not found.',
      });
    }

    const bucket = getBucket();
    try {
      await bucket.delete(imageMeta.gridFsFileId);
    } catch (gridErr) {
      console.warn('GridFS delete warning (file might have been removed already):', gridErr.message);
    }

    await ImageMeta.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully from database and GridFS storage.',
    });
  } catch (error) {
    console.error('Error in deleteImage:', error);
    next(error);
  }
};
