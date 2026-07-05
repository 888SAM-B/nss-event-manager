import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import AdminAllEvents from './AdminAllEvents';
import AdminAllOfficers from './AdminAllOfficers';
import AdminAllStudents from './AdminAllStudents';
import AdminAllNodalOfficers from './AdminAllNodalOfficers';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const getDecodedToken = () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

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
    const decoded = getDecodedToken();
    const userRole = decoded?.role || 'admin';
    const userDistrict = decoded?.district || '';
    const userName = decoded?.name || 'System Administrator';

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [collegeToDelete, setCollegeToDelete] = useState(null);
    const [adminUser, setAdminUser] = useState("");
    const [adminPass, setAdminPass] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Sidebar & Navigation States
    const [activeTab, setActiveTab] = useState("overview");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Gallery States
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [galleryImages, setGalleryImages] = useState([]);
    const [loadingGallery, setLoadingGallery] = useState(false);
    const [newImage, setNewImage] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [uploading, setUploading] = useState(false);
    const [editingImageId, setEditingImageId] = useState(null);
    const [editDescription, setEditDescription] = useState("");
    const [updating, setUpdating] = useState(false);

    // Admin Heads States
    const [adminHeads, setAdminHeads] = useState([]);
    const [loadingHeads, setLoadingHeads] = useState(false);
    const [headPosition, setHeadPosition] = useState("");
    const [headName, setHeadName] = useState("");
    const [headPhoto, setHeadPhoto] = useState("");
    const [headDesignation, setHeadDesignation] = useState("");
    const [headQualification, setHeadQualification] = useState("");
    const [headDisplayOrder, setHeadDisplayOrder] = useState(0);
    const [editingHeadId, setEditingHeadId] = useState(null);
    const [savingHead, setSavingHead] = useState(false);

    const fetchAdminHeads = async () => {
        setLoadingHeads(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin-heads`);
            if (res.data.success) {
                setAdminHeads(res.data.heads);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load administration heads");
        } finally {
            setLoadingHeads(false);
        }
    };

    const handleHeadPhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setHeadPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetHeadForm = () => {
        setHeadPosition("");
        setHeadName("");
        setHeadPhoto("");
        setHeadDesignation("");
        setHeadQualification("");
        setHeadDisplayOrder(0);
        setEditingHeadId(null);
        const fileInput = document.getElementById("head-photo-input");
        if (fileInput) fileInput.value = "";
    };

    const handleSaveAdminHead = async (e) => {
        e.preventDefault();
        if (!headPosition.trim() || !headName.trim() || !headPhoto || !headDesignation.trim() || !headQualification.trim()) {
            toast.error("All fields are required");
            return;
        }
        setSavingHead(true);
        try {
            const token = localStorage.getItem("adminToken");
            if (editingHeadId) {
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/admin/admin-head/${editingHeadId}`, {
                    position: headPosition,
                    photo: headPhoto,
                    name: headName,
                    designation: headDesignation,
                    qualification: headQualification,
                    displayOrder: Number(headDisplayOrder)
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    toast.success("Admin head updated successfully!");
                    resetHeadForm();
                    fetchAdminHeads();
                }
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/admin-head`, {
                    position: headPosition,
                    photo: headPhoto,
                    name: headName,
                    designation: headDesignation,
                    qualification: headQualification,
                    displayOrder: Number(headDisplayOrder)
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    toast.success("Admin head added successfully!");
                    resetHeadForm();
                    fetchAdminHeads();
                }
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save admin head");
        } finally {
            setSavingHead(false);
        }
    };

    const handleEditAdminHead = (head) => {
        setEditingHeadId(head._id);
        setHeadPosition(head.position);
        setHeadName(head.name);
        setHeadPhoto(head.photo);
        setHeadDesignation(head.designation);
        setHeadQualification(head.qualification);
        setHeadDisplayOrder(head.displayOrder || 0);
    };

    const handleDeleteAdminHead = async (id) => {
        if (!window.confirm("Are you sure you want to delete this administration head?")) return;
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/admin/admin-head/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success("Admin head deleted successfully!");
                fetchAdminHeads();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete admin head");
        }
    };

    const fetchGalleryImages = async () => {
        setLoadingGallery(true);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/gallery`);
            if (res.data.success) {
                setGalleryImages(res.data.images);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load gallery images");
        } finally {
            setLoadingGallery(false);
        }
    };

    useEffect(() => {
        if (showGalleryModal || activeTab === "gallery") {
            fetchGalleryImages();
        }
        if (activeTab === "admin-heads") {
            fetchAdminHeads();
        }
    }, [showGalleryModal, activeTab]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadImage = async (e) => {
        e.preventDefault();
        if (!newImage || !newDescription.trim()) {
            toast.error("Please select an image and enter a description");
            return;
        }
        setUploading(true);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/gallery`, {
                image: newImage,
                description: newDescription
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success("Image uploaded to gallery!");
                setNewImage("");
                setNewDescription("");
                const fileInput = document.getElementById("gallery-file-input");
                if (fileInput) fileInput.value = "";
                fetchGalleryImages();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateDescription = async (id) => {
        if (!editDescription.trim()) {
            toast.error("Description cannot be empty");
            return;
        }
        setUpdating(true);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/admin/gallery/${id}`, {
                description: editDescription
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success("Description updated successfully!");
                setEditingImageId(null);
                setEditDescription("");
                fetchGalleryImages();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to update description");
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteImage = async (id) => {
        if (!window.confirm("Are you sure you want to delete this gallery image?")) return;
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/admin/gallery/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success("Image deleted successfully!");
                fetchGalleryImages();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete gallery image");
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem("adminToken");
            if (!token) {
                navigate("/admin-login");
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
                const role = getDecodedToken()?.role || 'admin';
                // Clear all dashboard-related tokens
                localStorage.removeItem("adminToken");
                localStorage.removeItem("nsstoken");
                localStorage.removeItem("nss_username");
                localStorage.removeItem("unitToken");
                localStorage.removeItem("nssunitCode");
                localStorage.removeItem("nsscollegeCode");

                toast.error("Session expired or error fetching details. Please login again.");
                if (role === 'nodal') {
                    navigate("/nodal-login");
                } else {
                    navigate("/admin-login");
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

    // Chart data — monochromatic navy/blue palette
    const monoColors = [
        '#0F172A', '#1E3A8A', '#1D4ED8',
        '#2563EB', '#3B82F6', '#60A5FA',
    ];
    const categoryData = {
        labels: stats.eventsByCategory.map(c => c._id),
        datasets: [{
            label: '# of Events',
            data: stats.eventsByCategory.map(c => c.count),
            backgroundColor: monoColors,
            borderColor: '#FFFFFF',
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
                backgroundColor: '#2563EB',
                borderColor: '#1D4ED8',
                borderWidth: 1,
                borderRadius: 3,
            },
            {
                label: 'Events',
                data: stats.colleges.map(c => c.events.length),
                backgroundColor: '#CBD5E1',
                borderColor: '#94A3B8',
                borderWidth: 1,
                borderRadius: 3,
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
            y: { ticks: { color: '#64748b', precision: 0, stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.06)' }, beginAtZero: true }
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

    const handleRegeneratePasskey = async (college) => {
        if (!window.confirm(`Are you sure you want to regenerate the secure passkey for ${college.insName}? The old passkey will be immediately invalidated, and the new one will be emailed.`)) {
            return;
        }
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/regenerate-passkey`, { code: college.code }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success(`Passkey regenerated successfully: ${res.data.passkey}`);
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to regenerate passkey");
        }
    };

    const upcomingCount = stats.allEvents?.filter(e => {
        const d = new Date(e.singleDay ? e.date : e.dateFrom);
        return d >= new Date();
    }).length || 0;

    return (
        <div className="dashboard-layout-wrapper">
            {/* Sidebar overlay for mobile */}
            <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

            {/* Mobile Header */}
            <header className="mobile-nav-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="sidebar-brand-logo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M12 2L2 7l10 5 10-5-10-5z" /></svg>
                    </div>
                    <span className="sidebar-brand-name">{userRole === 'admin' ? 'NSS Admin' : `${userDistrict} Nodal`}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <ThemeToggle />
                    <button className="mobile-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Left Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-logo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M12 2L2 7l10 5 10-5-10-5z" /></svg>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <span className="sidebar-brand-name" style={{ display: 'block' }}>NSS PORTAL</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{userRole === 'admin' ? 'Administrator' : `${userDistrict} Nodal`}</span>
                    </div>
                </div>

                <div className="sidebar-menu">
                    <button className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
                        Overview
                    </button>
                    <button className={`sidebar-item ${activeTab === 'colleges' ? 'active' : ''}`} onClick={() => { setActiveTab('colleges'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></svg>
                        Colleges List
                    </button>
                    <button className={`sidebar-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        Manage Events
                    </button>
                    <button className={`sidebar-item ${activeTab === 'officers' ? 'active' : ''}`} onClick={() => { setActiveTab('officers'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Program Officers
                    </button>
                    <button className={`sidebar-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Student Records
                    </button>
                    <button className={`sidebar-item ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => { setActiveTab('gallery'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                        Event Gallery
                    </button>
                    {userRole === 'admin' && (
                        <button className={`sidebar-item ${activeTab === 'nodal' ? 'active' : ''}`} onClick={() => { setActiveTab('nodal'); setIsSidebarOpen(false); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            Nodal Officers
                        </button>
                    )}
                    {userRole === 'admin' && (
                        <button className={`sidebar-item ${activeTab === 'admin-heads' ? 'active' : ''}`} onClick={() => { setActiveTab('admin-heads'); setIsSidebarOpen(false); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            Admin Heads
                        </button>
                    )}
                </div>

                <div className="sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--txt-1)', fontWeight: 600 }}>Theme</span>
                        <ThemeToggle />
                    </div>
                    <button className="sidebar-item" onClick={handleLogout} style={{ color: 'var(--danger-500)', opacity: 0.9 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Right Main Content Pane */}
            <main className="main-content-pane">
                {activeTab === "overview" && (
                    <div>
                        {/* Header area in content */}
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>Dashboard Overview</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Welcome back, {userRole === 'admin' ? 'System Administrator' : `${userName} (${userDistrict} District Nodal)`}</p>
                            </div>
                            {userRole === 'admin' && (
                                <button className="btn btn-primary" onClick={handleAddOrg}>+ Register College</button>
                            )}
                        </div>

                        {/* Stats Row */}
                        <div className="grid-cols-4 mb-5" style={{ gap: '0.875rem' }}>
                            {[
                                {
                                    label: 'Colleges',
                                    value: stats.totalColleges,
                                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></svg>,
                                    color: '#6366F1',
                                    bgLight: 'rgba(99, 102, 241, 0.1)'
                                },
                                {
                                    label: 'Units',
                                    value: stats.totalUnits,
                                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M12 2L2 7l10 5 10-5-10-5z" /></svg>,
                                    color: '#2563EB',
                                    bgLight: 'rgba(37, 99, 235, 0.1)'
                                },
                                {
                                    label: 'Events',
                                    value: stats.totalEvents,
                                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
                                    color: '#10B981',
                                    bgLight: 'rgba(16, 185, 129, 0.1)'
                                },
                                {
                                    label: 'Upcoming',
                                    value: upcomingCount,
                                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
                                    color: '#F59E0B',
                                    bgLight: 'rgba(245, 158, 11, 0.1)'
                                },
                            ].map(s => (
                                <div key={s.label} style={{
                                    background: 'var(--card)',
                                    border: '1px solid var(--border)',
                                    borderLeft: `4px solid ${s.color}`,
                                    borderRadius: '0.5rem',
                                    padding: '1.125rem 1.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.875rem',
                                    boxShadow: 'var(--sh-sm)',
                                    transition: 'all 0.2s ease',
                                    cursor: 'default'
                                }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.boxShadow = 'var(--sh-md)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.boxShadow = 'var(--sh-sm)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{
                                        width: 42, height: 42, borderRadius: '0.375rem', flexShrink: 0,
                                        background: s.bgLight,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: s.color
                                    }}>{s.icon}</div>
                                    <div>
                                        <div style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--txt-1)', lineHeight: 1 }}>{s.value ?? '—'}</div>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.2rem' }}>{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts */}
                        <div className="grid-cols-2 mb-5 admin-charts-container">
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.25rem', boxShadow: 'var(--sh-sm)', height: 360 }}>
                                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>Events by Category</h3>
                                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>Distribution across categories</p>
                                    </div>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>{stats.eventsByCategory.length} types</span>
                                </div>
                                <div style={{ height: 280, display: 'flex', justifyContent: 'center' }}>
                                    <Doughnut data={categoryData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#475569', font: { family: 'Plus Jakarta Sans', size: 10 }, padding: 10 } } } }} />
                                </div>
                            </div>
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.25rem', boxShadow: 'var(--sh-sm)', height: 360 }}>
                                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>College Overview</h3>
                                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748B' }}>Units & events per college</p>
                                    </div>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 600, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', padding: '0.2rem 0.5rem', borderRadius: '3px' }}>{stats.colleges.length} colleges</span>
                                </div>
                                <div style={{ height: 280 }}>
                                    <Bar data={collegeData} options={{ ...chartBaseOptions, maintainAspectRatio: false, responsive: true }} />
                                </div>
                            </div>
                        </div>

                        {/* Calendar + Quick Actions */}
                        <div className="grid-cols-2 mb-5" style={{ gridTemplateColumns: '2fr 1fr', gap: '0.875rem' }}>
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.25rem', boxShadow: 'var(--sh-sm)' }}>
                                <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>Events Calendar</h3>
                                    <button style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#334155', cursor: 'pointer' }} onClick={() => setActiveTab('events')}>View All →</button>
                                </div>
                                <EventsCalendar events={stats.allEvents || []} />
                            </div>

                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.25rem', boxShadow: 'var(--sh-sm)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>Quick Actions</h3>
                                {[
                                    {
                                        label: 'Manage All Events',
                                        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
                                        handler: () => setActiveTab('events'),
                                    },
                                    {
                                        label: 'Program Officers',
                                        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
                                        handler: () => setActiveTab('officers'),
                                    },
                                    {
                                        label: 'Student Records',
                                        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
                                        handler: () => setActiveTab('students'),
                                    },
                                    {
                                        label: 'Event Gallery',
                                        icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
                                        handler: () => setActiveTab('gallery'),
                                    },
                                ].map((a, i) => (
                                    <button key={i}
                                        onClick={a.handler}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', fontSize: '0.8125rem', fontWeight: 500, color: '#334155', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '0.375rem', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s ease' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#334155'; }}
                                    >
                                        <span style={{ color: '#64748B' }}>{a.icon}</span> {a.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "colleges" && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--txt-1)' }}>Registered Colleges</h2>
                                <p style={{ margin: '0.2rem 0 0', color: 'var(--txt-3)', fontSize: '0.78rem' }}>Click any row to access the college dashboard</p>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)', padding: '0.25rem 0.625rem', borderRadius: '3px' }}>{stats.colleges.length} colleges</span>
                        </div>
                        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                                            {['Code', 'Institution Name', 'Status', 'Units', 'Events', userRole === 'admin' ? 'Actions' : ''].map(h => (
                                                h && <th key={h} style={{ padding: '0.625rem 0.875rem', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: '0.675rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.colleges.map((college, i) => (
                                            <tr key={college._id}
                                                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                                                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg)'}
                                            >
                                                <td style={{ padding: '0.625rem 0.875rem' }} onClick={() => handleCollegeRedirect(college)}>
                                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>{college.code}</span>
                                                </td>
                                                <td style={{ padding: '0.625rem 0.875rem', fontWeight: 600, color: 'var(--txt-1)' }} onClick={() => handleCollegeRedirect(college)}>{college.insName}</td>
                                                <td style={{ padding: '0.625rem 0.875rem' }} onClick={() => handleCollegeRedirect(college)}>
                                                    {college.isRegistered ? (
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'var(--badge-success-bg)', color: 'var(--badge-success-clr)' }}>Registered</span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'var(--badge-secondary-bg)', color: 'var(--badge-secondary-clr)' }}>Shell Only</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.625rem 0.875rem' }} onClick={() => handleCollegeRedirect(college)}>
                                                    <span style={{ fontWeight: 700, color: 'var(--brand-600)', fontSize: '0.875rem' }}>{college.units.length}</span>
                                                </td>
                                                <td style={{ padding: '0.625rem 0.875rem' }} onClick={() => handleCollegeRedirect(college)}>
                                                    <span style={{ fontWeight: 700, color: 'var(--success-600)', fontSize: '0.875rem' }}>{college.events.length}</span>
                                                </td>
                                                {userRole === 'admin' ? (
                                                    <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                                                        {college.isRegistered && (
                                                            <button 
                                                                style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.625rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txt-1)', cursor: 'pointer' }}
                                                                onClick={e => { e.stopPropagation(); handleRegeneratePasskey(college); }}
                                                            >
                                                                Regenerate Passkey
                                                            </button>
                                                        )}
                                                        <button style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.625rem', borderRadius: '4px', border: '1px solid var(--danger-400)', background: 'var(--danger-50)', color: 'var(--danger-600)', cursor: 'pointer' }}
                                                            onClick={e => { e.stopPropagation(); setCollegeToDelete(college); }}
                                                        >Remove</button>
                                                    </td>
                                                ) : (
                                                    <td style={{ padding: '0.625rem 0.875rem', textAlign: 'right' }}>
                                                        <span style={{ color: 'var(--brand-600)', fontWeight: 600, fontSize: '0.75rem' }} onClick={() => handleCollegeRedirect(college)}>View →</span>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "events" && (
                    <div>
                        <div className="mb-4">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>All Events Management</h2>
                            <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Monitor and view details of all college and unit events</p>
                        </div>
                        <AdminAllEvents subview={true} />
                    </div>
                )}

                {activeTab === "officers" && (
                    <div>
                        <div className="mb-4">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Program Officers List</h2>
                            <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>View registered Program Officers across all colleges</p>
                        </div>
                        <AdminAllOfficers subview={true} />
                    </div>
                )}

                {activeTab === "students" && (
                    <div>
                        <div className="mb-4">
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Student Records Directory</h2>
                            <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Comprehensive database of all enrolled NSS student volunteers</p>
                        </div>
                        <AdminAllStudents subview={true} />
                    </div>
                )}

                {activeTab === "gallery" && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--txt-1)' }}>Manage Event Gallery</h2>
                                <p style={{ margin: '0.2rem 0 0', color: 'var(--txt-3)', fontSize: '0.78rem' }}>Manage photos displayed in the public portal gallery</p>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, background: 'var(--bg-2)', color: 'var(--txt-2)', border: '1px solid var(--border)', padding: '0.25rem 0.625rem', borderRadius: '3px' }}>{galleryImages.length} images</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: userRole === 'admin' ? '320px 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
                            {/* Upload Panel */}
                            {userRole === 'admin' && (
                                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.25rem' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem', paddingBottom: '0.625rem', borderBottom: '1px solid var(--border)' }}>Upload New Image</div>
                                    <form onSubmit={handleUploadImage}>
                                        <div style={{ marginBottom: '0.875rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Image File</label>
                                            <input id="gallery-file-input" type="file" className="form-input" style={{ fontSize: '0.8125rem' }} accept="image/*" onChange={handleImageChange} required />
                                        </div>
                                        {newImage && (
                                            <div style={{ marginBottom: '0.875rem' }}>
                                                <img src={newImage} alt="Preview" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                                            </div>
                                        )}
                                        <div style={{ marginBottom: '0.875rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Description</label>
                                            <textarea className="form-input" style={{ fontSize: '0.8125rem', minHeight: 70 }} rows="2" placeholder="Brief caption for this photo..." value={newDescription} onChange={e => setNewDescription(e.target.value)} required />
                                        </div>
                                        <button type="submit" style={{ width: '100%', padding: '0.55rem', fontSize: '0.8125rem', fontWeight: 600, background: 'var(--brand-600)', color: '#fff', border: 'none', borderRadius: '4px', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }} disabled={uploading}>
                                            {uploading ? 'Uploading...' : 'Upload to Gallery'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* Image List */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                {loadingGallery ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--txt-3)', fontSize: '0.8125rem' }}>Loading gallery...</div>
                                ) : galleryImages.length === 0 ? (
                                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--txt-3)', fontSize: '0.8125rem' }}>No images uploaded yet.</div>
                                ) : (
                                    galleryImages.map((img, i) => (
                                        <div key={img._id} style={{ display: 'flex', gap: '0.875rem', padding: '0.875rem 1rem', borderBottom: i < galleryImages.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
                                            <img src={img.image} alt={img.description} style={{ width: 90, height: 68, objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)', flexShrink: 0 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {editingImageId === img._id ? (
                                                    <div>
                                                        <textarea className="form-input" style={{ fontSize: '0.8rem', minHeight: 56, marginBottom: '0.5rem' }} rows="2" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                                                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                                                            <button style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.625rem', borderRadius: '4px', border: 'none', background: 'var(--brand-600)', color: '#fff', cursor: 'pointer' }} onClick={() => handleUpdateDescription(img._id)} disabled={updating}>{updating ? 'Saving...' : 'Save'}</button>
                                                            <button style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.625rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txt-2)', cursor: 'pointer' }} onClick={() => { setEditingImageId(null); setEditDescription(''); }}>Cancel</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--txt-1)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{img.description}</p>
                                                        {userRole === 'admin' && (
                                                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                                                                <button style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '3px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txt-2)', cursor: 'pointer' }} onClick={() => { setEditingImageId(img._id); setEditDescription(img.description); }}>Edit</button>
                                                                <button style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.5rem', borderRadius: '3px', border: '1px solid var(--danger-400)', background: 'var(--danger-50)', color: 'var(--danger-600)', cursor: 'pointer' }} onClick={() => handleDeleteImage(img._id)}>Delete</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "nodal" && userRole === 'admin' && (
                    <div>
                        <AdminAllNodalOfficers />
                    </div>
                )}

                {activeTab === "admin-heads" && userRole === 'admin' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--txt-1)' }}>Manage Administration Heads</h2>
                                <p style={{ margin: '0.2rem 0 0', color: 'var(--txt-3)', fontSize: '0.9rem' }}>Configure Vice Chancellors, Coordinators, and other leadership members shown on the home page.</p>
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, background: 'var(--bg-2)', color: 'var(--txt-2)', border: '1px solid var(--border)', padding: '0.25rem 0.625rem', borderRadius: '3px' }}>{adminHeads.length} Heads</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                            {/* Management Form Panel */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.25rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem', paddingBottom: '0.625rem', borderBottom: '1px solid var(--border)' }}>
                                    {editingHeadId ? 'Edit Administration Head' : 'Add New Admin Head'}
                                </div>
                                <form onSubmit={handleSaveAdminHead}>
                                    <div className="form-group" style={{ marginBottom: '0.875rem' }}>
                                        <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Position / Title</label>
                                        <input type="text" className="form-input" style={{ fontSize: '0.85rem' }} placeholder="e.g. Vice Chancellor, NSS Coordinator" value={headPosition} onChange={e => setHeadPosition(e.target.value)} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0.875rem' }}>
                                        <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</label>
                                        <input type="text" className="form-input" style={{ fontSize: '0.85rem' }} placeholder="Full Name" value={headName} onChange={e => setHeadName(e.target.value)} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0.875rem' }}>
                                        <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Designation</label>
                                        <input type="text" className="form-input" style={{ fontSize: '0.85rem' }} placeholder="e.g. Professor & Head of CS" value={headDesignation} onChange={e => setHeadDesignation(e.target.value)} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0.875rem' }}>
                                        <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qualification</label>
                                        <input type="text" className="form-input" style={{ fontSize: '0.85rem' }} placeholder="e.g. Ph.D., M.Sc." value={headQualification} onChange={e => setHeadQualification(e.target.value)} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0.875rem' }}>
                                        <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Display Order</label>
                                        <input type="number" className="form-input" style={{ fontSize: '0.85rem' }} placeholder="e.g. 1, 2, 3" value={headDisplayOrder} onChange={e => setHeadDisplayOrder(e.target.value)} required />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0.875rem' }}>
                                        <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Photo</label>
                                        <input id="head-photo-input" type="file" className="form-input" style={{ fontSize: '0.85rem' }} accept="image/*" onChange={handleHeadPhotoChange} required={!editingHeadId} />
                                    </div>
                                    {headPhoto && (
                                        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                            <img src={headPhoto} alt="Head Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--border)' }} />
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                                        <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', fontWeight: 600 }} disabled={savingHead}>
                                            {savingHead ? 'Saving...' : editingHeadId ? 'Update' : 'Add Head'}
                                        </button>
                                        {editingHeadId && (
                                            <button type="button" className="btn btn-secondary" style={{ padding: '0.55rem', fontSize: '0.8rem' }} onClick={resetHeadForm}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* Admin Heads List Grid */}
                            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.25rem', flex: 1 }}>
                                {loadingHeads ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--txt-3)' }}>Loading administration heads...</div>
                                ) : adminHeads.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--txt-3)' }}>No administration heads configured. Use the form to add one.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'flex-start' }}>
                                        {adminHeads.map((head) => (
                                            <div key={head._id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '220px', boxSizing: 'border-box' }}>
                                                {/* Edit/Delete Actions overlay */}
                                                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.25rem' }}>
                                                    <button 
                                                        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                                        title="Edit"
                                                        onClick={() => handleEditAdminHead(head)}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--txt-2)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                    </button>
                                                    <button 
                                                        style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                                                        title="Delete"
                                                        onClick={() => handleDeleteAdminHead(head._id)}
                                                    >
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    </button>
                                                </div>

                                                <img src={head.photo} alt={head.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--border)', marginBottom: '0.75rem', background: '#e2e8f0' }} />
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-600)', background: 'rgba(99,102,241,0.08)', padding: '0.15rem 0.5rem', borderRadius: '999px', marginBottom: '0.5rem' }}>{head.position}</span>
                                                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--txt-1)' }}>{head.name}</h4>
                                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--txt-3)', fontWeight: 600 }}>{head.designation}</p>
                                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--txt-3)', fontStyle: 'italic' }}>{head.qualification}</p>

                                                {/* Inline Display Order controls */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--txt-3)', fontWeight: 600 }}>Order:</span>
                                                    <input 
                                                        type="number" 
                                                        style={{ width: '55px', fontSize: '0.75rem', padding: '0.2rem 0.4rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--card)', color: 'var(--txt-1)', textAlign: 'center' }} 
                                                        value={head.displayOrder || 0} 
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            setAdminHeads(prev => prev.map(h => h._id === head._id ? { ...h, displayOrder: val } : h));
                                                        }}
                                                        onBlur={async (e) => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            try {
                                                                const token = localStorage.getItem("adminToken");
                                                                await axios.put(`${import.meta.env.VITE_API_URL}/admin/admin-head/${head._id}`, {
                                                                    ...head,
                                                                    displayOrder: val
                                                                }, {
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                                toast.success("Display order updated!");
                                                                fetchAdminHeads();
                                                            } catch (err) {
                                                                console.error(err);
                                                                toast.error("Failed to update display order");
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Delete Modal */}
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
                                color: 'var(--danger-500)',
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                            </div>
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
                                    {isDeleting ? <span className="flex-center" style={{ gap: '0.5rem' }}><span className="loading" />Deleting...</span> : 'Confirm Delete'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;
