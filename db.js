const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // Si déjà connecté, ne rien faire
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const defaultUri = 'mongodb+srv://kijiramer:admin@cluster0.bafh5lk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const mongoUri = process.env.MONGODB_URI || defaultUri;

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log('MongoDB connected');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    isConnected = false;
    // Don't exit process on Vercel serverless - just log error
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
