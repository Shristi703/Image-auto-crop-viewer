import React from 'react';
import { Info, Check, Sparkles, Layers, Crop } from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import { RATIO_OPTIONS } from '../utils/constants';

export const ImageDetails = ({ image, croppedResult, selectedRatio }) => {
  if (!image) {
    return (
      <div className="glass-card">
        <h3 className="meta-panel-title">
          <Info size={18} />
          <span>Image & Crop Metrics</span>
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Select or upload an image to view real-time dimensions, aspect ratio calculations, and center-crop metrics.
        </p>
      </div>
    );
  }

  const activeRatioObj =
    RATIO_OPTIONS.find((r) => r.id === selectedRatio) || RATIO_OPTIONS[0];

  return (
    <div className="glass-card">
      <h3 className="meta-panel-title">
        <Info size={18} />
        <span>Image & Crop Metrics</span>
      </h3>

      {/* Side-by-side comparison stats */}
      <div className="meta-stats-grid">
        {/* Original Specs */}
        <div className="meta-stat-item">
          <div className="stat-label">
            <Layers size={11} style={{ display: 'inline', marginRight: 4 }} />
            Original Dimensions
          </div>
          <div className="stat-value">
            {image.width} × {image.height} <span style={{ fontSize: '0.72rem' }}>px</span>
          </div>
        </div>

        <div className="meta-stat-item">
          <div className="stat-label">Original Aspect Ratio</div>
          <div className="stat-value">
            {image.aspectRatioText || image.aspectRatio || 'Unknown'}
          </div>
        </div>

        {/* Cropped Specs */}
        <div className="meta-stat-item" style={{ borderColor: 'rgba(79, 70, 229, 0.3)', background: 'var(--bg-accent-soft)' }}>
          <div className="stat-label" style={{ color: 'var(--primary)' }}>
            <Crop size={11} style={{ display: 'inline', marginRight: 4 }} />
            Cropped Dimensions
          </div>
          <div className="stat-value stat-value-highlight">
            {croppedResult ? `${croppedResult.width} × ${croppedResult.height}` : 'Calculating...'} <span style={{ fontSize: '0.72rem' }}>px</span>
          </div>
        </div>

        <div className="meta-stat-item" style={{ borderColor: 'rgba(79, 70, 229, 0.3)', background: 'var(--bg-accent-soft)' }}>
          <div className="stat-label" style={{ color: 'var(--primary)' }}>Target Aspect Ratio</div>
          <div className="stat-value stat-value-highlight">
            {activeRatioObj.label} ({activeRatioObj.name})
          </div>
        </div>
      </div>

      {/* Real center-crop calculation card */}
      <div className="crop-comparison-card">
        <div className="comparison-header">
          <span>Center Crop Calculation</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Zero Distortion</span>
        </div>

        <div className="comparison-metrics">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Original Area Retained:</span>
            <strong style={{ color: 'var(--primary)' }}>
              {croppedResult?.percentRetained ?? 100}%
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Crop Offsets:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
              {croppedResult?.sourceX > 0
                ? `Horizontal: -${croppedResult.sourceX * 2} px (Centered)`
                : croppedResult?.sourceY > 0
                ? `Vertical: -${croppedResult.sourceY * 2} px (Centered)`
                : 'Exact Match (No Crop Needed)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Proportions Check:</span>
            <span style={{ color: 'var(--emerald)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Check size={13} strokeWidth={3} /> Natural (Not Stretched)
            </span>
          </div>
        </div>

        <div className="progress-bar-bg" title={`${croppedResult?.percentRetained ?? 100}% of original area retained`}>
          <div
            className="progress-bar-fill"
            style={{ width: `${croppedResult?.percentRetained ?? 100}%` }}
          />
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span><strong>File:</strong> {image.name}</span>
        <span>{formatBytes(image.size)}</span>
      </div>
    </div>
  );
};
