const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const connectDB = require('./db');
const { User, City, Building } = require('./CombinedModel'); // Import the Building model

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

// Add the buildings route
app.get('/buildings', async (req, res) => {
  try {
    const buildings = await Building.find();
    res.json(buildings);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.listen(8081, () => {
  console.log('Express server is running on port 8081.');
});
