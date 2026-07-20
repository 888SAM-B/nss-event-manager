import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EventsCalendar from './EventsCalendar';

const Field = ({ label, value }) => (
    <div>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>{label}</div>
        <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--txt-1)' }}>{value || '—'}</div>
    </div>
);

const AdminAllEvents = ({ subview = false }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [dateFilterType, setDateFilterType] = useState('all'); // 'all' | 'specific-month' | 'specific' | 'range'
    const [specificDate, setSpecificDate] = useState('');
    const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
    const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
    const [viewMode, setViewMode] = useState('list');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        const fetchEvents = async () => {
            const token = localStorage.getItem("adminToken");
            if (!token) { navigate("/admin-login"); return; }
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/events`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) setEvents(res.data.events);
            } catch (err) {
                if (err.response?.status === 401) { localStorage.removeItem("adminToken"); navigate("/admin-login"); }
            } finally { setLoading(false); }
        };
        fetchEvents();
    }, [navigate]);

    const categories = ['all', ...new Set(events.map(e => e.category).filter(Boolean))];
    const filteredEvents = events.filter(event => {
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) || event.eventCode?.toLowerCase().includes(searchTerm.toLowerCase()) || event.collegeId?.insName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || event.category === filterCategory;
        const eventDate = event.singleDay ? event.date : event.dateFrom;
        if (!eventDate) return matchesSearch && matchesCategory;

        let matchesDate = true;
        if (dateFilterType === 'specific-month') {
            matchesDate = eventDate.substring(0, 7) === `${filterYear}-${filterMonth}`;
        } else if (dateFilterType === 'specific') {
            if (specificDate) {
                if (event.singleDay) {
                    matchesDate = event.date === specificDate;
                } else {
                    matchesDate = specificDate >= event.dateFrom && specificDate <= event.dateTo;
                }
            }
        } else if (dateFilterType === 'range') {
            matchesDate = (!fromDate && !toDate)
                || (fromDate && toDate ? eventDate >= fromDate && eventDate <= toDate
                    : fromDate ? eventDate >= fromDate : eventDate <= toDate);
        }
        return matchesSearch && matchesCategory && matchesDate;
    });

    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterCategory, dateFilterType, specificDate, fromDate, toDate]);

    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    const paginatedEvents = filteredEvents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const formatDate = (event) => event.singleDay ? (event.date || '—') : `${event.dateFrom || '—'} → ${event.dateTo || '—'}`;

    const getStatusBadge = (event) => {
        const today = new Date();
        const d = event.singleDay ? new Date(event.date) : new Date(event.dateTo);
        if (!d || isNaN(d)) return null;
        if (d < today) return { label: 'Past', bg: 'var(--bg-3)', color: 'var(--txt-3)', border: 'var(--border)' };
        const diff = (d - today) / (1000 * 60 * 60 * 24);
        if (diff <= 7) return { label: 'Upcoming', bg: 'var(--warning-50)', color: 'var(--warning-700)', border: '#fde68a' };
        return { label: 'Scheduled', bg: 'var(--success-50)', color: 'var(--success-700)', border: '#bbf7d0' };
    };

    if (loading) return (
        <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--txt-3)', fontSize: '0.875rem' }}>
            <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTop: '2px solid var(--brand-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading events...
        </div>
    );

    return (
        <div>
            {/* Filter Bar */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Search</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input className="form-input" style={{ paddingLeft: '2rem', fontSize: '0.8125rem', padding: '0.45rem 0.75rem 0.45rem 2rem' }} placeholder="Event name, code, or college..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div style={{ flex: '0 1 180px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Category</label>
                    <select className="form-input" style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                        {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
                    </select>
                </div>
                {/* Date Filter Dropdown */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', flex: '0 1 auto', flexWrap: 'nowrap' }}>
                    <div style={{ minWidth: 0 }}>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Date Filter</label>
                        <select
                            className="form-input"
                            style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem', minWidth: 120 }}
                            value={dateFilterType}
                            onChange={e => {
                                setDateFilterType(e.target.value);
                                setSpecificDate('');
                                setFromDate('');
                                setToDate('');
                            }}
                        >
                            <option value="all">All Time</option>
                            <option value="specific-month">Specific Month</option>
                            <option value="specific">Specific Date</option>
                            <option value="range">Date Range</option>
                        </select>
                    </div>

                    {dateFilterType === 'specific-month' && (
                        <>
                            <div style={{ minWidth: 0 }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Month</label>
                                <select
                                    className="form-input"
                                    style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem', minWidth: 80 }}
                                    value={filterMonth}
                                    onChange={e => setFilterMonth(e.target.value)}
                                >
                                    {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => {
                                        const label = new Date(2000, Number(m) - 1).toLocaleDateString('en-US', { month: 'short' });
                                        return <option key={m} value={m}>{label}</option>;
                                    })}
                                </select>
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Year</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Year"
                                    style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem', minWidth: 85, maxWidth: 100 }}
                                    value={filterYear}
                                    onChange={e => setFilterYear(e.target.value)}
                                    min="1900"
                                    max="2100"
                                />
                            </div>
                        </>
                    )}

                    {dateFilterType === 'specific' && (
                        <div style={{ minWidth: 0 }}>
                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Select Date</label>
                            <input type="date" className="form-input" style={{ fontSize: '0.8125rem', padding: '0.45rem 0.5rem', minWidth: 130 }} value={specificDate} onChange={e => setSpecificDate(e.target.value)} />
                        </div>
                    )}

                    {dateFilterType === 'range' && (
                        <>
                            <div style={{ minWidth: 0 }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>From</label>
                                <input type="date" className="form-input" style={{ fontSize: '0.8125rem', padding: '0.45rem 0.5rem', minWidth: 130 }} value={fromDate} onChange={e => setFromDate(e.target.value)} />
                            </div>
                            <span style={{ color: 'var(--txt-3)', paddingBottom: '0.45rem', fontSize: '0.9rem' }}>–</span>
                            <div style={{ minWidth: 0 }}>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>To</label>
                                <input type="date" className="form-input" style={{ fontSize: '0.8125rem', padding: '0.45rem 0.5rem', minWidth: 130 }} value={toDate} onChange={e => setToDate(e.target.value)} />
                            </div>
                        </>
                    )}

                    {dateFilterType !== 'all' && (
                        <button style={{ fontSize: '0.75rem', padding: '0.45rem 0.5rem', cursor: 'pointer', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '0.375rem', color: 'var(--txt-2)' }} onClick={() => { setDateFilterType('all'); setSpecificDate(''); setFromDate(''); setToDate(''); }}>✕</button>
                    )}
                </div>
                {/* View Toggle */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem', marginLeft: 'auto' }}>
                    <button
                        onClick={() => setViewMode('list')}
                        title="List view"
                        style={{ padding: '0.45rem 0.6rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: viewMode === 'list' ? 'var(--brand-600)' : 'var(--card)', color: viewMode === 'list' ? '#fff' : 'var(--txt-2)', cursor: 'pointer', fontSize: '0.85rem' }}
                    >☰</button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        title="Calendar view"
                        style={{ padding: '0.45rem 0.6rem', borderRadius: '0.375rem', border: '1px solid var(--border)', background: viewMode === 'calendar' ? 'var(--brand-600)' : 'var(--card)', color: viewMode === 'calendar' ? '#fff' : 'var(--txt-2)', cursor: 'pointer', fontSize: '0.85rem' }}
                    >📅</button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)', whiteSpace: 'nowrap', paddingBottom: '0.1rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--txt-1)' }}>{viewMode === 'list' ? filteredEvents.length : events.length}</span> of {events.length}
                </div>
            </div>

            {/* Calendar View */}
            {viewMode === 'calendar' && (
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.5rem' }}>
                    <EventsCalendar events={events} />
                </div>
            )}

            {/* Table View */}
            {viewMode === 'list' && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                {filteredEvents.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-3)', fontSize: '0.875rem' }}>No events found matching your criteria.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                                    {['Code', 'Event Name', 'Category', 'College', 'Date', 'Status', ''].map(h => (
                                        <th key={h} style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.675rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedEvents.map((event, i) => {
                                    const status = getStatusBadge(event);
                                    return (
                                        <tr key={event._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                                            onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg)'}
                                        >
                                            <td style={{ padding: '0.625rem 0.875rem', whiteSpace: 'nowrap' }}>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>{event.eventCode}</span>
                                            </td>
                                            <td style={{ padding: '0.625rem 0.875rem', fontWeight: 600, color: 'var(--txt-1)', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.name}</td>
                                            <td style={{ padding: '0.625rem 0.875rem' }}>
                                                <span style={{ fontSize: '0.68rem', background: 'var(--bg-2)', color: 'var(--txt-2)', border: '1px solid var(--border)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>{event.category || '—'}</span>
                                            </td>
                                            <td style={{ padding: '0.625rem 0.875rem' }}>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--txt-1)', fontWeight: 500 }}>{event.collegeId?.insName || '—'}</div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--txt-3)' }}>{event.collegeId?.code}</div>
                                            </td>
                                            <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.78rem', color: 'var(--txt-2)', whiteSpace: 'nowrap' }}>{formatDate(event)}</td>
                                            <td style={{ padding: '0.625rem 0.875rem' }}>
                                                {status && <span style={{ fontSize: '0.68rem', fontWeight: 600, background: status.bg, color: status.color, border: `1px solid ${status.border}`, padding: '0.15rem 0.4rem', borderRadius: '3px' }}>{status.label}</span>}
                                            </td>
                                            <td style={{ padding: '0.625rem 0.875rem' }}>
                                                <button style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.625rem', borderRadius: '4px', border: '1px solid var(--brand-300)', background: 'var(--brand-50)', color: 'var(--brand-700)', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => setSelectedEvent(event)}>
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {filteredEvents.length > itemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 1rem', borderTop: '1px solid var(--border)', background: 'var(--bg)', fontSize: '0.75rem', color: 'var(--txt-3)' }}>
                        <span>Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length}</span>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button style={{ padding: '0.3rem 0.625rem', fontSize: '0.72rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>← Prev</button>
                            <span style={{ padding: '0.3rem 0.75rem', fontWeight: 600, color: 'var(--txt-1)' }}>{currentPage} / {totalPages}</span>
                            <button style={{ padding: '0.3rem 0.625rem', fontSize: '0.72rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next →</button>
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)', padding: '0.15rem 0.5rem', borderRadius: '3px' }}>{selectedEvent.eventCode}</span>
                                    <span style={{ fontSize: '0.68rem', background: 'var(--bg-2)', color: 'var(--txt-2)', border: '1px solid var(--border)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>{selectedEvent.category}</span>
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--txt-1)' }}>{selectedEvent.name}</h3>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '4px', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--txt-3)', fontSize: '1rem', flexShrink: 0 }}>×</button>
                        </div>

                        {/* Grid Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <Field label="College" value={selectedEvent.collegeId?.insName} />
                            <Field label="College Code" value={selectedEvent.collegeId?.code} />
                            <Field label="Unit" value={selectedEvent.unitId?.name} />
                            <Field label="Unit No." value={selectedEvent.unitId?.unitNumber} />
                            <Field label="Date(s)" value={formatDate(selectedEvent)} />
                            <Field label="Time" value={selectedEvent.timeFrom && selectedEvent.timeTo ? `${selectedEvent.timeFrom} – ${selectedEvent.timeTo}` : null} />
                            <Field label="Venue" value={selectedEvent.venue} />
                            <Field label="Level" value={selectedEvent.level} />
                        </div>

                        {selectedEvent.description && (
                            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.375rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.375rem' }}>Description</div>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--txt-2)', margin: 0, lineHeight: 1.6 }}>{selectedEvent.description}</p>
                            </div>
                        )}

                        {/* Images */}
                        {selectedEvent.images && selectedEvent.images.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Event Images</div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {selectedEvent.images.map((img, idx) => (
                                        <img key={idx} src={img} alt={`img-${idx}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Brochure */}
                        {selectedEvent.brochure && (
                            <div style={{ marginBottom: '1rem' }}>
                                <a href={selectedEvent.brochure} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brand-600)', border: '1px solid var(--brand-300)', background: 'var(--brand-50)', padding: '0.375rem 0.75rem', borderRadius: '4px', textDecoration: 'none' }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    View Brochure
                                </a>
                            </div>
                        )}

                        {/* Report Section */}
                        {selectedEvent.report ? (
                            <div style={{ padding: '0.875rem', background: 'var(--success-50)', border: '1px solid #bbf7d0', borderRadius: '0.375rem', borderLeft: '3px solid var(--success-500)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Event Report Filed</span>
                                    {selectedEvent.report.reportFile && (
                                        <a href={selectedEvent.report.reportFile} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--success-700)', border: '1px solid var(--success-500)', background: '#f0fdf4', padding: '0.25rem 0.5rem', borderRadius: '4px', textDecoration: 'none' }}>
                                            Download PDF
                                        </a>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: selectedEvent.report.outcome ? '0.75rem' : 0 }}>
                                    <Field label="Participants" value={selectedEvent.report.participantsCount} />
                                    <Field label="Colleges" value={selectedEvent.report.collegesCount} />
                                    <Field label="Status" value={selectedEvent.report.conductedOnDate ? "On Schedule" : "Pending"} />
                                </div>
                                {selectedEvent.report.outcome && (
                                    <div>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>Outcome</div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--txt-2)', margin: 0 }}>{selectedEvent.report.outcome}</p>
                                    </div>
                                )}
                                {selectedEvent.report.reportPhotos?.length > 0 && (
                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                        {selectedEvent.report.reportPhotos.map((img, idx) => (
                                            <img key={idx} src={img} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '4px', border: '1px solid #bbf7d0' }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ padding: '0.75rem 1rem', background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: '0.375rem', textAlign: 'center', color: 'var(--txt-3)', fontSize: '0.78rem' }}>
                                Report not yet filed
                            </div>
                        )}

                        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button style={{ fontSize: '0.8125rem', fontWeight: 600, padding: '0.45rem 1rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txt-2)', cursor: 'pointer' }} onClick={() => setSelectedEvent(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAllEvents;
