import React, { useState } from 'react';
import {
  Square,
  RectangleHorizontal,
  Grid,
  CheckCircle2,
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
} from 'lucide-react';
import { RATIO_OPTIONS } from '../utils/constants';

export const CropViewer = ({
  image,
  croppedResult,
  selectedRatio,
  onRatioChange,
  focusMode = 'ai',
  onFocusModeChange,
  isCropping = false,
}) => {
  const [viewMode, setViewMode] = useState('side-by-side'); // 'side-by-side' or 'slider'
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100 for before/after slider

  const activeOption =
    RATIO_OPTIONS.find((r) => r.id === selectedRatio) || RATIO_OPTIONS[0];

  return (
    <div className="preview-stage-container">
      {/* Target Aspect Ratio Selection Bar */}
      <div className="crop-controls-card">
        <div className="controls-section-title">
          <span>1. Select Target Aspect Ratio</span>
          <span className="auto-badge">
            <Sparkles size={13} />
            <span>AI Auto-Crops Instantly</span>
          </span>
        </div>

        {/* 4 Selectable Ratios: 1:1 (Default), 4:3, 16:9, 3:2 */}
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
                id={`ratio-btn-${opt.id.replace(':', '-')}`}
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

        {/* View Mode & AI Focus Mode Bar */}
        <div className="view-mode-bar">
          <div className="control-subgroup">
            <span className="control-group-title">Crop Intelligence:</span>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${focusMode === 'ai' ? 'active' : ''}`}
                onClick={() => onFocusModeChange('ai')}
                title="AI analyzes contrast & edges to find the subject"
              >
                <Bot size={13} />
                <span>AI Subject Focus</span>
              </button>

              <button
                type="button"
                className={`toggle-btn ${focusMode === 'center' ? 'active' : ''}`}
                onClick={() => onFocusModeChange('center')}
                title="Mathematical center crop"
              >
                <Target size={13} />
                <span>Center Focus</span>
              </button>

              <button
                type="button"
                className={`toggle-btn ${focusMode === 'top' ? 'active' : ''}`}
                onClick={() => onFocusModeChange('top')}
                title="Focus on upper region (Faces / Portraits)"
              >
                <Eye size={13} />
                <span>Portrait / Face</span>
              </button>
            </div>
          </div>

          <div className="control-subgroup">
            <span className="control-group-title">Comparison View:</span>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
                onClick={() => setViewMode('side-by-side')}
                title="Side by side view of original with cut overlay vs cropped result"
              >
                <Columns size={13} />
                <span>Side by Side</span>
              </button>

              <button
                type="button"
                className={`toggle-btn ${viewMode === 'slider' ? 'active' : ''}`}
                onClick={() => setViewMode('slider')}
                title="Interactive Before / After comparison slider"
              >
                <SplitSquareVertical size={13} />
                <span>Swipe Slider</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CROP COMPARISON ARENA */}
      {image ? (
        viewMode === 'side-by-side' ? (
          /* 1. SIDE-BY-SIDE DUAL PREVIEW */
          <div className="dual-preview-grid">
            {/* ORIGINAL PREVIEW WITH VISUAL CUTOUT OVERLAY */}
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
                {/* Original Image */}
                <img
                  src={image.previewUrl}
                  alt="Original"
                  className="preview-img-contain"
                />

                {/* VISUAL CROP OVERLAY MASK: Highlights kept region & darkens discarded strips */}
                {croppedResult?.cropRect && (
                  <div className="crop-mask-container">
                    {/* Kept Crop Window */}
                    <div
                      className="crop-keep-window"
                      style={{
                        left: `${croppedResult.cropRect.leftPercent}%`,
                        top: `${croppedResult.cropRect.topPercent}%`,
                        width: `${croppedResult.cropRect.widthPercent}%`,
                        height: `${croppedResult.cropRect.heightPercent}%`,
                      }}
                    >
                      {/* Corner crop handles */}
                      <span className="corner-bracket top-left" />
                      <span className="corner-bracket top-right" />
                      <span className="corner-bracket bottom-left" />
                      <span className="corner-bracket bottom-right" />

                      {/* AI Saliency Reticle */}
                      {focusMode === 'ai' && croppedResult.focalPoint && (
                        <div
                          className="ai-focal-reticle"
                          title="AI Detected Subject Focal Point"
                        >
                          <span className="reticle-dot" />
                          <span className="reticle-label">AI Subject</span>
                        </div>
                      )}

                      <div className="keep-window-badge">
                        <span>KEPT CROP ({activeOption.label})</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

                <div className="cut-indicator-bar">
                <Scissors size={13} color="var(--rose)" />
                <span>
                  {croppedResult?.cutWidth > 0
                    ? `Discarding ${croppedResult.cutWidth}px from width (${croppedResult.percentCut}% trimmed)`
                    : croppedResult?.cutHeight > 0
                    ? `Discarding ${croppedResult.cutHeight}px from height (${croppedResult.percentCut}% trimmed)`
                    : 'Exact match (0px trimmed)'}
                </span>
              </div>
            </div>

            {/* AUTO-CROPPED PREVIEW: PROMINENT FULL-BLEED TARGET RATIO SHAPE */}
            <div className="preview-column">
              <div className="preview-label-header cropped-header">
                <span className="preview-label-title">
                  <Crop size={15} color="var(--primary)" />
                  <span style={{ color: 'var(--primary)' }}>Auto Cropped Result ({activeOption.label})</span>
                </span>
                <span className="preview-label-meta highlight">
                  {croppedResult ? `${croppedResult.width} × ${croppedResult.height} px` : 'Rendering...'}
                </span>
              </div>

              {/* Box physically locked to target ratio with NO empty margins */}
              <div
                className="cropped-result-box"
                style={{
                  aspectRatio: activeOption.cssRatio,
                }}
              >
                {croppedResult ? (
                  <img
                    src={croppedResult.blobUrl}
                    alt="Auto Cropped"
                    className="cropped-result-img"
                  />
                ) : (
                  <div className="preview-empty-state" style={{ padding: '20px' }}>
                    <span className="spinner" style={{ width: 28, height: 28, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.85rem', marginTop: 10 }}>Auto-Cropping via AI Canvas...</span>
                  </div>
                )}

                <div className="distortion-free-tag">
                  <CheckCircle2 size={12} />
                  <span>Exact {activeOption.label} • Zero Distortion</span>
                </div>
              </div>

              <div className="cut-indicator-bar highlight">
                <Sparkles size={13} color="var(--primary)" />
                <span>
                  {focusMode === 'ai' ? '🤖 AI Subject Auto-Centered' : '🎯 Mathematically Centered'} • Retains {croppedResult?.percentRetained ?? 100}% frame
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* 2. INTERACTIVE BEFORE / AFTER SLIDER VIEW */
          <div className="slider-comparison-container">
            <div className="slider-header-info">
              <span>Drag the slider to compare Before (Original) vs After (Auto-Cropped)</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{sliderPos}% Cropped</span>
            </div>

            <div
              className="slider-stage"
              style={{
                aspectRatio: activeOption.cssRatio,
              }}
            >
              {/* Layer 1: Cropped Image (Revealed on Right) */}
              {croppedResult && (
                <img
                  src={croppedResult.blobUrl}
                  alt="Cropped After"
                  className="slider-img-after"
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
                />
                <div className="slider-tag before-tag">Original Uncropped</div>
              </div>

              <div className="slider-tag after-tag">Auto Cropped ({activeOption.label})</div>

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
              Upload an image above or select a sample from the gallery below to see instant automatic cropping.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
