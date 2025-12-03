// Debug Vercel - Log chaque étape
console.log('[DEBUG] 1. Script démarré');

try {
  console.log('[DEBUG] 2. Chargement express');
  const express = require('express');
  console.log('[DEBUG] 3. Express chargé OK');
  
  const app = express();
  console.log('[DEBUG] 4. App créée');
  
  app.get('/', (req, res) => {
    console.log('[DEBUG] 5. Route / appelée');
    res.json({ message: 'Debug OK', timestamp: new Date().toISOString() });
  });
  
  console.log('[DEBUG] 6. Route configurée');
  console.log('[DEBUG] 7. Export app');
  module.exports = app;
  console.log('[DEBUG] 8. Export réussi');
} catch (error) {
  console.error('[DEBUG] ERREUR:', error);
  throw error;
}
