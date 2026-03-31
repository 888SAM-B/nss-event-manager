import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Mini Calendar Component
const EventsCalendar = ({ events }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDayEvents, setSelectedDayEvents] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const getEventsForDate = (day) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(event => {
            if (event.singleDay) {
                return event.date === dateStr;
            } else {
                const from = new Date(event.dateFrom);
                const to = new Date(event.dateTo);
                const current = new Date(dateStr);
                return current >= from && current <= to;
            }
        });
    };

    const handleDayClick = (day, dayEvents) => {
        if (dayEvents.length > 0) {
            setSelectedDayEvents(dayEvents);
            setSelectedDate(`${monthNames[month]} ${day}, ${year}`);
        }
    };

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} style={{ padding: '8px' }}></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEvents = getEventsForDate(day);
        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
        const hasEvents = dayEvents.length > 0;

        days.push(
            <div
                key={day}
                onClick={() => handleDayClick(day, dayEvents)}
                style={{
                    padding: '8px',
                    textAlign: 'center',
                    borderRadius: '4px',
                    background: isToday ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: isToday ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                    position: 'relative',
                    minHeight: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: hasEvents ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    ...(hasEvents && {
                        ':hover': {
                            background: 'rgba(99, 102, 241, 0.1)',
                            transform: 'scale(1.05)'
                        }
                    })
                }}
                onMouseEnter={(e) => {
                    if (hasEvents) {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (hasEvents) {
                        e.currentTarget.style.background = isToday ? 'rgba(99, 102, 241, 0.2)' : 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                    }
                }}
            >
                <span style={{ fontSize: '0.9rem', fontWeight: isToday ? 'bold' : 'normal' }}>{day}</span>
                {dayEvents.length > 0 && (
                    <div style={{ display: 'flex', gap: '2px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {dayEvents.slice(0, 3).map((event, idx) => (
                            <div
                                key={idx}
                                title={event.name}
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: getCategoryColor(event.category)
                                }}
                            />
                        ))}
                        {dayEvents.length > 3 && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>+{dayEvents.length - 3}</span>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <div className="flex-between mb-3 calendar-header">
                <button className="btn btn-sm btn-secondary" onClick={prevMonth}>←</button>
                <h4 className="mb-0">{monthNames[month]} {year}</h4>
                <button className="btn btn-sm btn-secondary" onClick={nextMonth}>→</button>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                marginBottom: '1rem'
            }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', padding: '8px' }}>
                        {day}
                    </div>
                ))}
                {days}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <p className="mb-1">💡 Click on dates with colored dots to view events</p>
            </div>

            {/* Event Details Modal */}
            {selectedDayEvents && createPortal(
                <div className="modal-overlay " onClick={() => setSelectedDayEvents(null)}>
                    <div className="modal-content calender-pop " onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-4">
                            <div>
                                <h2 className="mb-1">Events on {selectedDate}</h2>
                                <p className="text-muted mb-0">{selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled</p>
                            </div>
                            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedDayEvents(null)}>
                                &times;
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {selectedDayEvents.map((event, idx) => (
                                <div key={idx} className="card" style={{ background: 'var(--bg-tertiary)', margin: 0 }}>
                                    <div className="flex-between mb-3">
                                        <h3 className="mb-0">{event.name}</h3>
                                        <span className="badge badge-primary">{event.eventCode}</span>
                                    </div>

                                    <div className="grid-cols-2 mb-3">
                                        <div>
                                            <p className="text-xs text-muted mb-1">CATEGORY</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    background: getCategoryColor(event.category)
                                                }}></div>
                                                <span className="fw-bold">{event.category || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted mb-1">DATE</p>
                                            <p className="fw-bold mb-0">
                                                {event.singleDay
                                                    ? event.date
                                                    : `${event.dateFrom} to ${event.dateTo}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid-cols-2 mb-3">
                                        <div>
                                            <p className="text-xs text-muted mb-1">COLLEGE</p>
                                            <p className="fw-bold mb-0">{event.collegeId?.insName || 'N/A'}</p>
                                            <p className="text-sm text-muted mb-0">{event.collegeId?.code}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted mb-1">UNIT</p>
                                            <p className="fw-bold mb-0">{event.unitId?.name || 'N/A'}</p>
                                            <p className="text-sm text-muted mb-0">{event.unitId?.unitNumber}</p>
                                        </div>
                                    </div>

                                    {(event.timeFrom || event.timeTo) && (
                                        <div className="mb-3">
                                            <p className="text-xs text-muted mb-1">TIME</p>
                                            <p className="fw-bold mb-0">
                                                {event.timeFrom && event.timeTo
                                                    ? `${event.timeFrom} - ${event.timeTo}`
                                                    : event.timeFrom || event.timeTo}
                                            </p>
                                        </div>
                                    )}

                                    {event.venue && (
                                        <div className="mb-3">
                                            <p className="text-xs text-muted mb-1">VENUE</p>
                                            <p className="fw-bold mb-0">{event.venue}</p>
                                        </div>
                                    )}

                                    {event.description && (
                                        <div className="mb-3">
                                            <p className="text-xs text-muted mb-1">DESCRIPTION</p>
                                            <p className="mb-0">{event.description}</p>
                                        </div>
                                    )}

                                    {event.report && (
                                        <div className="mt-4 p-3 rounded" style={{ background: 'var(--bg-secondary)', borderLeft: '3px solid var(--success-500)' }}>
                                            <div className="flex-between mb-2">
                                                <h4 className="mb-0" style={{ fontSize: '0.9rem', color: 'var(--success-500)' }}>Event Report</h4>
                                                {event.report.reportFile && (
                                                    <a
                                                        href={event.report.reportFile.replace('/upload/', '/upload/fl_attachment/')}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-sm btn-primary"
                                                        style={{ fontSize: '0.7rem' }}
                                                    >
                                                        Download PDF Report
                                                    </a>
                                                )}
                                            </div>
                                            <div className="grid-cols-2 gap-2 mb-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                                <div>
                                                    <p className="text-xs text-muted mb-0">PARTICIPANTS</p>
                                                    <p className="fw-bold mb-0" style={{ fontSize: '0.85rem' }}>{event.report.participantsCount}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted mb-0">COLLEGES</p>
                                                    <p className="fw-bold mb-0" style={{ fontSize: '0.85rem' }}>{event.report.collegesCount}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted mb-0">OUTCOME</p>
                                                <p className="mb-0" style={{ fontSize: '0.85rem' }}>{event.report.outcome}</p>
                                            </div>
                                            {event.report.reportPhotos && event.report.reportPhotos.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-xs text-muted mb-1">PHOTOS</p>
                                                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                        {event.report.reportPhotos.map((img, i) => (
                                                            <img key={i} src={img} alt="Report" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex-between pt-4 mt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <button className="btn btn-secondary close" onClick={() => setSelectedDayEvents(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>, document.body
            )}
        </div>
    );
};

const getCategoryColor = (category) => {
    const colors = {
        'Social': '#ef4444',
        'Educational': '#3b82f6',
        'Cultural': '#8b5cf6',
        'Environmental': '#10b981',
        'Health': '#f59e0b',
        'Sports': '#ec4899'
    };
    return colors[category] || '#6366f1';
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [collegeToDelete, setCollegeToDelete] = useState(null);
    const [adminUser, setAdminUser] = useState("");
    const [adminPass, setAdminPass] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem("adminToken");
            if (!token) {
                navigate("/admin/login");
                return;
            }

            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setStats(res.data.stats);
                }
            } catch (err) {
                console.error(err);
                // Clear all dashboard-related tokens
                localStorage.removeItem("adminToken");
                localStorage.removeItem("nsstoken");
                localStorage.removeItem("nss_username");
                localStorage.removeItem("unitToken");
                localStorage.removeItem("nssunitCode");
                localStorage.removeItem("nsscollegeCode");
                
                toast.error("Session expired or error fetching details. Please login again.");
                navigate("/admin-login");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        navigate("/");
    };

    if (loading) return (
        <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
                width: 56, height: 56,
                border: '3px solid rgba(99,102,241,0.2)',
                borderTop: '3px solid #6366f1',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ color: 'var(--txt-3)', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Loading dashboard...</span>
        </div>
    );

    if (!stats) {
        localStorage.removeItem("adminToken");
        navigate("/admin-login");
        return null;
    }

    // Chart data — standard professional palette
    const categoryData = {
        labels: stats.eventsByCategory.map(c => c._id),
        datasets: [{
            label: '# of Events',
            data: stats.eventsByCategory.map(c => c.count),
            backgroundColor: [
                '#3b82f6', '#22c55e', '#f59e0b',
                '#ef4444', '#8b5cf6', '#06b6d4',
            ],
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 6,
        }],
    };

    const collegeData = {
        labels: stats.colleges.map(c => c.code),
        datasets: [
            {
                label: 'Units',
                data: stats.colleges.map(c => c.units.length),
                backgroundColor: '#3b82f6',
                borderColor: '#2563eb',
                borderWidth: 1,
                borderRadius: 4,
            },
            {
                label: 'Events',
                data: stats.colleges.map(c => c.events.length),
                backgroundColor: '#22c55e',
                borderColor: '#16a34a',
                borderWidth: 1,
                borderRadius: 4,
            }
        ]
    };

    const chartBaseOptions = {
        plugins: {
            legend: {
                labels: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 12 }, padding: 14 }
            }
        },
        scales: {
            x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.06)' } },
            y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(0,0,0,0.06)' }, beginAtZero: true }
        }
    };

    const handleAddOrg = () => {
        navigate('/add-org', { state: { admin: import.meta.env.VITE_ADMIN_TOKEN } });
    };

    const handleCollegeRedirect = (college) => {
        localStorage.setItem('nss_username', college.userName);
        localStorage.setItem('nsstoken', localStorage.getItem('adminToken'));
        navigate(`/college-dashboard?username=${college.userName}`);
    };

    const handleDeleteCollege = async (e) => {
        e.preventDefault();
        setDeleteError("");
        setIsDeleting(true);

        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/delete-organization`, {
                collegeId: collegeToDelete._id,
                adminUsername: adminUser,
                adminPassword: adminPass
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("College and all associated data removed successfully");
                setCollegeToDelete(null);
                setAdminUser("");
                setAdminPass("");
                // Refresh data
                const statsRes = await axios.get(`${import.meta.env.VITE_API_URL}/admin/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (statsRes.data.success) {
                    setStats(statsRes.data.stats);
                }
            }
        } catch (err) {
            console.error(err);
            setDeleteError(err.response?.data?.message || "Failed to delete college");
        } finally {
            setIsDeleting(false);
        }
    };
    const upcomingCount = stats.allEvents?.filter(e => {
        const d = new Date(e.singleDay ? e.date : e.dateFrom);
        return d >= new Date();
    }).length || 0;

    return (
        <div className="admin-dashboard" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <header className="dashboard-header">
                <div className="container flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{
                            width: 38, height: 38,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(20,184,166,0.18))',
                            border: '1px solid rgba(99,102,241,0.3)',
                            borderRadius: '11px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem',
                            boxShadow: '0 0 20px rgba(99,102,241,0.2)',
                            flexShrink: 0,
                        }}>🛡️</div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em',
                                    background: 'linear-gradient(135deg, #818cf8, #2dd4bf)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                                }}>Admin Dashboard</span>
                                <span className="badge badge-primary" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>SYSTEM</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--txt-3)', marginTop: '-1px' }}>Periyar University NSS Portal</p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center" style={{ gap: '0.625rem' }}>
                        <ThemeToggle />
                        <button className="btn btn-secondary btn-sm" onClick={handleAddOrg}>+ Register College</button>
                        <button className="btn btn-danger btn-sm" onClick={handleLogout}>Sign Out</button>
                    </div>
                </div>
            </header>

            <main className="container main-container">

                {/* ── Stats Row ── */}
                <div className="grid-cols-4 mb-6" style={{ gap: '1rem' }}>
                    {[
                        { label: 'Colleges',  value: stats.totalColleges, icon: '🏛️', bg: '#dbeafe', clr: '#1d4ed8' },
                        { label: 'Units',     value: stats.totalUnits,    icon: '🏫', bg: '#dcfce7', clr: '#15803d' },
                        { label: 'Events',    value: stats.totalEvents,   icon: '📋', bg: '#fef3c7', clr: '#b45309' },
                        { label: 'Upcoming',  value: upcomingCount,       icon: '📅', bg: '#f0fdf4', clr: '#15803d' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '1rem',
                            padding: '1.25rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            transition: 'all 0.2s ease',
                            cursor: 'default',
                            boxShadow: 'var(--sh)',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--sh-md)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--sh)'; }}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: '12px', flexShrink: 0,
                                background: s.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.3rem',
                            }}>{s.icon}</div>
                            <div>
                                <div style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.04em', color: s.clr, lineHeight: 1 }}>{s.value}</div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.25rem' }}>{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Charts ── */}
                <div className="grid-cols-2 mb-6 admin-charts-container">
                    <div className="card admin-chart-card" style={{ height: 400 }}>
                        <div className="flex-between mb-4">
                            <h3 className="mb-0" style={{ fontSize: '1rem' }}>Events by Category</h3>
                            <span className="badge badge-primary">{stats.eventsByCategory.length} categories</span>
                        </div>
                        <div className="chart-wrapper" style={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                            <Doughnut data={categoryData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#64748b', font: { family: 'Plus Jakarta Sans', size: 11 }, padding: 12 } } } }} />
                        </div>
                    </div>
                    <div className="card admin-chart-card" style={{ height: 400 }}>
                        <div className="flex-between mb-4">
                            <h3 className="mb-0" style={{ fontSize: '1rem' }}>College Overview</h3>
                            <span className="badge badge-secondary">{stats.colleges.length} colleges</span>
                        </div>
                        <div className="chart-wrapper" style={{ height: 300 }}>
                            <Bar data={collegeData} options={{ ...chartBaseOptions, maintainAspectRatio: false, responsive: true }} />
                        </div>
                    </div>
                </div>

                {/* ── Calendar + Quick Actions ── */}
                <div className="grid-cols-2 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
                    <div className="card">
                        <div className="flex-between mb-4">
                            <h3 className="mb-0" style={{ fontSize: '1rem' }}>Events Calendar</h3>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/all-events')}>
                                View All →
                            </button>
                        </div>
                        <EventsCalendar events={stats.allEvents || []} />
                    </div>

                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                            <h3 className="mb-0" style={{ fontSize: '1rem' }}>Quick Actions</h3>
                            {[
                                { label: 'Manage All Events',  icon: '📋', handler: () => navigate('/admin/all-events'),   primary: true },
                                { label: 'Program Officers',   icon: '👨‍💼', handler: () => navigate('/admin/all-officers'), primary: false },
                                { label: 'Student Records',    icon: '🎓', handler: () => navigate('/admin/all-students'), primary: false },
                            ].map(a => (
                                <button key={a.label}
                                    className={`btn ${a.primary ? 'btn-primary' : 'btn-secondary'} w-100`}
                                    onClick={a.handler}
                                    style={{ justifyContent: 'flex-start', gap: '0.75rem' }}
                                >
                                    <span>{a.icon}</span> {a.label}
                                </button>
                            ))}
                            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {[
                                    { label: 'Total Events',    val: stats.totalEvents },
                                    { label: 'Upcoming Events', val: upcomingCount },
                                ].map(s => (
                                    <div key={s.label} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.5rem 0.75rem',
                                        background: 'var(--bg-2)',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border)',
                                    }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--txt-3)', fontWeight: 600 }}>{s.label}</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-600)' }}>{s.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                </div>

                {/* ── College Table ── */}
                <div className="card">
                    <div className="flex-between mb-5">
                        <div>
                            <h3 className="mb-1" style={{ fontSize: '1.1rem' }}>Registered Colleges</h3>
                            <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.8rem' }}>Click a row to enter the college dashboard</p>
                        </div>
                        <span className="badge badge-primary">{stats.colleges.length} total</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="styled-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Institution Name</th>
                                    <th>Units</th>
                                    <th>Events</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.colleges.map((college) => (
                                    <tr key={college._id} style={{ cursor: 'pointer' }}>
                                        <td onClick={() => handleCollegeRedirect(college)}>
                                            <span className="badge badge-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{college.code}</span>
                                        </td>
                                        <td onClick={() => handleCollegeRedirect(college)}>
                                            <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>{college.insName}</span>
                                        </td>
                                        <td onClick={() => handleCollegeRedirect(college)}>
                                            <span style={{ color: 'var(--brand-400)', fontWeight: 700 }}>{college.units.length}</span>
                                        </td>
                                        <td onClick={() => handleCollegeRedirect(college)}>
                                            <span style={{ color: 'var(--accent-400, #2dd4bf)', fontWeight: 700 }}>{college.events.length}</span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn btn-sm btn-danger"
                                                onClick={(e) => { e.stopPropagation(); setCollegeToDelete(college); }}
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Delete Modal ── */}
                {collegeToDelete && (
                    <div className="modal-overlay" onClick={() => setCollegeToDelete(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                                <div style={{
                                    width: 64, height: 64,
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.25)',
                                    borderRadius: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 1.25rem',
                                    fontSize: '1.75rem',
                                }}>🗑️</div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Delete College</h3>
                                <p style={{ color: 'var(--txt-2)', marginBottom: '0.375rem' }}>
                                    You are about to permanently delete <strong style={{ color: 'var(--txt-1)' }}>{collegeToDelete.insName}</strong>.
                                </p>
                                <p style={{ color: 'var(--danger-400)', fontSize: '0.8rem', margin: 0 }}>
                                    ⚠️ This will remove all units, events, and member data.
                                </p>
                            </div>

                            <form onSubmit={handleDeleteCollege}>
                                <div className="form-group">
                                    <label className="form-label">Admin Username</label>
                                    <input type="text" className="form-input" placeholder="Confirm your username"
                                        value={adminUser} onChange={(e) => setAdminUser(e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Admin Password</label>
                                    <input type="password" className="form-input" placeholder="Confirm your password"
                                        value={adminPass} onChange={(e) => setAdminPass(e.target.value)} required />
                                </div>

                                {deleteError && (
                                    <div style={{
                                        padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.07)',
                                        border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem',
                                        color: '#f87171', fontSize: '0.875rem', marginBottom: '1.25rem'
                                    }}>{deleteError}</div>
                                )}

                                <div className="flex-between" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                    <button type="button" className="btn btn-secondary"
                                        onClick={() => { setCollegeToDelete(null); setDeleteError(''); }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-danger" disabled={isDeleting}>
                                        {isDeleting ? <span className="flex-center" style={{ gap: '0.5rem' }}><span className="loading" />Deleting...</span> : '🗑️ Confirm Delete'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default AdminDashboard;
