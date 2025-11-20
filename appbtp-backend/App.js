// App.js
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const connectDB = require('./db');
const { User, City, Building, Note, Constatation, Effectif, Remarque, Folder, FolderPhoto } = require('./CombinedModel'); // Import the models

const JWT_SECRET = 'hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe';

const app = express();

// Cookie parser pour lire les cookies httpOnly
app.use(cookieParser());

// Configuration CORS pour permettre les requêtes depuis le navigateur et Vercel
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://appbtp-webapp.vercel.app',
  'https://app-btp-webapp.vercel.app'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Permettre localhost et domaines Vercel
  const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
  const isVercel = origin && (origin.includes('vercel.app') || origin.includes('netlify.app'));
  const isAllowed = allowedOrigins.includes(origin);
  
  if (isAllowed || isLocalhost || isVercel || process.env.NODE_ENV === 'production') {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Connecter à MongoDB au démarrage (non-bloquant pour Vercel)
connectDB().catch(err => console.error('Initial DB connection failed:', err));

// Route racine
app.get('/', (req, res) => {
  console.log('Root route accessed from origin:', req.headers.origin);
  res.json({
    message: 'Bienvenue sur l\'API AppBTP',
    version: '1.0.0',
    status: 'running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: {
        login: 'POST /login',
        register: 'POST /register'
      },
      data: {
        effectif: 'POST /effectif',
        constatations: 'GET /constatations'
      }
    }
  });
});

// Routes pour l'effectif
app.post('/effectif', async (req, res) => {
  try {
    const header = req.get('Authorization');
    if (!header) {
      return res.status(401).json({ success: false, message: 'You are not authorized.' });
    }
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }
    const { city, building, task, floor, apartment, company, nombrePersonnes, selectedDate } = req.body;
    
    // Normaliser la date pour éviter les problèmes de timezone
    const normalizedDate = new Date(selectedDate);
    normalizedDate.setHours(12, 0, 0, 0);
    
    const effectif = new Effectif({
      city,
      building,
      task,
      floor,
      apartment,
      company,
      nombrePersonnes,
      selectedDate: normalizedDate,
      userId: user._id
    });
    await effectif.save();
    res.json({ success: true, effectif });
  } catch (err) {
    console.error('Error creating effectif:', err.message);
    res.status(500).json({ success: false, message: 'Error creating effectif', error: err.message });
  }
});

app.get('/effectif', async (req, res) => {
  try {
    const header = req.get('Authorization');
    if (!header) {
      return res.status(401).json({ success: false, message: 'You are not authorized.' });
    }
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }
    const { city, building, floor, apartment, company, selectedDate } = req.query;
    const filter = {}; // Suppression du filtre userId - accessible à tous
    if (city) filter.city = city;
    if (building) filter.building = building;
    if (floor) filter.floor = floor;
    if (apartment) filter.apartment = apartment;
    if (company) filter.company = company;
    if (selectedDate) filter.selectedDate = selectedDate;
    const effectifs = await Effectif.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email');
    res.json({ success: true, effectifs });
  } catch (err) {
    console.error('Error fetching effectif:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching effectif', error: err.message });
  }
});

// Alias pour la route GET /effectifs (avec 's')
app.get('/effectifs', async (req, res) => {
  try {
    const header = req.get('Authorization');
    if (!header) {
      return res.status(401).json({ success: false, message: 'You are not authorized.' });
    }
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }
    const { city, building, task, floor, apartment, company, selectedDate } = req.query;
    const filter = {}; // Suppression du filtre userId - accessible à tous
    if (city) filter.city = city;
    if (building) filter.building = building;
    if (task) filter.task = task;
    if (floor) filter.floor = floor;
    if (apartment) filter.apartment = apartment;
    if (company) filter.company = company;
    
    // Si selectedDate est fourni, créer une plage pour le jour entier
    if (selectedDate) {
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      filter.selectedDate = { $gte: startDate, $lte: endDate };
    }
    
    const effectifs = await Effectif.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email');
    res.json({ success: true, effectifs });
  } catch (err) {
    console.error('Error fetching effectifs:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching effectifs', error: err.message });
  }
});

// Supprimer un effectif
app.delete('/effectifs/:id', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { id } = req.params;

    // Vérifier que l'effectif existe
    const effectif = await Effectif.findById(id);
    if (!effectif) {
      return res.status(404).json({ success: false, message: 'Effectif not found' });
    }

    // Vérifier que l'utilisateur est l'auteur ou admin
    if (effectif.userId.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this effectif' });
    }

    await Effectif.findByIdAndDelete(id);
    console.log('Effectif deleted successfully:', id);
    res.json({ success: true, message: 'Effectif deleted successfully' });
  } catch (err) {
    console.error('Error deleting effectif:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting effectif', error: err.message });
  }
});

// Helper functions
const generateSaltAndHashForPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return { salt, hash };
};

const comparePassword = async (password, salt, hash) => {
  console.log('Comparing password:', password);
  console.log('Using salt:', salt);
  console.log('Expected hash:', hash);

  if (!salt || !hash) {
    throw new Error('Salt or hash is missing');
  }

  const inputHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return hash === inputHash;
};

const sanitizeUser = (user) => {
  const sanitized = user.toObject();
  delete sanitized.salt;
  delete sanitized.hash;
  return sanitized;
};

app.get('/user', async (req, res) => {
  // Accept token from Authorization header or cookie
  const header = req.get('Authorization');
  const cookieToken = req.cookies && req.cookies.token;
  const token = header ? header.split(' ')[1] : cookieToken;
  if (!token) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid JWT token.' });
  }
});

// Route pour récupérer le profil utilisateur (alias de /user)
app.get('/user/profile', async (req, res) => {
  const header = req.get('Authorization');
  const cookieToken = req.cookies && req.cookies.token;
  const token = header ? header.split(' ')[1] : cookieToken;
  if (!token) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid JWT token.' });
  }
});

// Route pour mettre à jour le profil utilisateur
app.put('/user/profile', async (req, res) => {
  const header = req.get('Authorization');
  const cookieToken = req.cookies && req.cookies.token;
  const token = header ? header.split(' ')[1] : cookieToken;
  if (!token) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    // Mettre à jour les champs autorisés
    const { name, email } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    return res.status(500).json({ success: false, message: 'Error updating profile', error: err.message });
  }
});

app.get('/buildings', async (req, res) => {
  try {
    const buildings = await Building.find();
    console.log('Buildings fetched successfully:', buildings);
    res.json(buildings);
  } catch (err) {
    console.error('Error fetching buildings:', err.message); // Log the error message
    res.status(500).send({ error: 'Error fetching buildings', details: err.message }); // Send error message in the response
  }
});



app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt with email:', email);

  const user = await User.findOne({ email });
  console.log('User found:', user);

  if (!user) {
    return res.status(400).json({ success: false, message: 'Could not find user with this email address, please try again.' });
  }

  try {
    if (!await comparePassword(password, user.salt, user.hash)) {
      return res.status(400).json({ success: false, message: 'Unable to log in with provided credentials.' });
    }
  } catch (err) {
    console.log('Error comparing password:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }

  const payload = {
    id: user._id,
    name: user.name,
    email: user.email
  };
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
  // Set cookie httpOnly
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  return res.status(200).json({ success: true, token });
});

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User with this email already exists.' });
  }
  const { salt, hash } = generateSaltAndHashForPassword(password);
  const user = new User({
    name,
    email,
    salt,
    hash
  });
  await user.save();
  const payload = {
    id: user._id,
    name: user.name,
    email: user.email
  };
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
  // Set cookie httpOnly
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  return res.status(200).json({ success: true, token });
});

// Admin middleware
const isAdmin = async (req, res, next) => {
  try {
    // check Authorization header first, then cookie
    const header = req.get('Authorization');
    const cookieToken = req.cookies && req.cookies.token;
    const token = header ? header.split(' ')[1] : cookieToken;
    if (!token) return res.status(401).json({ success: false, message: 'You are not authorized.' });
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Admin route: list users (admin only)
app.get('/admin/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-salt -hash');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching users', error: err.message });
  }
});

// Admin route: create a user (admin only)
app.post('/admin/users', isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    const { salt, hash } = generateSaltAndHashForPassword(password);
    const user = new User({ name, email, salt, hash, role: role || 'user' });
    await user.save();
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error creating user', error: err.message });
  }
});

// Admin route: update a user (admin only)
app.put('/admin/users/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (password) {
      const { salt, hash } = generateSaltAndHashForPassword(password);
      user.salt = salt;
      user.hash = hash;
    }
    await user.save();
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating user', error: err.message });
  }
});

// Admin route: delete a user (admin only)
app.delete('/admin/users/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    await User.findByIdAndDelete(id);
    return res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting user', error: err.message });
  }
});

// Add the cities route
app.get('/cities', async (req, res) => {
  try {
    const cities = await City.find();
    res.json(cities);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Routes pour les notes
// Créer une nouvelle note
app.post('/notes', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }
  
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { city, building, task, floor, apartment, company, openTime, closedTime, selectedDate } = req.body;
    
    // Normaliser la date pour éviter les problèmes de timezone
    const normalizedDate = new Date(selectedDate);
    normalizedDate.setHours(12, 0, 0, 0);
    
    const note = new Note({
      city,
      building,
      task,
      floor,
      apartment,
      company,
      openTime: openTime || '',
      closedTime: closedTime || '',
      selectedDate: normalizedDate,
      userId: user._id
    });

    await note.save();
    console.log('Note created successfully:', note);
    res.json({ success: true, note });
  } catch (err) {
    console.error('Error creating note:', err.message);
    res.status(500).json({ success: false, message: 'Error creating note', error: err.message });
  }
});

// Récupérer les notes d'un utilisateur pour un context spécifique
app.get('/notes', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }
  
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { city, building, task, selectedDate } = req.query;
    
    const filter = {}; // Suppression du filtre userId - accessible à tous
    if (city) filter.city = city;
    if (building) filter.building = building;
    if (task) filter.task = task;
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.selectedDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const notes = await Note.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email');
    console.log('Notes fetched successfully:', notes);
    res.json({ success: true, notes });
  } catch (err) {
    console.error('Error fetching notes:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching notes', error: err.message });
  }
});

// Récupérer toutes les dates (jours) où des notes existent pour un contexte
app.get('/notes/dates', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { city, building, task } = req.query;
    const filter = {}; // Suppression du filtre userId - accessible à tous
    if (city) filter.city = city;
    if (building) filter.building = building;
    if (task) filter.task = task;

    const notes = await Note.find(filter).select('selectedDate').lean();
    const set = new Set();
    for (const n of notes) {
      if (n.selectedDate) {
        const d = new Date(n.selectedDate);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        set.add(`${y}-${m}-${day}`);
      }
    }
    return res.json({ success: true, dates: Array.from(set) });
  } catch (err) {
    console.error('Error fetching note dates:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching note dates', error: err.message });
  }
});

// Supprimer une note
app.delete('/notes/:id', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }
  
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { id } = req.params;
    
    // Vérifier que la note existe
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Vérifier que l'utilisateur est l'auteur ou admin
    if (note.userId.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this note' });
    }

    await Note.findByIdAndDelete(id);
    console.log('Note deleted successfully:', id);
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting note', error: err.message });
  }
});

// Mettre à jour une note (fermer une note)
app.put('/notes/:id', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { id } = req.params;
    const { closedTime } = req.body;

    // Vérifier que la note existe
    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Vérifier que l'utilisateur est l'auteur ou admin
    if (note.userId.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this note' });
    }

    note.closedTime = closedTime;
    await note.save();

    console.log('Note updated successfully:', id);
    res.json({ success: true, note });
  } catch (err) {
    console.error('Error updating note:', err.message);
    res.status(500).json({ success: false, message: 'Error updating note', error: err.message });
  }
});

// Routes pour les constatations
// Créer une nouvelle constatation
// Supporte deux types: Rapport Photo (anciens champs) et Constatation simple (nouveaux champs)
app.post('/constatations', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    // Support pour les deux types de constatations
    const {
      // Champs pour Rapport Photo (anciens)
      reportNumber, chantierName, company, imageAvant, imageApres,
      // Champs pour Constatation simple (nouveaux)
      floor, apartment, description, image,
      // Champs communs
      city, building, task, selectedDate, endDate
    } = req.body;

    // Normaliser la date pour éviter les problèmes de timezone
    const normalizedDate = new Date(selectedDate);
    normalizedDate.setHours(12, 0, 0, 0); // Midi pour éviter les changements de jour

    const constatationData = {
      city,
      building,
      task,
      selectedDate: normalizedDate,
      endDate: endDate ? new Date(endDate) : undefined,
      userId: user._id
    };

    // Ajouter les champs spécifiques selon le type
    if (reportNumber !== undefined) constatationData.reportNumber = reportNumber;
    if (chantierName) constatationData.chantierName = chantierName;
    if (company) constatationData.company = company;
    if (imageAvant) constatationData.imageAvant = imageAvant;
    if (imageApres) constatationData.imageApres = imageApres;

    if (floor) constatationData.floor = floor;
    if (apartment) constatationData.apartment = apartment;
    if (description) constatationData.description = description;
    if (image) constatationData.image = image;

    const constatation = new Constatation(constatationData);

    await constatation.save();
    console.log('Constatation created successfully:', constatation);
    res.json({ success: true, constatation });
  } catch (err) {
    console.error('Error creating constatation:', err.message);
    res.status(500).json({ success: false, message: 'Error creating constatation', error: err.message });
  }
});

// Récupérer les constatations d'un utilisateur pour un context spécifique
app.get('/constatations', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }
  
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { city, building, task, selectedDate } = req.query;
    
    const filter = {}; // Suppression du filtre userId - accessible à tous
    if (city) filter.city = city;
    if (building) filter.building = building;
    if (task) filter.task = task;
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.selectedDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const constatations = await Constatation.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email');
    console.log('Constatations fetched successfully:', constatations);
    res.json({ success: true, constatations });
  } catch (err) {
    console.error('Error fetching constatations:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching constatations', error: err.message });
  }
});

// Mettre à jour une constatation
app.put('/constatations/:id', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const constatationId = req.params.id;
    const updateData = req.body;

    // Construire l'objet de mise à jour avec tous les champs possibles
    const updateFields = {};
    if (updateData.intituleMission !== undefined) updateFields.intituleMission = updateData.intituleMission;
    if (updateData.chantierName !== undefined) updateFields.chantierName = updateData.chantierName;
    if (updateData.company !== undefined) updateFields.company = updateData.company;
    if (updateData.city !== undefined) updateFields.city = updateData.city;
    if (updateData.building !== undefined) updateFields.building = updateData.building;
    if (updateData.task !== undefined) updateFields.task = updateData.task;
    if (updateData.selectedDate !== undefined) updateFields.selectedDate = updateData.selectedDate;
    if (updateData.endDate !== undefined) updateFields.endDate = updateData.endDate;
    // Nouveaux champs pour Constatation simple
    if (updateData.floor !== undefined) updateFields.floor = updateData.floor;
    if (updateData.apartment !== undefined) updateFields.apartment = updateData.apartment;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.image !== undefined) updateFields.image = updateData.image;

    // Mettre à jour la constatation
    const updatedConstatation = await Constatation.findByIdAndUpdate(
      constatationId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedConstatation) {
      return res.status(404).json({ success: false, message: 'Constatation not found' });
    }

    res.json({ success: true, constatation: updatedConstatation });
  } catch (err) {
    console.error('Error updating constatation:', err.message);
    res.status(500).json({ success: false, message: 'Error updating constatation', error: err.message });
  }
});

// Supprimer une constatation
app.delete('/constatations/:id', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const constatationId = req.params.id;
    const constatation = await Constatation.findById(constatationId);

    if (!constatation) {
      return res.status(404).json({ success: false, message: 'Constatation not found' });
    }

    // Vérifier que l'utilisateur est le propriétaire de la constatation
    if (constatation.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this constatation' });
    }

    await Constatation.findByIdAndDelete(constatationId);
    console.log('Constatation deleted successfully:', constatationId);
    res.json({ success: true, message: 'Constatation deleted successfully' });
  } catch (err) {
    console.error('Error deleting constatation:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting constatation', error: err.message });
  }
});

// Routes pour les remarques
// Créer une nouvelle remarque
app.post('/remarques', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    // Vérifier que l'utilisateur est pilote ou admin
    if (user.role !== 'pilote' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only pilote and admin can create remarques' });
    }

    const { city, building, task, floor, apartment, description, image, selectedDate } = req.body;
    
    // Normaliser la date pour éviter les problèmes de timezone
    const normalizedDate = new Date(selectedDate);
    normalizedDate.setHours(12, 0, 0, 0);
    
    const remarque = new Remarque({
      city,
      building,
      task,
      floor,
      apartment,
      description,
      image,
      selectedDate: normalizedDate,
      userId: user._id
    });

    await remarque.save();
    console.log('Remarque created successfully:', remarque);
    res.json({ success: true, remarque });
  } catch (err) {
    console.error('Error creating remarque:', err.message);
    res.status(500).json({ success: false, message: 'Error creating remarque', error: err.message });
  }
});

// Récupérer les remarques
app.get('/remarques', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { city, building, task, selectedDate } = req.query;
    const filter = {}; // Suppression du filtre userId - accessible à tous

    if (city) filter.city = city;
    if (building) filter.building = building;
    if (task) filter.task = task;
    if (selectedDate) {
      const date = new Date(selectedDate);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      filter.selectedDate = {
        $gte: date,
        $lt: nextDate
      };
    }

    const remarques = await Remarque.find(filter).sort({ createdAt: -1 }).populate('userId', 'name email');
    console.log('Remarques fetched successfully:', remarques.length);
    res.json({ success: true, remarques });
  } catch (err) {
    console.error('Error fetching remarques:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching remarques', error: err.message });
  }
});

// Supprimer une remarque
app.delete('/remarques/:id', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    // Vérifier que l'utilisateur est pilote ou admin
    if (user.role !== 'pilote' && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only pilote and admin can delete remarques' });
    }

    const remarqueId = req.params.id;
    const remarque = await Remarque.findById(remarqueId);

    if (!remarque) {
      return res.status(404).json({ success: false, message: 'Remarque not found' });
    }

    // Vérifier que l'utilisateur est l'auteur ou admin
    if (remarque.userId.toString() !== user._id.toString() && user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this remarque' });
    }

    await Remarque.findByIdAndDelete(remarqueId);
    console.log('Remarque deleted successfully:', remarqueId);
    res.json({ success: true, message: 'Remarque deleted successfully' });
  } catch (err) {
    console.error('Error deleting remarque:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting remarque', error: err.message });
  }
});

// ==================== ROUTES POUR LES DOSSIERS (FOLDERS) ====================
// Créer un nouveau dossier avec numéro auto-incrémenté
app.post('/folders', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { intituleMission, chantierName, company, city, building, task, mission, startDate, endDate } = req.body;

    // Trouver le dernier numéro de rapport et incrémenter
    const lastFolder = await Folder.findOne().sort({ reportNumber: -1 });
    const reportNumber = lastFolder ? lastFolder.reportNumber + 1 : 1;

    const folder = new Folder({
      reportNumber,
      intituleMission,
      chantierName,
      company,
      city,
      building,
      task,
      mission,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      userId: user._id
    });

    await folder.save();
    console.log('Folder created successfully:', folder);
    res.json({ success: true, folder });
  } catch (err) {
    console.error('Error creating folder:', err.message);
    res.status(500).json({ success: false, message: 'Error creating folder', error: err.message });
  }
});

// Récupérer les dossiers d'un utilisateur
app.get('/folders', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { city, building, task, startDate, endDate } = req.query;
    const filter = { userId: user._id };

    if (city) filter.city = city;
    if (building) filter.building = building;
    if (task) filter.task = task;

    // Filtrer par plage de dates si spécifié
    if (startDate) {
      const date = new Date(startDate);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      filter.startDate = {
        $gte: date,
        $lt: nextDate
      };
    }

    const folders = await Folder.find(filter).sort({ createdAt: -1 });
    console.log('Folders fetched successfully:', folders.length);
    res.json({ success: true, folders });
  } catch (err) {
    console.error('Error fetching folders:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching folders', error: err.message });
  }
});

// Supprimer un dossier et toutes ses photos
app.delete('/folders/:id', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const folderId = req.params.id;
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }

    // Vérifier que l'utilisateur est le propriétaire du dossier
    if (folder.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this folder' });
    }

    // Supprimer toutes les photos du dossier
    await FolderPhoto.deleteMany({ folderId: folderId });

    // Supprimer le dossier
    await Folder.findByIdAndDelete(folderId);
    console.log('Folder and its photos deleted successfully:', folderId);
    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (err) {
    console.error('Error deleting folder:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting folder', error: err.message });
  }
});

// ==================== ROUTES POUR LES PHOTOS ====================
// Ajouter une paire de photos avant/après à un dossier
app.post('/folders/:folderId/photos', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { folderId } = req.params;
    const { imageAvant, imageApres } = req.body;

    // Vérifier que le dossier existe et appartient à l'utilisateur
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }
    if (folder.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to add photos to this folder' });
    }

    const photo = new FolderPhoto({
      folderId,
      imageAvant,
      imageApres,
      userId: user._id
    });

    await photo.save();
    console.log('Photo added to folder successfully:', photo);
    res.json({ success: true, photo });
  } catch (err) {
    console.error('Error adding photo to folder:', err.message);
    res.status(500).json({ success: false, message: 'Error adding photo', error: err.message });
  }
});

// Récupérer les photos d'un dossier
app.get('/folders/:folderId/photos', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { folderId } = req.params;

    // Vérifier que le dossier existe et appartient à l'utilisateur
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found' });
    }
    if (folder.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this folder' });
    }

    const photos = await FolderPhoto.find({ folderId }).sort({ createdAt: -1 });
    console.log('Photos fetched successfully for folder:', folderId, photos.length);
    res.json({ success: true, photos });
  } catch (err) {
    console.error('Error fetching photos:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching photos', error: err.message });
  }
});

// Supprimer une photo
app.delete('/photos/:id', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const photoId = req.params.id;
    const photo = await FolderPhoto.findById(photoId);

    if (!photo) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Vérifier que l'utilisateur est le propriétaire de la photo
    if (photo.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this photo' });
    }

    await FolderPhoto.findByIdAndDelete(photoId);
    console.log('Photo deleted successfully:', photoId);
    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (err) {
    console.error('Error deleting photo:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting photo', error: err.message });
  }
});

// Routes pour les rapports photos (alias de constatations pour l'app mobile)
// Ces routes utilisent le même modèle Constatation en backend
// Créer un nouveau rapport photo
app.post('/rapportsPhotos', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { reportNumber, chantierName, city, building, task, company, imageAvant, imageApres, selectedDate, endDate } = req.body;

    const rapportPhoto = new Constatation({
      reportNumber,
      chantierName,
      city,
      building,
      task,
      company,
      imageAvant,
      imageApres,
      selectedDate: new Date(selectedDate),
      endDate: endDate ? new Date(endDate) : undefined,
      userId: user._id
    });

    await rapportPhoto.save();
    console.log('Rapport photo created successfully:', rapportPhoto);
    res.json({ success: true, rapportPhoto });
  } catch (err) {
    console.error('Error creating rapport photo:', err.message);
    res.status(500).json({ success: false, message: 'Error creating rapport photo', error: err.message });
  }
});

// Récupérer les rapports photos d'un utilisateur pour un context spécifique
app.get('/rapportsPhotos', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const { city, building, task, selectedDate } = req.query;

    const filter = { userId: user._id };
    if (city) filter.city = city;
    if (building) filter.building = building;
    if (task) filter.task = task;
    if (selectedDate) {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.selectedDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const rapportsPhotos = await Constatation.find(filter).sort({ createdAt: -1 });
    console.log('Rapports photos fetched successfully:', rapportsPhotos);
    res.json({ success: true, rapportsPhotos });
  } catch (err) {
    console.error('Error fetching rapports photos:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching rapports photos', error: err.message });
  }
});

// Mettre à jour un rapport photo
app.put('/rapportsPhotos/:id', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const rapportPhotoId = req.params.id;
    const updateData = req.body;

    // Mettre à jour le rapport photo
    const updatedRapportPhoto = await Constatation.findByIdAndUpdate(
      rapportPhotoId,
      {
        $set: {
          intituleMission: updateData.intituleMission,
          chantierName: updateData.chantierName,
          company: updateData.company,
          city: updateData.city,
          building: updateData.building,
          task: updateData.task,
          selectedDate: updateData.selectedDate,
          endDate: updateData.endDate
        }
      },
      { new: true }
    );

    if (!updatedRapportPhoto) {
      return res.status(404).json({ success: false, message: 'Rapport photo not found' });
    }

    res.json({ success: true, rapportPhoto: updatedRapportPhoto });
  } catch (err) {
    console.error('Error updating rapport photo:', err.message);
    res.status(500).json({ success: false, message: 'Error updating rapport photo', error: err.message });
  }
});

// Supprimer un rapport photo
app.delete('/rapportsPhotos/:id', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('Invalid user.');
    }

    const rapportPhotoId = req.params.id;
    const rapportPhoto = await Constatation.findById(rapportPhotoId);

    if (!rapportPhoto) {
      return res.status(404).json({ success: false, message: 'Rapport photo not found' });
    }

    // Vérifier que l'utilisateur est le propriétaire du rapport photo
    if (rapportPhoto.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this rapport photo' });
    }

    await Constatation.findByIdAndDelete(rapportPhotoId);
    console.log('Rapport photo deleted successfully:', rapportPhotoId);
    res.json({ success: true, message: 'Rapport photo deleted successfully' });
  } catch (err) {
    console.error('Error deleting rapport photo:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting rapport photo', error: err.message });
  }
});

// Logout : clear token cookie
app.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  return res.json({ success: true, message: 'Logged out' });
});

// Configuration pour Vercel (serverless) et développement local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8081;
  const HOST = process.env.HOST || '0.0.0.0';

  const server = app.listen(PORT, HOST, () => {
    console.log(`Express server is running on port ${PORT}.`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Error: Port ${PORT} is already in use. Kill the process using it or change PORT.`);
    } else {
      console.error('Server error:', err);
    }
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection at:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
  });
}

// Export pour Vercel
module.exports = app;
