import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { CropViewer } from './components/CropViewer';
import { ImageDetails } from './components/ImageDetails';
import { ActionButtons } from './components/ActionButtons';
import { SavedGallery } from './components/SavedGallery';
import { Toast } from './components/Toast';
import {
  fetchStoredImages,
  deleteImageFromDatabase,
  getGridFsImageUrl,
} from './utils/api';
import { getAspectRatioInfo } from './utils/formatters';

export function App() {
  const [currentImage, setCurrentImage] = useState(null);
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [fitMode, setFitMode] = useState('cover'); // 'cover' or 'contain'
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(false);
  const [toasts, setToasts] = useState([]);

  const imageRef = useRef(null);

  // Toast notification helper
  const addToast = ({ type = 'info', title = '', message = '' }) => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load stored images from MongoDB GridFS
  const loadGallery = async (quiet = false) => {
    setIsLoadingGallery(true);
    try {
      const items = await fetchStoredImages();
      setGalleryImages(items);
      setIsApiConnected(true);

      // Auto-preview first image if no image currently selected
      if (!currentImage && items && items.length > 0) {
        selectGalleryItem(items[0]);
      }
    } catch (err) {
      console.warn('Could not fetch stored gallery images:', err.message);
      setIsApiConnected(false);
      if (!quiet) {
        addToast({
          type: 'error',
          title: 'Database Sync',
          message: 'Unable to reach backend API. Ensure server is running.',
        });
      }
    } finally {
      setIsLoadingGallery(false);
    }
  };

  useEffect(() => {
    loadGallery(true);
  }, []);

  // Set active image from uploaded file
  const handleImageSelect = (imgData) => {
    // If previous was a local object URL, revoke it to avoid memory leaks
    if (currentImage && !currentImage.isFromDatabase && currentImage.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(currentImage.previewUrl);
    }
    setCurrentImage(imgData);
    addToast({
      type: 'info',
      title: 'Image Loaded',
      message: `"${imgData.name}" is ready for aspect ratio auto-cropping.`,
    });
  };

  // Select an existing image from MongoDB gallery
  const selectGalleryItem = (item) => {
    const streamUrl = getGridFsImageUrl(item.id);
    const ratioInfo = getAspectRatioInfo(item.width, item.height);

    setCurrentImage({
      file: null,
      previewUrl: streamUrl,
      name: item.originalName,
      size: item.size,
      type: item.mimeType,
      width: item.width,
      height: item.height,
      aspectRatio: ratioInfo.label,
      aspectRatioText: ratioInfo.text,
      aspectRatioDecimal: ratioInfo.decimal,
      isFromDatabase: true,
      dbId: item.id,
    });
  };

  // Handle successful upload to MongoDB GridFS
  const handleImageSaved = (savedDoc) => {
    if (currentImage) {
      setCurrentImage((prev) => ({
        ...prev,
        isFromDatabase: true,
        dbId: savedDoc.id,
      }));
    }
    loadGallery(true);
  };

  // Delete image from database and GridFS
  const handleDeleteImage = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from MongoDB?`)) {
      return;
    }

    try {
      await deleteImageFromDatabase(id);
      addToast({
        type: 'success',
        title: 'Image Deleted',
        message: `"${name}" removed from MongoDB GridFS.`,
      });

      // If deleted image is currently in preview, select another or clear
      if (currentImage?.dbId === id) {
        const remaining = galleryImages.filter((img) => img.id !== id);
        if (remaining.length > 0) {
          selectGalleryItem(remaining[0]);
        } else {
          setCurrentImage(null);
        }
      }

      loadGallery(true);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Error deleting image.',
      });
    }
  };

  const handleReset = () => {
    if (currentImage && !currentImage.isFromDatabase && currentImage.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(currentImage.previewUrl);
    }
    setCurrentImage(null);
  };

  return (
    <div className="app-container">
      <Header isConnected={isApiConnected} imageCount={galleryImages.length} />

      <main className="main-content">
        {/* Upload Zone */}
        <ImageUploader
          onImageSelect={handleImageSelect}
          onError={(msg) => addToast({ type: 'error', title: 'Upload Validation', message: msg })}
        />

        {/* Main Crop & Metadata Workspace */}
        <div className="workspace-grid">
          {/* Left Column: Crop Viewer Stage */}
          <div className="viewer-column">
            <CropViewer
              image={currentImage}
              selectedRatio={selectedRatio}
              onRatioChange={setSelectedRatio}
              fitMode={fitMode}
              onFitModeChange={setFitMode}
              imageRef={imageRef}
            />
          </div>

          {/* Right Column: Metadata Panel & Action Buttons */}
          <div className="sidebar-column">
            <ImageDetails
              image={currentImage}
              selectedRatio={selectedRatio}
            />

            <ActionButtons
              image={currentImage}
              selectedRatio={selectedRatio}
              imageRef={imageRef}
              onImageSaved={handleImageSaved}
              onReset={handleReset}
              onNotify={addToast}
            />
          </div>
        </div>

        {/* Saved Images Gallery from MongoDB GridFS */}
        <SavedGallery
          images={galleryImages}
          activeImageId={currentImage?.dbId}
          onSelectImage={selectGalleryItem}
          onDeleteImage={handleDeleteImage}
          onRefresh={() => loadGallery(false)}
          isLoading={isLoadingGallery}
        />
      </main>

      {/* Floating Notifications */}
      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
