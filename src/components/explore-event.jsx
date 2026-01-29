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

  // --- Report Modal State ---
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingEvent, setReportingEvent] = useState(null);
  const [reportForm, setReportForm] = useState({
    conductedOnDate: true,
    participantsCount: "",
    collegesCount: "",
    outcome: "",
    reportFile: "", // For PDF
    reportPhotos: [] // Up to 5
  });
  const [reportFiles, setReportFiles] = useState({ pdf: null, photos: [] });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);


  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
  const CLOUDINARY_PDF_CLOUD_NAME = import.meta.env.VITE_PDF_CLOUD_NAME;
  const CLOUDINARY_PDF_UPLOAD_PRESET = import.meta.env.VITE_PDF_UPLOAD_PRESET;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;

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

  // --- Report Handlers ---
  const openReportModal = (event, e) => {
    e.stopPropagation();
    setReportingEvent(event);
    setReportForm({
      conductedOnDate: event.report?.conductedOnDate ?? true,
      participantsCount: event.report?.participantsCount || "",
      collegesCount: event.report?.collegesCount || "",
      outcome: event.report?.outcome || "",
      reportFile: event.report?.reportFile || "",
      reportPhotos: event.report?.reportPhotos || []
    });
    setReportFiles({ pdf: null, photos: [] });
    setShowReportModal(true);
  };

  const handleReportInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReportForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleReportFileChange = (e, type) => {
    if (type === 'pdf') {
      setReportFiles(prev => ({ ...prev, pdf: e.target.files[0] }));
    } else {
      const files = Array.from(e.target.files).slice(0, 5); // Max 5 photos
      setReportFiles(prev => ({ ...prev, photos: files }));
    }
  };

  const uploadToCloudinary = async (file, resourceType = 'image', isPdf = false) => {
    const formData = new FormData();
    formData.append('file', file);

    // Use PDF-specific variables if isPdf is true, otherwise use default ones
    const uploadPreset = isPdf ? CLOUDINARY_PDF_UPLOAD_PRESET : CLOUDINARY_UPLOAD_PRESET;
    const cloudName = isPdf ? CLOUDINARY_PDF_CLOUD_NAME : CLOUDINARY_CLOUD_NAME;
    const resourceType1 = isPdf ? 'raw' : 'image';
    formData.append('upload_preset', uploadPreset);
    console.log(resourceType1, "resourceType1");
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType1}/upload`,
      formData
    );
    return response.data.secure_url;
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReport(true);

    try {
      let pdfUrl = reportForm.reportFile;
      let photoUrls = [...reportForm.reportPhotos];

      // Upload PDF if selected
      if (reportFiles.pdf) {
        pdfUrl = await uploadToCloudinary(reportFiles.pdf, 'image', true);
      }

      // Upload photos if selected
      if (reportFiles.photos.length > 0) {
        const uploadedPhotos = await Promise.all(
          reportFiles.photos.map(file => uploadToCloudinary(file, 'image', false))
        );
        photoUrls = [...photoUrls.slice(0, 5 - uploadedPhotos.length), ...uploadedPhotos].slice(0, 5);
      }

      const finalReportData = {
        ...reportForm,
        reportFile: pdfUrl,
        reportPhotos: photoUrls,
        submittedAt: new Date()
      };

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/submitReport`, {
        eventId: reportingEvent._id,
        reportData: finalReportData
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("unitToken")}`
        }
      });

      if (res.data.success) {
        alert("Report submitted successfully!");
        setUnitEvents(prev => prev.map(ev => ev._id === reportingEvent._id ? res.data.event : ev));
        setShowReportModal(false);
      }
    } catch (err) {
      console.error("Report submisson error:", err);
      alert("Failed to submit report. Ensure cloud configuration is correct.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const EventCard = ({ event, isOwnEvent }) => {
    const borderColor = getEventStatusColor(event);
    const isCompleted = borderColor === 'var(--danger-500)';
    let statusText = event.eventCode;

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
            <div className="mt-3">
              <div className="d-flex gap-2 mb-2">
                {!isCompleted && (
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
              {isCompleted && (
                <button
                  className="btn btn-success btn-sm w-100"
                  onClick={(e) => openReportModal(event, e)}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                >
                  {event.report ? "Edit Report" : "Generate Report"}
                </button>
              )}
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
        {location.state?.fromRole !== 'college' && (
          <Section title="My Unit Events" events={unitEvents} isOwnEvent={true} />
        )}
        <Section title="College Events" events={collegeEvents} isOwnEvent={false} />
        <Section title="Other Events" events={otherEvents} isOwnEvent={false} />
      </main>

      {/* Report Form Modal */}
      {showReportModal && reportingEvent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-4">
              <h2 className="mb-0">Event Report: {reportingEvent.name}</h2>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowReportModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleReportSubmit}>
              <div className="form-group mb-4 p-3" style={{ background: 'var(--dark-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <label className="d-flex align-items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="conductedOnDate"
                    checked={reportForm.conductedOnDate}
                    onChange={handleReportInputChange}
                    className="form-check-input"
                  />
                  <span className="ms-2">Was the event conducted on the scheduled date?</span>
                </label>
              </div>

              <div className="grid-cols-2 mb-3">
                <div className="form-group">
                  <label>Total Participants <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="participantsCount"
                    className="form-control"
                    value={reportForm.participantsCount}
                    onChange={handleReportInputChange}
                    required
                    placeholder="e.g. 50"
                  />
                </div>
                <div className="form-group">
                  <label>Colleges Participated <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    name="collegesCount"
                    className="form-control"
                    value={reportForm.collegesCount}
                    onChange={handleReportInputChange}
                    required
                    placeholder="e.g. 1"
                  />
                </div>
              </div>

              <div className="form-group mb-3">
                <label>Outcome of the Event <span className="text-danger">*</span></label>
                <textarea
                  name="outcome"
                  className="form-control"
                  rows="3"
                  value={reportForm.outcome}
                  onChange={handleReportInputChange}
                  required
                  placeholder="Describe the impact/outcome for students..."
                ></textarea>
              </div>

              <div className="form-group mb-3">
                <label>Attach Report (PDF) <span className="text-danger">*</span></label>
                <input
                  type="file"
                  accept=".pdf"
                  className="form-control"
                  onChange={(e) => handleReportFileChange(e, 'pdf')}
                />
                {reportForm.reportFile && <small className="text-success d-block mt-1">✓ PDF Report already attached</small>}
              </div>

              <div className="form-group mb-4">
                <label>Event Photos (Max: 5)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="form-control"
                  onChange={(e) => handleReportFileChange(e, 'photo')}
                />
                <small className="text-muted d-block mt-1">Select up to 5 best photos of the event.</small>
                {(reportForm.reportPhotos && reportForm.reportPhotos.length > 0) && (
                  <small className="text-success d-block">✓ {reportForm.reportPhotos.length} photos already attached</small>
                )}
              </div>

              <div className="flex-between pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)} disabled={isSubmittingReport}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingReport}>
                  {isSubmittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && !showReportModal && (
        <div className="modal-overlay">
          <div className="modal-content selected-evt" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="flex-between mb-4">
              <div>
                <h2 className="gaps">{selectedEvent.name}</h2>
                <span className="badge badge-primary">{selectedEvent.category}</span>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedEvent(null)}>&times;</button>
            </div>

            <div className="mb-6 text-sm">
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

            {selectedEvent.report && (
              <div className="mb-6 p-4 rounded" style={{ background: 'var(--dark-bg-secondary)', border: '1px solid var(--primary-500)' }}>
                <h3 className="text-lg mb-3">Event Report</h3>
                <div className="grid-cols-2 gap-4">
                  <p><strong>Status:</strong> {selectedEvent.report.participantsCount ? (selectedEvent.report.conductedOnDate ? "Conducted on time" : "Delayed/Rescheduled") : "Yet to be updated"}</p>
                  <p><strong>Participants:</strong> {selectedEvent.report.participantsCount}</p>
                  <p><strong>Colleges:</strong> {selectedEvent.report.collegesCount}</p>
                  {selectedEvent.report.reportFile && (
                    <p><strong>Report:</strong> <a href={selectedEvent.report.reportFile} target="_blank" rel="noopener noreferrer" className="text-primary">View PDF</a></p>
                  )}
                </div>
                <div className="mt-2">
                  <p><strong>Outcome:</strong> {selectedEvent.report.outcome}</p>
                </div>
              </div>
            )}

            {selectedEvent.report?.reportPhotos?.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg mb-3">Event Photos (From Report)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {selectedEvent.report.reportPhotos.map((img, idx) => (
                    <div key={idx} style={{ height: '150px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer' }} onClick={() => { setSelectedEvent({ ...selectedEvent, images: selectedEvent.report.reportPhotos }); openGallery(idx); }}>
                      <img src={img} alt="Report" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              selectedEvent.images && selectedEvent.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg mb-3">Event Gallery</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {selectedEvent.images.map((img, idx) => (
                      <div key={idx} style={{ height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => openGallery(idx)}>
                        <img src={img} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'contain' }} className="gallery-thumb" />
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            <div className="flex-center mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Gallery Modal */}
      {galleryIndex >= 0 && selectedEvent && (
        <div className="modal-overlay" style={{ zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={closeGallery}>
          <button onClick={closeGallery} style={{ position: 'absolute', top: '20px', right: '30px', background: 'transparent', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer', zIndex: 2001 }}>&times;</button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: '100%', height: '100%' }} onClick={(e) => e.stopPropagation()}>
            <button onClick={prevImage} style={{ position: 'absolute', left: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '2rem', padding: '1rem', cursor: 'pointer', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#10094;</button>
            <img src={selectedEvent.images[galleryIndex]} alt="Full view" style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '4px' }} />
            <button onClick={nextImage} style={{ position: 'absolute', right: '20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '2rem', padding: '1rem', cursor: 'pointer', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#10095;</button>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', color: 'white' }}>{galleryIndex + 1} / {selectedEvent.images.length}</div>
        </div>
      )}
    </div>
  );
}

export default ExploreEvents;