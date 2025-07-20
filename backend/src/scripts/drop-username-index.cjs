const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/intelligentinvestor";

async function dropUsernameIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check existing indexes
    console.log('Checking existing indexes...');
    const indexes = await db.collection('users').getIndexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    // Drop username index if it exists
    if (indexes.username_1) {
      console.log('Dropping username_1 index...');
      await db.collection('users').dropIndex('username_1');
      console.log('✅ Username index dropped successfully');
    } else {
      console.log('No username index found');
    }

    // Check indexes again
    const newIndexes = await db.collection('users').getIndexes();
    console.log('Indexes after cleanup:', JSON.stringify(newIndexes, null, 2));

    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropUsernameIndex(); 