// /api/constatation.js - Route pour récupérer toutes les constatations (avec photos)
const dbConnect = require('../db');
const { Constatation } = require('../CombinedModel');
const jwt = require('jsonwebtoken');

module.exports = async function handler(req, res) {
  await dbConnect();
  if (req.method === 'GET') {
    // Authentification et filtres
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Token manquant.' });
    try {
      const token = header.split(' ')[1];
      const payload = jwt.verify(token, 'hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe');
      // Filtres
      const { city, building, task, selectedDate } = req.query;
      const filter = {};
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
      res.status(200).json({ success: true, constatations });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  } else if (req.method === 'POST') {
    // Création d'une constatation avec URLs Cloudinary
    try {
      const header = req.headers.authorization;
      if (!header) return res.status(401).json({ error: 'Token manquant.' });
      const token = header.split(' ')[1];
      const payload = jwt.verify(token, 'hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jbkj?[]]pou89ywe');
      const userId = payload.id;
      const { reportNumber, chantierName, city, building, task, company, imageAvant, imageApres, selectedDate, endDate } = req.body;
      if (!imageAvant || !imageApres) {
        return res.status(400).json({ error: 'Les URLs des images sont requises.' });
      }
      const constatation = await Constatation.create({
        reportNumber,
        chantierName,
        city,
        building,
        task,
        company,
        imageAvant,
        imageApres,
        selectedDate,
        endDate,
        userId,
      });
      res.status(201).json({ success: true, constatation });
    } catch (err) {
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  } else {
    res.status(405).json({ error: 'Méthode non autorisée.' });
  }
}
