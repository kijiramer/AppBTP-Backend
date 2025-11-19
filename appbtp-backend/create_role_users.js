// create_role_users.js - Script pour créer les utilisateurs avec rôles
const mongoose = require('mongoose');
const crypto = require('crypto');
const connectDB = require('./db');
const { User } = require('./CombinedModel');

// Fonction pour hasher le mot de passe
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('hex');
  return { salt, hash };
}

async function createRoleUsers() {
  try {
    // Connexion à MongoDB
    await connectDB();
    console.log('✅ Connexion à MongoDB réussie\n');

    // Liste des utilisateurs à créer
    const users = [
      {
        name: 'Nettoyeur Test',
        email: 'nettoyeur@test.com',
        password: 'test123',
        role: 'nettoyeur'
      },
      {
        name: 'Homme Clé Test',
        email: 'clé@test.com',
        password: 'test123',
        role: 'hommeclé'
      },
      {
        name: 'Pilote Test',
        email: 'pilote@test.com',
        password: 'test123',
        role: 'pilote'
      }
    ];

    console.log('📝 Création des utilisateurs de test...\n');

    for (const userData of users) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⚠️  L'utilisateur ${userData.email} existe déjà (rôle: ${existingUser.role})`);

        // Mettre à jour le rôle si nécessaire
        if (existingUser.role !== userData.role) {
          existingUser.role = userData.role;
          await existingUser.save();
          console.log(`   ✅ Rôle mis à jour: ${userData.role}\n`);
        } else {
          console.log('');
        }
        continue;
      }

      // Créer le nouvel utilisateur
      const { salt, hash } = hashPassword(userData.password);

      const newUser = new User({
        name: userData.name,
        email: userData.email,
        salt: salt,
        hash: hash,
        role: userData.role
      });

      await newUser.save();
      console.log(`✅ Utilisateur créé: ${userData.email}`);
      console.log(`   Nom: ${userData.name}`);
      console.log(`   Rôle: ${userData.role}`);
      console.log(`   Mot de passe: ${userData.password}\n`);
    }

    // Mettre à jour l'admin existant si nécessaire
    const adminEmail = 'kijiramer@hotmail.fr';
    const admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`👑 Admin trouvé: ${adminEmail}`);
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        console.log(`   ✅ Rôle mis à jour: admin\n`);
      } else {
        console.log(`   ✅ Rôle déjà configuré: admin\n`);
      }
    } else {
      console.log(`⚠️  Admin ${adminEmail} non trouvé\n`);
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ TOUS LES UTILISATEURS SONT PRÊTS !\n');

    // Afficher un résumé
    const allUsers = await User.find({});
    console.log('📊 Résumé des utilisateurs:');
    console.log('═══════════════════════════════════════');
    for (const user of allUsers) {
      console.log(`${user.role === 'admin' ? '👑' : '👤'} ${user.email} - ${user.role}`);
    }
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter le script
createRoleUsers();
