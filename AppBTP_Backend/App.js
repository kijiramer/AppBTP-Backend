// App.js
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('./db');
const { User, City, Building, Note, Constatation } = require('./CombinedModel'); // Import the models

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

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

const JWT_SECRET = 'hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe';

app.get('/user', async (req, res) => {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'You are not authorized.' });
  }
  const token = header.split(' ')[1];
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
  return res.status(200).json({ success: true, token });
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

    const { city, building, task, company, imageAvant, imageApres, selectedDate } = req.body;
    
    const constatation = new Constatation({
      city,
      building,
      task,
      company,
      imageAvant,
      imageApres,
      selectedDate: new Date(selectedDate),
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

app.listen(5001, '0.0.0.0', () => {
  console.log('Express server is running on port 5001.');
});
