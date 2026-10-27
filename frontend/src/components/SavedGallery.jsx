import React from 'react';
import {
  Image as ImageIcon,
  Trash2,
  Crop,
  RefreshCw,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import { formatBytes, getAspectRatioInfo } from '../utils/formatters';
import { getGridFsImageUrl } from '../utils/api';

export const SavedGallery = ({
  images = [],
  activeImageId = null,
  onSelectImage,
  onDeleteImage,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <section className="gallery-section">
      <div className="gallery-header">
        <div className="gallery-title-wrapper">
          <h2 className="gallery-title">MongoDB Saved Images Gallery</h2>
          <span className="gallery-count-badge">
            {images.length} {images.length === 1 ? 'image' : 'images'}
          </span>
        </div>

        <button
          type="button"
          className="btn-action btn-secondary"
          style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {images.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div className="empty-icon-circle" style={{ margin: '0 auto 16px' }}>
            <FolderOpen size={32} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
            No saved images yet
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto' }}>
            Upload an image using the box above and click "Save to Database" to store it securely in MongoDB Atlas GridFS.
          </p>
        </div>
      ) : (
        <div className="gallery-grid">
          {images.map((item) => {
            const isActive = activeImageId === item.id;
            const fileStreamUrl = getGridFsImageUrl(item.id);
            const ratioInfo = getAspectRatioInfo(item.width, item.height);

            const formattedDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Stored';

            return (
              <div
                key={item.id}
                className={`gallery-card ${isActive ? 'active-preview' : ''}`}
              >
                {/* Thumbnail streamed dynamically from MongoDB GridFS */}
                <div
                  className="gallery-thumb-wrapper"
                  onClick={() => onSelectImage(item)}
                  title="Click to preview & auto-crop"
                >
                  <img
                    src={fileStreamUrl}
                    alt={item.originalName}
                    className="gallery-thumb"
                    loading="lazy"
                    crossOrigin="anonymous"
                  />
                  <div className="gallery-card-badge">
                    {ratioInfo.label}
                  </div>
                  {isActive && (
                    <div className="gallery-active-tag">Active</div>
                  )}
                </div>

                <div className="gallery-card-body">
                  <div className="gallery-card-name" title={item.originalName}>
                    {item.originalName}
                  </div>

                  <div className="gallery-card-meta">
                    <span>
                      {item.width} × {item.height}
                    </span>
                    <span>{formatBytes(item.size)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-light)' }}>
                    <Calendar size={12} />
                    <span>{formattedDate}</span>
                  </div>

                  <div className="gallery-card-actions">
                    <button
                      type="button"
                      className="btn-card-preview"
                      onClick={() => onSelectImage(item)}
                    >
                      <Crop size={14} />
                      <span>{isActive ? 'Previewing' : 'Crop & View'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-card-delete"
                      onClick={() => onDeleteImage(item.id, item.originalName)}
                      title="Delete from MongoDB GridFS"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
