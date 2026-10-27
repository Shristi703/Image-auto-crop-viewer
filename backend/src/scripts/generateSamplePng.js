import zlib from 'zlib';

// Table for CRC calculation
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function calculateCrc(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  typeBuf.copy(chunk, 4);
  data.copy(chunk, 8);
  const crc = calculateCrc(Buffer.concat([typeBuf, data]));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

/**
 * Generates a valid PNG Buffer with custom dimensions and gradient palette
 */
export function generateGradientPng({
  width = 800,
  height = 600,
  startColor = [59, 130, 246], // RGB
  endColor = [147, 51, 234],   // RGB
  accentColor = [244, 63, 94], // RGB
}) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw Scanlines: 1 filter byte + width * 3 bytes per scanline
  const scanlineLength = 1 + width * 3;
  const rawData = Buffer.alloc(scanlineLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    const vFactor = y / height;

    for (let x = 0; x < width; x++) {
      const hFactor = x / width;
      const pixelOffset = rowOffset + 1 + x * 3;

      // Distance from center for radial highlight
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / maxDist;
      const radialFactor = Math.max(0, 1 - dist);

      // Grid line accent
      const isGrid = (x % 50 === 0 || y % 50 === 0) ? 0.15 : 0;
      // Center crosshair
      const isCrosshair = (Math.abs(x - cx) < 2 || Math.abs(y - cy) < 2) ? 0.3 : 0;

      let r = startColor[0] * (1 - hFactor) + endColor[0] * hFactor;
      let g = startColor[1] * (1 - hFactor) + endColor[1] * hFactor;
      let b = startColor[2] * (1 - hFactor) + endColor[2] * hFactor;

      // Blend radial accent
      r = r * (1 - radialFactor * 0.4) + accentColor[0] * (radialFactor * 0.4);
      g = g * (1 - radialFactor * 0.4) + accentColor[1] * (radialFactor * 0.4);
      b = b * (1 - radialFactor * 0.4) + accentColor[2] * (radialFactor * 0.4);

      // Add grid/crosshair highlights
      r = Math.min(255, Math.round(r + (isGrid + isCrosshair) * 150));
      g = Math.min(255, Math.round(g + (isGrid + isCrosshair) * 150));
      b = Math.min(255, Math.round(b + (isGrid + isCrosshair) * 150));

      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 6 });
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}
