import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let gridFSBucket = null;

/**
 * Connect to MongoDB Atlas or local MongoDB service.
 * Defaults to local mongodb://127.0.0.1:27017/image_crop_viewer if no URI is supplied.
 */
export const connectDB = async () => {
  const mongoUri =
    process.env.MONGODB_URI && process.env.MONGODB_URI.trim() !== ''
      ? process.env.MONGODB_URI
      : 'mongodb://127.0.0.1:27017/image_crop_viewer';

  console.log(`🔄 Connecting to MongoDB: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });

    console.log(`🚀 MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);

    // Initialize GridFS bucket on the active connection database
    gridFSBucket = new mongoose.mongo.GridFSBucket(conn.connection.db, {
      bucketName: 'images',
    });

    console.log('📦 GridFSBucket "images" initialized successfully');
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Get active GridFSBucket instance.
 */
export const getBucket = () => {
  if (!gridFSBucket) {
    throw new Error('GridFSBucket has not been initialized. Ensure connectDB() has resolved.');
  }
  return gridFSBucket;
};
