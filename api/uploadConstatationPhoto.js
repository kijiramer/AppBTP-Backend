// /api/uploadConstatationPhoto.js - Upload photo pour constatation (Cloudinary)
const formidable = require('formidable');
const jwt = require('jsonwebtoken');
const dbConnect = require('../db');
const { Constatation } = require('../CombinedModel');
const cloudinary = require('../utils/cloudinary');

const JWT_SECRET = 'hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  await dbConnect();
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token manquant.' });
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.id;

    const form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur upload.' });
      }
      console.log('Files received:', Object.keys(files));
      const fileAvant = files.imageAvant ? (Array.isArray(files.imageAvant) ? files.imageAvant[0] : files.imageAvant) : null;
      const fileApres = files.imageApres ? (Array.isArray(files.imageApres) ? files.imageApres[0] : files.imageApres) : null;
      console.log('fileAvant:', fileAvant ? 'Present' : 'Missing');
      console.log('fileApres:', fileApres ? 'Present' : 'Missing');

      // Au moins un fichier doit être présent
      if (!fileAvant && !fileApres) {
        return res.status(400).json({ error: 'Au moins un fichier est requis.' });
      }

      try {
        const result = { success: true };

        // Upload imageAvant si présent
        if (fileAvant) {
          const uploadAvant = await cloudinary.uploader.upload(fileAvant.filepath, {
            folder: 'constatations',
            public_id: `avant_${userId}_${Date.now()}`,
          });
          result.imageAvant = uploadAvant.secure_url;
        }

        // Upload imageApres si présent
        if (fileApres) {
          const uploadApres = await cloudinary.uploader.upload(fileApres.filepath, {
            folder: 'constatations',
            public_id: `apres_${userId}_${Date.now()}`,
          });
          result.imageApres = uploadApres.secure_url;
        }

        return res.json(result);
      } catch (cloudErr) {
        console.error('Erreur Cloudinary:', cloudErr);
        return res.status(500).json({ error: 'Erreur Cloudinary.' });
      }
    });
  } catch (err) {
    console.error('Erreur upload constatation:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}
