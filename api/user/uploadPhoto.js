// /api/user/uploadPhoto.js - Route Vercel API pour upload de photo (fichier)
import formidable from 'formidable';
import jwt from 'jsonwebtoken';
import dbConnect from '../../db';
import { User } from '../../CombinedModel';
import cloudinary from '../../utils/cloudinary';

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
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Erreur upload.' });
      }
      const file = files.photo;
      if (!file) {
        return res.status(400).json({ error: 'Aucun fichier envoyé.' });
      }
      // Upload vers Cloudinary
      try {
        const result = await cloudinary.uploader.upload(file.filepath, {
          folder: 'avatars',
          public_id: `${userId}_${Date.now()}`,
        });
        const url = result.secure_url;
        await User.findByIdAndUpdate(userId, { avatar: url });
        return res.json({ success: true, avatarUrl: url });
      } catch (cloudErr) {
        console.error('Erreur Cloudinary:', cloudErr);
        return res.status(500).json({ error: 'Erreur Cloudinary.' });
      }
    });
  } catch (err) {
    console.error('Erreur upload photo:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}
