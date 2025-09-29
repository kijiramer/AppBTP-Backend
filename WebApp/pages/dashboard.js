import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function Dashboard() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchCities();
  }, [token]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/cities`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setCities(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des villes:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCityClick = (cityName) => {
    router.push(`/chantiers?city=${encodeURIComponent(cityName)}`);
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
        {/* Banner Section */}
        <Row className="mb-4">
          <Col>
            <div className="banner-container">
              <div className="banner-text">
                <div className="banner-title">
                  Bienvenue dans votre application BTP
                </div>
                <div className="banner-subtitle">
                  Voici la liste de vos chantiers par ville
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* Welcome Message */}
        <Row className="mb-4">
          <Col>
            <h2>Bonjour {user.name || user.email}</h2>
            <p className="text-muted">
              Sélectionnez une ville pour voir les chantiers disponibles
            </p>
          </Col>
        </Row>

        {/* Cities List */}
        <Row>
          <Col>
            {loading ? (
              <div className="loading-container">
                <Spinner animation="border" className="spinner-border-custom" />
                <p className="mt-3">Chargement des villes...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <div className="alert alert-danger">{error}</div>
                <Button variant="primary" onClick={fetchCities}>
                  Réessayer
                </Button>
              </div>
            ) : cities.length === 0 ? (
              <div className="text-center">
                <p className="text-muted">Aucune ville disponible</p>
              </div>
            ) : (
              <Row>
                {cities.map((city, index) => (
                  <Col key={index} xs={12} sm={6} md={4} lg={3} className="mb-3">
                    <Card 
                      className="city-card h-100"
                      onClick={() => handleCityClick(city.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className="d-flex flex-column align-items-center text-center">
                        <div className="card-icon mb-3">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                          </svg>
                        </div>
                        <Card.Title className="card-title">
                          {city.name}
                        </Card.Title>
                        <Card.Text className="card-text">
                          Cliquez pour voir les chantiers
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