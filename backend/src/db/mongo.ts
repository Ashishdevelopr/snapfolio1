import mongoose from "mongoose";
import { config } from "dotenv";

config();
console.log("process.env.MONGODB_URI",process.env.MONGODB_URI);

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/intelligentinvestor";

export const connectMongo = async () => {
  console.log('Attempting to connect to MongoDB...');
  console.log('MongoDB URI:', process.env.MONGODB_URI ? 'From environment' : 'Using fallback (localhost)');
  
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      } as any);
      console.log("✅ Connected to MongoDB successfully");
      console.log("Database:", mongoose.connection.db?.databaseName || 'Unknown');
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      console.error("Please ensure MongoDB is running locally or set MONGODB_URI environment variable");
      throw error;
    }
  } else {
    console.log("MongoDB already connected, readyState:", mongoose.connection.readyState);
  }
}; 