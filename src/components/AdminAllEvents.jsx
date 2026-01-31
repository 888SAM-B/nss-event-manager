import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminAllEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            const token = localStorage.getItem("adminToken");
            if (!token) {
                navigate("/admin/login");
                return;
            }

            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/events`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setEvents(res.data.events);
                }
            } catch (err) {
                console.error(err);
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem("adminToken");
                    navigate("/admin/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [navigate]);

    const categories = ['all', ...new Set(events.map(e => e.category).filter(Boolean))];

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.eventCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.collegeId?.insName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const formatDate = (event) => {
        if (event.singleDay) {
            return event.date || 'N/A';
        } else {
            return `${event.dateFrom || 'N/A'} to ${event.dateTo || 'N/A'}`;
        }
    };

    if (loading) return (
        <div className="flex-center" style={{ height: '100vh' }}>
            <div className="loading"></div>
            <h2 className="ms-2">Loading Events...</h2>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
            <header className="dashboard-header">
                <div className="container flex-between">
                    <div>
                        <span className="badge badge-primary">System Administrator</span>
                        <h1 className="mb-0">All Events Management</h1>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <ThemeToggle />
                        <button className="btn btn-secondary" onClick={() => navigate('/admin-dashboard')}>
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </header>

            <main className="container main-container">
                {/* Filters */}
                <div className="card mb-6">
                    <div className="grid-cols-2" style={{ gap: '1rem' }}>
                        <div className="form-group mb-0">
                            <label className="form-label">Search Events</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name, code, or college..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">Filter by Category</label>
                            <select
                                className="form-input"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {cat === 'all' ? 'All Categories' : cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid-cols-3 mb-6">
                    <div className="card text-center">
                        <h3 className="text-secondary mb-2">Total Events</h3>
                        <p className="fw-bold" style={{ fontSize: '2rem' }}>{events.length}</p>
                    </div>
                    <div className="card text-center">
                        <h3 className="text-secondary mb-2">Filtered Results</h3>
                        <p className="fw-bold" style={{ fontSize: '2rem' }}>{filteredEvents.length}</p>
                    </div>
                    <div className="card text-center">
                        <h3 className="text-secondary mb-2">Categories</h3>
                        <p className="fw-bold" style={{ fontSize: '2rem' }}>{categories.length - 1}</p>
                    </div>
                </div>

                {/* Events Table */}
                <div className="card">
                    <h3 className="mb-4">Events List</h3>
                    {filteredEvents.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="styled-table w-100">
                                <thead>
                                    <tr>
                                        <th>Event Code</th>
                                        <th>Event Name</th>
                                        <th>Category</th>
                                        <th>College</th>
                                        <th>Unit</th>
                                        <th>Date(s)</th>
                                        <th>Venue</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEvents.map((event) => (
                                        <tr key={event._id}>
                                            <td>
                                                <span className="badge badge-primary">{event.eventCode}</span>
                                            </td>
                                            <td>{event.name}</td>
                                            <td>
                                                <span className="badge badge-secondary">{event.category || 'N/A'}</span>
                                            </td>
                                            <td>
                                                {event.collegeId?.insName || 'N/A'}
                                                <br />
                                                <small className="text-muted">{event.collegeId?.code}</small>
                                            </td>
                                            <td>
                                                {event.unitId?.name || 'N/A'}
                                                <br />
                                                <small className="text-muted">{event.unitId?.unitNumber}</small>
                                            </td>
                                            <td>{formatDate(event)}</td>
                                            <td>{event.venue || 'N/A'}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => setSelectedEvent(event)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center p-6">
                            <p className="mb-0">No events found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="flex-between mb-4">
                            <h2 className="mb-0">Event Details</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedEvent(null)}>
                                &times;
                            </button>
                        </div>

                        <div className="mb-4">
                            <div className="grid-cols-2 mb-3">
                                <div>
                                    <p className="text-xs text-muted mb-1">EVENT CODE</p>
                                    <p className="fw-bold">{selectedEvent.eventCode}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted mb-1">CATEGORY</p>
                                    <p className="fw-bold">{selectedEvent.category || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="mb-3">
                                <p className="text-xs text-muted mb-1">EVENT NAME</p>
                                <p className="fw-bold">{selectedEvent.name}</p>
                            </div>

                            <div className="mb-3">
                                <p className="text-xs text-muted mb-1">DESCRIPTION</p>
                                <p>{selectedEvent.description || 'No description provided'}</p>
                            </div>

                            <div className="grid-cols-2 mb-3">
                                <div>
                                    <p className="text-xs text-muted mb-1">COLLEGE</p>
                                    <p className="fw-bold">{selectedEvent.collegeId?.insName || 'N/A'}</p>
                                    <p className="text-sm text-muted">{selectedEvent.collegeId?.code}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted mb-1">UNIT</p>
                                    <p className="fw-bold">{selectedEvent.unitId?.name || 'N/A'}</p>
                                    <p className="text-sm text-muted">{selectedEvent.unitId?.unitNumber}</p>
                                </div>
                            </div>

                            <div className="grid-cols-2 mb-3">
                                <div>
                                    <p className="text-xs text-muted mb-1">DATE(S)</p>
                                    <p className="fw-bold">{formatDate(selectedEvent)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted mb-1">TIME</p>
                                    <p className="fw-bold">
                                        {selectedEvent.timeFrom && selectedEvent.timeTo
                                            ? `${selectedEvent.timeFrom} - ${selectedEvent.timeTo}`
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-3">
                                <p className="text-xs text-muted mb-1">VENUE</p>
                                <p className="fw-bold">{selectedEvent.venue || 'N/A'}</p>
                            </div>

                            {selectedEvent.images && selectedEvent.images.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted mb-2">IMAGES</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {selectedEvent.images.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt={`Event ${idx + 1}`}
                                                style={{
                                                    width: '100px',
                                                    height: '100px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedEvent.report && (
                                <div className="mt-6 p-4 rounded" style={{ background: 'var(--bg-secondary)', borderLeft: '4px solid var(--success-500)', marginTop: '20px' }}>
                                    <div className="flex-between mb-3">
                                        <h3 className="mb-0" style={{ fontSize: '1.1rem', color: 'var(--success-500)' }}>Event Report</h3>
                                        {selectedEvent.report.reportFile && (
                                            <a
                                                href={selectedEvent.report.reportFile}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-success"
                                                download={selectedEvent.report.reportFile}
                                            >
                                                Download PDF Report
                                            </a>

                                        )}
                                    </div>
                                    <div className="grid-cols-3 mb-3">
                                        <div>
                                            <p className="text-xs text-muted mb-1">STATUS</p>
                                            <p className="fw-bold">{selectedEvent.report.conductedOnDate ? "On Schedule" : "Delayed/Rescheduled"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted mb-1">PARTICIPANTS</p>
                                            <p className="fw-bold">{selectedEvent.report.participantsCount}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted mb-1">COLLEGES</p>
                                            <p className="fw-bold">{selectedEvent.report.collegesCount}</p>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <p className="text-xs text-muted mb-1">OUTCOME</p>
                                        <p className="mb-0" style={{ lineHeight: '1.5' }}>{selectedEvent.report.outcome}</p>
                                    </div>
                                    {selectedEvent.report.reportPhotos && selectedEvent.report.reportPhotos.length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted mb-2">REPORT PHOTOS</p>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {selectedEvent.report.reportPhotos.map((img, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={img}
                                                        alt={`Report Photo ${idx + 1}`}
                                                        style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            objectFit: 'cover',
                                                            borderRadius: '6px'
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex-between pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <button className="btn close btn-secondary" onClick={() => setSelectedEvent(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAllEvents;
