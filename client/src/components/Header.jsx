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
          <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px', fontSize: '18px'}}>CO</span>
          <span>ODYSSEY ONE</span>
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
