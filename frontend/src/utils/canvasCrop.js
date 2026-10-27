/**
 * Generates and downloads an exact center-cropped image matching target aspect ratio
 * using the HTML5 Canvas API, preserving high fidelity without squashing or stretching.
 *
 * @param {HTMLImageElement} imageEl - The loaded HTMLImageElement
 * @param {number} targetRatio - Target aspect ratio (width / height, e.g. 16/9, 4/3, 1, 1.5)
 * @param {string} targetRatioLabel - Label such as "16:9", "1:1", "4:3", "3:2"
 * @param {string} originalFilename - Original filename for naming download
 * @param {string} mimeType - Image mime type (default: image/jpeg or image/png)
 */
export async function downloadCroppedImage({
  imageEl,
  targetRatio,
  targetRatioLabel,
  originalFilename = 'image.jpg',
  mimeType = 'image/jpeg',
}) {
  if (!imageEl) {
    throw new Error('No image element provided for cropping.');
  }

  const sw = imageEl.naturalWidth || imageEl.width;
  const sh = imageEl.naturalHeight || imageEl.height;

  if (!sw || !sh) {
    throw new Error('Image dimensions could not be determined.');
  }

  const sourceRatio = sw / sh;
  let sx = 0;
  let sy = 0;
  let cropW = sw;
  let cropH = sh;

  // Calculate center-crop coordinates matching CSS object-fit: cover, object-position: center
  if (sourceRatio > targetRatio) {
    // Source image is wider than target ratio: crop left and right
    cropH = sh;
    cropW = Math.round(sh * targetRatio);
    sx = Math.round((sw - cropW) / 2);
    sy = 0;
  } else if (sourceRatio < targetRatio) {
    // Source image is taller than target ratio: crop top and bottom
    cropW = sw;
    cropH = Math.round(sw / targetRatio);
    sx = 0;
    sy = Math.round((sh - cropH) / 2);
  } else {
    // Exact match
    cropW = sw;
    cropH = sh;
    sx = 0;
    sy = 0;
  }

  // Create an offscreen canvas
  const canvas = document.createElement('canvas');
  // Optional memory safety clamp for extreme multi-megapixel images on mobile
  const MAX_DIM = 4096;
  let destW = cropW;
  let destH = cropH;
  if (destW > MAX_DIM || destH > MAX_DIM) {
    const scale = Math.min(MAX_DIM / destW, MAX_DIM / destH);
    destW = Math.round(destW * scale);
    destH = Math.round(destH * scale);
  }

  canvas.width = destW;
  canvas.height = destH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create Canvas 2D rendering context.');
  }

  // Use high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw source image slice onto destination canvas
  ctx.drawImage(imageEl, sx, sy, cropW, cropH, 0, 0, destW, destH);

  // Determine export MIME type and extension
  const safeMime = ['image/png', 'image/webp'].includes(mimeType) ? mimeType : 'image/jpeg';
  const ext = safeMime === 'image/png' ? 'png' : safeMime === 'image/webp' ? 'webp' : 'jpg';

  // Generate blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return reject(new Error('Canvas toBlob failed to produce an image blob.'));
        }

        // Clean filename and attach crop tag
        const nameWithoutExt = originalFilename.replace(/\.[^/.]+$/, '');
        const ratioSlug = targetRatioLabel.replace(':', 'x');
        const downloadFilename = `${nameWithoutExt}_cropped_${ratioSlug}.${ext}`;

        // Trigger browser download
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = downloadFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        resolve({
          filename: downloadFilename,
          width: destW,
          height: destH,
          size: blob.size,
        });
      },
      safeMime,
      0.95
    );
  });
}
