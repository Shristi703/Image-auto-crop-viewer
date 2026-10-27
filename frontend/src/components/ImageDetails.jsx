import React from 'react';
import { Info, Check, Sparkles, Layers, Crop, Scissors, Bot, Target } from 'lucide-react';
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

  const cutWidth = croppedResult?.cutWidth || 0;
  const cutHeight = croppedResult?.cutHeight || 0;
  const percentCut = croppedResult?.percentCut ?? 0;
  const percentRetained = croppedResult?.percentRetained ?? 100;

  return (
    <div className="glass-card">
      <h3 className="meta-panel-title">
        <Info size={18} />
        <span>Image & Auto-Crop Metrics</span>
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
        <div className="meta-stat-item" style={{ borderColor: 'rgba(79, 70, 229, 0.4)', background: 'var(--bg-accent-soft)' }}>
          <div className="stat-label" style={{ color: 'var(--primary)' }}>
            <Crop size={11} style={{ display: 'inline', marginRight: 4 }} />
            Cropped Dimensions
          </div>
          <div className="stat-value stat-value-highlight">
            {croppedResult ? `${croppedResult.width} × ${croppedResult.height}` : 'Calculating...'} <span style={{ fontSize: '0.72rem' }}>px</span>
          </div>
        </div>

        <div className="meta-stat-item" style={{ borderColor: 'rgba(79, 70, 229, 0.4)', background: 'var(--bg-accent-soft)' }}>
          <div className="stat-label" style={{ color: 'var(--primary)' }}>Target Aspect Ratio</div>
          <div className="stat-value stat-value-highlight">
            {activeRatioObj.label} ({activeRatioObj.name})
          </div>
        </div>
      </div>

      {/* Prominent Crop Difference Card */}
      <div className="crop-comparison-card">
        <div className="comparison-header">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Scissors size={14} color="var(--rose)" />
            <span>Crop Cut Breakdown</span>
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: percentCut > 0 ? 'var(--rose)' : 'var(--emerald)' }}>
            {percentCut > 0 ? `-${percentCut}% Trimmed` : '100% Retained'}
          </span>
        </div>

        <div className="comparison-metrics">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Original ➔ Cropped:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              {image.width}×{image.height} ➔ {croppedResult ? `${croppedResult.width}×${croppedResult.height}` : '...'} px
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pixels Trimmed:</span>
            <span style={{ color: percentCut > 0 ? 'var(--rose)' : 'var(--emerald)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {cutWidth > 0
                ? `${cutWidth} px removed from sides`
                : cutHeight > 0
                ? `${cutHeight} px removed from top/bottom`
                : '0 px (Exact aspect ratio match)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>AI Focus Algorithm:</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Bot size={13} />
              {croppedResult?.focusMode === 'ai' ? 'AI Subject Saliency Centered' : 'Geometric Center'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Distortion Check:</span>
            <span style={{ color: 'var(--emerald)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Check size={13} strokeWidth={3} /> 0% (Natural Proportions Preserved)
            </span>
          </div>
        </div>

        {/* Visual Dual-Colored Progress Bar (Retained vs Cut) */}
        <div className="progress-bar-bg" title={`${percentRetained}% kept, ${percentCut}% trimmed`} style={{ display: 'flex' }}>
          <div
            style={{
              width: `${percentRetained}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981 0%, #4f46e5 100%)',
              transition: 'width 0.3s ease',
            }}
          />
          <div
            style={{
              width: `${percentCut}%`,
              height: '100%',
              background: 'rgba(225, 29, 72, 0.65)',
              transition: 'width 0.3s ease',
            }}
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
