require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI environment variable is required in production.');
      }
      console.warn('WARNING: MONGO_URI not set. Falling back to local MongoDB.');
    }
    const conn = await mongoose.connect(mongoUri || 'mongodb://127.0.0.1:27017/brooemail');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
