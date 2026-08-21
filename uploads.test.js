// Contrat des routes d'upload apres la migration vers Supabase Storage.
//
// Ce que l'application mobile attend, c'est une chaine d'URL qu'elle pose
// telle quelle dans <Image source={{ uri }} />. Les trois pieges qui cassent
// ce contrat sans rien afficher d'anormal cote serveur sont verifies ici :
// la garde de configuration, la forme de l'URL renvoyee, et surtout le fait
// qu'un echec Supabase ne doit jamais produire une URL.
//
// Supabase est mocke : on teste notre logique, pas le reseau.
process.env.JWT_SECRET = 'secret-de-test';

const mockUpload = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: key => ({
          data: {
            publicUrl: `https://projet.supabase.co/storage/v1/object/public/photos/${key}`,
          },
        }),
      }),
    },
  }),
}));

const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');

const app = express();
app.use(require('./uploads'));

const token = jwt.sign({ id: 'user-1' }, process.env.JWT_SECRET);
// Entete JPEG : le contenu n'a aucune importance, multer ne l'inspecte pas.
const IMAGE = Buffer.from('ffd8ffdb', 'hex');

// L'app envoie toujours imageAvant sur cette route ; c'est le chemin le plus
// emprunte (Rapport photo et Constatation passent tous les deux par la).
function envoyerPhoto(fichier = 'avant.jpg') {
  return request(app)
    .post('/uploadConstatationPhoto')
    .set('Authorization', `Bearer ${token}`)
    .attach('imageAvant', IMAGE, fichier);
}

beforeEach(() => {
  mockUpload.mockReset();
  mockUpload.mockResolvedValue({ data: { path: 'ok' }, error: null });
  process.env.SUPABASE_URL = 'https://projet.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-de-test';
  process.env.SUPABASE_BUCKET = 'photos';
});

test('refuse l upload quand les variables SUPABASE_* sont absentes', async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_BUCKET;

  const res = await envoyerPhoto();

  expect(res.status).toBe(500);
  expect(res.body.success).toBe(false);
  expect(mockUpload).not.toHaveBeenCalled();
});

test('renvoie une URL publique directement exploitable par <Image>', async () => {
  const res = await envoyerPhoto();

  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
  expect(res.body.imageAvant).toMatch(
    /^https:\/\/.+\/appbtp\/constatations\/[0-9a-f-]{36}\.jpg$/
  );
  // Champ absent de la requete : doit rester null, pas undefined ni une URL.
  expect(res.body.imageApres).toBeNull();
});

test('conserve le type reel du fichier plutot que de forcer du jpeg', async () => {
  const res = await envoyerPhoto('avant.png');

  expect(res.body.imageAvant).toMatch(/\.png$/);
  expect(mockUpload.mock.calls[0][2]).toEqual({ contentType: 'image/png' });
});

test('ne renvoie aucune URL quand Supabase refuse l upload', async () => {
  // supabase-js ne jette pas : sans test explicite sur `error`, la route
  // repondrait 200 avec une URL pointant vers un objet inexistant.
  mockUpload.mockResolvedValue({ data: null, error: { message: 'Bucket not found' } });

  const res = await envoyerPhoto();

  expect(res.status).toBe(500);
  expect(res.body.success).toBe(false);
  expect(res.body.imageAvant).toBeUndefined();
});
