
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing');
  process.exit(1);
}

async function dropIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: 'streams' }).toArray();

    if (collections.length === 0) {
      console.log('Streams collection does not exist');
      return;
    }

    const indexes = await db.collection('streams').indexes();
    const uniqueIndex = indexes.find(idx => idx.key.agoraChannel === 1);

    if (uniqueIndex) {
      console.log(`Found unique index: ${uniqueIndex.name}. Dropping it...`);
      await db.collection('streams').dropIndex(uniqueIndex.name);
      console.log('Index dropped successfully');
    } else {
        // Double check for other names or if it's strictly the key
        console.log('Unique index on agoraChannel not found via key check. Listing all indexes:', indexes);
        // Attempt to drop by standard mongoose name just in case
        try {
            await db.collection('streams').dropIndex('agoraChannel_1');
            console.log('Tried dropping agoraChannel_1 directly.');
        } catch(e) {
            console.log('Could not drop agoraChannel_1 (might not exist or different name).');
        }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

dropIndex();
