import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const MarkdownCardRenderer = ({ text }) => {
  if (!text) return null;

  // Split by "### " headers
  const parts = text.split(/(?=### )/g);

  return (
    <div className="d-flex flex-column gap-4">
      {parts.map((part, idx) => {
        const headerMatch = part.match(/^### (.*)/);
        const header = headerMatch ? headerMatch[1].trim() : null;
        const content = header ? part.replace(/^### .*/, '').trim() : part.trim();

        if (!content) return null;

        // Check for numbered list items (e.g., "1. **Name**")
        const numberedSplitRegex = /(?=\n\d+[\.\)]\s)/g;
        let listItems = content.split(numberedSplitRegex).map(s => s.trim()).filter(s => s);
        let isNumbered = listItems.some(item => /^\d+[\.\)]\s/.test(item));
        let isBullet = false;

        if (!isNumbered) {
            // Check for bullet points that look like main items (start with - **...)
            const bulletItems = content.split(/(?=(?:^|\n)-\s+\*\*)/g).map(s => s.trim()).filter(s => s);
            if (bulletItems.length > 0 && bulletItems.some(item => item.startsWith('- **'))) {
                isBullet = true;
                listItems = bulletItems;
            }
        }

        if (isNumbered || isBullet) {
          return (
            <div key={idx}>
              {header && <h6 className="fw-bold text-uppercase text-secondary mb-3 ls-1">{header}</h6>}
              <div className="row g-3">
                {listItems.map((item, i) => {
                  let title = '';
                  let details = '';
                  let badgeContent = null;

                  if (isNumbered) {
                      const itemMatch = item.match(/^(\d+)[\.\)]\s+(.*)/s);
                      if (!itemMatch) {
                        return <div key={i} className="col-12 text-muted mb-2">{item}</div>;
                      }
                      badgeContent = `#${itemMatch[1]}`;
                      const rawContent = itemMatch[2];
                      const titleMatch = rawContent.match(/^\*\*(.*?)\*\*/);
                      title = titleMatch ? titleMatch[1] : `Item ${itemMatch[1]}`;
                      details = titleMatch ? rawContent.replace(/^\*\*.*?\*\*/, '').trim() : rawContent;
                  } else {
                      const titleMatch = item.match(/^-\s*\*\*(.*?)\*\*/);
                      if (!titleMatch) {
                          return <div key={i} className="col-12 text-muted mb-2">{item}</div>;
                      }
                      title = titleMatch[1];
                      badgeContent = <i className="bi bi-check2"></i>;
                      details = item.replace(/^-\s*\*\*.*?\*\*/, '').trim();
                  }

                  const detailLines = details.split('\n').map(l => l.trim()).filter(l => l);

                  return (
                    <div key={i} className="col-12">
                      <div className="card h-100 border-0 shadow-sm hover-shadow transition-all" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
                        <div className="card-body p-4">
                          <div className="d-flex align-items-start mb-3">
                            {isNumbered ? (
                                <span className="badge bg-primary-subtle text-primary me-3 rounded-pill px-3 py-2" style={{ fontSize: '0.85rem' }}>{badgeContent}</span>
                            ) : (
                                <span className="badge bg-success-subtle text-success me-3 rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', minWidth: '32px' }}>{badgeContent}</span>
                            )}
                            <h6 className="fw-bold text-dark mb-0 lh-base" style={{ fontSize: '1.1rem' }}>{title}</h6>
                          </div>
                          <div className="ps-1">
                            {detailLines.map((line, lIdx) => {
                              const kvMatch = line.match(/^-\s*\*\*(.*?):\*\*\s*(.*)/);
                              if (kvMatch) {
                                return (
                                  <div key={lIdx} className="mb-2 d-flex align-items-baseline">
                                    <span className="fw-semibold text-secondary small text-uppercase me-2 col-4" style={{ minWidth: '80px', fontSize: '0.75rem', letterSpacing: '0.5px' }}>{kvMatch[1]}:</span> 
                                    <span className="text-dark small col-8">{kvMatch[2]}</span>
                                  </div>
                                );
                              }
                              return (
                                <div key={lIdx} className="d-flex align-items-start mb-2 small text-muted">
                                  <span className="me-2 text-primary">•</span>
                                  <span>{line.replace(/^-\s*/, '')}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <div key={idx} className="bg-light p-3 rounded-3">
            {header && <h6 className="fw-bold text-dark mb-2">{header}</h6>}
            <div className="text-muted small" style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
          </div>
        );
      })}
    </div>
  );
};

const parseEventsFromResponse = (rawData) => {
  if (!rawData) return [];
  
  let textContent = '';
  if (rawData.result?.status?.message?.parts?.[0]?.text) {
    textContent = rawData.result.status.message.parts[0].text;
  } else if (rawData.result?.artifacts?.[0]?.parts?.[0]?.text) {
    textContent = rawData.result.artifacts[0].parts[0].text;
  } else if (typeof rawData === 'string') {
      textContent = rawData;
  }

  if (textContent) {
    const extractedEvents = [];
    const lines = textContent.split('\n');
    let currentEvent = null;

    lines.forEach(line => {
      line = line.trim();
      
      // Match numbered items: "1. Title" or "1. **Title**" or "1. **Event:** Title"
      const newItemMatch = line.match(/^\d+\.\s*(.*)/);
      // Match bullet point event title: "- **Event Title:** Title" or "- **Event:** Title"
      const bulletTitleMatch = line.match(/^-\s*\*\*(?:Event Title|Event):\*\*\s*(.*)/i);
      
      if (newItemMatch || bulletTitleMatch) {
        if (currentEvent) extractedEvents.push(currentEvent);
        
        let rawTitle = newItemMatch ? newItemMatch[1] : bulletTitleMatch[1];
        // Clean up title
        rawTitle = rawTitle.replace(/\*\*/g, ''); // Remove bold markers
        rawTitle = rawTitle.replace(/^Event:\s*/i, ''); // Remove "Event:" prefix
        rawTitle = rawTitle.replace(/^Title:\s*/i, ''); // Remove "Title:" prefix
        
        currentEvent = { 
          id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          summary: rawTitle.trim(),
          start: {},
          end: {},
          description: '',
          location: '',
          status: '',
          htmlLink: ''
        };
        return;
      }

      if (!currentEvent) return;

      // Parse details like "- **Date:** 2025-12-10"
      const dateMatch = line.match(/-\s*\*\*?(Date|Time|Location|Start Date|End Date|Status|Link to Event|Event Link):?\*\*?\s*(.*)/i);
      if (dateMatch) {
          const key = dateMatch[1].toLowerCase().replace(/\s/g, '');
          const value = dateMatch[2].trim();
          
          if (key === 'date' || key === 'startdate') {
              currentEvent.start.date = value;
              const parsedDate = new Date(value);
              if (!isNaN(parsedDate.getTime())) {
                  currentEvent.start.dateTime = parsedDate.toISOString();
              }
          } else if (key === 'enddate') {
              currentEvent.end.date = value;
              const parsedDate = new Date(value);
              if (!isNaN(parsedDate.getTime())) {
                  currentEvent.end.dateTime = parsedDate.toISOString();
              }
          } else if (key === 'time') {
              currentEvent.description += `Time: ${value}\n`;
              if (currentEvent.start.date) {
                  const combined = new Date(`${currentEvent.start.date} ${value}`);
                  if (!isNaN(combined.getTime())) {
                      currentEvent.start.dateTime = combined.toISOString();
                  }
              }
          } else if (key === 'location') {
              currentEvent.location = value;
              currentEvent.description += `Location: ${value}\n`;
          } else if (key === 'status') {
              currentEvent.status = value;
          } else if (key === 'linktoevent' || key === 'eventlink') {
              const linkUrlMatch = value.match(/\[.*?\]\((.*?)\)/);
              if (linkUrlMatch) {
                  currentEvent.htmlLink = linkUrlMatch[1];
              } else {
                  currentEvent.htmlLink = value;
              }
          }
      }
      
      const linkMatch = line.match(/\[View Event\]\((.*?)\)/);
      if (linkMatch && !currentEvent.htmlLink) {
        currentEvent.htmlLink = linkMatch[1];
      }
    });
    
    if (currentEvent) extractedEvents.push(currentEvent);
    
    if (extractedEvents.length > 0) {
        return extractedEvents;
    }
    
    // Attempt to find a JSON array of objects (e.g. [{ ... }]) to avoid matching Markdown links like [View Event]
    const jsonMatch = textContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            // Silent fail or debug log if needed, but don't warn for non-JSON content
        }
    }
  }

  if (Array.isArray(rawData)) {
    return rawData;
  } else if (rawData.items && Array.isArray(rawData.items)) {
    return rawData.items;
  }

  return [];
};

const CalendarPage = () => {
  const { user, preferences } = useAuth();
  const location = useLocation();
  
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [recommendations, setRecommendations] = useState(null);
  const [giftIdeas, setGiftIdeas] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?.email) return;
      
      setLoadingEvents(true);
      try {
        const rpcBody = {
          "jsonrpc": "2.0",
          "id": "task124",
          "method": "tasks/send",
          "params": {
            "message": {
              "role": "user",
              "parts": [
                {
                  "type": "text",
                  "text": `get all my calendar events ${user.email}?`
                }
              ]
            }
          }
        };
        const response = await api.post('/calendar/events', rpcBody);
        console.log('API Response for events:', response.data);
        const parsedEvents = parseEventsFromResponse(response.data);
        
        if (parsedEvents.length > 0) {
          setEvents(parsedEvents);
        } else {
          // If no events found, set empty array instead of static data
          // This prevents "flickering" to static data when user actually has 0 events
          setEvents([]); 
        }
      } catch (error) {
        console.error('Failed to fetch events', error);
        toast.error('Failed to sync calendar.');
        // Only fallback to static data on actual error if desired, or just show empty
        setEvents([]); 
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [user?.email]);

  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    setLoadingRecs(true);
    setRecommendations(null);
    setGiftIdeas(null);

    try {
      const queryResponse = await api.post('/recommendations/query', {
        event_summary: event.summary,
        event_location: event.location || "Hyderabad",
        phone: preferences?.user_profiles?.phone || "9876543210"
      });
      
      const recs = queryResponse.data;
      setRecommendations(recs);

      const giftResponse = await api.post('/recommendations/gifts', {
        events: [event],
        preferences: preferences,
        recommendations: recs
      });

      const giftIdeas = giftResponse.data;

      setGiftIdeas(giftIdeas);
      toast.success('Recommendations generated successfully!');

    } catch (error) {
      console.error('Failed to get recommendations', error);
      toast.error('Could not fetch recommendations. Please try again.');
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <div className="container">
      <div className="p-4 p-md-5 bg-white border-0 shadow rounded-4 mb-5 position-relative overflow-hidden">
        <div className="text-center mb-4">
          <h3 className="fw-bold mb-3">Your Calendar Insights</h3>
          <p className="text-muted mb-4" style={{maxWidth: '600px', margin: '0 auto'}}>
            Select an event to get AI-powered recommendations tailored to your preferences.
          </p>
        </div>
      
        {loadingEvents ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div>
            <p className="text-muted">Syncing your calendar...</p>
          </div>
        ) : (
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="card-header bg-white border-bottom py-3 px-4">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary-subtle text-primary rounded-circle p-2 me-3">
                      <i className="bi bi-calendar-event-fill fs-5"></i>
                    </div>
                    <h5 className="mb-0 text-dark fw-bold">Upcoming Events</h5>
                  </div>
                </div>
                <div className="card-body p-2 custom-scrollbar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="list-group list-group-flush">
                    {events.map(evt => (
                      <button 
                        key={evt.id} 
                        className={`list-group-item list-group-item-action rounded mb-3 border-0 p-3 transition-all ${selectedEvent?.id === evt.id ? 'shadow-sm bg-primary-subtle text-primary' : 'bg-light hover-shadow'}`}
                        onClick={() => handleEventClick(evt)}
                        style={{ borderRadius: '12px' }}
                      >
                        <div className="d-flex w-100 justify-content-between align-items-start mb-2">
                          <h6 className={`mb-0 fw-bold ${selectedEvent?.id === evt.id ? 'text-primary' : 'text-dark'}`}>{evt.summary || 'No Title'}</h6>
                          {evt.status && <span className="badge bg-success-subtle text-success rounded-pill" style={{fontSize: '0.7rem'}}>{evt.status}</span>}
                        </div>
                        
                        <div className={`small mb-2 ${selectedEvent?.id === evt.id ? 'text-primary' : 'text-muted'}`}>
                          <div className="d-flex align-items-center mb-1">
                              <i className="bi bi-calendar3 me-2"></i>
                              <span>{evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : evt.start?.date}</span>
                          </div>
                          {evt.location && (
                              <div className="d-flex align-items-start">
                                  <i className="bi bi-geo-alt me-2 mt-1"></i>
                                  <span className="text-truncate" style={{maxWidth: '200px'}}>{evt.location}</span>
                              </div>
                          )}
                        </div>

                        {evt.htmlLink && (
                            <a href={evt.htmlLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary rounded-pill py-0 px-2" style={{fontSize: '0.75rem'}} onClick={(e) => e.stopPropagation()}>
                                View Event <i className="bi bi-box-arrow-up-right ms-1"></i>
                            </a>
                        )}
                      </button>
                    ))}
                    {events.length === 0 && <div className="p-4 text-center text-muted">No events found.</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="bg-info-subtle text-info rounded-circle p-2 me-3">
                      <i className="bi bi-stars fs-5"></i>
                    </div>
                    <h5 className="mb-0 text-dark fw-bold">AI Insights</h5>
                  </div>
                  {selectedEvent && <span className="badge bg-light text-dark border px-3 py-2 rounded-pill">{selectedEvent.summary}</span>}
                </div>
                
                <div className="card-body p-4 custom-scrollbar" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {selectedEvent ? (
                    <>
                      {loadingRecs ? (
                        <div className="text-center py-5">
                          <div className="spinner-border text-primary mb-3"></div>
                          <p className="text-muted">Analyzing event context & preferences...</p>
                        </div>
                      ) : (
                        <div className="fade-in">
                          {recommendations && (
                            <div className="mb-5">
                              <div className="d-flex align-items-center mb-4">
                                <span className="badge bg-primary-subtle text-primary me-2">STRATEGY</span>
                                <h6 className="fw-bold text-uppercase text-muted small mb-0">Strategic Suggestions</h6>
                              </div>
                              <div className="p-1">
                                <MarkdownCardRenderer text={recommendations.result?.status?.message?.parts?.[0]?.text || recommendations.result?.artifacts?.[0]?.parts?.[0]?.text} />
                              </div>
                            </div>
                          )}

                          {giftIdeas && (
                            <div className="mb-3">
                              <div className="d-flex align-items-center mb-4">
                                <span className="badge bg-success-subtle text-success me-2">GIFTS</span>
                                <h6 className="fw-bold text-uppercase text-muted small mb-0">Gift Ideas & Actions</h6>
                              </div>
                              <div className="p-1">
                                 <MarkdownCardRenderer text={giftIdeas.result?.status?.message?.parts?.[0]?.text || giftIdeas.result?.artifacts?.[0]?.parts?.[0]?.text} />
                              </div>
                            </div>
                          )}
                          
                          {!recommendations && !giftIdeas && (
                            <div className="text-center py-5 text-muted">
                              <i className="bi bi-exclamation-circle display-4 mb-3 d-block text-secondary opacity-25"></i>
                              <p>No recommendations available for this event.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-center p-5">
                      <div>
                        <div className="mb-4 text-primary opacity-25">
                          <i className="bi bi-calendar-check display-1"></i>
                        </div>
                        <h5 className="fw-bold text-dark mb-2">Select an Event</h5>
                        <p className="text-muted small" style={{maxWidth: '300px', margin: '0 auto'}}>
                          Choose an event from the list on the left to generate personalized AI insights and recommendations.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
