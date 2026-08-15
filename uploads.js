// Routes d'upload de photos vers Cloudinary.
//
// L'application mobile envoie les images en multipart/form-data puis stocke
// l'URL renvoyee ici dans la remarque ou la photo de dossier. Sans ces routes,
// la creation d'une remarque est impossible (la photo y est obligatoire).
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Meme secret que App.js et avatar.js : les jetons doivent rester verifiables
// par tous les modules. Ne pas diverger vers une variable d'environnement ici
// tant que App.js utilise la constante en dur.
const JWT_SECRET = 'hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Stockage en memoire : le disque de Render est ephemere, un fichier ecrit
// localement disparait au redemarrage de l'instance.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Middleware d'authentification JWT (identique a avatar.js)
function authenticate(req, res, next) {
  const header = req.get('Authorization');
  if (!header) {
    return res.status(401).json({ success: false, message: 'Token manquant.' });
  }
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide.' });
  }
}

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Middleware: echoue explicitement si les variables Cloudinary manquent, plutot
// que de laisser le SDK renvoyer une erreur obscure.
function requireCloudinary(req, res, next) {
  if (!cloudinaryConfigured()) {
    console.error('Upload refuse : variables CLOUDINARY_* absentes.');
    return res.status(500).json({
      success: false,
      message: "Stockage d'images non configure sur le serveur.",
    });
  }
  next();
}

// Envoie un buffer vers Cloudinary et renvoie l'URL HTTPS.
function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });
}

// Photo d'une remarque. L'app envoie un seul fichier sous le champ "photo"
// et attend { success, avatarUrl }.
router.post(
  '/uploadRemarquePhoto',
  authenticate,
  requireCloudinary,
  upload.single('photo'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune photo recue.' });
    }
    try {
      const avatarUrl = await uploadBuffer(req.file.buffer, 'appbtp/remarques');
      return res.json({ success: true, avatarUrl });
    } catch (err) {
      console.error('Erreur upload remarque:', err.message);
      return res.status(500).json({ success: false, message: 'Upload echoue', error: err.message });
    }
  }
);

// Photos d'un rapport photo. Les deux champs sont independamment optionnels :
// l'ajout initial envoie imageAvant (+ imageApres eventuel), tandis que l'ajout
// d'un "apres" sur une photo existante n'envoie que imageApres.
router.post(
  '/uploadConstatationPhoto',
  authenticate,
  requireCloudinary,
  upload.fields([
    { name: 'imageAvant', maxCount: 1 },
    { name: 'imageApres', maxCount: 1 },
  ]),
  async (req, res) => {
    const avantFile = req.files && req.files.imageAvant && req.files.imageAvant[0];
    const apresFile = req.files && req.files.imageApres && req.files.imageApres[0];

    if (!avantFile && !apresFile) {
      return res.status(400).json({ success: false, message: 'Aucune image recue.' });
    }

    try {
      const [imageAvant, imageApres] = await Promise.all([
        avantFile ? uploadBuffer(avantFile.buffer, 'appbtp/constatations') : Promise.resolve(null),
        apresFile ? uploadBuffer(apresFile.buffer, 'appbtp/constatations') : Promise.resolve(null),
      ]);
      return res.json({ success: true, imageAvant, imageApres });
    } catch (err) {
      console.error('Erreur upload constatation:', err.message);
      return res.status(500).json({ success: false, message: 'Upload echoue', error: err.message });
    }
  }
);

// Gestion des erreurs multer (fichier trop volumineux, champ inattendu...),
// sinon Express renvoie une 500 sans message exploitable cote app.
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image trop volumineuse (15 Mo maximum).'
      : `Erreur de reception du fichier : ${err.message}`;
    return res.status(400).json({ success: false, message });
  }
  return next(err);
});

module.exports = router;
