// Route d'avatar utilisateur (stockage URI)
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('./CombinedModel');
const JWT_SECRET = 'hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe';

// Middleware d'authentification JWT
function authenticate(req, res, next) {
  const header = req.get('Authorization');
  if (!header) return res.status(401).json({ error: 'Token manquant.' });
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide.' });
  }
}

// Route POST /user/avatar (stocke l'URI)
router.post('/user/avatar', authenticate, async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ error: 'Aucune URI fournie.' });
    }
    await User.findByIdAndUpdate(req.user.id, { avatar });
    return res.json({ success: true, avatarUrl: avatar });
  } catch (err) {
    console.error('Erreur avatar:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
