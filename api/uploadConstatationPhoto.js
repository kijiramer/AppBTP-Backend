// /api/uploadConstatationPhoto.js - Upload photo pour constatation (Cloudinary)
import formidable from 'formidable';
import jwt from 'jsonwebtoken';
import dbConnect from '../db';
import { Constatation } from '../CombinedModel';
import cloudinary from '../utils/cloudinary';

export const config = {
  api: {
    bodyParser: false,
  },
};

const JWT_SECRET = 'hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe';

export default async function handler(req, res) {
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
      const fileAvant = files.imageAvant;
      const fileApres = files.imageApres;
      if (!fileAvant || !fileApres) {
        return res.status(400).json({ error: 'Les deux fichiers sont requis.' });
      }
      try {
        const uploadAvant = await cloudinary.uploader.upload(fileAvant.filepath, {
          folder: 'constatations',
          public_id: `avant_${userId}_${Date.now()}`,
        });
        const uploadApres = await cloudinary.uploader.upload(fileApres.filepath, {
          folder: 'constatations',
          public_id: `apres_${userId}_${Date.now()}`,
        });
        const urlAvant = uploadAvant.secure_url;
        const urlApres = uploadApres.secure_url;
        // Ici tu peux créer la constatation ou juste retourner les URLs
        return res.json({ success: true, imageAvant: urlAvant, imageApres: urlApres });
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
