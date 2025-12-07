import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthPage from './pages/AuthPage';
import PublicDataPage from './pages/PublicDataPage';
import CalendarPage from './pages/CalendarPage';
import Header from './components/Header';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      <Header />
      <main className="container flex-grow-1 py-5 mt-5">
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route 
            path="/public-data" 
            element={
              <ProtectedRoute>
                <PublicDataPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/calendar" 
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      <footer className="bg-light text-center py-3 mt-auto">
        <div className="container">
          <span className="text-muted">SF A2A MVP &copy; 2025</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
