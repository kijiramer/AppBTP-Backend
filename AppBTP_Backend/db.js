const mongoose = require('mongoose');

const connectDB = async () => {
  const defaultUri = 'mongodb+srv://kijiramer:admin@cluster0.bafh5lk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const mongoUri = process.env.MONGODB_URI || defaultUri;
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
