import React from 'react';
import { Info, Check, Sparkles, Layers, Crop, Scissors, Bot, AlertTriangle } from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import { RATIO_OPTIONS } from '../utils/constants';

export const ImageDetails = ({ image, croppedResult, selectedRatio }) => {
  if (!image) {
    return (
      <div className="glass-card">
        <h3 className="meta-panel-title">
          <Info size={18} />
          <span>Image & AI Crop Metrics</span>
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Select or upload an image to view computer vision subject detection, dimensions, and framing metrics.
        </p>
      </div>
    );
  }

  const activeRatioObj =
    RATIO_OPTIONS.find((r) => r.id === selectedRatio) || RATIO_OPTIONS[0];

  const analysis = croppedResult?.analysis;
  const cutWidth = croppedResult?.cutWidth || 0;
  const cutHeight = croppedResult?.cutHeight || 0;
  const percentCut = croppedResult?.percentCut ?? 0;
  const percentRetained = croppedResult?.percentRetained ?? 100;

  return (
    <div className="glass-card">
      <h3 className="meta-panel-title">
        <Info size={18} />
        <span>Image & AI Crop Metrics</span>
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
            {croppedResult ? `${croppedResult.width} × ${croppedResult.height}` : 'Analyzing...'} <span style={{ fontSize: '0.72rem' }}>px</span>
          </div>
        </div>

        <div className="meta-stat-item" style={{ borderColor: 'rgba(79, 70, 229, 0.4)', background: 'var(--bg-accent-soft)' }}>
          <div className="stat-label" style={{ color: 'var(--primary)' }}>Target Aspect Ratio</div>
          <div className="stat-value stat-value-highlight">
            {activeRatioObj.label} ({activeRatioObj.name})
          </div>
        </div>
      </div>

      {/* AI Subject Detection Card */}
      {analysis && (
        <div className="ai-detection-details-card">
          <div className="detection-header">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
              <Bot size={15} color="var(--primary)" />
              <span>AI Computer Vision Analysis</span>
            </span>
            {typeof analysis.confidence === 'number' && analysis.confidence > 0 ? (
              <span className="confidence-pill">{analysis.confidence}% Confidence</span>
            ) : (
              <span className="confidence-pill" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                Saliency
              </span>
            )}
          </div>

          <div className="detection-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Identified Subject:</span>
              <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>
                {analysis.primarySubject}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Vision Pipeline:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600 }}>
                {analysis.detectionType === 'blazeface'
                  ? 'MediaPipe BlazeFace Face Detector'
                  : analysis.detectionType === 'coco'
                  ? 'TensorFlow COCO-SSD Object Detector'
                  : analysis.detectionType === 'product'
                  ? 'Foreground Product Contour Analyzer'
                  : analysis.detectionType === 'screenshot'
                  ? 'UI Document Layout Analyzer'
                  : 'Visual Contrast Saliency Fallback'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-muted)' }}>Subject Framing:</span>
              <span style={{ color: analysis.isSubjectClipped && !croppedResult?.containPadding ? 'var(--amber)' : 'var(--emerald)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {analysis.isSubjectClipped && !croppedResult?.containPadding ? (
                  <>
                    <AlertTriangle size={12} />
                    <span>Edge Clipped by Target Ratio</span>
                  </>
                ) : croppedResult?.containPadding ? (
                  <>
                    <Check size={13} strokeWidth={3} />
                    <span>Complete (Preserved with Smart Padding)</span>
                  </>
                ) : analysis.detectionType === 'blazeface' ? (
                  <>
                    <Check size={13} strokeWidth={3} />
                    <span>Complete (Face & Head Preserved)</span>
                  </>
                ) : analysis.subjectBBox?.isAnimal ? (
                  <>
                    <Check size={13} strokeWidth={3} />
                    <span>Complete (Ears & Body Preserved)</span>
                  </>
                ) : analysis.detectionType === 'product' ? (
                  <>
                    <Check size={13} strokeWidth={3} />
                    <span>Complete (Full Product Framed)</span>
                  </>
                ) : analysis.detectionType === 'screenshot' ? (
                  <>
                    <Check size={13} strokeWidth={3} />
                    <span>Complete (Readable UI Preserved)</span>
                  </>
                ) : (
                  <>
                    <Check size={13} strokeWidth={3} />
                    <span>Composition Balanced</span>
                  </>
                )}
              </span>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: '6px', marginTop: 8 }}>
              {analysis.detectionExplanation}
            </p>
          </div>
        </div>
      )}

      {/* Crop Breakdown Card */}
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
                : '0 px (Full frame preserved)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Proportions / Distortion:</span>
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
