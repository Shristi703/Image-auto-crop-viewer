import React, { useState } from 'react';
import {
  Square,
  RectangleHorizontal,
  Grid,
  Maximize2,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export const RATIO_OPTIONS = [
  {
    id: '1:1',
    label: '1:1',
    name: 'Square',
    ratio: 1 / 1,
    cssRatio: '1 / 1',
    description: 'Instagram, Avatars, Products',
  },
  {
    id: '4:3',
    label: '4:3',
    name: 'Standard',
    ratio: 4 / 3,
    cssRatio: '4 / 3',
    description: 'Tablets, Presentations, Medium Format',
  },
  {
    id: '16:9',
    label: '16:9',
    name: 'Widescreen',
    ratio: 16 / 9,
    cssRatio: '16 / 9',
    description: 'HD Screens, YouTube, Video Banners',
  },
  {
    id: '3:2',
    label: '3:2',
    name: 'Classic Photo',
    ratio: 3 / 2,
    cssRatio: '3 / 2',
    description: '35mm Film, DSLR Photography, Prints',
  },
];

export const CropViewer = ({
  image,
  selectedRatio,
  onRatioChange,
  fitMode,
  onFitModeChange,
  imageRef,
}) => {
  const [showGrid, setShowGrid] = useState(false);

  const activeOption =
    RATIO_OPTIONS.find((r) => r.id === selectedRatio) || RATIO_OPTIONS[2];

  return (
    <div className="preview-stage-container">
      {/* Ratio Controls & Mode Switcher */}
      <div className="crop-controls-card">
        <div className="controls-section-title">
          <span>Target Aspect Ratio</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)' }}>
            Zero Distortion Guarantee
          </span>
        </div>

        {/* 4 Standard Selectable Aspect Ratios */}
        <div className="aspect-ratio-grid">
          {RATIO_OPTIONS.map((opt) => {
            const isActive = selectedRatio === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`ratio-btn ${isActive ? 'active' : ''}`}
                onClick={() => onRatioChange(opt.id)}
                title={opt.description}
              >
                <div
                  className="ratio-shape-icon"
                  style={{
                    aspectRatio: opt.cssRatio,
                    height: opt.id === '1:1' ? '22px' : '18px',
                  }}
                />
                <span className="ratio-tag">{opt.label}</span>
                <span className="ratio-name">{opt.name}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Bar: Cover vs Contain Comparison & Grid Toggle */}
        <div className="view-mode-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Display Mode:
            </span>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${fitMode === 'cover' ? 'active' : ''}`}
                onClick={() => onFitModeChange('cover')}
                title="Auto crop image to fill target ratio (No distortion)"
              >
                <Maximize2 size={13} />
                <span>Cover (Cropped)</span>
              </button>
              <button
                type="button"
                className={`toggle-btn ${fitMode === 'contain' ? 'active' : ''}`}
                onClick={() => onFitModeChange('contain')}
                title="Fit whole image inside ratio container (Letterbox)"
              >
                <Eye size={13} />
                <span>Contain (Full)</span>
              </button>
            </div>
          </div>

          <label className="switch-label">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <Grid size={15} />
            <span>Rule of Thirds Grid</span>
          </label>
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div className="crop-viewport-wrapper">
        {image ? (
          <div
            className="crop-box"
            style={{
              aspectRatio: activeOption.cssRatio,
            }}
          >
            {/* The Image Element: strictly object-fit: cover or contain, object-position: center */}
            <img
              ref={imageRef}
              src={image.previewUrl}
              alt={image.name || 'Preview'}
              className="crop-preview-image"
              crossOrigin="anonymous"
              style={{
                objectFit: fitMode === 'cover' ? 'cover' : 'contain',
                objectPosition: 'center center',
              }}
            />

            {/* Optional Rule of Thirds Grid Overlay */}
            {showGrid && (
              <div className="thirds-grid-overlay">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="grid-cell" />
                ))}
              </div>
            )}

            {/* Subtle Center Alignment Crosshair */}
            <div className="center-crosshair" title="Center Anchor Point" />
          </div>
        ) : (
          <div className="preview-empty-state">
            <div className="empty-icon-circle">
              <RectangleHorizontal size={36} />
            </div>
            <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
              No image selected yet
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              Upload an image above or pick a sample from the gallery below to preview auto-crop.
            </p>
          </div>
        )}
      </div>

      {/* Viewport Footer Info */}
      {image && (
        <div className="stage-header">
          <div className="stage-badge-info">
            <span>Target Ratio: {activeOption.label} ({activeOption.name})</span>
            <span>•</span>
            <span>Mode: {fitMode === 'cover' ? 'Auto Center-Crop' : 'Letterbox Contain'}</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {fitMode === 'cover'
              ? 'CSS object-fit: cover applied without distortion'
              : 'CSS object-fit: contain showing full uncropped image'}
          </span>
        </div>
      )}
    </div>
  );
};
