import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CircularBellNotification = ({ onBellClick }) => {
    const [circulars, setCirculars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCirculars();
        // Set up periodic refresh every 60 seconds
        const interval = setInterval(fetchCirculars, 60000);
        return () => clearInterval(interval);
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

    const unreadCount = circulars.filter(c => !readIds.includes(c._id)).length;

    const getAttachmentUrl = (fileUrl) => {
        if (!fileUrl) return '';
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
            return fileUrl;
        }
        return `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}/${fileUrl.replace(/^\//, '')}`;
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Bell Button */}
            <button
                onClick={() => {
                    if (onBellClick) {
                        onBellClick();
                    } else {
                        setIsOpen(!isOpen);
                        if (!isOpen) fetchCirculars();
                    }
                }}
                className="btn btn-sm btn-secondary"
                style={{
                    position: 'relative',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    color: 'var(--txt-1)'
                }}
                title="Circulars & Announcements"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>

                {unreadCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#ef4444',
                            color: '#ffffff',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(239,68,68,0.4)',
                            animation: 'pulse 2s infinite'
                        }}
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Drawer / Panel */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9998,
                            background: 'rgba(0, 0, 0, 0.2)'
                        }}
                    />

                    {/* Notification Drawer */}
                    <div
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 8px)',
                            width: '380px',
                            maxWidth: '90vw',
                            maxHeight: '520px',
                            background: 'var(--card-bg, #ffffff)',
                            border: '1px solid var(--border, #e2e8f0)',
                            borderRadius: '12px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                            zIndex: 9999,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: '14px 16px',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'var(--bg-secondary, #f8fafc)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--txt-1)' }}>
                                    Circulars & Notifications
                                </h3>
                                {unreadCount > 0 && (
                                    <span style={{
                                        fontSize: '0.7rem',
                                        background: 'rgba(99, 102, 241, 0.15)',
                                        color: '#6366f1',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontWeight: 600
                                    }}>
                                        {unreadCount} New
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            color: '#6366f1',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        fontSize: '1.2rem',
                                        cursor: 'pointer',
                                        color: 'var(--txt-3)',
                                        lineHeight: 1
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* List Content */}
                        <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
                            {loading && circulars.length === 0 ? (
                                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--txt-3)', fontSize: '0.85rem' }}>
                                    Loading notifications...
                                </div>
                            ) : circulars.length === 0 ? (
                                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--txt-3)' }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4, marginBottom: '8px' }}>
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No circulars published yet</p>
                                </div>
                            ) : (
                                circulars.map((c) => {
                                    const isRead = readIds.includes(c._id);
                                    return (
                                        <div
                                            key={c._id}
                                            onClick={() => {
                                                markAsRead(c._id);
                                                setSelectedCircular(c);
                                            }}
                                            style={{
                                                padding: '12px',
                                                borderRadius: '8px',
                                                marginBottom: '6px',
                                                background: isRead ? 'transparent' : 'rgba(99, 102, 241, 0.06)',
                                                borderLeft: isRead ? '3px solid transparent' : '3px solid #6366f1',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--bg-secondary, rgba(0,0,0,0.03))';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = isRead ? 'transparent' : 'rgba(99, 102, 241, 0.06)';
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 700,
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: c.targetAudience === 'all' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                    color: c.targetAudience === 'all' ? '#10b981' : '#3b82f6'
                                                }}>
                                                    For {c.targetAudience.toUpperCase()}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--txt-3)' }}>
                                                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>

                                            <h4 style={{
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                margin: '4px 0',
                                                color: 'var(--txt-1)',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 1,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {c.title}
                                            </h4>

                                            <p style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--txt-2)',
                                                margin: 0,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                lineHeight: 1.3
                                            }}>
                                                {c.content}
                                            </p>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.7rem', color: 'var(--txt-3)' }}>
                                                <span>By {c.postedByName}</span>
                                                {c.attachments && c.attachments.length > 0 && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#6366f1', fontWeight: 600 }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                                        {c.attachments.length} attachment{c.attachments.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Circular Full Details Modal */}
            {selectedCircular && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={() => setSelectedCircular(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--card-bg, #ffffff)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px',
                            maxWidth: '600px',
                            width: '100%',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            padding: '24px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            position: 'relative'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div>
                                <span style={{
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    background: selectedCircular.targetAudience === 'all' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                    color: selectedCircular.targetAudience === 'all' ? '#10b981' : '#3b82f6',
                                    display: 'inline-block',
                                    marginBottom: '8px'
                                }}>
                                    Target: {selectedCircular.targetAudience.toUpperCase()}
                                </span>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>
                                    {selectedCircular.title}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedCircular(null)}
                                style={{
                                    border: 'none',
                                    background: 'var(--bg-secondary, #f1f5f9)',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    color: 'var(--txt-2)'
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '16px',
                            fontSize: '0.8rem',
                            color: 'var(--txt-3)',
                            paddingBottom: '12px',
                            borderBottom: '1px solid var(--border)',
                            marginBottom: '16px'
                        }}>
                            <div><strong>Published by:</strong> {selectedCircular.postedByName} ({selectedCircular.postedByRole === 'nodal' ? `${selectedCircular.postedByDistrict} District Nodal` : 'Administrator'})</div>
                            <div><strong>Date:</strong> {new Date(selectedCircular.createdAt).toLocaleString()}</div>
                        </div>

                        <div style={{
                            fontSize: '0.9rem',
                            color: 'var(--txt-1)',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            marginBottom: '24px'
                        }}>
                            {selectedCircular.content}
                        </div>

                        {/* Attachments Section */}
                        {selectedCircular.attachments && selectedCircular.attachments.length > 0 && (
                            <div style={{
                                background: 'var(--bg-secondary, #f8fafc)',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid var(--border)'
                            }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--txt-1)' }}>
                                    Attachments & Links ({selectedCircular.attachments.length})
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedCircular.attachments.map((att, idx) => {
                                        const fileUrl = getAttachmentUrl(att.fileUrl);
                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    background: 'var(--card-bg, #ffffff)',
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--border)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#6366f1' }}>
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                    </svg>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--txt-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {att.name}
                                                    </span>
                                                </div>
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-sm btn-primary"
                                                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                                                >
                                                    View / Download
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setSelectedCircular(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CircularBellNotification;
