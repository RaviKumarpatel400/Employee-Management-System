const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const fixDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB...');

    const db = mongoose.connection.db;
    
    // Check if leavebalances collection exists
    const collections = await db.listCollections({ name: 'leavebalances' }).toArray();
    
    if (collections.length > 0) {
      console.log('Found "leavebalances" collection. Dropping it to remove conflicting indexes...');
      await db.dropCollection('leavebalances');
      console.log('Collection "leavebalances" dropped successfully.');
    } else {
      console.log('"leavebalances" collection does not exist. No action needed.');
    }

    // Optional: Check users collection indexes if needed, but error was specific to leavebalances.
    
    console.log('Database fix complete. You can now create employees.');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing database:', err);
    process.exit(1);
  }
};

fixDB();
