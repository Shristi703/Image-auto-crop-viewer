import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { getAspectRatioInfo } from '../utils/formatters';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ImageUploader = ({ onImageSelect, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError('Invalid format. Please select a JPG, PNG, or WebP image.');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE_BYTES) {
      onError('Image file size exceeds the 5 MB limit. Please select a smaller file.');
      return;
    }

    // Create object URL for immediate instant preview before database upload
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const ratioInfo = getAspectRatioInfo(width, height);

      onImageSelect({
        file,
        previewUrl: objectUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        width,
        height,
        aspectRatio: ratioInfo.label,
        aspectRatioText: ratioInfo.text,
        aspectRatioDecimal: ratioInfo.decimal,
        isFromDatabase: false,
        dbId: null,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      onError('Unable to parse the image file. Please try another image.');
    };

    img.src = objectUrl;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="upload-card">
      <div
        className={`dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          id="file-upload-input"
        />

        <div className="dropzone-icon-circle">
          <UploadCloud size={30} />
        </div>

        <h3 className="dropzone-title">Upload Image to Crop & View</h3>
        <p className="dropzone-hint">
          Drag and drop your image here, or browse from your device
        </p>

        <div className="upload-button-wrapper">
          <button
            type="button"
            className="btn-primary-choose"
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
          >
            <ImageIcon size={18} />
            <span>Choose Image</span>
          </button>
        </div>

        <div className="upload-formats">
          <span>Supported:</span>
          <span className="format-pill">JPG</span>
          <span className="format-pill">PNG</span>
          <span className="format-pill">WebP</span>
          <span>• Max 5 MB</span>
        </div>
      </div>
    </div>
  );
};
