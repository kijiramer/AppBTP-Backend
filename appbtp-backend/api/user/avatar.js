// /api/user/avatar.js - Route Vercel API pour mettre à jour l'avatar utilisateur (stockage URI)
import jwt from 'jsonwebtoken';
import dbConnect from '../../db';
import { User } from '../../CombinedModel';

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
    const { avatar } = req.body;
    if (!avatar) {
      return res.status(400).json({ error: 'Aucune URI fournie.' });
    }
    await User.findByIdAndUpdate(userId, { avatar });
    return res.json({ success: true, avatarUrl: avatar });
  } catch (err) {
    console.error('Erreur avatar:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}
