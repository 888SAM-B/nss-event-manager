import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';

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

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hoveredEventId, setHoveredEventId] = useState(null);

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
    reportPhotos: [], // Up to 5
    treesPlanted: "",
    bloodUnitsCollected: ""
  });
  const [reportFiles, setReportFiles] = useState({ pdf: null, photos: [] });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [unitMembers, setUnitMembers] = useState([]);
  const [attendeeSearch, setAttendeeSearch] = useState("");


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
        const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken") || localStorage.getItem("adminToken");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/getEvents/${collegeCode}/${unitCode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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

    const fetchUnitMembers = async () => {
      try {
        const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken");
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/unit-dashboard/${unitCode}/${collegeCode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setUnitMembers(res.data.unit.members || []);
        }
      } catch (err) {
        console.error("Error fetching unit members:", err);
      }
    };

    fetchEvents();
    fetchUnitMembers();
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

    setIsDeleting(true);
    const toastId = toast.loading("Deleting event...");

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
        toast.success("Event deleted successfully", { id: toastId });
      } else {
        toast.error("Failed to delete event: " + res.data.message, { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting event", { id: toastId });
    } finally {
      setIsDeleting(false);
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
      reportPhotos: event.report?.reportPhotos || [],
      guests: event.report?.guests && event.report.guests.length > 0 ? event.report.guests : [""],
      treesPlanted: event.report?.treesPlanted || "",
      bloodUnitsCollected: event.report?.bloodUnitsCollected || ""
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
    const files = Array.from(e.target.files).slice(0, 5); // Max 5 photos
    setReportFiles(prev => ({ ...prev, photos: files }));
  };

  const uploadToCloudinary = async (file, resourceType = 'image', isPdf = false) => {
    const formData = new FormData();
    formData.append('file', file);

    const uploadPreset = isPdf ? CLOUDINARY_PDF_UPLOAD_PRESET : CLOUDINARY_UPLOAD_PRESET;
    const cloudName = isPdf ? CLOUDINARY_PDF_CLOUD_NAME : CLOUDINARY_CLOUD_NAME;
    const resourceType1 = isPdf ? 'raw' : 'image';
    formData.append('upload_preset', uploadPreset);
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType1}/upload`,
      formData
    );
    return response.data.secure_url;
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (reportFiles.photos.length === 0 && reportForm.reportPhotos.length === 0) {
      toast.error("Please upload at least one photo (newspaper cutting, invitation, or certificate).");
      return;
    }
    setIsSubmittingReport(true);

    try {
      let photoUrls = [...reportForm.reportPhotos];

      // Upload photos if selected
      if (reportFiles.photos.length > 0) {
        const uploadedPhotos = await Promise.all(
          reportFiles.photos.map(file => uploadToCloudinary(file, 'image', false))
        );
        photoUrls = [...photoUrls.slice(0, 5 - uploadedPhotos.length), ...uploadedPhotos].slice(0, 5);
      }

      const finalReportData = {
        conductedOnDate: reportForm.conductedOnDate,
        participantsCount: reportForm.participantsCount,
        collegesCount: reportForm.collegesCount,
        outcome: reportForm.outcome,
        guests: reportForm.guests.filter(g => g.trim() !== ""),
        reportPhotos: photoUrls,
        submittedAt: new Date(),
        ...(reportingEvent.category === 'Tree Plantation' && reportForm.treesPlanted !== "" && { treesPlanted: Number(reportForm.treesPlanted) }),
        ...(reportingEvent.category === 'Blood Donation' && reportForm.bloodUnitsCollected !== "" && { bloodUnitsCollected: Number(reportForm.bloodUnitsCollected) })
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
        toast.success("Report submitted successfully!");
        setUnitEvents(prev => prev.map(ev => ev._id === reportingEvent._id ? res.data.event : ev));
        setShowReportModal(false);
      }
    } catch (err) {
      console.error("Report submission error:", err);
      toast.error("Failed to submit report. Ensure cloud configuration is correct.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // SVG Icons for cards
  const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );

  const ClockIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );

  const MapPinIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );

  const filterEvents = (events) => {
    return events.filter(evt => {
      const matchesSearch = !searchQuery || 
                            evt.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            evt.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            evt.venue?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const borderColor = getEventStatusColor(evt);
      let status = "ongoing";
      if (borderColor === 'var(--danger-500)') status = "completed";
      else if (borderColor === 'var(--success-500)') status = "upcoming";

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const EventCard = ({ event, isOwnEvent }) => {
    const borderColor = getEventStatusColor(event);
    const isCompleted = borderColor === 'var(--danger-500)';
    const isHovered = hoveredEventId === event._id;

    let statusText = "Ongoing";
    let statusBg = "rgba(245, 158, 11, 0.1)";
    let statusColor = "var(--warning-500)";

    if (borderColor === 'var(--danger-500)') {
      statusText = "Completed";
      statusBg = "rgba(239, 68, 68, 0.1)";
      statusColor = "var(--danger-500)";
    } else if (borderColor === 'var(--success-500)') {
      statusText = "Upcoming";
      statusBg = "rgba(16, 185, 129, 0.1)";
      statusColor = "var(--success-500)";
    }

    return (
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: isHovered ? `1px solid ${statusColor}` : '1px solid var(--border-color)',
          borderTop: `4px solid ${statusColor}`,
          borderRadius: '12px',
          background: 'var(--card-bg, #ffffff)',
          position: 'relative',
          padding: '1.25rem',
          height: '100%',
          transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
          boxShadow: isHovered 
            ? '0 12px 24px -10px rgba(0, 0, 0, 0.15), 0 8px 16px -8px rgba(0, 0, 0, 0.1)' 
            : 'var(--card-shadow, 0 2px 4px rgba(0, 0, 0, 0.02))',
        }}
        onMouseEnter={() => setHoveredEventId(event._id)}
        onMouseLeave={() => setHoveredEventId(null)}
        onClick={() => setSelectedEvent(event)}
      >
        <div className="flex-between mb-3" style={{ alignItems: 'center' }}>
          <span style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: '0.8rem',
            color: 'var(--txt-3)',
            background: 'var(--bg-secondary)',
            padding: '2px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
          }}>
            {event.eventCode}
          </span>
          <span style={{
            background: statusBg,
            color: statusColor,
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: '9999px',
            letterSpacing: '0.5px'
          }}>
            {statusText}
          </span>
        </div>

        <div className="mb-2">
          <span className="badge" style={{
            background: 'rgba(59, 130, 246, 0.08)',
            color: 'var(--primary-color, #3b82f6)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            fontSize: '0.7rem',
            padding: '3px 8px',
            borderRadius: '9999px',
            fontWeight: 600,
            display: 'inline-block',
            marginBottom: '0.5rem'
          }}>
            {event.category}
          </span>
          <h3 className="mb-2" style={{ 
            fontSize: '1.15rem', 
            fontWeight: 700, 
            color: 'var(--txt-1)', 
            lineHeight: '1.4',
            margin: 0
          }}>
            {event.name}
          </h3>
        </div>

        <p className="text-sm text-muted mb-4" style={{ 
          flex: 1, 
          overflow: 'hidden', 
          display: '-webkit-box', 
          WebkitLineClamp: 3, 
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.5',
          fontSize: '0.875rem'
        }}>
          {event.description}
        </p>

        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1.25rem',
          fontSize: '0.8rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--txt-2)' }}>
            <CalendarIcon />
            <span>
              {event.singleDay ? event.date : `${event.dateFrom} - ${event.dateTo}`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--txt-2)' }}>
            <ClockIcon />
            <span>{event.timeFrom} - {event.timeTo}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--txt-2)' }}>
            <MapPinIcon />
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {event.venue}
            </span>
          </div>
        </div>

        {isOwnEvent && (
          <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex gap-2">
              {!isCompleted && (
                <button
                  className="btn btn-sm"
                  onClick={(e) => handleEditEvent(event, e)}
                  style={{ 
                    flex: 1,
                    fontSize: '0.8rem', 
                    padding: '0.4rem 0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--txt-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    borderRadius: '6px'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  Edit
                </button>
              )}
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={(e) => handleDeleteEvent(event._id, e)}
                style={{ 
                  flex: 1,
                  fontSize: '0.8rem', 
                  padding: '0.4rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  borderRadius: '6px'
                }}
                disabled={isDeleting}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                {isDeleting ? "..." : "Delete"}
              </button>
            </div>
            {isCompleted && (
              <button
                className="btn btn-sm btn-success w-100 mt-2"
                onClick={(e) => openReportModal(event, e)}
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '0.4rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  borderRadius: '6px'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                {event.report ? "Edit Report" : "Generate Report"}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, events, isOwnEvent }) => {
    const filtered = filterEvents(events);
    
    return (
      <div className="mb-8">
        <div className="flex-between mb-4" style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
          <h2 className="mb-0" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--txt-1)' }}>{title} ({filtered.length})</h2>
          {isOwnEvent && (
            <button className="btn btn-primary btn-sm" onClick={handleAddEvent} style={{ borderRadius: '6px' }}>
              + Add Event
            </button>
          )}
        </div>
        {filtered.length > 0 ? (
          <div className="grid-cols-3" style={{ gap: '1.25rem' }}>
            {filtered.map((event) => (
              <EventCard key={event._id} event={event} isOwnEvent={isOwnEvent} />
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center" style={{ background: 'var(--card-bg)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            <p className="text-muted mb-0">No matching events found in this category.</p>
          </div>
        )}
      </div>
    );
  };

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
      <header className="dashboard-header" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--card-bg)' }}>
        <div className="container flex-between" style={{ padding: '1rem 0' }}>
          <div>
            <h1 className="mb-0" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--txt-1)' }}>Explore Events</h1>
            <p className="text-sm text-muted mb-0">Discover and manage activities in your unit and college</p>
          </div>
          <div className="d-flex align-items-center width-set gap-3">
            <ThemeToggle />
            <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ borderRadius: '6px' }}>Back to Dashboard</button>
          </div>
        </div>
      </header>

      <main className="container main-container pb-6" style={{ marginTop: '2rem' }}>
        {/* Search & Filter Bar */}
        <div className="card p-4 mb-6" style={{ 
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: 'var(--card-shadow, 0 2px 4px rgba(0, 0, 0, 0.02))'
        }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search events by name, category, or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: '8px' }}
              />
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)' }}
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            
            <div style={{ minWidth: '180px' }}>
              <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '100%', borderRadius: '8px' }}
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {location.state?.fromRole !== 'college' && (
          <Section title="My Unit Events" events={unitEvents} isOwnEvent={true} />
        )}
        <Section title="College Events" events={collegeEvents} isOwnEvent={false} />
        <Section title="Other Events" events={otherEvents} isOwnEvent={false} />
      </main>

      {/* Report Form Modal */}
      {showReportModal && reportingEvent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-4">
              <h2 className="mb-0">Event Report: {reportingEvent.name}</h2>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowReportModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleReportSubmit}>
              <div className="form-group mb-4 p-3" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
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

              {/* Tree Plantation specific field */}
              {reportingEvent.category === 'Tree Plantation' && (
                <div className="form-group mb-3 p-3" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--success-600)' }}>
                    🌱 Number of Trees Planted <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="treesPlanted"
                    className="form-control"
                    value={reportForm.treesPlanted}
                    onChange={handleReportInputChange}
                    required
                    min="1"
                    placeholder="e.g. 100"
                  />
                  <small className="text-muted">Total number of saplings/trees planted during this event.</small>
                </div>
              )}

              {/* Blood Donation specific field */}
              {reportingEvent.category === 'Blood Donation' && (
                <div className="form-group mb-3 p-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--danger-600)' }}>
                    🩸 Units of Blood Donated <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    name="bloodUnitsCollected"
                    className="form-control"
                    value={reportForm.bloodUnitsCollected}
                    onChange={handleReportInputChange}
                    required
                    min="1"
                    placeholder="e.g. 25"
                  />
                  <small className="text-muted">Total units of blood collected during the donation drive.</small>
                </div>
              )}

              {/* Guest / Resource Person Dynamic Fields */}
              <div className="form-group mb-3 p-3" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <label className="d-flex justify-content-between align-items-center mb-2 fw-bold">
                  <span>Name of Guest / Resource Person(s)</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setReportForm(prev => ({ ...prev, guests: [...prev.guests, ""] }))}
                  >
                    + Add Guest
                  </button>
                </label>
                {reportForm.guests?.map((guest, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      value={guest}
                      placeholder={`Guest/Resource Person #${idx + 1}`}
                      onChange={(e) => {
                        const updatedGuests = [...reportForm.guests];
                        updatedGuests[idx] = e.target.value;
                        setReportForm(prev => ({ ...prev, guests: updatedGuests }));
                      }}
                      required
                    />
                    {reportForm.guests.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.375rem 0.75rem' }}
                        onClick={() => {
                          const updatedGuests = reportForm.guests.filter((_, i) => i !== idx);
                          setReportForm(prev => ({ ...prev, guests: updatedGuests }));
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
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

              <div className="form-group mb-4">
                <label>Event Photos <span className="text-danger">*</span></label>
                <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', color: '#B45309', padding: '0.75rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  ⚠️ <strong>Required:</strong> Please upload at least one photo showing <strong>Newspaper cuttings</strong>, <strong>invitation</strong>, or <strong>certificate</strong>. (Max: 5 photos in total)
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="form-control"
                  onChange={(e) => handleReportFileChange(e, 'photo')}
                />
                <small className="text-muted d-block mt-1">Select up to 5 best photos of the event.</small>
                {(reportForm.reportPhotos && reportForm.reportPhotos.length > 0) && (
                  <small className="text-success d-block mt-1">✓ {reportForm.reportPhotos.length} photos already attached</small>
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

            <div className="mb-6 text-sm" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <div className="grid-cols-2 gap-4">
                <div>
                  <p className="mb-2"><strong>Date:</strong> {selectedEvent.singleDay ? selectedEvent.date : `${selectedEvent.dateFrom} to ${selectedEvent.dateTo}`}</p>
                  <p className="mb-2"><strong>Time:</strong> {selectedEvent.timeFrom || "N/A"} - {selectedEvent.timeTo || "N/A"}</p>
                  <p className="mb-2"><strong>Venue:</strong> {selectedEvent.venue}</p>
                  {selectedEvent.resourcePerson && (
                    <p className="mb-0"><strong>Resource Person:</strong> {selectedEvent.resourcePerson}</p>
                  )}
                </div>
                <div>
                  <p className="mb-2"><strong>Level of Event:</strong> <span className="badge badge-primary">{selectedEvent.level || "College"}</span></p>
                  <p className="mb-2"><strong>Sponsorship:</strong> {selectedEvent.sponsorship || "N/A"}</p>
                  <p className="mb-2"><strong>MY Bharat Registration:</strong> {selectedEvent.registeredMeriBharath || "No"}</p>
                  {selectedEvent.registeredMeriBharath === "Yes" && selectedEvent.meriBharathUrl && (
                    <p className="mb-0"><strong>MY Bharat URL:</strong> <a href={selectedEvent.meriBharathUrl} target="_blank" rel="noopener noreferrer" className="text-primary">View Event Link</a></p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg mb-2">Description</h3>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '1.5rem' }}>{selectedEvent.description}</p>

              {selectedEvent.brochure && (
                <div className="p-3 rounded d-flex align-items-center gap-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--primary-500)', fontSize: '1.5rem' }}>📄</div>
                  <div style={{ flex: 1 }}>
                    <p className="mb-0 fw-bold">Event Brochure</p>
                    <p className="mb-0 text-xs text-muted">Download for more details and schedules</p>
                  </div>
                  <a href={selectedEvent.brochure} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">Download PDF</a>
                </div>
              )}
            </div>

            {selectedEvent.report && (
              <div className="mb-6 p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--primary-500)' }}>
                <h3 className="text-lg mb-3">Event Report</h3>
                <div className="grid-cols-2 gap-4">
                  <p><strong>Status:</strong> {selectedEvent.report.participantsCount ? (selectedEvent.report.conductedOnDate ? "Conducted on time" : "Delayed/Rescheduled") : "Yet to be updated"}</p>
                  <p><strong>Participants:</strong> {selectedEvent.report.participantsCount}</p>
                  <p><strong>Colleges:</strong> {selectedEvent.report.collegesCount}</p>
                  {selectedEvent.category === 'Tree Plantation' && selectedEvent.report.treesPlanted != null && (
                    <p style={{ gridColumn: '1 / -1' }}>
                      <strong>🌱 Trees Planted:</strong>{' '}
                      <span style={{ color: 'var(--success-600)', fontWeight: 700 }}>{selectedEvent.report.treesPlanted}</span>
                    </p>
                  )}
                  {selectedEvent.category === 'Blood Donation' && selectedEvent.report.bloodUnitsCollected != null && (
                    <p style={{ gridColumn: '1 / -1' }}>
                      <strong>🩸 Blood Units Donated:</strong>{' '}
                      <span style={{ color: 'var(--danger-500)', fontWeight: 700 }}>{selectedEvent.report.bloodUnitsCollected} units</span>
                    </p>
                  )}
                </div>
                {selectedEvent.report.guests && selectedEvent.report.guests.length > 0 && (
                  <p className="mt-2 mb-2"><strong>Guest / Resource Person(s):</strong> {selectedEvent.report.guests.join(', ')}</p>
                )}
                <div className="mt-2">
                  <p><strong>Outcome:</strong> {selectedEvent.report.outcome}</p>
                </div>
              </div>
            )}

            {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg mb-3">Participation List ({selectedEvent.attendees.length} Volunteers)</h3>
                <div style={{ maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-secondary)', padding: '10px', borderRadius: '4px' }}>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedEvent.attendees.map(attendee => {
                      // attendee is now a populated object from the backend
                      return (
                        <span key={attendee._id} className="badge badge-secondary p-2" style={{ fontSize: '0.75rem' }}>
                          {attendee.name} ({attendee.regNo})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {selectedEvent.report?.reportPhotos && selectedEvent.report.reportPhotos.length > 0 ?
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
             : 
              selectedEvent.images && selectedEvent.images.length > 0 ?
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
               : null
            }

            <div className="flex-center mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary close" onClick={() => setSelectedEvent(null)}>Close</button>
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