import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Modal, Alert, Spinner, Table } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Effectifs() {
  const [effectifs, setEffectifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentEffectif, setCurrentEffectif] = useState({
    date: new Date().toISOString().split('T')[0],
    chantier: '',
    batiment: '',
    nombrePersonnes: '',
    notes: '',
    id: null
  });
  const [saving, setSaving] = useState(false);
  
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && token) {
      fetchEffectifs();
    }
  }, [user, token]);

  const fetchEffectifs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/effectifs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEffectifs(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des effectifs:', error);
      setError('Erreur lors du chargement des effectifs');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEffectif = async () => {
    if (!currentEffectif.date || !currentEffectif.chantier || !currentEffectif.nombrePersonnes) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const effectifData = {
        selectedDate: currentEffectif.date,
        selectedChantier: currentEffectif.chantier,
        selectedBatiment: currentEffectif.batiment,
        selectedEffectif: parseInt(currentEffectif.nombrePersonnes),
        notes: currentEffectif.notes
      };

      if (currentEffectif.id) {
        await axios.put(`${API_BASE_URL}/effectifs/${currentEffectif.id}`, effectifData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/effectifs`, effectifData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowModal(false);
      setCurrentEffectif({
        date: new Date().toISOString().split('T')[0],
        chantier: '',
        batiment: '',
        nombrePersonnes: '',
        notes: '',
        id: null
      });
      fetchEffectifs();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde de l\'effectif');
    } finally {
      setSaving(false);
    }
  };

  const handleEditEffectif = (effectif) => {
    setCurrentEffectif({
      id: effectif.id,
      date: effectif.selectedDate ? new Date(effectif.selectedDate).toISOString().split('T')[0] : '',
      chantier: effectif.selectedChantier || '',
      batiment: effectif.selectedBatiment || '',
      nombrePersonnes: effectif.selectedEffectif?.toString() || '',
      notes: effectif.notes || ''
    });
    setShowModal(true);
  };

  const handleDeleteEffectif = async (effectifId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet effectif ?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/effectifs/${effectifId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEffectifs();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Erreur lors de la suppression de l\'effectif');
    }
  };

  const handleNewEffectif = () => {
    setCurrentEffectif({
      date: new Date().toISOString().split('T')[0],
      chantier: '',
      batiment: '',
      nombrePersonnes: '',
      notes: '',
      id: null
    });
    setError('');
    setShowModal(true);
  };

  if (!user) {
    return (
      <div className="loading-container">
        <div className="spinner-border spinner-border-custom" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Container fluid className="page-container">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Effectifs</h2>
                <p className="text-muted">
                  Gérez les effectifs de vos chantiers
                </p>
              </div>
              <Button variant="primary" onClick={handleNewEffectif}>
                + Nouvel Effectif
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Row className="mb-3">
            <Col>
              <Alert variant="danger">{error}</Alert>
            </Col>
          </Row>
        )}

        <Row>
          <Col>
            {loading ? (
              <div className="loading-container">
                <Spinner animation="border" className="spinner-border-custom" />
                <p className="mt-3">Chargement des effectifs...</p>
              </div>
            ) : effectifs.length === 0 ? (
              <div className="text-center">
                <div className="mb-4">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="#ccc">
                    <path d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z" />
                  </svg>
                </div>
                <h4 className="text-muted">Aucun effectif</h4>
                <p className="text-muted">Commencez par enregistrer un effectif</p>
                <Button variant="primary" onClick={handleNewEffectif}>
                  Enregistrer un effectif
                </Button>
              </div>
            ) : (
              <Card>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Chantier</th>
                        <th>Bâtiment</th>
                        <th>Nb Personnes</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {effectifs.map((effectif) => (
                        <tr key={effectif.id}>
                          <td>
                            {effectif.selectedDate 
                              ? new Date(effectif.selectedDate).toLocaleDateString()
                              : '-'
                            }
                          </td>
                          <td>{effectif.selectedChantier || '-'}</td>
                          <td>{effectif.selectedBatiment || '-'}</td>
                          <td>
                            <span className="badge bg-primary">
                              {effectif.selectedEffectif || 0}
                            </span>
                          </td>
                          <td>
                            {effectif.notes ? (
                              effectif.notes.length > 50 
                                ? `${effectif.notes.substring(0, 50)}...`
                                : effectif.notes
                            ) : '-'}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline-primary" 
                                onClick={() => handleEditEffectif(effectif)}
                              >
                                Modifier
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline-danger" 
                                onClick={() => handleDeleteEffectif(effectif.id)}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentEffectif.id ? 'Modifier l\'effectif' : 'Nouvel effectif'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={currentEffectif.date}
                    onChange={(e) => setCurrentEffectif({ ...currentEffectif, date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre de personnes *</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={currentEffectif.nombrePersonnes}
                    onChange={(e) => setCurrentEffectif({ ...currentEffectif, nombrePersonnes: e.target.value })}
                    placeholder="0"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Chantier *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentEffectif.chantier}
                    onChange={(e) => setCurrentEffectif({ ...currentEffectif, chantier: e.target.value })}
                    placeholder="Nom du chantier"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bâtiment</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentEffectif.batiment}
                    onChange={(e) => setCurrentEffectif({ ...currentEffectif, batiment: e.target.value })}
                    placeholder="Nom du bâtiment (optionnel)"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={currentEffectif.notes}
                onChange={(e) => setCurrentEffectif({ ...currentEffectif, notes: e.target.value })}
                placeholder="Notes additionnelles (optionnel)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveEffectif} disabled={saving}>
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}