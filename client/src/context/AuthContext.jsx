import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedPrefs = localStorage.getItem('preferences');
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage', e);
        localStorage.removeItem('user');
      }
    }
    
    if (storedPrefs) {
      try {
        setPreferences(JSON.parse(storedPrefs));
      } catch (e) {
        console.error('Failed to parse preferences from local storage', e);
        localStorage.removeItem('preferences');
      }
    }
    
    setLoading(false);
  }, []);

  const login = (userData, prefsData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    if (prefsData) {
      setPreferences(prefsData);
      localStorage.setItem('preferences', JSON.stringify(prefsData));
    }
  };

  const logout = () => {
    setUser(null);
    setPreferences(null);
    localStorage.removeItem('user');
    localStorage.removeItem('preferences');
  };

  const updatePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    localStorage.setItem('preferences', JSON.stringify(newPrefs));
  };

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }

  return (
    <AuthContext.Provider value={{ user, preferences, login, logout, updatePreferences }}>
      {children}
    </AuthContext.Provider>
  );
};
