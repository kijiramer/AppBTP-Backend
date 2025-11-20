const mongoose = require('mongoose');
const { City } = require('./CombinedModel');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// 5 nouvelles villes à ajouter
const newCities = [
  { name: 'Lyon' },
  { name: 'Marseille' },
  { name: 'Toulouse' },
  { name: 'Nice' },
  { name: 'Nantes' }
];

async function addCities() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Ajouter les villes une par une
    for (const cityData of newCities) {
      // Vérifier si la ville existe déjà
      const existingCity = await City.findOne({ name: cityData.name });
      
      if (existingCity) {
        console.log(`⚠️  ${cityData.name} existe déjà`);
      } else {
        const city = new City(cityData);
        await city.save();
        console.log(`✅ ${cityData.name} ajoutée`);
      }
    }

    console.log('\n🎉 Toutes les villes ont été traitées !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

addCities();
