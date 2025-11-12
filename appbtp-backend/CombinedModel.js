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
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
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

// Constatation schema - Flexible pour supporter deux types de constatations
// Type 1: Rapport Photo (reportNumber, chantierName, company, imageAvant, imageApres)
// Type 2: Constatation simple (floor, apartment, description, image)
const constatationSchema = new mongoose.Schema({
  // Champs pour Rapport Photo (optionnels)
  reportNumber: {
    type: Number,
    required: false
  },
  intituleMission: {
    type: String,
    required: false
  },
  chantierName: {
    type: String,
    required: false
  },
  company: {
    type: String,
    required: false
  },
  imageAvant: {
    type: String,
    required: false
  },
  imageApres: {
    type: String,
    required: false
  },
  // Champs pour Constatation simple (optionnels)
  floor: {
    type: String,
    required: false
  },
  apartment: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  image: {
    type: String,
    required: false
  },
  // Champs communs
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
  selectedDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: false
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

// Effectif schema
const effectifSchema = new mongoose.Schema({
  city: { type: String, required: true },
  building: { type: String, required: true },
  task: { type: String, required: true },
  floor: { type: String, required: true },
  apartment: { type: String, required: true },
  company: { type: String, required: true },
  nombrePersonnes: { type: Number, required: true },
  selectedDate: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Effectif = mongoose.model('Effectif', effectifSchema);

module.exports = { City, User, Building, Note, Constatation, Effectif };
