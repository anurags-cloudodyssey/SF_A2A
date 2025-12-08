import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <img src="/logo.png" alt="Odyssey One" style={{ height: '36px' }} />
          <span className="fw-bold" style={{ color: '#00A3E0', letterSpacing: '0.5px' }}>ODYSSEY ONE</span>
        </Link>
        <div className="collapse navbar-collapse justify-content-end">
          {user && (
            <ul className="navbar-nav align-items-center">
              <li className="nav-item">
                <span className="nav-link text-dark fw-medium">Welcome, {user.name}</span>
              </li>
              <li className="nav-item">
                <button className="btn btn-outline-primary btn-sm ms-3 px-3 rounded-pill" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
