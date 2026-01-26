import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ExploreEvents = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const collegeCode = location.state?.collegeCode;
  const unitCode = location.state?.unitCode;

  const [unitEvents, setUnitEvents] = useState([]);
  const [collegeEvents, setCollegeEvents] = useState([]);
  const [otherEvents, setOtherEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state for selected event for modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  // State for gallery modal
  const [galleryIndex, setGalleryIndex] = useState(-1);

  useEffect(() => {
    if (!collegeCode || !unitCode) {
      setError("Missing college or unit information");
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/getEvents/${collegeCode}/${unitCode}`);
        if (res.data.success) {
          setUnitEvents(res.data.unitEvents || []);
          setCollegeEvents(res.data.collegeEvents || []);
          setOtherEvents(res.data.otherEvents || []);
        } else {
          setError("Failed to fetch events");
        }
      } catch (err) {
        console.error(err);
        setError("An error occurred while fetching events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [collegeCode, unitCode]);

  const openGallery = (index) => {
    setGalleryIndex(index);
  }

  const closeGallery = () => {
    setGalleryIndex(-1);
  }

  const nextImage = (e) => {
    e.stopPropagation();
    if (selectedEvent && selectedEvent.images) {
      setGalleryIndex((prev) => (prev + 1) % selectedEvent.images.length);
    }
  }

  const prevImage = (e) => {
    e.stopPropagation();
    if (selectedEvent && selectedEvent.images) {
      setGalleryIndex((prev) => (prev - 1 + selectedEvent.images.length) % selectedEvent.images.length);
    }
  }

  const getEventStatusColor = (event) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate, endDate;

    if (event.singleDay) {
      startDate = new Date(event.date);
      endDate = new Date(event.date);
    } else {
      startDate = new Date(event.dateFrom);
      endDate = new Date(event.dateTo);
    }

    // Normalize comparison dates
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (today > endDate) {
      return 'var(--danger-500)'; // Completed - Red
    } else if (today < startDate) {
      return 'var(--success-500)'; // Upcoming - Green
    } else {
      return 'var(--warning-500)'; // Ongoing - Yellow
    }
  };

  const handleAddEvent = () => {
    navigate('/events', { state: { unitCode, collegeCode } });
  };

  const handleEditEvent = (event, e) => {
    e.stopPropagation();
    navigate('/events', { state: { unitCode, collegeCode, eventToEdit: event } });
  };

  const handleDeleteEvent = async (eventId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/deleteEvent`, {
        eventId,
        unitCode,
        collegeCode
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("unitToken")}`
        }
      });

      if (res.data.success) {
        setUnitEvents(prev => prev.filter(ev => ev._id !== eventId));
        alert("Event deleted successfully");
      } else {
        alert("Failed to delete event: " + res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting event");
    }
  };

  const EventCard = ({ event, isOwnEvent }) => {
    console.log("DEBUG", event)
    const borderColor = getEventStatusColor(event);
    let statusText = "";
    if (borderColor === 'var(--danger-500)') statusText = event.eventCode;
    else if (borderColor === 'var(--success-500)') statusText = event.eventCode;
    else statusText = event.eventCode;

    return (
      <div
        className="card h-100"
        style={{
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          borderLeft: `5px solid ${borderColor}`,
          position: 'relative'
        }}
        onClick={() => setSelectedEvent(event)}
      >
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          color: borderColor,
          fontWeight: 'bold',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          border: `1px solid ${borderColor}`,
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          {statusText}
        </div>

        <div className="flex-between mb-2 mt-4">
          <span className="badge evt-cat badge-primary">{event.category}</span>
          {event.singleDay ? (
            <span className="text-xs text-muted">{event.date}</span>
          ) : (
            <span className="text-xs text-muted">{event.dateFrom} - {event.dateTo}</span>
          )}
        </div>

        <h3 className="mb-2" style={{ fontSize: '1.25rem' }}>{event.name}</h3>
        <p className="text-sm text-muted mb-3" style={{ flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {event.description}
        </p>

        <div className="mt-auto">
          <p className="text-xs mb-1"><strong>Time:</strong> {event.timeFrom} - {event.timeTo}</p>
          <p className="text-xs mb-0"><strong>Venue:</strong> {event.venue}</p>

          {isOwnEvent && (
            <div className="mt-3 d-flex gap-2">
              {borderColor !== 'var(--danger-500)' && (
                <button
                  className="btn btn-primary btn-sm w-100"
                  onClick={(e) => handleEditEvent(event, e)}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                >
                  Edit
                </button>
              )}
              <button
                className="btn btn-danger btn-sm w-100"
                onClick={(e) => handleDeleteEvent(event._id, e)}
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ title, events, isOwnEvent }) => (
    <div className="mb-8">
      <div className="flex-between mb-4" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="mb-0">{title}</h2>
        {isOwnEvent && (
          <button className="btn btn-primary btn-sm" onClick={handleAddEvent}>
            + Add Event
          </button>
        )}
      </div>
      {events.length > 0 ? (
        <div className="grid-cols-3">
          {events.map((event) => (
            <EventCard key={event._id} event={event} isOwnEvent={isOwnEvent} />
          ))}
        </div>
      ) : (
        <p className="text-muted">No events found in this category.</p>
      )}
    </div>
  );

  if (loading) return (
    <div className="flex-center" style={{ height: '100vh' }}>
      <div className="loading"></div>
      <h2 className="ms-2">Loading Events...</h2>
    </div>
  );

  if (error) return (
    <div className="container p-6 text-center">
      <h2 className="text-danger">Error</h2>
      <p>{error}</p>
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
      <header className="dashboard-header">
        <div className="container flex-between">
          <div>
            <h1 className="mb-0" style={{ fontSize: '1.5rem' }}>Explore Events</h1>
            <p className="text-sm text-muted mb-0">Discover what's happening in your unit and college</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back to Dashboard</button>
        </div>
      </header>

      <main className="container main-container pb-6">
        <Section title="My Unit Events" events={unitEvents} isOwnEvent={true} />
        <Section title="College Events" events={collegeEvents} />
        <Section title="Other Events" events={otherEvents} />
      </main>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="modal-overlay ">
          <div className="modal-content selected-evt " style={{ maxWidth: '800px', width: '90%' }}>
            <div className="flex-between mb-4">
              <div className="" >
                <h2 className="gaps">{selectedEvent.name}</h2>
                <span className="badge badge-primary">{selectedEvent.category}</span>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedEvent(null)}>&times;</button>
            </div>

            <div className="mb-6">
              <div className="flex-between mb-2">
                <p className="mb-0"><strong>Date:</strong> {selectedEvent.singleDay ? selectedEvent.date : `${selectedEvent.dateFrom} to ${selectedEvent.dateTo}`}</p>
                <p className="mb-0"><strong>Time:</strong> {selectedEvent.timeFrom} - {selectedEvent.timeTo}</p>
              </div>
              <p><strong>Venue:</strong> {selectedEvent.venue}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg mb-2">Description</h3>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedEvent.description}</p>
            </div>

            {selectedEvent.images && selectedEvent.images.length > 0 && (
              <div  >
                <h3 className="text-lg mb-3">Event Gallery</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {selectedEvent.images.map((img, idx) => (
                    <div key={idx} style={{ height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => openGallery(idx)}>
                      <img
                        src={img}
                        alt={`${selectedEvent.name} - ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.2s' }}
                        className="gallery-thumb"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-center mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Gallery Modal */}
      {galleryIndex >= 0 && selectedEvent && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 2000,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex',
            flexDirection: 'column',
            padding: 0
          }}
          onClick={closeGallery}
        >
          <button
            onClick={closeGallery}
            style={{
              position: 'absolute',
              top: '20px',
              right: '30px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer',
              zIndex: 2001
            }}
          >
            &times;
          </button>

          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
              height: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEvent.images.length > 1 && (
              <button
                onClick={prevImage}
                style={{
                  position: 'absolute',
                  left: '20px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  fontSize: '2rem',
                  padding: '1rem',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                className="gallery-nav-btn"
              >
                &#10094;
              </button>
            )}

            <img
              src={selectedEvent.images[galleryIndex]}
              alt={`Gallery view ${galleryIndex + 1}`}
              style={{
                maxWidth: '90%',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: '4px',
                boxShadow: '0 0 20px rgba(0,0,0,0.5)'
              }}
            />

            {selectedEvent.images.length > 1 && (
              <button
                onClick={nextImage}
                style={{
                  position: 'absolute',
                  right: '20px',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  fontSize: '2rem',
                  padding: '1rem',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                className="gallery-nav-btn"
              >
                &#10095;
              </button>
            )}
          </div>

          <div style={{ textAlign: 'center', padding: '10px', color: 'white', fontSize: '1rem' }}>
            {galleryIndex + 1} / {selectedEvent.images.length}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExploreEvents;