import React from 'react';
import { Info, Sparkles, Check, Database } from 'lucide-react';
import { formatBytes, getCroppedDimensions } from '../utils/formatters';
import { RATIO_OPTIONS } from './CropViewer';

export const ImageDetails = ({ image, selectedRatio }) => {
  if (!image) {
    return (
      <div className="glass-card">
        <h3 className="meta-panel-title">
          <Info size={18} />
          <span>Image Metadata Panel</span>
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Select or upload an image to view automatic dimensions, file size, and aspect ratio metrics.
        </p>
      </div>
    );
  }

  const activeRatioObj =
    RATIO_OPTIONS.find((r) => r.id === selectedRatio) || RATIO_OPTIONS[2];

  const croppedDims = getCroppedDimensions(
    image.width,
    image.height,
    activeRatioObj.ratio
  );

  return (
    <div className="glass-card">
      <h3 className="meta-panel-title">
        <Info size={18} />
        <span>Image & Crop Metadata</span>
      </h3>

      {/* Original Image Metadata */}
      <div className="meta-stats-grid">
        <div className="meta-stat-item">
          <div className="stat-label">Original Dimensions</div>
          <div className="stat-value">
            {image.width} × {image.height} <span style={{ fontSize: '0.75rem' }}>px</span>
          </div>
        </div>

        <div className="meta-stat-item">
          <div className="stat-label">Original Aspect Ratio</div>
          <div className="stat-value stat-value-highlight">
            {image.aspectRatioText || image.aspectRatio || 'Unknown'}
          </div>
        </div>

        <div className="meta-stat-item">
          <div className="stat-label">File Size</div>
          <div className="stat-value">{formatBytes(image.size)}</div>
        </div>

        <div className="meta-stat-item">
          <div className="stat-label">Format / Source</div>
          <div className="stat-value" style={{ textTransform: 'uppercase' }}>
            {image.type ? image.type.replace('image/', '') : 'PNG'}
            {image.isFromDatabase ? ' (GridFS)' : ' (Local)'}
          </div>
        </div>
      </div>

      {/* Target Crop Calculations */}
      <div className="crop-comparison-card">
        <div className="comparison-header">
          <span>Crop Output Target</span>
          <span>{activeRatioObj.label} ({activeRatioObj.name})</span>
        </div>

        <div className="comparison-metrics">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Target Dimensions:</span>
            <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
              {croppedDims.width} × {croppedDims.height} px
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Retained Image Area:</span>
            <strong style={{ color: 'var(--primary)' }}>
              {croppedDims.percentKept}%
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Distortion Check:</span>
            <span style={{ color: 'var(--emerald)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Check size={13} strokeWidth={3} /> 0% (Exact Proportions)
            </span>
          </div>
        </div>

        <div className="progress-bar-bg" title={`${croppedDims.percentKept}% frame retained`}>
          <div
            className="progress-bar-fill"
            style={{ width: `${croppedDims.percentKept}%` }}
          />
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <strong>File:</strong> {image.name}
      </div>
    </div>
  );
};
