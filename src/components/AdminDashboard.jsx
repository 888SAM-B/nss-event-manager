import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

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
            {selectedDayEvents && (
                <div className="modal-overlay" onClick={() => setSelectedDayEvents(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
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
                                <div key={idx} className="card" style={{ background: 'var(--dark-bg-tertiary)', margin: 0 }}>
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
                                        <div className="mt-4 p-3 rounded" style={{ background: 'var(--dark-bg-secondary)', borderLeft: '3px solid var(--success-500)' }}>
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
                            <button className="btn btn-secondary" onClick={() => setSelectedDayEvents(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
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
                if (err.response && err.response.status === 401) {
                    localStorage.removeItem("adminToken");
                    navigate("/admin/login");
                }
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

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading Admin Dashboard...</div>;
    if (!stats) return <div className="flex-center">Failed to load stats.</div>;

    // Prepare Chart Data
    const categoryData = {
        labels: stats.eventsByCategory.map(c => c._id),
        datasets: [
            {
                label: '# of Events',
                data: stats.eventsByCategory.map(c => c.count),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const collegeData = {
        labels: stats.colleges.map(c => c.code),
        datasets: [
            {
                label: 'Units per College',
                data: stats.colleges.map(c => c.units.length),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
            {
                label: 'Events per College',
                data: stats.colleges.map(c => c.events.length),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
            }
        ]
    };
    const handleAddOrg = () => {
        navigate('/add-org', { state: { admin: import.meta.env.VITE_ADMIN_TOKEN } });
        // console.log("Hello",import.meta.env.VITE_ADMIN_TOKEN)
    }

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
                alert("College and all associated data removed successfully");
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
    return (
        <div className="admin-dashboard" style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
            <header className="dashboard-header">
                <div className="container flex-between">
                    <div>
                        <span className="badge  badge-primary" style={{ marginBottom: '10px' }} >System Administrator</span>
                        <h1 className="mb-0">Admin Dashboard</h1>
                    </div>
                    <button className='btn' onClick={handleAddOrg} >+ Add an Organization</button>
                    <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            <main className="container main-container">
                {/* Stats Cards */}
                <div className="grid-cols-3 mb-6">
                    <div className="card text-center">
                        <h3 className="text-secondary mb-2">Total Colleges</h3>
                        <p className="fw-bold" style={{ fontSize: '2rem' }}>{stats.totalColleges}</p>

                    </div>
                    <div className="card text-center">
                        <h3 className="text-secondary mb-2">Total Units</h3>
                        <p className="fw-bold" style={{ fontSize: '2rem' }}>{stats.totalUnits}</p>
                    </div>
                    <div className="card text-center">
                        <h3 className="text-secondary mb-2">Total Events</h3>
                        <p className="fw-bold" style={{ fontSize: '2rem' }}>{stats.totalEvents}</p>
                    </div>
                </div>
                {/* Charts */}
                <div className="grid-cols-2 mb-6 admin-charts-container">
                    <div className="card admin-chart-card" style={{ height: '400px' }}>
                        <h3 className="mb-4">Events by Category</h3>
                        <div className="chart-wrapper" style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                            <Doughnut data={categoryData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </div>
                    <div className="card admin-chart-card" style={{ height: '400px' }}>
                        <h3 className="mb-4">College Overview</h3>
                        <div className="chart-wrapper" style={{ height: '300px' }}>
                            <Bar
                                data={collegeData}
                                options={{
                                    maintainAspectRatio: false,
                                    responsive: true,
                                    scales: {
                                        y: {
                                            beginAtZero: true
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Events Calendar & Quick Actions */}
                <div className="grid-cols-2 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
                    <div className="card">
                        <div className="flex-between mb-4">
                            <h3 className="mb-0">Events Calendar</h3>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate('/admin/all-events')}
                            >
                                View All Events →
                            </button>
                        </div>
                        <EventsCalendar events={stats.allEvents || []} />
                    </div>
                    <div className="card">
                        <h3 className="mb-4">Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button
                                className="btn btn-primary w-100"
                                onClick={() => navigate('/admin/all-events')}
                            >
                                📋 Manage All Events
                            </button>
                            <div className="p-3" style={{ background: 'var(--dark-bg-tertiary)', borderRadius: '8px' }}>
                                <p className="text-sm mb-2 fw-bold">Total Events</p>
                                <p className="text-lg mb-0">{stats.totalEvents}</p>
                            </div>
                            <div className="p-3" style={{ background: 'var(--dark-bg-tertiary)', borderRadius: '8px' }}>
                                <p className="text-sm mb-2 fw-bold">Upcoming Events</p>
                                <p className="text-lg mb-0">
                                    {stats.allEvents?.filter(e => {
                                        const eventDate = new Date(e.singleDay ? e.date : e.dateFrom);
                                        return eventDate >= new Date();
                                    }).length || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* College List Table */}
                <div className="card">
                    <h3 className="mb-4">Registered Colleges</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="styled-table w-100">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Institute Name</th>
                                    <th>Units</th>
                                    <th>Total Events</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.colleges.map((college) => (
                                    <tr key={college._id} style={{ cursor: 'pointer' }} >
                                        <td onClick={() => handleCollegeRedirect(college)}><span className="badge badge-secondary">{college.code}</span></td>
                                        <td onClick={() => handleCollegeRedirect(college)}>{college.insName}</td>
                                        <td onClick={() => handleCollegeRedirect(college)}>{college.units.length}</td>
                                        <td onClick={() => handleCollegeRedirect(college)}>{college.events.length}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCollegeToDelete(college);
                                                }}
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

                {/* Confirm Delete Modal */}
                {collegeToDelete && (
                    <div className="modal-overlay" onClick={() => setCollegeToDelete(null)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                            <div className="text-center mb-6">
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                                <h3>Confirm Deletion</h3>
                                <p>Are you sure you want to delete <strong>{collegeToDelete.insName}</strong>?</p>
                                <p className="text-danger text-sm">This will permanently remove all associated units and events.</p>
                            </div>

                            <form onSubmit={handleDeleteCollege}>
                                <div className="form-group">
                                    <label className="form-label">Admin Username</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Confirm admin username"
                                        value={adminUser}
                                        onChange={(e) => setAdminUser(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Admin Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Confirm admin password"
                                        value={adminPass}
                                        onChange={(e) => setAdminPass(e.target.value)}
                                        required
                                    />
                                </div>

                                {deleteError && <div className="text-danger mb-4 text-center">{deleteError}</div>}

                                <div className="flex-between">
                                    <button type="button" className="btn btn-secondary" onClick={() => setCollegeToDelete(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-danger" disabled={isDeleting}>
                                        {isDeleting ? "Deleting..." : "Confirm Delete"}
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
