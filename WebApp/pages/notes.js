import { useState, useEffect, useRef } from 'react';
import useScrollOnOpen from '../src/hooks/useScrollOnOpen';
import { Container, Row, Col, Card, Form, Button, Modal, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '', id: null });
  const [saving, setSaving] = useState(false);
  
  const { user, token } = useAuth();
  const router = useRouter();
  const topRef = useRef(null);
  useScrollOnOpen(showModal, topRef, { behavior: 'smooth', block: 'start' });

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && token) {
      fetchNotes();
    }
  }, [user, token]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
      setError('Erreur lors du chargement des notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!currentNote.title.trim() || !currentNote.content.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      if (currentNote.id) {
        await axios.put(`${API_BASE_URL}/notes/${currentNote.id}`, {
          title: currentNote.title,
          content: currentNote.content
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE_URL}/notes`, {
          title: currentNote.title,
          content: currentNote.content
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setShowModal(false);
      setCurrentNote({ title: '', content: '', id: null });
      fetchNotes();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError('Erreur lors de la sauvegarde de la note');
    } finally {
      setSaving(false);
    }
  };

  const handleEditNote = (note) => {
    setCurrentNote({
      id: note.id,
      title: note.title,
      content: note.content
    });
    setShowModal(true);
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotes();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setError('Erreur lors de la suppression de la note');
    }
  };

  const handleNewNote = () => {
    setCurrentNote({ title: '', content: '', id: null });
    setError('');
    // scroll the page to the top of the form/modal area then open
    try {
      if (topRef && topRef.current && typeof topRef.current.scrollIntoView === 'function') {
        topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {}
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
        {/* anchor for scrolling when opening the form/modal */}
        <div ref={topRef} />
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Mes Notes</h2>
                <p className="text-muted">
                  Gérez vos notes et observations
                </p>
              </div>
              <Button variant="primary" onClick={handleNewNote}>
                + Nouvelle Note
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
                <p className="mt-3">Chargement des notes...</p>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center">
                <div className="mb-4">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="#ccc">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                  </svg>
                </div>
                <h4 className="text-muted">Aucune note</h4>
                <p className="text-muted">Commencez par créer votre première note</p>
                <Button variant="primary" onClick={handleNewNote}>
                  Créer une note
                </Button>
              </div>
            ) : (
              <Row>
                {notes.map((note) => (
                  <Col key={note.id} xs={12} sm={6} md={4} lg={3} className="mb-3">
                    <Card className="h-100">
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="card-title">
                          {note.title}
                        </Card.Title>
                        <Card.Text className="flex-grow-1" style={{ fontSize: '0.9rem' }}>
                          {note.content.length > 100 
                            ? `${note.content.substring(0, 100)}...` 
                            : note.content
                          }
                        </Card.Text>
                        <div className="mt-auto">
                          {note.createdAt && (
                            <small className="text-muted d-block mb-2">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </small>
                          )}
                          <div className="d-flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline-primary" 
                              onClick={() => handleEditNote(note)}
                            >
                              Modifier
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline-danger" 
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {currentNote.id ? 'Modifier la note' : 'Nouvelle note'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titre</Form.Label>
              <Form.Control
                type="text"
                value={currentNote.title}
                onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                placeholder="Titre de la note"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contenu</Form.Label>
              <Form.Control
                as="textarea"
                rows={6}
                value={currentNote.content}
                onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                placeholder="Contenu de la note"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSaveNote} disabled={saving}>
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
