import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLogin) {
      try {
        const response = await api.post('/signup', formData);
        
        if (response.status === 201) {
          toast.success(`Welcome, ${formData.name}!`);
          login({ name: formData.name, email: formData.email, phone: formData.phone });
          navigate('/public-data', { state: { isSignup: true } });
        }
      } catch (error) {
        if (error.response && error.response.status === 409) {
          toast.info('Account already exists. Logging you in...');
          login({ name: formData.name, email: formData.email, phone: formData.phone });
          navigate('/public-data', { state: { isSignup: false } });
        } else {
          toast.error('Signup failed. Please check your details and try again.');
        }
      }
    } else {
      try {
        const response = await api.post('/login', {
          username: formData.email,
          password: formData.password
        });

        if (response.status === 200) {
          const { user, preferences } = response.data;
          toast.success(`Welcome back, ${user.name || 'User'}!`);
          login(user, preferences);
          navigate('/public-data');
        }
      } catch (error) {
        if (error.response) {
           toast.error(error.response.data.message || 'Invalid credentials.');
        } else {
           toast.error('Login failed. Please try again.');
        }
      }
    }
  };

  return (
    <div className="row justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="col-md-6 col-lg-5 col-xl-4">
        <div className="text-center mb-4">
          <h1 className="h3 fw-bold text-primary">Welcome Back</h1>
          <p className="text-muted">Sign in to access your AI assistant</p>
        </div>
        <div className="card border-0 shadow-lg">
          <div className="card-body p-4 p-md-5">
            <ul className="nav nav-pills nav-fill mb-4 bg-light rounded p-1" role="tablist">
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link rounded ${isLogin ? 'active shadow-sm' : ''}`} 
                  onClick={() => setIsLogin(true)}
                  style={{ transition: 'all 0.2s' }}
                >
                  Login
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link rounded ${!isLogin ? 'active shadow-sm' : ''}`} 
                  onClick={() => setIsLogin(false)}
                  style={{ transition: 'all 0.2s' }}
                >
                  Signup
                </button>
              </li>
            </ul>
            
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-control form-control-lg" 
                      name="name" 
                      placeholder="John Doe"
                      value={formData.name} 
                      onChange={handleChange} 
                      required={!isLogin}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-control form-control-lg" 
                      name="phone" 
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone} 
                      onChange={handleChange} 
                      required={!isLogin}
                    />
                  </div>
                </>
              )}
              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-control form-control-lg" 
                  name="email" 
                  placeholder="name@example.com"
                  value={formData.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-control form-control-lg" 
                  name="password" 
                  placeholder="••••••••"
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="d-grid">
                <button type="submit" className="btn btn-primary btn-lg">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="text-center mt-4 text-muted small">
          &copy; 2025 SF A2A MVP. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
