import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Profile() {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  
  const { user, token, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        position: user.position || ''
      });
      setLoading(false);
    }
  }, [user]);

  const handleInputChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!profileData.name || !profileData.email) {
      setError('Le nom et l\'email sont obligatoires');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await axios.put(`${API_BASE_URL}/user/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
      router.push('/login');
    }
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
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={6}>
            <Card>
              <Card.Header>
                <div className="d-flex align-items-center">
                  <div className="me-3">
                    <div 
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '60px',
                        height: '60px',
                        backgroundColor: '#F85F6A',
                        borderRadius: '50%',
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold'
                      }}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-0">{user.name || user.email}</h4>
                    <p className="text-muted mb-0">Mon profil</p>
                  </div>
                </div>
              </Card.Header>
              
              <Card.Body>
                {error && (
                  <Alert variant="danger" className="mb-3">
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert variant="success" className="mb-3">
                    {success}
                  </Alert>
                )}

                <Form onSubmit={handleSaveProfile}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nom complet *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={profileData.name}
                          onChange={handleInputChange}
                          placeholder="Votre nom complet"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          placeholder="Votre email"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Téléphone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleInputChange}
                          placeholder="Votre numéro de téléphone"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Entreprise</Form.Label>
                        <Form.Control
                          type="text"
                          name="company"
                          value={profileData.company}
                          onChange={handleInputChange}
                          placeholder="Nom de votre entreprise"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-4">
                    <Form.Label>Poste</Form.Label>
                    <Form.Control
                      type="text"
                      name="position"
                      value={profileData.position}
                      onChange={handleInputChange}
                      placeholder="Votre poste/fonction"
                    />
                  </Form.Group>

                  <div className="d-flex gap-3">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Sauvegarde...
                        </>
                      ) : (
                        'Sauvegarder les modifications'
                      )}
                    </Button>

                    <Button 
                      variant="outline-danger" 
                      onClick={handleLogout}
                    >
                      Se déconnecter
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            <Card className="mt-4">
              <Card.Header>
                <h5 className="mb-0">Informations du compte</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col sm={6}>
                    <strong>Date de création:</strong>
                  </Col>
                  <Col sm={6}>
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Non disponible'
                    }
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col sm={6}>
                    <strong>Dernière connexion:</strong>
                  </Col>
                  <Col sm={6}>
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Non disponible'
                    }
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col sm={6}>
                    <strong>ID utilisateur:</strong>
                  </Col>
                  <Col sm={6}>
                    <code>{user.id || 'Non disponible'}</code>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
