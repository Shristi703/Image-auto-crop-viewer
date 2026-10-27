/**
 * Intelligent Image Focal Point Detector (AI Saliency & Edge Energy)
 * Analyzes contrast, gradient edges, and color saturation to automatically detect
 * the visual subject / focal point in an image.
 */
export function detectImageFocalPoint(img) {
  try {
    const sampleSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { x: 0.5, y: 0.5 };

    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;

    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;

    for (let y = 1; y < sampleSize - 1; y++) {
      for (let x = 1; x < sampleSize - 1; x++) {
        const idx = (y * sampleSize + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Luminance
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Neighbor luminance for gradient/edge detection
        const idxL = (y * sampleSize + (x - 1)) * 4;
        const idxR = (y * sampleSize + (x + 1)) * 4;
        const idxU = ((y - 1) * sampleSize + x) * 4;
        const idxD = ((y + 1) * sampleSize + x) * 4;

        const lumL = 0.299 * data[idxL] + 0.587 * data[idxL + 1] + 0.114 * data[idxL + 2];
        const lumR = 0.299 * data[idxR] + 0.587 * data[idxR + 1] + 0.114 * data[idxR + 2];
        const lumU = 0.299 * data[idxU] + 0.587 * data[idxU + 1] + 0.114 * data[idxU + 2];
        const lumD = 0.299 * data[idxD] + 0.587 * data[idxD + 1] + 0.114 * data[idxD + 2];

        const gradX = Math.abs(lumR - lumL);
        const gradY = Math.abs(lumD - lumU);
        const edgeEnergy = gradX + gradY;

        // Color saturation (salient objects usually have higher saturation than backgrounds)
        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;

        // Weight: edge energy + saturation boost
        const weight = edgeEnergy * (1 + sat * 1.5);

        totalWeight += weight;
        weightedX += x * weight;
        weightedY += y * weight;
      }
    }

    if (totalWeight > 0) {
      const rawX = weightedX / (totalWeight * sampleSize);
      const rawY = weightedY / (totalWeight * sampleSize);
      // Gentle clamp towards center to prevent extreme edge jumps
      return {
        x: Math.min(0.85, Math.max(0.15, rawX)),
        y: Math.min(0.85, Math.max(0.15, rawY)),
      };
    }
  } catch (err) {
    console.warn('AI Focal point detection fallback:', err);
  }
  return { x: 0.5, y: 0.5 };
}

/**
 * Generates an exact cropped image Blob matching target aspect ratio
 * using HTML5 Canvas API with AI Subject-Aware Focus or Mathematical Center Focus.
 *
 * @param {string|HTMLImageElement} source - Image URL, Blob URL, or HTMLImageElement
 * @param {number} targetRatio - Target aspect ratio (e.g. 1/1, 4/3, 16/9, 3/2)
 * @param {string} focusMode - 'ai' (AI Subject Focus), 'center' (Exact Center), 'top' (Face/Upper focus)
 * @param {number} maxDimension - Clamps output resolution (default: 2048)
 * @param {string} mimeType - Export MIME type
 */
export async function generateCroppedCanvasImage({
  source,
  targetRatio,
  focusMode = 'ai',
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

  // Determine crop box size
  if (origRatio > targetRatio) {
    // Image is wider than target: constrain height, crop width
    cropH = origH;
    cropW = Math.round(origH * targetRatio);
  } else if (origRatio < targetRatio) {
    // Image is taller than target: constrain width, crop height
    cropW = origW;
    cropH = Math.round(origW / targetRatio);
  } else {
    cropW = origW;
    cropH = origH;
  }

  // Determine Focal Point & Crop Coordinates
  let focalPoint = { x: 0.5, y: 0.5 };
  let sourceX = 0;
  let sourceY = 0;

  if (focusMode === 'ai') {
    focalPoint = detectImageFocalPoint(img);
    // Center crop window on focal point and clamp within original bounds
    sourceX = Math.round(origW * focalPoint.x - cropW / 2);
    sourceY = Math.round(origH * focalPoint.y - cropH / 2);
  } else if (focusMode === 'top') {
    focalPoint = { x: 0.5, y: 0.25 };
    sourceX = Math.round((origW - cropW) / 2);
    sourceY = Math.round((origH - cropH) * 0.15);
  } else {
    // Classic mathematical center
    focalPoint = { x: 0.5, y: 0.5 };
    sourceX = Math.round((origW - cropW) / 2);
    sourceY = Math.round((origH - cropH) / 2);
  }

  // Clamp sourceX and sourceY to never exceed image boundaries
  sourceX = Math.max(0, Math.min(origW - cropW, sourceX));
  sourceY = Math.max(0, Math.min(origH - cropH, sourceY));

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

  // Draw ONLY the calculated crop slice onto the destination canvas
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

  // Calculate percentage and pixel metrics
  const origArea = origW * origH;
  const croppedArea = cropW * cropH;
  const percentRetained = Math.round((croppedArea / origArea) * 100);
  const percentCut = 100 - percentRetained;

  const cutWidth = origW - cropW;
  const cutHeight = origH - cropH;

  // Normalized crop rectangle for UI overlay on original image
  const cropRect = {
    leftPercent: (sourceX / origW) * 100,
    topPercent: (sourceY / origH) * 100,
    widthPercent: (cropW / origW) * 100,
    heightPercent: (cropH / origH) * 100,
  };

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
    focalPoint,
    focusMode,
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
