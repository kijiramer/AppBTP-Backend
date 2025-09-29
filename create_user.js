// create_user.js - run with node create_user.js
const mongoose = require('mongoose');
const connectDB = require('./db');
const { User } = require('./CombinedModel');
const crypto = require('crypto');

const generateSaltAndHashForPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return { salt, hash };
};

(async () => {
  try {
    await connectDB();
    
    const email = 'kijiramer@gmail.com';
    const password = 'azerty';
    const name = 'Kiji Ramer';
    
    // Vérifier si l'utilisateur existe déjà
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('❌ Utilisateur existe déjà:', email);
      console.log('✅ Vous pouvez vous connecter avec cet email et votre mot de passe');
      process.exit(0);
    }
    
    // Créer le nouvel utilisateur
    const { salt, hash } = generateSaltAndHashForPassword(password);
    const user = new User({ 
      name, 
      email, 
      salt, 
      hash, 
      role: 'admin' 
    });
    
    await user.save();
    
    console.log('✅ Utilisateur créé avec succès!');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('👤 Nom:', name);
    console.log('🔐 Rôle: admin');
    console.log('');
    console.log('🚀 Vous pouvez maintenant vous connecter à la webapp avec ces identifiants!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);
    process.exit(1);
  }
})();