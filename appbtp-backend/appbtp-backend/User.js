const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  salt: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'nettoyeur', 'hommeclé', 'pilote'],
    default: 'user'
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
