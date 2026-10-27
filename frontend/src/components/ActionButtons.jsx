import React, { useState } from 'react';
import { Database, Download, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { downloadCroppedImage } from '../utils/canvasCrop';
import { uploadImageToDatabase } from '../utils/api';
import { RATIO_OPTIONS } from './CropViewer';

export const ActionButtons = ({
  image,
  selectedRatio,
  imageRef,
  onImageSaved,
  onReset,
  onNotify,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!image) return null;

  const activeOption =
    RATIO_OPTIONS.find((r) => r.id === selectedRatio) || RATIO_OPTIONS[2];

  // Save original image to MongoDB Atlas GridFS
  const handleSaveToDatabase = async () => {
    if (image.isFromDatabase) {
      onNotify({
        type: 'info',
        title: 'Already in Database',
        message: 'This image is already stored securely in MongoDB Atlas GridFS.',
      });
      return;
    }

    if (!image.file) {
      onNotify({
        type: 'error',
        title: 'Save Failed',
        message: 'Original image file is missing.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const savedDoc = await uploadImageToDatabase(image.file, {
        width: image.width,
        height: image.height,
      });

      onImageSaved(savedDoc);
      onNotify({
        type: 'success',
        title: 'Saved to MongoDB GridFS',
        message: `"${image.name}" stored securely in database with metadata!`,
      });
    } catch (err) {
      console.error('Save to database error:', err);
      onNotify({
        type: 'error',
        title: 'Database Save Error',
        message: err.message || 'Failed to save image to MongoDB Atlas.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate and download client-side cropped image via HTML5 Canvas API
  const handleDownloadCropped = async () => {
    if (!imageRef.current) {
      onNotify({
        type: 'error',
        title: 'Download Failed',
        message: 'Image preview is not ready.',
      });
      return;
    }

    setIsDownloading(true);
    try {
      const result = await downloadCroppedImage({
        imageEl: imageRef.current,
        targetRatio: activeOption.ratio,
        targetRatioLabel: activeOption.label,
        originalFilename: image.name,
        mimeType: image.type,
      });

      onNotify({
        type: 'success',
        title: 'Cropped Image Downloaded',
        message: `Saved ${result.filename} (${result.width}×${result.height} px) without distortion!`,
      });
    } catch (err) {
      console.error('Download crop error:', err);
      onNotify({
        type: 'error',
        title: 'Download Error',
        message: err.message || 'Could not export cropped image from Canvas.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="glass-card">
      <div className="action-buttons-group">
        {/* Save to Database Button */}
        <button
          type="button"
          className="btn-action btn-save-db"
          onClick={handleSaveToDatabase}
          disabled={isSaving || image.isFromDatabase}
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="spinner" />
              <span>Saving to MongoDB GridFS...</span>
            </>
          ) : image.isFromDatabase ? (
            <>
              <CheckCircle size={18} />
              <span>Saved in MongoDB GridFS</span>
            </>
          ) : (
            <>
              <Database size={18} />
              <span>Save to Database</span>
            </>
          )}
        </button>

        {/* Download Cropped Image Button */}
        <button
          type="button"
          className="btn-action btn-download-crop"
          onClick={handleDownloadCropped}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 size={18} className="spinner" />
              <span>Rendering Canvas Crop...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>Download Cropped ({activeOption.label})</span>
            </>
          )}
        </button>

        {/* Clear / Upload Another Button */}
        <button
          type="button"
          className="btn-action btn-secondary"
          onClick={onReset}
        >
          <RefreshCw size={16} />
          <span>Choose Another Image</span>
        </button>
      </div>
    </div>
  );
};
