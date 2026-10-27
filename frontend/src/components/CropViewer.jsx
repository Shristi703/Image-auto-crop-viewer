import React, { useState } from 'react';
import {
  Square,
  RectangleHorizontal,
  Grid,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Scissors,
  SplitSquareVertical,
  Columns,
  Layers,
  Crop,
  Eye,
  Sliders,
  Target,
  Bot,
  ShieldAlert,
  Maximize2,
} from 'lucide-react';
import { RATIO_OPTIONS } from '../utils/constants';

export const CropViewer = ({
  image,
  croppedResult,
  selectedRatio,
  onRatioChange,
  containPadding = false,
  onToggleContainPadding,
  isCropping = false,
}) => {
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'slider'
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100 for before/after slider

  const activeOption =
    RATIO_OPTIONS.find((r) => r.id === selectedRatio) || RATIO_OPTIONS[0];

  // Dynamic CSS ratio for the cropped container
  const dynamicCssRatio =
    croppedResult?.width && croppedResult?.height
      ? `${croppedResult.width} / ${croppedResult.height}`
      : activeOption.cssRatio || '1 / 1';

  const analysis = croppedResult?.analysis;

  return (
    <div className="preview-stage-container">
      {/* Target Aspect Ratio Selection Bar */}
      <div className="crop-controls-card">
        <div className="controls-section-title">
          <span>Target Crop Aspect Ratio</span>
          <span className="auto-badge">
            <Sparkles size={13} />
            <span>AI Content-Aware Active</span>
          </span>
        </div>

        {/* 5 Selectable Ratios: Smart Auto (Default), 1:1, 4:3, 16:9, 3:2 */}
        <div className="aspect-ratio-grid five-cols">
          {RATIO_OPTIONS.map((opt) => {
            const isActive = selectedRatio === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`ratio-btn ${isActive ? 'active' : ''} ${opt.isAuto ? 'smart-auto-btn' : ''}`}
                onClick={() => onRatioChange(opt.id)}
                title={opt.description}
                id={`ratio-btn-${opt.id.replace(':', '-')}`}
              >
                {opt.isAuto ? (
                  <div className="smart-auto-icon-badge">
                    <Bot size={18} />
                  </div>
                ) : (
                  <div
                    className="ratio-shape-icon"
                    style={{
                      aspectRatio: opt.cssRatio,
                      height: opt.id === '1:1' ? '22px' : '18px',
                    }}
                  />
                )}
                <span className="ratio-tag">{opt.label}</span>
                <span className="ratio-name">{opt.name}</span>
              </button>
            );
          })}
        </div>

        {/* AI Detection Explanation Banner */}
        {analysis && (
          <div className="ai-status-banner">
            <div className="ai-status-header">
              <span className="ai-status-tag">
                <Bot size={14} />
                <span>AI Vision: {analysis.primarySubject ? analysis.primarySubject.toUpperCase() : 'SCENERY'}</span>
              </span>
              {typeof analysis.confidence === 'number' && analysis.confidence > 0 && (
                <span className="ai-confidence-badge">
                  {analysis.confidence}% Confidence
                </span>
              )}
              <span className="ai-ratio-badge">
                Ratio: {analysis.chosenRatioId.toUpperCase()}
              </span>
            </div>
            <p className="ai-status-text">{analysis.detectionExplanation}</p>
            {analysis.ratioExplanation && (
              <p className="ai-ratio-text">{analysis.ratioExplanation}</p>
            )}

            {/* Warning if a manual ratio clips the subject + Smart Padding Mode */}
            {analysis.isSubjectClipped && selectedRatio !== 'auto' && (
              <div className="ai-clipped-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
                  <AlertTriangle size={16} color="var(--amber)" style={{ flexShrink: 0 }} />
                  <span>
                    Manual {selectedRatio} cuts off subject boundaries. Switch to <strong>Smart Auto</strong> or enable <strong>Smart Padding</strong>.
                  </span>
                </div>
                {onToggleContainPadding && (
                  <button
                    type="button"
                    className={`btn-secondary ${containPadding ? 'active' : ''}`}
                    onClick={() => onToggleContainPadding(!containPadding)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: '6px',
                      background: containPadding ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                      color: containPadding ? '#fff' : 'var(--text-main)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    id="btn-toggle-contain-padding"
                  >
                    <Maximize2 size={13} />
                    <span>{containPadding ? 'Smart Padding Active' : 'Fit With Smart Padding'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Comparison View Mode Toggle */}
        <div className="view-mode-bar">
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Comparison Layout:
          </span>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
              onClick={() => setViewMode('side-by-side')}
              title="Side by side comparison of original with detection vs cropped"
              id="view-toggle-side-by-side"
            >
              <Columns size={13} />
              <span>Side by Side</span>
            </button>

            <button
              type="button"
              className={`toggle-btn ${viewMode === 'slider' ? 'active' : ''}`}
              onClick={() => setViewMode('slider')}
              title="Interactive Before / After comparison slider"
              id="view-toggle-slider"
            >
              <SplitSquareVertical size={13} />
              <span>Swipe Slider</span>
            </button>
          </div>
        </div>
      </div>

      {/* CROP COMPARISON ARENA */}
      {image ? (
        viewMode === 'side-by-side' ? (
          /* 1. SIDE-BY-SIDE DUAL PREVIEW */
          <div className="dual-preview-grid">
            {/* ORIGINAL PREVIEW WITH VISUAL CUTOUT OVERLAY & SUBJECT BOUNDING BOX */}
            <div className="preview-column">
              <div className="preview-label-header">
                <span className="preview-label-title">
                  <Layers size={15} />
                  <span>Original Image</span>
                </span>
                <span className="preview-label-meta">
                  {image.width} × {image.height} px ({image.aspectRatioText || image.aspectRatio})
                </span>
              </div>

              <div className="preview-box original-box">
                {/* Image Wrapper matching exact image aspect ratio so overlays align 1:1 with pixels */}
                <div
                  className="original-image-wrapper"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      maxWidth: '100%',
                      maxHeight: '100%',
                      aspectRatio: `${image.width} / ${image.height}`,
                      width: image.width >= image.height ? '100%' : 'auto',
                      height: image.height > image.width ? '100%' : 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={image.previewUrl}
                      alt="Original"
                      className="preview-img-contain"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />

                    {/* OVERLAYS: Crop Window & Subject Bounding Box */}
                    {croppedResult?.cropRect && (
                      <div
                        className="crop-mask-container"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          pointerEvents: 'none',
                        }}
                      >
                        {/* 1. Kept Crop Window */}
                        <div
                          className="crop-keep-window"
                          style={{
                            position: 'absolute',
                            left: `${croppedResult.cropRect.leftPercent}%`,
                            top: `${croppedResult.cropRect.topPercent}%`,
                            width: `${croppedResult.cropRect.widthPercent}%`,
                            height: `${croppedResult.cropRect.heightPercent}%`,
                          }}
                        >
                          <span className="corner-bracket top-left" />
                          <span className="corner-bracket top-right" />
                          <span className="corner-bracket bottom-left" />
                          <span className="corner-bracket bottom-right" />

                          <div className="keep-window-badge">
                            <span>CROP ({activeOption.label})</span>
                          </div>
                        </div>

                        {/* 2. Detected Subject Bounding Box (cyan/green outline) */}
                        {croppedResult?.subjectRect &&
                          typeof croppedResult.subjectRect.rawWidthPercent === 'number' &&
                          croppedResult.subjectRect.rawWidthPercent > 0 &&
                          !isNaN(croppedResult.subjectRect.rawLeftPercent) && (
                            <div
                              className="subject-bounding-box"
                              style={{
                                position: 'absolute',
                                left: `${croppedResult.subjectRect.rawLeftPercent}%`,
                                top: `${croppedResult.subjectRect.rawTopPercent}%`,
                                width: `${croppedResult.subjectRect.rawWidthPercent}%`,
                                height: `${croppedResult.subjectRect.rawHeightPercent}%`,
                                border: '2px solid #06b6d4',
                                background: 'rgba(6, 182, 212, 0.12)',
                                borderRadius: '4px',
                                pointerEvents: 'none',
                              }}
                            >
                              <span
                                className="subject-box-tag"
                                style={{
                                  position: 'absolute',
                                  top: '-20px',
                                  left: 0,
                                  background: '#06b6d4',
                                  color: '#000',
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: '3px',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {analysis?.primarySubject}
                                {typeof analysis?.confidence === 'number' && analysis.confidence > 0
                                  ? ` (${analysis.confidence}%)`
                                  : ''}
                              </span>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="cut-indicator-bar">
                <Scissors size={13} color="var(--rose)" />
                <span>
                  {croppedResult?.containPadding
                    ? '100% of frame preserved with smart padding'
                    : croppedResult?.cutWidth > 0
                    ? `Discarding ${croppedResult.cutWidth}px from width (${croppedResult.percentCut}% trimmed)`
                    : croppedResult?.cutHeight > 0
                    ? `Discarding ${croppedResult.cutHeight}px from height (${croppedResult.percentCut}% trimmed)`
                    : 'Full frame preserved (0px trimmed)'}
                </span>
              </div>
            </div>

            {/* AUTO-CROPPED PREVIEW: PROMINENT FULL-BLEED TARGET RATIO SHAPE */}
            <div className="preview-column">
              <div className="preview-label-header cropped-header">
                <span className="preview-label-title">
                  <Crop size={15} color="var(--primary)" />
                  <span style={{ color: 'var(--primary)' }}>
                    AI Smart Cropped ({activeOption.label})
                  </span>
                </span>
                <span className="preview-label-meta highlight">
                  {croppedResult ? `${croppedResult.width} × ${croppedResult.height} px` : 'Analyzing...'}
                </span>
              </div>

              <div
                className="cropped-result-box"
                style={{
                  aspectRatio: dynamicCssRatio,
                }}
              >
                {croppedResult ? (
                  <img
                    src={croppedResult.blobUrl}
                    alt="AI Smart Cropped"
                    className="cropped-result-img"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                ) : (
                  <div className="preview-empty-state" style={{ padding: '20px' }}>
                    <span
                      className="spinner"
                      style={{
                        width: 28,
                        height: 28,
                        border: '3px solid var(--primary)',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', marginTop: 10 }}>Running AI Computer Vision Analysis...</span>
                  </div>
                )}

                <div className="distortion-free-tag">
                  <CheckCircle2 size={12} />
                  <span>Subject Preserved • Zero Distortion</span>
                </div>
              </div>

              <div className="cut-indicator-bar highlight">
                <Sparkles size={13} color="var(--primary)" />
                <span>
                  {analysis?.primarySubject ? `Framing centered on ${analysis.primarySubject}` : 'Content balanced'} • Retains {croppedResult?.percentRetained ?? 100}% of frame
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* 2. INTERACTIVE BEFORE / AFTER SLIDER VIEW */
          <div className="slider-comparison-container">
            <div className="slider-header-info">
              <span>Drag slider to compare Before (Original) vs After (AI Smart Cropped)</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{sliderPos}% Cropped</span>
            </div>

            <div
              className="slider-stage"
              style={{
                aspectRatio: dynamicCssRatio,
              }}
            >
              {/* Layer 1: Cropped Image (Revealed on Right) */}
              {croppedResult && (
                <img
                  src={croppedResult.blobUrl}
                  alt="Cropped After"
                  className="slider-img-after"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}

              {/* Layer 2: Original Image (Clipped by sliderPos on Left) */}
              <div
                className="slider-before-clipper"
                style={{
                  width: `${sliderPos}%`,
                }}
              >
                <img
                  src={image.previewUrl}
                  alt="Original Before"
                  className="slider-img-before"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="slider-tag before-tag">Original Uncropped</div>
              </div>

              <div className="slider-tag after-tag">AI Smart Cropped ({activeOption.label})</div>

              {/* The Draggable Divider Handle */}
              <div
                className="slider-divider-line"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="slider-handle-circle">
                  <span>⇄</span>
                </div>
              </div>

              {/* Range input for smooth touch and mouse scrubbing */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="slider-scrubber-input"
              />
            </div>
          </div>
        )
      ) : (
        <div className="crop-viewport-wrapper">
          <div className="preview-empty-state">
            <div className="empty-icon-circle">
              <RectangleHorizontal size={36} />
            </div>
            <p style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
              No image selected yet
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              Upload any image above to see real-time AI subject detection and content-aware cropping.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
