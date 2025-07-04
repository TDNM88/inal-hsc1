import mongoose from 'mongoose';

// Define interface for the cached MongoDB connection
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Define types for global mongoose cache
declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inal-hsc';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Initialize the cached variable with proper typing
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

// Set the global mongoose object if it doesn't exist
if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Hàm trợ giúp để lấy MongoDB client connection từ mongoose
 * Sử dụng trong các API route để truy cập collection
 */
export async function getMongoDb() {
  await connectToDatabase();
  // Truy cập db trực tiếp từ mongoose.connection
  return mongoose.connection.db;
}
