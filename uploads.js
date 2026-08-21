// Routes d'upload de photos vers Supabase Storage.
//
// L'application mobile envoie les images en multipart/form-data puis stocke
// l'URL renvoyee ici dans la remarque ou la photo de dossier. Sans ces routes,
// la creation d'une remarque est impossible (la photo y est obligatoire).
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Meme secret que App.js et avatar.js : les jetons doivent rester verifiables
// par tous les modules. Ne pas diverger vers une variable d'environnement ici
// tant que App.js utilise la constante en dur.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET manquant. Definir la variable d environnement avant de demarrer.');
}

// Client cree paresseusement : ce module est importe par App.js au demarrage,
// or createClient jette si l'URL est absente. On veut que le serveur demarre
// et renvoie une 500 explicite sur l'upload, pas qu'il refuse de booter.
let supabase = null;
function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return supabase;
}

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

function storageConfigured() {
  return Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_BUCKET
  );
}

// Middleware: echoue explicitement si les variables Supabase manquent, plutot
// que de laisser le SDK renvoyer une erreur obscure.
function requireStorage(req, res, next) {
  if (!storageConfigured()) {
    console.error('Upload refuse : variables SUPABASE_* absentes.');
    return res.status(500).json({
      success: false,
      message: "Stockage d'images non configure sur le serveur.",
    });
  }
  next();
}

// Envoie un buffer vers Supabase Storage et renvoie l'URL publique.
// Le nom de fichier est un UUID : deux photos prises la meme seconde par deux
// utilisateurs ne doivent pas s'ecraser l'une l'autre.
async function uploadBuffer(buffer, folder, mimetype) {
  const type = mimetype && mimetype.startsWith('image/') ? mimetype : 'image/jpeg';
  const ext = type.split('/')[1].replace('jpeg', 'jpg');
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;
  const bucket = getSupabase().storage.from(process.env.SUPABASE_BUCKET);

  // supabase-js ne jette pas : il renvoie { data, error }. Sans ce test, un
  // upload en echec renverrait quand meme une URL bien formee, et le bug ne se
  // verrait qu'a l'affichage, plus tard.
  const { error } = await bucket.upload(key, buffer, { contentType: type });
  if (error) throw new Error(error.message);

  return bucket.getPublicUrl(key).data.publicUrl;
}

// Photo d'une remarque. L'app envoie un seul fichier sous le champ "photo"
// et attend { success, avatarUrl }.
router.post(
  '/uploadRemarquePhoto',
  authenticate,
  requireStorage,
  upload.single('photo'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune photo recue.' });
    }
    try {
      const avatarUrl = await uploadBuffer(req.file.buffer, 'appbtp/remarques', req.file.mimetype);
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
  requireStorage,
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
        avantFile ? uploadBuffer(avantFile.buffer, 'appbtp/constatations', avantFile.mimetype) : Promise.resolve(null),
        apresFile ? uploadBuffer(apresFile.buffer, 'appbtp/constatations', apresFile.mimetype) : Promise.resolve(null),
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
