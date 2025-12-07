import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
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
        // Improved regex to handle various numbered formats and spacing
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
                      // Check if this specific chunk is a list item
                      // Regex matches "1. Title" or "1) Title"
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
                      // Bullet item: - **Title** ...
                      const titleMatch = item.match(/^-\s*\*\*(.*?)\*\*/);
                      if (!titleMatch) {
                          return <div key={i} className="col-12 text-muted mb-2">{item}</div>;
                      }
                      title = titleMatch[1];
                      // Use a checkmark or dot for bullets
                      badgeContent = <i className="bi bi-check2"></i>;
                      details = item.replace(/^-\s*\*\*.*?\*\*/, '').trim();
                  }

                  // Parse details (bullet points)
                  const detailLines = details.split('\n').map(l => l.trim()).filter(l => l);

                  return (
                    <div key={i} className="col-12 col-md-6">
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
                              // Check for Key-Value pairs: - **Key:** Value
                              const kvMatch = line.match(/^-\s*\*\*(.*?):\*\*\s*(.*)/);
                              if (kvMatch) {
                                return (
                                  <div key={lIdx} className="mb-2 d-flex align-items-baseline">
                                    <span className="fw-semibold text-secondary small text-uppercase me-2 col-4" style={{ minWidth: '80px', fontSize: '0.75rem', letterSpacing: '0.5px' }}>{kvMatch[1]}:</span> 
                                    <span className="text-dark small col-8">{kvMatch[2]}</span>
                                  </div>
                                );
                              }
                              // Regular bullet
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

        // Regular text block
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

const CalendarPage = () => {
  const location = useLocation();
  const preferences = location.state?.preferences || {};
  
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [recommendations, setRecommendations] = useState(null);
  const [giftIdeas, setGiftIdeas] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      // 1. Check if events were passed via navigation state (from PublicDataPage)
      if (location.state?.events) {
        try {
          const rawData = location.state.events;
          console.log('Processing passed events:', rawData);
          
          let parsedEvents = [];
          
          // Handle JSON-RPC structure from CloudHub Agent
          if (rawData.result?.status?.message?.parts?.[0]?.text) {
            const textContent = rawData.result.status.message.parts[0].text;
            console.log('Parsing agent text response:', textContent);
            
            // Custom Markdown Parser for Calendar Events
            const extractedEvents = [];
            const lines = textContent.split('\n');
            let currentEvent = null;

            lines.forEach(line => {
              line = line.trim();
              
              // Match event title: "1. **Birthday**" or "1. **Title**"
              // Regex looks for: Number + dot + spaces + bold markers + content + bold markers
              const titleMatch = line.match(/^\d+\.\s*\*\*(.*?)\*\*/);
              
              if (titleMatch) {
                // Push previous event if exists
                if (currentEvent) extractedEvents.push(currentEvent);
                
                // Start new event
                currentEvent = { 
                  id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                  summary: titleMatch[1],
                  start: {},
                  description: ''
                };
                return;
              }

              if (!currentEvent) return;

              // Match Date: "- **Date:** December 8, 2025"
              const dateMatch = line.match(/-\s*\*\*Date:\*\*\s*(.*)/);
              if (dateMatch) {
                const dateStr = dateMatch[1].trim();
                currentEvent.start.date = dateStr;
                
                // Try to parse to ISO for better formatting if possible
                const parsedDate = new Date(dateStr);
                if (!isNaN(parsedDate.getTime())) {
                    currentEvent.start.dateTime = parsedDate.toISOString();
                }
              }

              // Match Time: "- **Time:** 9:00 AM - 10:00 AM"
              const timeMatch = line.match(/-\s*\*\*Time:\*\*\s*(.*)/);
              if (timeMatch) {
                 currentEvent.description += `Time: ${timeMatch[1]}\n`;
              }

              // Match Location: "- **Location:** ..."
              const locMatch = line.match(/-\s*\*\*Location:\*\*\s*(.*)/);
              if (locMatch) {
                currentEvent.location = locMatch[1].trim();
                currentEvent.description += `Location: ${locMatch[1].trim()}\n`;
              }
              
              // Match Link: "- [View Event](...)"
              const linkMatch = line.match(/\[View Event\]\((.*?)\)/);
              if (linkMatch) {
                currentEvent.htmlLink = linkMatch[1];
              }
            });
            
            // Push the last event
            if (currentEvent) extractedEvents.push(currentEvent);
            
            if (extractedEvents.length > 0) {
                parsedEvents = extractedEvents;
            } else {
                // Fallback: Try to find JSON array if Markdown parsing failed
                const jsonMatch = textContent.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    try {
                        parsedEvents = JSON.parse(jsonMatch[0]);
                    } catch (e) {
                        console.warn('Failed to parse JSON fallback', e);
                    }
                }
            }
          } 
          // Handle direct array or Google Calendar API format
          else if (Array.isArray(rawData)) {
            parsedEvents = rawData;
          } else if (rawData.items) {
            parsedEvents = rawData.items;
          }

          if (parsedEvents.length > 0) {
            setEvents(parsedEvents);
            setLoadingEvents(false);
            return;
          }
        } catch (err) {
          console.error('Error parsing passed events:', err);
        }
      }

      // 2. Fallback: Fetch from backend if no state passed or parsing failed
      try {
        const response = await api.post('/calendar/events');
        // Assuming response.data is an array of events or has an 'items' key
        const eventList = Array.isArray(response.data) ? response.data : (response.data.items || []);
        setEvents(eventList);
      } catch (error) {
        console.error('Failed to fetch events', error);
        toast.error('Failed to sync calendar. Showing offline/demo data.');
        // Fallback mock data if API fails (for MVP demo purposes if API is unreachable)
        setEvents([
          { id: '1', summary: 'Daughter\'s Birthday', start: { dateTime: '2025-12-10T10:00:00' } },
          { id: '2', summary: 'Team Lunch', start: { dateTime: '2025-12-12T12:30:00' } }
        ]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [location.state]);

  const handleEventClick = async (event) => {
    setSelectedEvent(event);
    setLoadingRecs(true);
    setRecommendations(null);
    setGiftIdeas(null);

    try {
      // Step 3c: Get Recommendations (Preference Query Agent)
      // We pass the event details and preferences. 
      // Note: The backend route is POST now.
      const queryResponse = await api.post('/recommendations/query', {
        event_summary: event.summary,
        event_location: event.location || "Hyderabad",
        phone: preferences?.user_profiles?.phone || "9876543210"
      });
      
      const recs = queryResponse.data;
      setRecommendations(recs);

      // Step 4: Gift Recommendation Agent
      const giftResponse = await api.post('/recommendations/gifts', {
        events: [event], // Pass the specific event
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
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Your Calendar</h2>
        <p className="text-muted">Select an event to get AI-powered recommendations</p>
      </div>
      
      {loadingEvents ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}></div>
          <p className="text-muted">Syncing your calendar...</p>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-header bg-white border-bottom py-3">
                <h6 className="mb-0 fw-bold text-uppercase text-muted small">Upcoming Events</h6>
              </div>
              <div className="list-group list-group-flush p-2">
                {events.map(evt => (
                  <button 
                    key={evt.id} 
                    className={`list-group-item list-group-item-action rounded mb-2 border-0 p-3 ${selectedEvent?.id === evt.id ? 'active shadow' : ''}`}
                    onClick={() => handleEventClick(evt)}
                  >
                    <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                      <h6 className={`mb-0 fw-bold ${selectedEvent?.id === evt.id ? 'text-white' : 'text-dark'}`}>{evt.summary || 'No Title'}</h6>
                    </div>
                    <small className={selectedEvent?.id === evt.id ? 'text-white-50' : 'text-muted'}>
                      <i className="bi bi-calendar-event me-2"></i>
                      {evt.start?.dateTime ? new Date(evt.start.dateTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : evt.start?.date}
                    </small>
                  </button>
                ))}
                {events.length === 0 && <div className="p-3 text-center text-muted">No events found.</div>}
              </div>
            </div>
          </div>

          <div className="col-md-8">
            {selectedEvent ? (
              <div className="card border-0 shadow h-100">
                <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-primary">
                    AI Insights
                  </h5>
                  <span className="badge bg-light text-dark border">{selectedEvent.summary}</span>
                </div>
                <div className="card-body p-4">
                  {loadingRecs ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary mb-3"></div>
                      <p className="text-muted">Analyzing event context & preferences...</p>
                    </div>
                  ) : (
                    <div className="fade-in">
                      {/* Display Recommendations from Step 3c */}
                      {recommendations && (
                        <div className="mb-4">
                          <h6 className="fw-bold text-uppercase text-muted small mb-3">Strategic Suggestions</h6>
                          <div className="p-2">
                            <MarkdownCardRenderer text={recommendations.result?.status?.message?.parts?.[0]?.text || recommendations.result?.artifacts?.[0]?.parts?.[0]?.text} />
                          </div>
                        </div>
                      )}

                      {/* Display Gift Ideas from Step 4 */}
                      {giftIdeas && (
                        <div>
                          <h6 className="fw-bold text-uppercase text-success small mb-3">Gift Ideas & Actions</h6>
                          <div className="p-2">
                             <MarkdownCardRenderer text={giftIdeas.result?.status?.message?.parts?.[0]?.text || giftIdeas.result?.artifacts?.[0]?.parts?.[0]?.text} />
                          </div>
                        </div>
                      )}
                      
                      {!recommendations && !giftIdeas && (
                        <div className="text-center py-5 text-muted">
                          <p>No recommendations available for this event.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center bg-light">
                <div className="text-center p-5">
                  <div className="mb-3 text-muted" style={{ fontSize: '3rem' }}>👈</div>
                  <h5 className="fw-bold text-muted">Select an event</h5>
                  <p className="text-muted small">Choose an event from the list to generate AI insights.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
