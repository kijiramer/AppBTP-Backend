import { Navbar, Nav, Button, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function Header({ title = "AppBTP" }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  return (
    <Navbar className="header" expand="lg" fixed="top">
      <Navbar.Brand 
        onClick={() => router.push('/dashboard')} 
        style={{ cursor: 'pointer', fontWeight: '600' }}
      >
        {title}
      </Navbar.Brand>
      
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="me-auto">
          {user && (
            <>
              <Nav.Link onClick={() => router.push('/dashboard')}>
                Accueil
              </Nav.Link>
              <Nav.Link onClick={() => router.push('/notes')}>
                Notes
              </Nav.Link>
              <Nav.Link onClick={() => router.push('/effectifs')}>
                Effectifs
              </Nav.Link>
            </>
          )}
        </Nav>
        
        {user && (
          <Nav>
            <Dropdown align="end">
              <Dropdown.Toggle 
                as={Button} 
                variant="outline-light"
                className="d-flex align-items-center"
              >
                <span className="me-2">👤</span>
                {user.name || user.email}
              </Dropdown.Toggle>
              
              <Dropdown.Menu>
                <Dropdown.Item onClick={handleProfile}>
                  Profil
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  Se déconnecter
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Nav>
        )}
      </Navbar.Collapse>
    </Navbar>
  );
}