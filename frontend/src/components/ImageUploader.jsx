import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles } from 'lucide-react';
import { getAspectRatioInfo } from '../utils/formatters';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const TEST_PRESETS = [
  {
    id: 'cat',
    label: '🐱 Cat Portrait',
    file: '/samples/cat-portrait.jpg',
    name: 'Ginger Cat Portrait (Ears & Body).jpg',
  },
  {
    id: 'human',
    label: '👤 Human Portrait',
    file: '/samples/human-portrait.jpg',
    name: 'Professional Headshot Portrait.jpg',
  },
  {
    id: 'landscape',
    label: '🏞️ Scenic Landscape',
    file: '/samples/landscape.jpg',
    name: 'Alpine Lake & Mountains Horizon.jpg',
  },
  {
    id: 'ui',
    label: '💻 UI Screenshot',
    file: '/samples/website-screenshot.jpg',
    name: 'DataSphere Dashboard Screenshot.jpg',
  },
  {
    id: 'product',
    label: '🎧 Product Shot',
    file: '/samples/product-photo.jpg',
    name: 'Wireless ANC Headphones Product.jpg',
  },
];

export const ImageUploader = ({ onImageSelect, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState(null);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError('Invalid format. Please select a JPG, PNG, or WebP image.');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      onError('Image file size exceeds limit. Please select a smaller file.');
      return;
    }

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

  const loadPreset = async (preset) => {
    setLoadingPreset(preset.id);
    try {
      const response = await fetch(preset.file);
      const blob = await response.blob();
      const file = new File([blob], preset.name, { type: blob.type || 'image/jpeg' });
      processFile(file);
    } catch (err) {
      console.error('Failed to load preset:', err);
      onError(`Failed to load preset "${preset.label}".`);
    } finally {
      setLoadingPreset(null);
    }
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
          Drag and drop any image from your computer, or click below to browse
        </p>

        <div className="upload-button-wrapper">
          <button
            type="button"
            className="btn-primary-choose"
            onClick={(e) => {
              e.stopPropagation();
              triggerFileInput();
            }}
            id="btn-choose-file"
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
          <span>• Max 10 MB</span>
        </div>
      </div>

      {/* Quick Test Presets for Interviewers and Testing */}
      <div
        className="sample-presets-bar"
        style={{
          marginTop: '14px',
          padding: '12px 16px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          <Sparkles size={14} color="var(--primary)" />
          <span>Quick Test Categories:</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TEST_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="btn-secondary"
              onClick={() => loadPreset(p)}
              disabled={loadingPreset === p.id}
              style={{
                fontSize: '0.78rem',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              id={`preset-btn-${p.id}`}
            >
              {loadingPreset === p.id ? 'Loading...' : p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
