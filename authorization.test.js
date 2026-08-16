// Regles d'autorisation sur les routes d'ecriture.
//
// Ces deux PUT n'avaient aucun controle de propriete : tout compte connecte
// pouvait modifier la constatation ou le rapport photo de n'importe qui. Ce
// fichier verifie que le controle est bien la, et qu'il ne va pas trop loin
// (le proprietaire et l'admin doivent passer).
//
// Mongo est mocke : on teste les regles d'acces, pas la persistance.
process.env.JWT_SECRET = 'secret-de-test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

const jwt = require('jsonwebtoken');

const PROPRIETAIRE = { _id: 'user-proprietaire', role: 'user' };
const TIERS = { _id: 'user-tiers', role: 'user' };
const ADMIN = { _id: 'user-admin', role: 'admin' };

const users = {
  [PROPRIETAIRE._id]: PROPRIETAIRE,
  [TIERS._id]: TIERS,
  [ADMIN._id]: ADMIN,
};

// Enregistrement appartenant a PROPRIETAIRE.
let document;

jest.mock('./db', () => jest.fn(async () => {}));

jest.mock('./CombinedModel', () => {
  const model = () => ({
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    find: jest.fn(() => ({ sort: () => [] })),
  });
  return {
    User: model(),
    City: model(),
    Building: model(),
    Note: model(),
    Constatation: model(),
    Effectif: model(),
    Remarque: model(),
    Folder: model(),
    FolderPhoto: model(),
  };
});

const { User, Constatation } = require('./CombinedModel');
const app = require('./App');
const request = require('supertest');

const tokenPour = user => jwt.sign({ id: user._id }, process.env.JWT_SECRET);

beforeEach(() => {
  document = {
    _id: 'doc-1',
    userId: { toString: () => PROPRIETAIRE._id },
  };
  User.findById.mockImplementation(async id => {
    const u = users[id];
    return u ? { ...u, _id: { toString: () => u._id } } : null;
  });
  Constatation.findById.mockImplementation(async () => document);
  Constatation.findByIdAndUpdate.mockImplementation(async () => document);
});

afterEach(() => jest.clearAllMocks());

describe.each([
  ['PUT /constatations/:id', '/constatations/doc-1'],
  ['PUT /rapportsPhotos/:id', '/rapportsPhotos/doc-1'],
])('%s', (_nom, url) => {
  test('sans token : 401', async () => {
    const res = await request(app).put(url).send({ description: 'x' });
    expect(res.status).toBe(401);
    expect(Constatation.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('un tiers ne peut pas modifier : 403', async () => {
    const res = await request(app)
      .put(url)
      .set('Authorization', `Bearer ${tokenPour(TIERS)}`)
      .send({ description: 'piratage' });

    expect(res.status).toBe(403);
    expect(Constatation.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('le proprietaire peut modifier : 200', async () => {
    const res = await request(app)
      .put(url)
      .set('Authorization', `Bearer ${tokenPour(PROPRIETAIRE)}`)
      .send({ description: 'correction' });

    expect(res.status).toBe(200);
    expect(Constatation.findByIdAndUpdate).toHaveBeenCalled();
  });

  test('un admin peut modifier : 200', async () => {
    const res = await request(app)
      .put(url)
      .set('Authorization', `Bearer ${tokenPour(ADMIN)}`)
      .send({ description: 'correction admin' });

    expect(res.status).toBe(200);
    expect(Constatation.findByIdAndUpdate).toHaveBeenCalled();
  });

  test('enregistrement inexistant : 404', async () => {
    Constatation.findById.mockImplementation(async () => null);

    const res = await request(app)
      .put(url)
      .set('Authorization', `Bearer ${tokenPour(PROPRIETAIRE)}`)
      .send({ description: 'x' });

    expect(res.status).toBe(404);
    expect(Constatation.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('secrets hors du code', () => {
  test('JWT_SECRET vient de l environnement, sans valeur de repli', () => {
    const source = require('fs').readFileSync(require.resolve('./App.js'), 'utf8');
    expect(source).toContain('process.env.JWT_SECRET');
    expect(source).not.toMatch(/JWT_SECRET\s*=\s*['"][^'"]/);
  });

  test('l URI Mongo vient de l environnement, sans valeur de repli', () => {
    const source = require('fs').readFileSync(require.resolve('./db.js'), 'utf8');
    expect(source).toContain('process.env.MONGODB_URI');
    expect(source).not.toContain('mongodb+srv://');
  });
});
