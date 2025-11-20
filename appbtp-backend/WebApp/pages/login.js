import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.message || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border spinner-border-custom" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <Container fluid>
      <Row className="justify-content-center">
        <Col xs={12} sm={8} md={6} lg={4}>
          <div className="form-container">
            <div className="text-center mb-4">
              <h2>Connexion</h2>
              <p className="text-muted">Connectez-vous à votre compte AppBTP</p>
            </div>

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Entrez votre email"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Mot de passe</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  required
                />
              </Form.Group>

              <div className="d-grid mb-3">
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </div>

              <div className="text-center">
                <p className="mb-0">
                  Pas encore de compte ?{' '}
                  <Link href="/signup" className="text-decoration-none">
                    S'inscrire
                  </Link>
                </p>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
