/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calculate greatest common divisor
 */
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Calculate human-readable aspect ratio from width and height
 */
export function getAspectRatioInfo(width, height) {
  if (!width || !height) return { label: 'Unknown', decimal: 1, text: 'N/A' };

  const decimal = parseFloat((width / height).toFixed(2));

  // Match common standard ratios
  if (Math.abs(decimal - 1.0) < 0.02) return { label: '1:1', decimal, text: '1:1 Square' };
  if (Math.abs(decimal - 1.333) < 0.03) return { label: '4:3', decimal, text: '4:3 Standard' };
  if (Math.abs(decimal - 1.777) < 0.03) return { label: '16:9', decimal, text: '16:9 Widescreen' };
  if (Math.abs(decimal - 1.5) < 0.03) return { label: '3:2', decimal, text: '3:2 Classic Photo' };
  if (Math.abs(decimal - 0.75) < 0.03) return { label: '3:4', decimal, text: '3:4 Portrait' };
  if (Math.abs(decimal - 0.5625) < 0.03) return { label: '9:16', decimal, text: '9:16 Vertical Story' };

  const divisor = gcd(Math.round(width), Math.round(height));
  const wRatio = Math.round(width / divisor);
  const hRatio = Math.round(height / divisor);

  if (wRatio <= 25 && hRatio <= 25) {
    return { label: `${wRatio}:${hRatio}`, decimal, text: `${wRatio}:${hRatio} (${decimal})` };
  }

  return { label: `${decimal}:1`, decimal, text: `${decimal}:1` };
}

/**
 * Calculate target cropped output dimensions given source dimensions and target ratio
 */
export function getCroppedDimensions(sw, sh, targetRatio) {
  if (!sw || !sh || !targetRatio) return { width: 0, height: 0, percentKept: 100 };

  const sourceRatio = sw / sh;
  let cropW = sw;
  let cropH = sh;

  if (sourceRatio > targetRatio) {
    // Crop horizontally
    cropH = sh;
    cropW = Math.round(sh * targetRatio);
  } else if (sourceRatio < targetRatio) {
    // Crop vertically
    cropW = sw;
    cropH = Math.round(sw / targetRatio);
  }

  const sourceArea = sw * sh;
  const croppedArea = cropW * cropH;
  const percentKept = Math.round((croppedArea / sourceArea) * 100);

  return {
    width: cropW,
    height: cropH,
    percentKept,
  };
}
