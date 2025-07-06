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
  console.log('Connecting to MongoDB...');
  
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Creating new database connection...');
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    console.log('Waiting for database connection...');
    cached.conn = await cached.promise;
    console.log('Database connection established');
  } catch (e) {
    console.error('Failed to connect to MongoDB:', e);
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
  try {
    console.log('Getting MongoDB connection...');
    await connectToDatabase();
    
    if (!mongoose.connection.db) {
      throw new Error('MongoDB connection is not established');
    }
    
    console.log('Successfully got MongoDB connection');
    return mongoose.connection.db;
  } catch (error) {
    console.error('Error getting MongoDB connection:', error);
    throw error;
  }
}
