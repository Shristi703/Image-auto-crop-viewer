import { Readable } from 'stream';
import dotenv from 'dotenv';
import { connectDB, getBucket } from '../config/db.js';
import { ImageMeta } from '../models/ImageMeta.js';
import { generateGradientPng } from './generateSamplePng.js';

dotenv.config();

const SAMPLE_IMAGES = [
  {
    name: 'sample-square-1-1.png',
    originalName: 'Modern Architecture Minimalist (1x1).png',
    width: 1000,
    height: 1000,
    aspectRatio: '1:1',
    aspectRatioDecimal: 1.0,
    startColor: [249, 115, 22], // Orange
    endColor: [236, 72, 153],   // Pink
    accentColor: [255, 255, 255],
  },
  {
    name: 'sample-standard-4-3.png',
    originalName: 'Studio Gallery Presentation (4x3).png',
    width: 1200,
    height: 900,
    aspectRatio: '4:3',
    aspectRatioDecimal: 1.33,
    startColor: [14, 165, 233], // Sky blue
    endColor: [99, 102, 241],   // Indigo
    accentColor: [52, 211, 153], // Emerald
  },
  {
    name: 'sample-widescreen-16-9.png',
    originalName: 'Cinematic Horizon Sunset (16x9).png',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    aspectRatioDecimal: 1.78,
    startColor: [99, 102, 241],  // Indigo
    endColor: [168, 85, 247],   // Purple
    accentColor: [251, 191, 36], // Amber
  },
  {
    name: 'sample-classic-3-2.png',
    originalName: 'Classic 35mm Street Film (3x2).png',
    width: 1200,
    height: 800,
    aspectRatio: '3:2',
    aspectRatioDecimal: 1.5,
    startColor: [16, 185, 129], // Emerald
    endColor: [20, 184, 166],  // Teal
    accentColor: [244, 63, 94], // Rose
  },
];

export async function seedSampleImages(quiet = false) {
  if (!quiet) console.log('🌱 Checking seed images in MongoDB...');

  const count = await ImageMeta.countDocuments();
  if (count > 0) {
    if (!quiet) console.log(`ℹ️ Database already contains ${count} images. Skipping seed.`);
    return;
  }

  const bucket = getBucket();

  for (const sample of SAMPLE_IMAGES) {
    const pngBuffer = generateGradientPng({
      width: sample.width,
      height: sample.height,
      startColor: sample.startColor,
      endColor: sample.endColor,
      accentColor: sample.accentColor,
    });

    const timestamp = Date.now();
    const gridFsFilename = `${timestamp}-${sample.name}`;

    const uploadStream = bucket.openUploadStream(gridFsFilename, {
      contentType: 'image/png',
      metadata: {
        originalName: sample.originalName,
        size: pngBuffer.length,
        width: sample.width,
        height: sample.height,
        aspectRatio: sample.aspectRatio,
        isSample: true,
      },
    });

    const readable = new Readable();
    readable.push(pngBuffer);
    readable.push(null);

    await new Promise((resolve, reject) => {
      readable
        .pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    await ImageMeta.create({
      filename: gridFsFilename,
      originalName: sample.originalName,
      mimeType: 'image/png',
      size: pngBuffer.length,
      width: sample.width,
      height: sample.height,
      aspectRatio: sample.aspectRatio,
      aspectRatioDecimal: sample.aspectRatioDecimal,
      gridFsFileId: uploadStream.id,
    });

    if (!quiet) {
      console.log(`✅ Seeded: ${sample.originalName} (${sample.width}x${sample.height}, ${sample.aspectRatio})`);
    }
  }

  if (!quiet) console.log('🎉 Sample images successfully seeded into GridFS!');
}

// If run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedSampleImages();
      process.exit(0);
    } catch (err) {
      console.error('❌ Seeding error:', err);
      process.exit(1);
    }
  })();
}
