import { analyzeImageContentAndSelectCrop } from './aiVision';

/**
 * Generates an exact cropped image Blob matching target aspect ratio
 * using real Computer Vision AI Subject Detection and Content-Aware Cropping.
 *
 * @param {string|HTMLImageElement} source - Image URL, Blob URL, or HTMLImageElement
 * @param {string} selectedRatio - 'auto', '1:1', '4:3', '16:9', '3:2'
 * @param {boolean} containPadding - If true, pad rather than cut when subject exceeds ratio
 * @param {number} maxDimension - Clamps output resolution (default: 2048)
 * @param {string} mimeType - Export MIME type
 */
export async function generateSmartCroppedImage({
  source,
  selectedRatio = 'auto',
  containPadding = false,
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
      imageObj.onerror = (e) => reject(new Error('Failed to load image: ' + e));
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

  // Run real Computer Vision AI detection and smart crop window calculation
  const analysis = await analyzeImageContentAndSelectCrop({
    imageElement: img,
    origWidth: origW,
    origHeight: origH,
    selectedRatio,
    containPadding,
  });

  const { cropW, cropH, sourceX, sourceY, chosenRatioId, chosenRatioNumeric } = analysis;

  let destW = cropW;
  let destH = cropH;

  const canvas = document.createElement('canvas');

  if (containPadding && analysis.isSubjectClipped && selectedRatio !== 'auto') {
    // SMART CONTAIN / PADDING MODE:
    // Scale image uniformly so 100% of the image fits into the target aspect ratio
    // with smooth blurred background margins to prevent ANY subject clipping.
    const targetRatio = chosenRatioNumeric;
    let canvasW, canvasH;

    if (origW / origH > targetRatio) {
      canvasW = origW;
      canvasH = Math.round(origW / targetRatio);
    } else {
      canvasH = origH;
      canvasW = Math.round(origH * targetRatio);
    }

    if (canvasW > maxDimension || canvasH > maxDimension) {
      const scale = Math.min(maxDimension / canvasW, maxDimension / canvasH);
      canvasW = Math.round(canvasW * scale);
      canvasH = Math.round(canvasH * scale);
    }

    canvas.width = canvasW;
    canvas.height = canvasH;
    destW = canvasW;
    destH = canvasH;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 1. Draw blurred ambient backdrop
    ctx.save();
    ctx.filter = 'blur(24px) brightness(0.65)';
    ctx.drawImage(img, -20, -20, canvasW + 40, canvasH + 40);
    ctx.restore();

    // 2. Uniformly fit original image centered
    const imgScale = Math.min(canvasW / origW, canvasH / origH);
    const fitW = Math.round(origW * imgScale);
    const fitH = Math.round(origH * imgScale);
    const fitX = Math.round((canvasW - fitW) / 2);
    const fitY = Math.round((canvasH - fitH) / 2);

    ctx.drawImage(img, fitX, fitY, fitW, fitH);
  } else {
    // STANDARD CONTENT-AWARE CROP MODE:
    // Scale down if exceeds maxDimension to avoid device OOM
    if (destW > maxDimension || destH > maxDimension) {
      const scale = Math.min(maxDimension / destW, maxDimension / destH);
      destW = Math.round(destW * scale);
      destH = Math.round(destH * scale);
    }

    canvas.width = destW;
    canvas.height = destH;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not obtain Canvas 2D context.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Uniform slice only — ZERO STRETCH OR DISTORTION
    ctx.drawImage(img, sourceX, sourceY, cropW, cropH, 0, 0, destW, destH);
  }

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

  // Percentage and pixel metrics
  const origArea = origW * origH;
  const croppedArea = cropW * cropH;
  const percentRetained = Math.round((croppedArea / origArea) * 100);
  const percentCut = Math.max(0, 100 - percentRetained);

  const cutWidth = origW - cropW;
  const cutHeight = origH - cropH;

  // Normalized crop rectangle for UI overlay on original image
  const cropRect = {
    leftPercent: Number(((sourceX / origW) * 100).toFixed(2)),
    topPercent: Number(((sourceY / origH) * 100).toFixed(2)),
    widthPercent: Number(((cropW / origW) * 100).toFixed(2)),
    heightPercent: Number(((cropH / origH) * 100).toFixed(2)),
  };

  // Normalized subject bounding box for UI overlay (Safe numbers, never NaN)
  let subjectRect = null;
  if (analysis.subjectBBox && typeof analysis.subjectBBox.rawX === 'number') {
    const s = analysis.subjectBBox;
    subjectRect = {
      leftPercent: Number(((s.x / origW) * 100).toFixed(2)),
      topPercent: Number(((s.y / origH) * 100).toFixed(2)),
      widthPercent: Number(((s.width / origW) * 100).toFixed(2)),
      heightPercent: Number(((s.height / origH) * 100).toFixed(2)),
      rawLeftPercent: Number(((s.rawX / origW) * 100).toFixed(2)),
      rawTopPercent: Number(((s.rawY / origH) * 100).toFixed(2)),
      rawWidthPercent: Number(((s.rawWidth / origW) * 100).toFixed(2)),
      rawHeightPercent: Number(((s.rawHeight / origH) * 100).toFixed(2)),
    };
  }

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
    cutWidth,
    cutHeight,
    percentRetained,
    percentCut,
    cropRect,
    subjectRect,
    analysis,
    chosenRatioId,
    chosenRatioNumeric,
    containPadding,
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

// Backward compatibility alias
export const generateCroppedCanvasImage = generateSmartCroppedImage;
