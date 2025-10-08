// App.js
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const connectDB = require('./db');
const { User, City, Building, Note, Constatation, Effectif } = require('./CombinedModel'); // Import the models

const JWT_SECRET = 'hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe';

const app = express();

// Cookie parser pour lire les cookies httpOnly
app.use(cookieParser());

// Configuration CORS pour permettre les requêtes depuis le navigateur et Vercel
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://appbtp-webapp.vercel.app'
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

// Connect to MongoDB
connectDB();

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
    const { city, building, floor, apartment, company, nombrePersonnes, selectedDate } = req.body;
    const effectif = new Effectif({
      city,
      building,
      floor,
      apartment,
      company,
      nombrePersonnes,
      selectedDate,
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
    const filter = { userId: user._id };
    if (city) filter.city = city;
    if (building) filter.building = building;
    if (floor) filter.floor = floor;
    if (apartment) filter.apartment = apartment;
    if (company) filter.company = company;
    if (selectedDate) filter.selectedDate = selectedDate;
    const effectifs = await Effectif.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, effectifs });
  } catch (err) {
    console.error('Error fetching effectif:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching effectif', error: err.message });
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
    
    const note = new Note({
      city,
      building,
      task,
      floor,
      apartment,
      company,
      openTime: openTime || '',
      closedTime: closedTime || '',
      selectedDate: new Date(selectedDate),
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

    const notes = await Note.find(filter).sort({ createdAt: -1 });
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
    const filter = { userId: user._id };
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
    
    // Vérifier que la note appartient à l'utilisateur
    const note = await Note.findOne({ _id: id, userId: user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found or not authorized' });
    }

    await Note.findByIdAndDelete(id);
    console.log('Note deleted successfully:', id);
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err.message);
    res.status(500).json({ success: false, message: 'Error deleting note', error: err.message });
  }
});

// Mettre à jour une note (par exemple, ajouter l'heure de fermeture)
app.put('/notes/:id', async (req, res) => {
  console.log('PUT /notes/:id - Request received');
  console.log('Note ID:', req.params.id);
  console.log('Body:', req.body);

  const header = req.get('Authorization');
  if (!header) {
    console.log('No authorization header');
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    console.log('Token verified, user ID:', payload.id);

    const user = await User.findById(payload.id);
    if (!user) {
      console.log('User not found');
      throw new Error('Invalid user.');
    }

    const { id } = req.params;
    const { closedTime } = req.body;

    console.log('Looking for note with ID:', id, 'and userId:', user._id);

    // Vérifier que la note appartient à l'utilisateur
    const note = await Note.findOne({ _id: id, userId: user._id });

    if (!note) {
      console.log('Note not found for user');
      // Essayer de trouver la note sans filtrer par userId pour déboguer
      const noteExists = await Note.findById(id);
      if (noteExists) {
        console.log('Note exists but belongs to user:', noteExists.userId);
      } else {
        console.log('Note does not exist at all');
      }
      return res.status(404).json({ success: false, message: 'Note not found or not authorized' });
    }

    console.log('Note found, updating closedTime to:', closedTime);

    // Mettre à jour la note
    note.closedTime = closedTime;
    await note.save();

    console.log('Note updated successfully:', id);
    res.json({ success: true, message: 'Note updated successfully', note });
  } catch (err) {
    console.error('Error updating note:', err.message);
    console.error('Stack:', err.stack);
    res.status(500).json({ success: false, message: 'Error updating note', error: err.message });
  }
});

// Routes pour les constatations
// Créer une nouvelle constatation
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

    const { reportNumber, chantierName, city, building, task, company, imageAvant, imageApres, selectedDate, endDate } = req.body;

    const constatation = new Constatation({
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

    const constatations = await Constatation.find(filter).sort({ createdAt: -1 });
    console.log('Constatations fetched successfully:', constatations);
    res.json({ success: true, constatations });
  } catch (err) {
    console.error('Error fetching constatations:', err.message);
    res.status(500).json({ success: false, message: 'Error fetching constatations', error: err.message });
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
