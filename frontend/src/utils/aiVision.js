import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as blazeface from '@tensorflow-models/blazeface';

let cocoModelPromise = null;
let blazefaceModelPromise = null;

/**
 * Loads the COCO-SSD object detection model (cached singleton).
 */
export async function loadCocoModel() {
  if (!cocoModelPromise) {
    cocoModelPromise = cocoSsd.load({ base: 'lite_mobilenet_v2' }).catch((err) => {
      console.warn('COCO-SSD lite_mobilenet_v2 failed, falling back to default:', err);
      return cocoSsd.load();
    });
  }
  return cocoModelPromise;
}

/**
 * Loads the Google MediaPipe BlazeFace face detection model (cached singleton).
 */
export async function loadBlazeFaceModel() {
  if (!blazefaceModelPromise) {
    blazefaceModelPromise = blazeface.load().catch((err) => {
      console.warn('BlazeFace model failed to load:', err);
      return null;
    });
  }
  return blazefaceModelPromise;
}

/**
 * Detects human faces with high precision using BlazeFace.
 */
export async function detectFacesWithAI(imageElement) {
  try {
    const model = await loadBlazeFaceModel();
    if (!model) return [];
    const predictions = await model.estimateFaces(imageElement, false);
    if (!predictions || !predictions.length) return [];

    return predictions.map((p) => {
      const x1 = Math.round(p.topLeft[0]);
      const y1 = Math.round(p.topLeft[1]);
      const x2 = Math.round(p.bottomRight[0]);
      const y2 = Math.round(p.bottomRight[1]);
      const w = Math.max(1, x2 - x1);
      const h = Math.max(1, y2 - y1);
      const prob = p.probability ? p.probability[0] || p.probability : 0.9;
      return {
        class: 'face',
        score: Math.round(prob * 100),
        bbox: { x: x1, y: y1, width: w, height: h },
        landmarks: p.landmarks,
      };
    });
  } catch (error) {
    console.warn('BlazeFace detection error:', error);
    return [];
  }
}

/**
 * Detects general objects & animals using COCO-SSD.
 */
export async function detectObjectsWithAI(imageElement) {
  try {
    const model = await loadCocoModel();
    const predictions = await model.detect(imageElement, 10, 0.22);
    return predictions.map((p) => ({
      class: p.class,
      score: Math.round(p.score * 100),
      bbox: {
        x: Math.round(p.bbox[0]),
        y: Math.round(p.bbox[1]),
        width: Math.round(p.bbox[2]),
        height: Math.round(p.bbox[3]),
      },
    }));
  } catch (error) {
    console.warn('COCO-SSD detection error:', error);
    return [];
  }
}

/**
 * Priority ranking for detected object classes
 */
const CLASS_PRIORITY = {
  face: 12,
  person: 10,
  cat: 9,
  dog: 9,
  bird: 8,
  horse: 8,
  sheep: 8,
  cow: 8,
  elephant: 8,
  bear: 8,
  zebra: 8,
  giraffe: 8,
  laptop: 7,
  tv: 7,
  'cell phone': 7,
  car: 7,
  motorcycle: 7,
  bicycle: 7,
  bottle: 6,
  cup: 6,
  chair: 5,
  couch: 5,
  backpack: 6,
  handbag: 6,
  suitcase: 6,
  book: 5,
};

/**
 * Analyzes image for text / screenshot / document features
 * using high-frequency edge density and horizontal variance.
 */
export function analyzeDocumentScreenshot(canvasOrImg, origW, origH) {
  try {
    const sampleW = 160;
    const sampleH = Math.max(10, Math.round((sampleW * origH) / origW));
    const offscreen = document.createElement('canvas');
    offscreen.width = sampleW;
    offscreen.height = sampleH;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { isScreenshotOrDoc: false, edgeDensity: 0 };

    ctx.drawImage(canvasOrImg, 0, 0, sampleW, sampleH);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;

    let sharpEdges = 0;
    let horizontalTransitions = 0;
    let textLikeRows = 0;

    for (let y = 1; y < sampleH - 1; y++) {
      let rowEdges = 0;
      for (let x = 1; x < sampleW - 1; x++) {
        const i = (y * sampleW + x) * 4;
        const iLeft = (y * sampleW + (x - 1)) * 4;
        const iRight = (y * sampleW + (x + 1)) * 4;

        const lum = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
        const lumL = 0.299 * imgData[iLeft] + 0.587 * imgData[iLeft + 1] + 0.114 * imgData[iLeft + 2];
        const lumR = 0.299 * imgData[iRight] + 0.587 * imgData[iRight + 1] + 0.114 * imgData[iRight + 2];

        const diffH = Math.abs(lumR - lumL);
        if (diffH > 40) {
          sharpEdges++;
          horizontalTransitions++;
          rowEdges++;
        }
      }
      if (rowEdges > sampleW * 0.15) {
        textLikeRows++;
      }
    }

    const totalSamplePixels = sampleW * sampleH;
    const edgeRatio = sharpEdges / totalSamplePixels;
    const rowRatio = textLikeRows / sampleH;

    const isWidescreen = origW / origH > 1.35;
    const isMobileTall = origH / origW > 1.6;

    // Detect if image is a document, website UI, code screenshot, or slide
    const isScreenshotOrDoc =
      (edgeRatio > 0.11 && rowRatio > 0.22) ||
      (edgeRatio > 0.14 && (isWidescreen || isMobileTall)) ||
      (edgeRatio > 0.22);

    return {
      isScreenshotOrDoc,
      edgeDensity: Math.round(edgeRatio * 100),
      confidence: Math.min(99, Math.round((edgeRatio / 0.25) * 85 + (rowRatio > 0.3 ? 14 : 5))),
    };
  } catch (err) {
    return { isScreenshotOrDoc: false, edgeDensity: 0 };
  }
}

/**
 * Analyzes standalone product photography on clean or studio backgrounds
 * (e.g. shoes, watches, bottles, electronics, packaged goods).
 */
export function analyzeProductPhotography(canvasOrImg, origW, origH) {
  try {
    const sizeW = 120;
    const sizeH = Math.max(10, Math.round((sizeW * origH) / origW));
    const offscreen = document.createElement('canvas');
    offscreen.width = sizeW;
    offscreen.height = sizeH;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(canvasOrImg, 0, 0, sizeW, sizeH);
    const data = ctx.getImageData(0, 0, sizeW, sizeH).data;

    // 1. Sample outer border pixels to determine background color
    let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
    const samplePixel = (x, y) => {
      const idx = (y * sizeW + x) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
      bgCount++;
    };

    for (let x = 0; x < sizeW; x += 3) {
      samplePixel(x, 0);
      samplePixel(x, sizeH - 1);
    }
    for (let y = 0; y < sizeH; y += 3) {
      samplePixel(0, y);
      samplePixel(sizeW - 1, y);
    }

    bgR = bgR / bgCount;
    bgG = bgG / bgCount;
    bgB = bgB / bgCount;

    // 2. Scan for foreground subject pixels differing significantly from background
    let minX = sizeW, minY = sizeH, maxX = 0, maxY = 0;
    let foregroundPixelCount = 0;

    for (let y = 2; y < sizeH - 2; y++) {
      for (let x = 2; x < sizeW - 2; x++) {
        const idx = (y * sizeW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        const diff = Math.sqrt(
          (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2
        );

        if (diff > 35 || a < 200) {
          foregroundPixelCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const totalInnerPixels = (sizeW - 4) * (sizeH - 4);
    const fgRatio = foregroundPixelCount / totalInnerPixels;

    // Typical product photos occupy 15% to 75% of the frame with clear background margins
    const hasClearBorder = minX > 2 && maxX < sizeW - 3 && minY > 2 && maxY < sizeH - 3;
    const isSolidBg = bgR > 210 || bgR < 45 || hasClearBorder;

    if (fgRatio > 0.12 && fgRatio < 0.78 && isSolidBg && maxX > minX && maxY > minY) {
      const scaleX = origW / sizeW;
      const scaleY = origH / sizeH;

      const rawX = Math.round(minX * scaleX);
      const rawY = Math.round(minY * scaleY);
      const rawW = Math.round((maxX - minX) * scaleX);
      const rawH = Math.round((maxY - minY) * scaleY);

      // Add 16% natural margin around the product
      const padX = Math.round(rawW * 0.16);
      const padY = Math.round(rawH * 0.16);

      const px = Math.max(0, rawX - padX);
      const py = Math.max(0, rawY - padY);
      const pw = Math.min(origW - px, rawW + padX * 2);
      const ph = Math.min(origH - py, rawH + padY * 2);

      return {
        isProduct: true,
        confidence: Math.round(Math.min(95, 65 + fgRatio * 35)),
        bbox: {
          x: px,
          y: py,
          width: pw,
          height: ph,
          rawX,
          rawY,
          rawWidth: rawW,
          rawHeight: rawH,
          centerX: rawX + rawW / 2,
          centerY: rawY + rawH / 2,
        },
      };
    }
  } catch (e) {
    console.warn('Product analysis error:', e);
  }
  return null;
}

/**
 * Calculates visual saliency center of mass for scenery or landscape images
 * when no discrete COCO object or face is detected.
 */
export function calculateVisualSaliency(canvasOrImg, origW, origH) {
  try {
    const size = 64;
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return {
        x: 0,
        y: 0,
        width: origW,
        height: origH,
        rawX: 0,
        rawY: 0,
        rawWidth: origW,
        rawHeight: origH,
        centerX: origW / 2,
        centerY: origH / 2,
      };
    }

    ctx.drawImage(canvasOrImg, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;

    let minX = size;
    let minY = size;
    let maxX = 0;
    let maxY = 0;

    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const i = (y * size + x) * 4;
        const iR = (y * size + (x + 1)) * 4;
        const iL = (y * size + (x - 1)) * 4;
        const iD = ((y + 1) * size + x) * 4;
        const iU = ((y - 1) * size + x) * 4;

        const lumR = 0.299 * data[iR] + 0.587 * data[iR + 1] + 0.114 * data[iR + 2];
        const lumL = 0.299 * data[iL] + 0.587 * data[iL + 1] + 0.114 * data[iL + 2];
        const lumD = 0.299 * data[iD] + 0.587 * data[iD + 1] + 0.114 * data[iD + 2];
        const lumU = 0.299 * data[iU] + 0.587 * data[iU + 1] + 0.114 * data[iU + 2];

        const energy = Math.abs(lumR - lumL) + Math.abs(lumD - lumU);

        if (energy > 28) {
          totalWeight += energy;
          sumX += x * energy;
          sumY += y * energy;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (totalWeight > 0) {
      const normCenterX = sumX / (totalWeight * size);
      const normCenterY = sumY / (totalWeight * size);

      const normWidth = Math.max(0.65, (maxX - minX) / size);
      const normHeight = Math.max(0.65, (maxY - minY) / size);

      const rawX = Math.round(Math.max(0, (normCenterX - normWidth / 2) * origW));
      const rawY = Math.round(Math.max(0, (normCenterY - normHeight / 2) * origH));
      const rawW = Math.round(Math.min(origW - rawX, normWidth * origW));
      const rawH = Math.round(Math.min(origH - rawY, normHeight * origH));

      return {
        x: rawX,
        y: rawY,
        width: rawW,
        height: rawH,
        rawX,
        rawY,
        rawWidth: rawW,
        rawHeight: rawH,
        centerX: Math.round(normCenterX * origW),
        centerY: Math.round(normCenterY * origH),
      };
    }
  } catch (err) {
    console.warn('Saliency computation fallback:', err);
  }

  const defW = Math.round(origW * 0.8);
  const defH = Math.round(origH * 0.8);
  const defX = Math.round((origW - defW) / 2);
  const defY = Math.round((origH - defH) / 2);

  return {
    x: defX,
    y: defY,
    width: defW,
    height: defH,
    rawX: defX,
    rawY: defY,
    rawWidth: defW,
    rawHeight: defH,
    centerX: Math.round(origW / 2),
    centerY: Math.round(origH / 2),
  };
}

/**
 * Main Smart Analysis Pipeline:
 * Dispatches to the appropriate detector based on image characteristics,
 * calculates subject preservation bounds, and selects optimal SMART AUTO framing.
 */
export async function analyzeImageContentAndSelectCrop({
  imageElement,
  origWidth,
  origHeight,
  selectedRatio = 'auto', // 'auto', '1:1', '4:3', '16:9', '3:2'
  containPadding = false, // When true, manual ratios will pad rather than clip
}) {
  const origRatio = origWidth / origHeight;

  // 1. Run parallel computer vision models: BlazeFace (faces) and COCO-SSD (objects/animals)
  const [faces, detectedObjects] = await Promise.all([
    detectFacesWithAI(imageElement),
    detectObjectsWithAI(imageElement),
  ]);

  // 2. Check for UI screenshot / document text layout
  const docAnalysis = analyzeDocumentScreenshot(imageElement, origWidth, origHeight);

  // 3. Check for standalone product photography
  const productAnalysis = analyzeProductPhotography(imageElement, origWidth, origHeight);

  let primarySubject = null;
  let subjectBBox = null;
  let detectionType = 'saliency'; // 'blazeface', 'coco', 'product', 'screenshot', 'saliency'
  let detectionExplanation = '';
  let confidence = null;

  // Decision logic based on vision results:
  if (faces.length > 0) {
    // Human face / portrait detected via BlazeFace
    detectionType = 'blazeface';
    const primaryFace = faces[0];
    confidence = primaryFace.score;

    // Enclose all detected faces
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    faces.forEach((f) => {
      minX = Math.min(minX, f.bbox.x);
      minY = Math.min(minY, f.bbox.y);
      maxX = Math.max(maxX, f.bbox.x + f.bbox.width);
      maxY = Math.max(maxY, f.bbox.y + f.bbox.height);
    });

    const faceW = maxX - minX;
    const faceH = maxY - minY;

    // Headroom: expand upward by 35% of face height for hair/forehead,
    // and downward by 70% of face height for chin/shoulders
    const headTop = Math.max(0, minY - Math.round(faceH * 0.4));
    const chestBottom = Math.min(origHeight, maxY + Math.round(faceH * 0.8));
    const headW = maxX - minX;
    const sideMargin = Math.round(headW * 0.35);
    const headLeft = Math.max(0, minX - sideMargin);
    const headRight = Math.min(origWidth, maxX + sideMargin);

    subjectBBox = {
      x: headLeft,
      y: headTop,
      width: headRight - headLeft,
      height: chestBottom - headTop,
      rawX: minX,
      rawY: minY,
      rawWidth: faceW,
      rawHeight: faceH,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      isFace: true,
    };

    primarySubject = faces.length > 1 ? `${faces.length} People` : 'Human Portrait';
    detectionExplanation = `AI detected ${primarySubject} (${confidence}% confidence) — face, hair, and head fully preserved without decapitation.`;
  } else if (
    docAnalysis.isScreenshotOrDoc &&
    (detectedObjects.length === 0 ||
      detectedObjects.every((o) => ['laptop', 'tv', 'cell phone', 'keyboard'].includes(o.class)))
  ) {
    // UI screenshot / document layout detected
    detectionType = 'screenshot';
    primarySubject = 'UI Screenshot';
    confidence = docAnalysis.confidence;
    subjectBBox = {
      x: 0,
      y: 0,
      width: origWidth,
      height: origHeight,
      rawX: 0,
      rawY: 0,
      rawWidth: origWidth,
      rawHeight: origHeight,
      centerX: origWidth / 2,
      centerY: origHeight / 2,
    };
    detectionExplanation = `UI / Screenshot layout detected (${docAnalysis.edgeDensity}% edge density) — preserving entire readable interface without cutting navigation, text, or buttons.`;
  } else if (
    productAnalysis &&
    productAnalysis.isProduct &&
    (detectedObjects.length === 0 ||
      detectedObjects[0].score < 40 ||
      !['cat', 'dog', 'person', 'horse', 'car'].includes(detectedObjects[0].class))
  ) {
    // Standalone product photography detected via contrast & contour
    detectionType = 'product';
    primarySubject = 'Product';
    confidence = productAnalysis.confidence;
    subjectBBox = productAnalysis.bbox;
    detectionExplanation = `Product photography detected (${confidence}% confidence) — full product and balanced studio margins preserved.`;
  } else if (detectedObjects.length > 0) {
    // COCO-SSD object or animal detected
    detectionType = 'coco';

    // Sort by priority and score
    const sorted = [...detectedObjects].sort((a, b) => {
      const prioA = CLASS_PRIORITY[a.class] || 1;
      const prioB = CLASS_PRIORITY[b.class] || 1;
      return prioB * b.score - prioA * a.score;
    });

    const topItem = sorted[0];
    primarySubject = topItem.class;
    confidence = topItem.score;

    // Group matching or high-confidence objects
    const importantObjects = sorted.filter(
      (obj) => obj.class === topItem.class || obj.score > 60
    );

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    importantObjects.forEach((obj) => {
      minX = Math.min(minX, obj.bbox.x);
      minY = Math.min(minY, obj.bbox.y);
      maxX = Math.max(maxX, obj.bbox.x + obj.bbox.width);
      maxY = Math.max(maxY, obj.bbox.y + obj.bbox.height);
    });

    const rawW = maxX - minX;
    const rawH = maxY - minY;

    // Natural breathing room: 18% horizontal, 20% vertical (extra headroom for ears/horns)
    const padX = Math.round(rawW * 0.18);
    const padY = Math.round(rawH * 0.2);

    const paddedX = Math.max(0, minX - padX);
    const paddedY = Math.max(0, minY - padY);
    const paddedW = Math.min(origWidth - paddedX, rawW + padX * 2);
    const paddedH = Math.min(origHeight - paddedY, rawH + padY * 2);

    subjectBBox = {
      x: paddedX,
      y: paddedY,
      width: paddedW,
      height: paddedH,
      rawX: minX,
      rawY: minY,
      rawWidth: rawW,
      rawHeight: rawH,
      centerX: minX + rawW / 2,
      centerY: minY + rawH / 2,
      isAnimal: ['cat', 'dog', 'bird', 'horse', 'sheep', 'cow', 'bear'].includes(topItem.class),
    };

    const count = importantObjects.length;
    const animalEars = subjectBBox.isAnimal ? ' — ears, face, and full body preserved' : ' — complete subject framed';
    detectionExplanation = `AI detected ${count > 1 ? `${count} ${primarySubject}s` : `a ${primarySubject}`} (${confidence}% confidence)${animalEars}.`;
  } else {
    // Saliency / scenery fallback
    const sal = calculateVisualSaliency(imageElement, origWidth, origHeight);
    detectionType = 'saliency';
    primarySubject = 'Landscape / Scenery';
    confidence = null; // Honest fallback: no fake confidence!
    subjectBBox = sal;
    detectionExplanation = `No discrete animal, person, or product detected — utilizing visual contrast and scenery horizon balance.`;
  }

  // 4. Determine Aspect Ratio (SMART AUTO MODE)
  let chosenRatioId = selectedRatio;
  let chosenRatioNumeric = 1;
  let ratioExplanation = '';

  if (selectedRatio === 'auto') {
    if (detectionType === 'screenshot') {
      // Screenshots: NEVER cut! Keep original image aspect ratio
      chosenRatioNumeric = origRatio;
      chosenRatioId = 'auto';
      ratioExplanation = `Smart Auto chose original ${origRatio.toFixed(2)}:1 to preserve all readable UI elements and text.`;
    } else if (subjectBBox) {
      const subjectRatio = subjectBBox.width / subjectBBox.height;

      // Smart ratio selection based on subject geometry
      if (subjectRatio > 1.55) {
        chosenRatioId = '16:9';
        chosenRatioNumeric = 16 / 9;
        ratioExplanation = `Smart Auto selected 16:9 Widescreen to comfortably frame the horizontal subject.`;
      } else if (subjectRatio > 1.2) {
        chosenRatioId = '3:2';
        chosenRatioNumeric = 3 / 2;
        ratioExplanation = `Smart Auto selected 3:2 Classic Photo to balance subject width and environment.`;
      } else if (subjectRatio > 0.85 && subjectRatio <= 1.2) {
        // Balanced square-like subject
        chosenRatioId = '1:1';
        chosenRatioNumeric = 1 / 1;
        ratioExplanation = `Smart Auto selected 1:1 Square to frame the subject with uniform margins.`;
      } else {
        // Tall subject (human portrait, sitting cat/dog, vertical product)
        if (origRatio < 0.9) {
          // If the original image is portrait, use 3:4 portrait or keep original vertical framing
          // To ensure we fit within standard web presets while keeping full height:
          chosenRatioId = '3:4';
          chosenRatioNumeric = 3 / 4;
          ratioExplanation = `Smart Auto selected 3:4 Portrait to preserve vertical body proportions without cutting head or base.`;
        } else if (origRatio <= 1.25) {
          chosenRatioId = '1:1';
          chosenRatioNumeric = 1 / 1;
          ratioExplanation = `Smart Auto selected 1:1 Square to preserve vertical subject height without cutting ears or head.`;
        } else {
          chosenRatioId = '4:3';
          chosenRatioNumeric = 4 / 3;
          ratioExplanation = `Smart Auto selected 4:3 Standard to comfortably enclose the vertical subject.`;
        }
      }
    } else {
      chosenRatioId = '1:1';
      chosenRatioNumeric = 1 / 1;
      ratioExplanation = `Defaulted to 1:1 Square.`;
    }
  } else {
    const RATIO_MAP = {
      '1:1': 1 / 1,
      '4:3': 4 / 3,
      '16:9': 16 / 9,
      '3:2': 3 / 2,
    };
    chosenRatioNumeric = RATIO_MAP[selectedRatio] || 1;
    ratioExplanation = `Manual target ratio ${selectedRatio} applied.`;
  }

  // 5. Calculate Optimal Subject-Preserving Crop Window
  let cropW, cropH;
  let sourceX, sourceY;
  let fitsSubjectCompletely = true;

  if (detectionType === 'screenshot' && selectedRatio === 'auto') {
    // Preserve full frame exactly
    cropW = origWidth;
    cropH = origHeight;
    sourceX = 0;
    sourceY = 0;
  } else {
    const reqW = subjectBBox.width;
    const reqH = subjectBBox.height;

    // Minimum crop box that contains reqW and reqH with chosenRatioNumeric
    let targetCropW = Math.max(reqW, reqH * chosenRatioNumeric);
    let targetCropH = targetCropW / chosenRatioNumeric;

    if (targetCropH < reqH) {
      targetCropH = reqH;
      targetCropW = targetCropH * chosenRatioNumeric;
    }

    // Check if targetCrop fits inside image bounds
    if (targetCropW > origWidth || targetCropH > origHeight) {
      fitsSubjectCompletely = false;

      // Scale down to maximum dimension that fits within original image
      if (origWidth / origHeight > chosenRatioNumeric) {
        cropH = origHeight;
        cropW = Math.round(origHeight * chosenRatioNumeric);
      } else {
        cropW = origWidth;
        cropH = Math.round(origWidth / chosenRatioNumeric);
      }
    } else {
      // Subject fits! Expand comfortably (up to 30% more environment if space exists)
      const maxExpand = Math.min(
        origWidth / targetCropW,
        origHeight / targetCropH,
        1.32
      );
      cropW = Math.round(targetCropW * maxExpand);
      cropH = Math.round(targetCropH * maxExpand);
    }

    // Center crop window on subject center of mass
    sourceX = Math.round(subjectBBox.centerX - cropW / 2);
    sourceY = Math.round(subjectBBox.centerY - cropH / 2);

    // If human portrait or animal ears, bias slightly upward so head/ears have breathing room
    if (subjectBBox.isFace) {
      // Keep face in upper half of crop
      const desiredFaceY = Math.round(cropH * 0.32);
      sourceY = Math.round(subjectBBox.rawY - desiredFaceY);
    } else if (subjectBBox.isAnimal) {
      // Ensure animal ears at top are preserved
      const desiredAnimalTop = Math.round(cropH * 0.15);
      sourceY = Math.round(subjectBBox.rawY - desiredAnimalTop);
    }

    // Clamp within image bounds
    sourceX = Math.max(0, Math.min(origWidth - cropW, sourceX));
    sourceY = Math.max(0, Math.min(origHeight - cropH, sourceY));
  }

  // Check if subject was clipped by a manual ratio (checking raw subject bounds)
  const rawSubjectX = typeof subjectBBox.rawX === 'number' ? subjectBBox.rawX : subjectBBox.x;
  const rawSubjectY = typeof subjectBBox.rawY === 'number' ? subjectBBox.rawY : subjectBBox.y;
  const rawSubjectW = typeof subjectBBox.rawWidth === 'number' ? subjectBBox.rawWidth : subjectBBox.width;
  const rawSubjectH = typeof subjectBBox.rawHeight === 'number' ? subjectBBox.rawHeight : subjectBBox.height;

  const rawSubjectRight = rawSubjectX + rawSubjectW;
  const rawSubjectBottom = rawSubjectY + rawSubjectH;
  const cropRight = sourceX + cropW;
  const cropBottom = sourceY + cropH;

  const isSubjectClipped =
    sourceX > rawSubjectX ||
    cropRight < rawSubjectRight ||
    sourceY > rawSubjectY ||
    cropBottom < rawSubjectBottom;

  return {
    detectionType,
    confidence,
    primarySubject,
    detectedObjects,
    faces,
    subjectBBox,
    chosenRatioId,
    chosenRatioNumeric,
    detectionExplanation,
    ratioExplanation,
    cropW,
    cropH,
    sourceX,
    sourceY,
    fitsSubjectCompletely,
    isSubjectClipped,
    containPadding,
  };
}
