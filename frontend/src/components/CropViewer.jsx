import React from 'react';
import {
  Square,
  RectangleHorizontal,
  Grid,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Sliders,
  Crop,
  Layers,
} from 'lucide-react';

export const RATIO_OPTIONS = [
  {
    id: '1:1',
    label: '1:1',
    name: 'Square',
    ratio: 1 / 1,
    cssRatio: '1 / 1',
    description: 'Instagram, Avatars, Icons',
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
  croppedResult,
  selectedRatio,
  onRatioChange,
  isCropping = false,
}) => {
  const activeOption =
    RATIO_OPTIONS.find((r) => r.id === selectedRatio) || RATIO_OPTIONS[0];

  return (
    <div className="preview-stage-container">
      {/* Target Aspect Ratio Selection Bar */}
      <div className="crop-controls-card">
        <div className="controls-section-title">
          <span>Target Aspect Ratio</span>
          <span className="auto-badge">
            <Sparkles size={13} />
            <span>Auto-Crops Instantly</span>
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
      </div>

      {/* DUAL SIDE-BY-SIDE PREVIEWS: Original Image vs Auto Cropped Image */}
      {image ? (
        <div className="dual-preview-grid">
          {/* 1. ORIGINAL IMAGE PREVIEW */}
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
              <img
                src={image.previewUrl}
                alt="Original"
                className="preview-img-contain"
              />

              {/* Crop guide overlay box showing the center-crop slice */}
              {croppedResult && (
                <div
                  className="crop-slice-indicator"
                  style={{
                    aspectRatio: activeOption.cssRatio,
                  }}
                  title="Center crop slice region"
                >
                  <div className="crop-indicator-badge">Crop Region ({activeOption.label})</div>
                </div>
              )}
            </div>

            <div className="preview-footer-note">
              <span>Unmodified original image ({image.type ? image.type.replace('image/', '').toUpperCase() : 'IMAGE'})</span>
            </div>
          </div>

          {/* 2. AUTO-CROPPED IMAGE PREVIEW */}
          <div className="preview-column">
            <div className="preview-label-header cropped-header">
              <span className="preview-label-title">
                <Crop size={15} color="var(--primary)" />
                <span style={{ color: 'var(--primary)' }}>Auto Cropped Image</span>
              </span>
              <span className="preview-label-meta highlight">
                {croppedResult ? `${croppedResult.width} × ${croppedResult.height} px (${activeOption.label})` : 'Generating...'}
              </span>
            </div>

            <div
              className="preview-box cropped-box"
              style={{
                aspectRatio: activeOption.cssRatio,
              }}
            >
              {croppedResult ? (
                <img
                  src={croppedResult.blobUrl}
                  alt="Auto Cropped"
                  className="preview-img-contain"
                />
              ) : (
                <div className="preview-empty-state" style={{ padding: '20px' }}>
                  <span className="spinner" style={{ width: 24, height: 24, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.8rem', marginTop: 8 }}>Cropping via Canvas...</span>
                </div>
              )}

              {/* Verified Distortion-Free Watermark / Badge */}
              <div className="distortion-free-tag">
                <CheckCircle2 size={12} />
                <span>No Distortion • Exact {activeOption.label}</span>
              </div>
            </div>

            <div className="preview-footer-note highlight">
              <span>Real Canvas render • Retains {croppedResult?.percentRetained ?? 100}% of frame</span>
            </div>
          </div>
        </div>
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
