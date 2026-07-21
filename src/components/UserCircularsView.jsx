import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserCircularsView = ({ userRole = 'college' }) => {
    const [circulars, setCirculars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCircular, setSelectedCircular] = useState(null);
    const [readIds, setReadIds] = useState(() => {
        try {
            const saved = localStorage.getItem('nss_read_circulars');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const getAuthToken = () => {
        return localStorage.getItem('adminToken') || 
               localStorage.getItem('nsstoken') || 
               localStorage.getItem('unitToken');
    };

    const fetchCirculars = async () => {
        const token = getAuthToken();
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/circulars`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCirculars(res.data.circulars || []);
            }
        } catch (err) {
            console.error('Error fetching circulars:', err);
            toast.error('Failed to load circulars');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCirculars();
    }, []);

    const markAsRead = (id) => {
        if (!readIds.includes(id)) {
            const updated = [...readIds, id];
            setReadIds(updated);
            try {
                localStorage.setItem('nss_read_circulars', JSON.stringify(updated));
            } catch (e) {
                console.error(e);
            }
        }
    };

    const markAllAsRead = () => {
        const allIds = circulars.map(c => c._id);
        setReadIds(allIds);
        try {
            localStorage.setItem('nss_read_circulars', JSON.stringify(allIds));
        } catch (e) {
            console.error(e);
        }
        toast.success("All circulars marked as read");
    };

    const getAttachmentUrl = (fileUrl) => {
        if (!fileUrl) return '';
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            return fileUrl;
        }
        return `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/${fileUrl.replace(/^\//, '')}`;
    };

    const filteredCirculars = circulars.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.postedByName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const unreadCount = circulars.filter(c => !readIds.includes(c._id)).length;

    return (
        <div>
            {/* Header */}
            <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>
                        Official Circulars & Announcements
                    </h1>
                    <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>
                        View official notifications, government circulars, and attachments issued by NSS State/District Authorities.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>
                        Mark All ({unreadCount}) as Read
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div className="card p-4 mb-6" style={{ background: 'var(--card-bg)' }}>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search circulars by title, text, or sender..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Circular List */}
            {loading ? (
                <div className="flex-center" style={{ padding: '3rem' }}>
                    <span style={{ color: 'var(--txt-3)' }}>Loading official circulars...</span>
                </div>
            ) : filteredCirculars.length === 0 ? (
                <div className="card p-8 text-center" style={{ background: 'var(--card-bg)' }}>
                    <p style={{ color: 'var(--txt-3)', margin: 0 }}>No circulars available at this moment.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {filteredCirculars.map((c) => {
                        const isRead = readIds.includes(c._id);
                        return (
                            <div
                                key={c._id}
                                className="card p-5"
                                style={{
                                    background: 'var(--card-bg)',
                                    margin: 0,
                                    borderLeft: isRead ? '4px solid var(--border)' : '4px solid #6366f1',
                                    position: 'relative'
                                }}
                                onClick={() => markAsRead(c._id)}
                            >
                                <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span className="badge" style={{
                                            background: c.targetAudience === 'all' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                            color: c.targetAudience === 'all' ? '#10b981' : '#3b82f6',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase'
                                        }}>
                                            FOR {c.targetAudience.toUpperCase()}
                                        </span>
                                        {!isRead && (
                                            <span style={{
                                                background: '#ef4444',
                                                color: '#fff',
                                                fontSize: '0.65rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold'
                                            }}>
                                                NEW
                                            </span>
                                        )}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>
                                            {new Date(c.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--txt-3)', fontWeight: 600 }}>
                                        Issued by: {c.postedByName} ({c.postedByRole === 'nodal' ? `${c.postedByDistrict} Nodal` : 'Admin'})
                                    </span>
                                </div>

                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 10px', color: 'var(--txt-1)' }}>
                                    {c.title}
                                </h3>

                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--txt-1)',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                    marginBottom: '16px'
                                }}>
                                    {c.content}
                                </div>

                                {/* Attachments */}
                                {c.attachments && c.attachments.length > 0 && (
                                    <div style={{
                                        borderTop: '1px solid var(--border)',
                                        paddingTop: '12px',
                                        marginTop: '12px'
                                    }}>
                                        <h4 style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--txt-2)' }}>
                                            ATTACHMENTS & LINKS ({c.attachments.length})
                                        </h4>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {c.attachments.map((att, idx) => (
                                                <a
                                                    key={idx}
                                                    href={getAttachmentUrl(att.fileUrl)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-primary"
                                                    style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                                    {att.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default UserCircularsView;
