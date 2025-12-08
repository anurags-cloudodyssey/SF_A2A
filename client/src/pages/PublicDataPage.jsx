import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PublicDataPage = () => {
  const { user, preferences, updatePreferences } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [publicData, setPublicData] = useState(null);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConnectButton, setShowConnectButton] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [calendarEmail, setCalendarEmail] = useState('');

  useEffect(() => {
    if (user?.email) setCalendarEmail(user.email);
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Use context preferences if available
      if (preferences) {
        setPublicData(preferences);
        setLoading(false);
        return;
      }

      // 2. If fresh signup, fetch from agent
      if (location.state?.isSignup) {
        await fetchPublicData();
        return;
      }

      // 3. Try to fetch from backend
      try {
        const profileResponse = await api.post('/user-profile', { email: user.email });
        if (profileResponse.status === 200 && profileResponse.data) {
           setPublicData(profileResponse.data);
           updatePreferences(profileResponse.data);
           toast.success('Profile loaded successfully');
           setLoading(false);
        }
      } catch (profileErr) {
        // 4. Fallback to agent
        await fetchPublicData();
      }
    };

    const fetchPublicData = async () => {
      try {
        const response = await api.post('/public-data', {
          email: user.email, 
          name: user.name,
          phone: user.phone
        });
        
        const data = response.data;
        // Ensure profile data matches signup details
        if (data && data.user_profiles) {
            data.user_profiles.email = user.email;
            if (user.name) data.user_profiles.full_name = user.name;
            if (user.phone) data.user_profiles.phone = user.phone;
        }

        setPublicData(data);
        toast.success('Public data loaded successfully');
      } catch (err) {
        const msg = 'Failed to fetch public data. Please try again.';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, preferences, location.state]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.post('/preferences', publicData);
      updatePreferences(publicData);
      setShowSuccessModal(true);
      setShowConnectButton(true);
      toast.success('Preferences saved successfully!');
    } catch (err) {
      const msg = 'Failed to save preferences.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCalendar = () => {
    const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=867698189324-l8bsq6g6l8408rppce5iqpl88e2ftpmk.apps.googleusercontent.com&redirect_uri=https://calender-mcp-server-bt5gn1.7y6hwo.usa-e2.cloudhub.io/callback&response_type=code&scope=openid%20email%20profile%20https://www.googleapis.com/auth/calendar%20https://www.googleapis.com/auth/contacts.readonly&access_type=offline&prompt=consent";
    window.open(authUrl, '_blank', 'width=600,height=700');
    setIsAuthenticating(true);
  };

  const handleFetchEvents = () => {
    // Navigate to calendar page, which will handle fetching events
    navigate('/calendar');
  };

  const handleInputChange = (section, key, value, index = null) => {
    setPublicData(prev => {
      const newData = { ...prev };
      if (index !== null) {
        newData[section][index][key] = value;
      } else {
        newData[section][key] = value;
      }
      return newData;
    });
  };

  const renderFormFields = (data, section, index = null) => {
    if (!data) return null;
    return Object.keys(data).map(key => {
      if (typeof data[key] === 'object' && data[key] !== null) return null;
      if (key === 'user_id') return null;

      const isReadOnly = ['full_name', 'email', 'phone'].includes(key);
      
      return (
        <div className="col-12 mb-2" key={key}>
          <label className="form-label text-capitalize small fw-semibold text-muted mb-1">{key.replace(/_/g, ' ')}</label>
          <input 
            type="text" 
            className="form-control bg-light border-0" 
            style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}
            value={data[key] || ''} 
            readOnly={isReadOnly}
            disabled={isReadOnly}
            onChange={(e) => handleInputChange(section, key, e.target.value, index)}
          />
        </div>
      );
    });
  };

  if (loading && !publicData) return <div className="text-center mt-5"><div className="spinner-border spinner-lg text-primary"></div></div>;

  return (
    <div className="container">
      {error && <div className="alert alert-danger rounded-3 shadow-sm border-0 mb-4">{error}</div>}

      {publicData && (
        <div className="p-4 p-md-5 bg-white border-0 shadow rounded-4 mb-5 position-relative overflow-hidden">
          <div className="text-center mb-4">
            <div className="mb-3">
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">Step 1</span>
            </div>
            <h3 className="fw-bold mb-3">Review Public Data</h3>
            <p className="text-muted mb-4" style={{maxWidth: '500px', margin: '0 auto'}}>
              Verify and update your profile information
            </p>
          </div>
          
          <form>
            <div className="row g-4">
              {publicData.user_profiles && (
                <div className="col-lg-6">
                  <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <div className="card-header bg-white border-bottom py-3 px-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary-subtle text-primary rounded-circle p-2 me-3">
                          <i className="bi bi-person-fill fs-5"></i>
                        </div>
                        <h5 className="mb-0 text-dark fw-bold">User Profile</h5>
                      </div>
                    </div>
                    <div className="card-body p-4 custom-scrollbar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <div className="row g-3">
                        {renderFormFields(publicData.user_profiles, 'user_profiles')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {publicData.family_members && Array.isArray(publicData.family_members) && (
                <div className="col-lg-6">
                  <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                    <div className="card-header bg-white border-bottom py-3 px-4">
                      <div className="d-flex align-items-center">
                        <div className="bg-info-subtle text-info rounded-circle p-2 me-3">
                          <i className="bi bi-people-fill fs-5"></i>
                        </div>
                        <h5 className="mb-0 text-dark fw-bold">Family Members</h5>
                      </div>
                    </div>
                    <div className="card-body p-4 custom-scrollbar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      {publicData.family_members.map((member, idx) => (
                        <div key={idx} className="mb-4 border-bottom pb-4 last-child-no-border">
                          <div className="d-flex align-items-center mb-3">
                            <span className="badge bg-light text-dark border me-2">#{idx + 1}</span>
                            <h6 className="text-uppercase text-muted fw-bold small mb-0">Member Details</h6>
                          </div>
                          <div className="row g-3">
                            {renderFormFields(member, 'family_members', idx)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {!showConnectButton && (
        <>
          <div style={{ height: '100px' }}></div>
          <div className="position-fixed bottom-0 start-0 end-0 bg-white border-top py-3 shadow-lg" style={{ zIndex: 1030 }}>
            <div className="container">
              <div className="d-grid d-md-flex justify-content-md-end">
                <button className="btn btn-success btn-lg px-5 rounded-pill shadow hover-scale transition-all" onClick={handleSave} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : 'Save & Continue'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showConnectButton && (
        <div className="mt-4 p-5 bg-white border-0 shadow rounded-4 text-center mb-5 position-relative overflow-hidden">
          <div className="position-relative z-1">
            <div className="mb-3">
              <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2">Step 2</span>
            </div>
            <h3 className="fw-bold mb-3">Connect Your Calendar</h3>
            <p className="text-muted mb-4" style={{maxWidth: '500px', margin: '0 auto'}}>
              Connect your Google Calendar to allow our AI to analyze your schedule and provide personalized recommendations.
            </p>
            
            <div className="mb-4 mx-auto" style={{maxWidth: '350px'}}>
              <div className="p-3 bg-light rounded-4 border border-light-subtle">
                <small className="text-muted d-block mb-1 text-uppercase fw-bold" style={{fontSize: '0.7rem', letterSpacing: '1px'}}>Connecting Account</small>
                <div className="d-flex align-items-center justify-content-center">
                  <i className="bi bi-google me-2 text-secondary"></i>
                  <span className="fw-semibold text-dark">{calendarEmail}</span>
                </div>
              </div>
            </div>

            {!isAuthenticating ? (
              <div className="d-flex flex-column align-items-center gap-3">
                <button className="btn btn-primary btn-lg px-5 rounded-pill shadow-lg" onClick={handleConnectCalendar}>
                  Connect Google Calendar
                </button>
                <button className="btn btn-link text-decoration-none text-muted" onClick={handleFetchEvents} style={{fontSize: '0.9rem'}}>
                  Already have access? <span className="fw-bold text-primary">Proceed to Calendar</span>
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center gap-3">
                <p className="text-success fw-bold mb-0">
                  <span className="spinner-grow spinner-grow-sm me-2" role="status" aria-hidden="true"></span>
                  Waiting for authentication...
                </p>
                <button className="btn btn-success btn-lg px-5 rounded-pill shadow-lg" onClick={handleFetchEvents}>
                  I've Finished Connecting
                </button>
                <button className="btn btn-link text-muted btn-sm" onClick={() => setIsAuthenticating(false)}>
                  Cancel / Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-success">Success</h5>
                <button type="button" className="btn-close" onClick={() => setShowSuccessModal(false)}></button>
              </div>
              <div className="modal-body py-4">
                <div className="text-center mb-3">
                  <div className="rounded-circle bg-success-subtle d-inline-flex p-3 mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-check-lg text-success" viewBox="0 0 16 16">
                      <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
                    </svg>
                  </div>
                  <p className="h5">Preferences saved successfully!</p>
                </div>
              </div>
              <div className="modal-footer border-0 justify-content-center pb-4">
                <button type="button" className="btn btn-primary px-4 rounded-pill" onClick={() => setShowSuccessModal(false)}>Continue</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicDataPage;
