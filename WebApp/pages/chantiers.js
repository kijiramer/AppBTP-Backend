import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Breadcrumb } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Chantiers() {
  const [chantiers, setChantiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, token } = useAuth();
  const router = useRouter();
  const { city } = router.query;

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (city) {
      fetchChantiers();
    }
  }, [city, token]);

  const fetchChantiers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/chantiers/${encodeURIComponent(city)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setChantiers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des chantiers:', error);
      setError('Erreur lors du chargement des chantiers');
    } finally {
      setLoading(false);
    }
  };

  const handleChantierId = (chantierId) => {
    router.push(`/batiments?chantier=${chantierId}`);
  };

  const handleBackToCities = () => {
    router.push('/dashboard');
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
        {/* Breadcrumb */}
        <Row className="mb-3">
          <Col>
            <Breadcrumb>
              <Breadcrumb.Item onClick={handleBackTocities} style={{ cursor: 'pointer' }}>
                Villes
              </Breadcrumb.Item>
              <Breadcrumb.Item active>{city}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
        </Row>

        {/* Page Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Chantiers - {city}</h2>
                <p className="text-muted">
                  Sélectionnez un chantier pour voir les bâtiments
                </p>
              </div>
              <Button variant="secondary" onClick={handleBackTocities}>
                ← Retour aux villes
              </Button>
            </div>
          </Col>
        </Row>

        {/* Chantiers List */}
        <Row>
          <Col>
            {loading ? (
              <div className="loading-container">
                <Spinner animation="border" className="spinner-border-custom" />
                <p className="mt-3">Chargement des chantiers...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="alert alert-danger">{error}</div>
                <Button variant="primary" onClick={fetchChantiers}>
                  Réessayer
                </Button>
              </div>
            ) : chantiers.length === 0 ? (
              <div className="text-center">
                <p className="text-muted">Aucun chantier disponible dans cette ville</p>
                <Button variant="secondary" onClick={handleBackToCity}>
                  Retour aux villes
                </Button>
              </div>
            ) : (
              <Row>
                {chantiers.map((chantier, index) => (
                  <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-3">
                    <Card 
                      className="chantier-card h-100"
                      onClick={() => handleChantierId(chantier.id || chantier.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="d-flex flex-column align-items-center text-center">
                        <div className="card-icon mb-3">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M13 3v6h8v4.5h-3L15 17v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4l-3-3.5H3V9h8V3a1 1 0 011-1h1a1 1 0 011 1z"/>
                          </svg>
                        </div>
                        <Card.Title className="card-title">
                          {chantier.name || chantier.title}
                        </Card.Title>
                        <Card.Text className="card-text">
                          {chantier.address && <div className="mb-2">{chantier.address}</div>}
                          Cliquez pour voir les bâtiments
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
}