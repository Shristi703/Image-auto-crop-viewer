/**
 * Generates an exact center-cropped image Blob matching target aspect ratio
 * using HTML5 Canvas API and real dimensions math.
 *
 * Formula:
 * For target ratio R = targetWidth / targetHeight:
 * - If origWidth / origHeight > R, crop horizontally:
 *   cropHeight = origHeight, cropWidth = Math.round(origHeight * R)
 *   sourceX = Math.round((origWidth - cropWidth) / 2), sourceY = 0
 * - Else, crop vertically:
 *   cropWidth = origWidth, cropHeight = Math.round(origWidth / R)
 *   sourceX = 0, sourceY = Math.round((origHeight - cropHeight) / 2)
 *
 * @param {string|HTMLImageElement} source - Image URL, Blob URL, or HTMLImageElement
 * @param {number} targetRatio - Target aspect ratio (e.g. 1/1, 4/3, 16/9, 3/2)
 * @param {number} maxDimension - Clamps output resolution to prevent memory spikes (default: 2048)
 * @param {string} mimeType - Export MIME type (default: image/jpeg or image/png)
 */
export async function generateCroppedCanvasImage({
  source,
  targetRatio,
  maxDimension = 2048,
  mimeType = 'image/jpeg',
}) {
  if (!source) {
    throw new Error('No image source provided.');
  }

  // Load image if string source URL passed
  let img;
  if (typeof source === 'string') {
    img = await new Promise((resolve, reject) => {
      const imageObj = new Image();
      imageObj.crossOrigin = 'anonymous';
      imageObj.onload = () => resolve(imageObj);
      imageObj.onerror = (e) => reject(new Error('Failed to load image for cropping: ' + e));
      imageObj.src = source;
    });
  } else {
    img = source;
  }

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  if (!origW || !origH) {
    throw new Error('Image dimensions could not be determined.');
  }

  const origRatio = origW / origH;
  let cropW = origW;
  let cropH = origH;
  let sourceX = 0;
  let sourceY = 0;

  // Real center crop calculation
  if (origRatio > targetRatio) {
    // Original is wider than target ratio: crop horizontally
    cropH = origH;
    cropW = Math.round(origH * targetRatio);
    sourceX = Math.round((origW - cropW) / 2);
    sourceY = 0;
  } else if (origRatio < targetRatio) {
    // Original is taller than target ratio: crop vertically
    cropW = origW;
    cropH = Math.round(origW / targetRatio);
    sourceX = 0;
    sourceY = Math.round((origH - cropH) / 2);
  } else {
    // Exact match
    cropW = origW;
    cropH = origH;
    sourceX = 0;
    sourceY = 0;
  }

  // Destination canvas resolution (scaled down if exceeds maxDimension to avoid device OOM)
  let destW = cropW;
  let destH = cropH;
  if (destW > maxDimension || destH > maxDimension) {
    const scale = Math.min(maxDimension / destW, maxDimension / destH);
    destW = Math.round(destW * scale);
    destH = Math.round(destH * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = destW;
  canvas.height = destH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not obtain Canvas 2D context.');
  }

  // High quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw ONLY the calculated center-crop slice onto the destination canvas
  ctx.drawImage(img, sourceX, sourceY, cropW, cropH, 0, 0, destW, destH);

  // Safe export format
  const safeMime = ['image/png', 'image/webp'].includes(mimeType) ? mimeType : 'image/jpeg';

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error('Canvas toBlob returned null.'));
        else resolve(b);
      },
      safeMime,
      0.95
    );
  });

  const blobUrl = URL.createObjectURL(blob);

  // Calculate percentage of original area retained
  const origArea = origW * origH;
  const croppedArea = cropW * cropH;
  const percentRetained = Math.round((croppedArea / origArea) * 100);

  return {
    blob,
    blobUrl,
    width: destW,
    height: destH,
    cropW,
    cropH,
    origW,
    origH,
    sourceX,
    sourceY,
    percentRetained,
    targetRatio,
  };
}

/**
 * Downloads a Blob directly with custom filename
 */
export function downloadBlob(blob, filename) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
