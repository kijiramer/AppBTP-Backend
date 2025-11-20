require('dotenv').config();
const mongoose = require('mongoose');
const { Building } = require('./CombinedModel');

const buildings = [
  // Paris 17ème
  { name: 'Bâtiment A', city: 'Paris 17ème' },
  { name: 'Bâtiment B', city: 'Paris 17ème' },
  { name: 'Bâtiment C', city: 'Paris 17ème' },
  
  // Saint-Ouen-sur-Seine
  { name: 'Bâtiment Nord', city: 'Saint-Ouen-sur-Seine' },
  { name: 'Bâtiment Sud', city: 'Saint-Ouen-sur-Seine' },
  
  // Montfermeil
  { name: 'Résidence Les Bosquets', city: 'Montfermeil' },
  { name: 'Résidence Les Coquelicots', city: 'Montfermeil' },
  
  // Villeneuve-la-Garenne
  { name: 'Tour A', city: 'Villeneuve-la-Garenne' },
  { name: 'Tour B', city: 'Villeneuve-la-Garenne' },
  
  // Lyon
  { name: 'Bâtiment Principal', city: 'Lyon' },
  { name: 'Annexe Est', city: 'Lyon' },
  
  // Marseille
  { name: 'Immeuble Vieux-Port', city: 'Marseille' },
  { name: 'Immeuble Canebière', city: 'Marseille' },
  
  // Toulouse
  { name: 'Résidence Capitole', city: 'Toulouse' },
  { name: 'Résidence Saint-Cyprien', city: 'Toulouse' },
  
  // Nice
  { name: 'Bâtiment Promenade', city: 'Nice' },
  { name: 'Bâtiment Colline', city: 'Nice' },
  
  // Nantes
  { name: 'Immeuble Loire', city: 'Nantes' },
  { name: 'Immeuble Erdre', city: 'Nantes' },
];

async function addBuildings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connexion à MongoDB réussie');

    for (const buildingData of buildings) {
      const existing = await Building.findOne({ name: buildingData.name, city: buildingData.city });
      if (existing) {
        console.log(`⚠️  ${buildingData.name} (${buildingData.city}) existe déjà`);
      } else {
        const building = new Building(buildingData);
        await building.save();
        console.log(`✅ ${buildingData.name} (${buildingData.city}) ajouté`);
      }
    }

    console.log('🎉 Tous les bâtiments ont été traités !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

addBuildings();
