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

// Constatation schema
const constatationSchema = new mongoose.Schema({
  floor: {
    type: String,
    required: true
  },
  apartment: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
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

// Effectif schema
const effectifSchema = new mongoose.Schema({
  city: { type: String, required: true },
  building: { type: String, required: true },
  floor: { type: String, required: true },
  apartment: { type: String, required: true },
  company: { type: String, required: true },
  nombrePersonnes: { type: Number, required: true },
  selectedDate: { type: Date, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Effectif = mongoose.model('Effectif', effectifSchema);

// Remarque schema
const remarqueSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: false
  },
  image: {
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

const Remarque = mongoose.model('Remarque', remarqueSchema);

// Folder schema
const folderSchema = new mongoose.Schema({
  reportNumber: { type: Number, required: true },
  chantierName: { type: String, required: true },
  company: { type: String, required: true },
  city: { type: String, required: true },
  building: { type: String, required: true },
  task: { type: String, required: true },
  mission: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Folder = mongoose.model('Folder', folderSchema);

// FolderPhoto schema
const folderPhotoSchema = new mongoose.Schema({
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true },
  imageAvant: { type: String, required: true },
  imageApres: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const FolderPhoto = mongoose.model('FolderPhoto', folderPhotoSchema);

module.exports = { City, User, Building, Note, Constatation, Effectif, Remarque, Folder, FolderPhoto };
