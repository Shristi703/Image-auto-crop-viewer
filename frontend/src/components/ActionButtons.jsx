import React, { useState } from 'react';
import { Database, Download, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { downloadBlob } from '../utils/canvasCrop';
import { uploadImageToDatabase } from '../utils/api';
import { RATIO_OPTIONS } from '../utils/constants';

export const ActionButtons = ({
  image,
  croppedResult,
  selectedRatio,
  onImageSaved,
  onReset,
  onNotify,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  if (!image) return null;

  const activeOption =
    RATIO_OPTIONS.find((r) => r.id === selectedRatio) || RATIO_OPTIONS[0];

  // Save original uncropped image to MongoDB Atlas GridFS
  const handleSaveToDatabase = async () => {
    if (image.isFromDatabase) {
      onNotify({
        type: 'info',
        title: 'Already in Database',
        message: 'This original image is already stored securely in MongoDB Atlas GridFS.',
      });
      return;
    }

    if (!image.file) {
      onNotify({
        type: 'error',
        title: 'Save Failed',
        message: 'Original image file buffer is missing.',
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

  // Instant download of the pre-rendered Canvas cropped Blob
  const handleDownloadCropped = () => {
    if (!croppedResult?.blob) {
      onNotify({
        type: 'error',
        title: 'Download Unavailable',
        message: 'Cropped image is still generating. Please wait a moment.',
      });
      return;
    }

    const nameWithoutExt = image.name.replace(/\.[^/.]+$/, '');
    const ratioSlug = activeOption.label.replace(':', 'x');
    const ext = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg';
    const downloadFilename = `${nameWithoutExt}_cropped_${ratioSlug}.${ext}`;

    downloadBlob(croppedResult.blob, downloadFilename);

    onNotify({
      type: 'success',
      title: 'Cropped Image Downloaded',
      message: `Downloaded ${downloadFilename} (${croppedResult.width}×${croppedResult.height} px, ${activeOption.label})!`,
    });
  };

  return (
    <div className="glass-card">
      <div className="action-buttons-group">
        {/* Download Cropped Image Button */}
        <button
          type="button"
          className="btn-action btn-download-crop"
          onClick={handleDownloadCropped}
          disabled={!croppedResult?.blob}
          id="btn-download-cropped"
        >
          <Download size={18} />
          <span>Download Cropped Image ({activeOption.label})</span>
        </button>

        {/* Save to Database Button */}
        <button
          type="button"
          className="btn-action btn-save-db"
          onClick={handleSaveToDatabase}
          disabled={isSaving || image.isFromDatabase}
          id="btn-save-db"
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
              <span>Save Original to Database</span>
            </>
          )}
        </button>

        {/* Clear / Upload Another Button */}
        <button
          type="button"
          className="btn-action btn-secondary"
          onClick={onReset}
          id="btn-choose-another"
        >
          <RefreshCw size={16} />
          <span>Choose Another Image</span>
        </button>
      </div>
    </div>
  );
};
