const mongoose = require('mongoose');

// Existing schemas
const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const City = mongoose.model('City', citySchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  salt: { type: String, required: true },
  hash: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// New building schema
const buildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});

const Building = mongoose.model('Building', buildingSchema);

// Note schema
const noteSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true
  },
  building: {
    type: String,
    required: true
  },
  task: {
    type: String,
    required: true
  },
  floor: {
    type: String,
    required: true
  },
  apartment: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  openTime: {
    type: String,
    default: ''
  },
  closedTime: {
    type: String,
    default: ''
  },
  selectedDate: {
    type: Date,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Note = mongoose.model('Note', noteSchema);

// Constatation schema
const constatationSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true
  },
  building: {
    type: String,
    required: true
  },
  task: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  imageAvant: {
    type: String,
    required: true
  },
  imageApres: {
    type: String,
    required: true
  },
  selectedDate: {
    type: Date,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Constatation = mongoose.model('Constatation', constatationSchema);

module.exports = { City, User, Building, Note, Constatation };
