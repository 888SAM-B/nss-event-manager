import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminCircularsManager = ({ userRole, userDistrict, userName }) => {
    const [circulars, setCirculars] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [title, setTitle] = useState('');
    const [targetAudience, setTargetAudience] = useState('all');
    const [content, setContent] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [externalLinks, setExternalLinks] = useState([{ name: '', url: '' }]);
    const [publishing, setPublishing] = useState(false);

    // Filter & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [audienceFilter, setAudienceFilter] = useState('all');

    const fetchCirculars = async () => {
        const token = localStorage.getItem('adminToken');
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
            console.error(err);
            toast.error('Failed to load circulars');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCirculars();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleAddLink = () => {
        setExternalLinks([...externalLinks, { name: '', url: '' }]);
    };

    const handleRemoveLink = (index) => {
        setExternalLinks(externalLinks.filter((_, i) => i !== index));
    };

    const handleLinkChange = (index, field, value) => {
        const updated = [...externalLinks];
        updated[index][field] = value;
        setExternalLinks(updated);
    };

    const handlePublish = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error('Please enter a title and content for the circular.');
            return;
        }

        setPublishing(true);
        try {
            const token = localStorage.getItem('adminToken');
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('targetAudience', targetAudience);
            formData.append('postedByName', userName || (userRole === 'admin' ? 'System Administrator' : 'District Nodal Officer'));

            // Append attached files
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            // Append valid external links
            const validLinks = externalLinks
                .filter(l => l.name.trim() && l.url.trim())
                .map(l => ({ name: l.name.trim(), fileUrl: l.url.trim(), fileType: 'link' }));

            if (validLinks.length > 0) {
                formData.append('attachments', JSON.stringify(validLinks));
            }

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/circulars`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                toast.success('Circular published successfully!');
                setShowCreateModal(false);
                setTitle('');
                setContent('');
                setTargetAudience('all');
                setSelectedFiles([]);
                setExternalLinks([{ name: '', url: '' }]);
                fetchCirculars();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to publish circular.');
        } finally {
            setPublishing(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this circular?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/circulars/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('Circular deleted successfully!');
                fetchCirculars();
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete circular');
        }
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
            c.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAudience = audienceFilter === 'all' || c.targetAudience === audienceFilter;
        return matchesSearch && matchesAudience;
    });

    return (
        <div>
            {/* Header */}
            <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>
                        Circulars & Announcements
                    </h1>
                    <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>
                        Create and broadcast official circulars, notices, and attachments to colleges or units.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    + Post New Circular
                </button>
            </div>

            {/* Filters & Search Bar */}
            <div className="card p-4 mb-6" style={{ background: 'var(--card-bg)' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search circulars by title or keyword..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div style={{ width: '180px' }}>
                        <select
                            className="form-control"
                            value={audienceFilter}
                            onChange={(e) => setAudienceFilter(e.target.value)}
                        >
                            <option value="all">All Targets</option>
                            <option value="college">Colleges Only</option>
                            <option value="unit">Units Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Circular List */}
            {loading ? (
                <div className="flex-center" style={{ padding: '3rem' }}>
                    <span style={{ color: 'var(--txt-3)' }}>Loading circulars...</span>
                </div>
            ) : filteredCirculars.length === 0 ? (
                <div className="card p-8 text-center" style={{ background: 'var(--card-bg)' }}>
                    <p style={{ color: 'var(--txt-3)', margin: 0 }}>No circulars found matching your criteria.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {filteredCirculars.map((c) => (
                        <div key={c._id} className="card p-5" style={{ background: 'var(--card-bg)', margin: 0 }}>
                            <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="badge" style={{
                                        background: c.targetAudience === 'all' ? 'rgba(16, 185, 129, 0.15)' :
                                                    c.targetAudience === 'college' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                        color: c.targetAudience === 'all' ? '#10b981' :
                                               c.targetAudience === 'college' ? '#3b82f6' : '#a855f7',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase'
                                    }}>
                                        FOR {c.targetAudience.toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--txt-3)' }}>
                                        {new Date(c.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(c._id)}
                                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                                >
                                    Delete
                                </button>
                            </div>

                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--txt-1)' }}>
                                {c.title}
                            </h3>

                            <p style={{ fontSize: '0.85rem', color: 'var(--txt-3)', marginBottom: '12px' }}>
                                Published by: <strong>{c.postedByName}</strong> ({c.postedByRole === 'nodal' ? `${c.postedByDistrict} District Nodal` : 'Administrator'})
                            </p>

                            <div style={{ fontSize: '0.9rem', color: 'var(--txt-1)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
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
                                        ATTACHMENTS ({c.attachments.length})
                                    </h4>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {c.attachments.map((att, idx) => (
                                            <a
                                                key={idx}
                                                href={getAttachmentUrl(att.fileUrl)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-secondary"
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
                    ))}
                </div>
            )}

            {/* Create Circular Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-4">
                            <h2 style={{ margin: 0 }}>Post New Circular / Announcement</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowCreateModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handlePublish}>
                            <div className="mb-4">
                                <label className="form-label fw-bold">Circular Title *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter title or subject of the circular"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold">Target Audience ("For Whom") *</label>
                                <select
                                    className="form-control"
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    required
                                >
                                    <option value="all">All (Colleges & Units)</option>
                                    <option value="college">Colleges Only</option>
                                    <option value="unit">Units Only</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold">Circular Content / Details *</label>
                                <textarea
                                    className="form-control"
                                    rows="5"
                                    placeholder="Write the circular announcement details here..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            {/* File Upload Attachment */}
                            <div className="mb-4">
                                <label className="form-label fw-bold">File Attachments (PDFs, Images)</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                />
                                <small style={{ color: 'var(--txt-3)', display: 'block', marginTop: '4px' }}>
                                    Supported file types: PDF, JPG, PNG (Max 10MB per file)
                                </small>
                            </div>

                            {/* External Links / Document Links */}
                            <div className="mb-4">
                                <div className="flex-between mb-2">
                                    <label className="form-label fw-bold mb-0">External Link Attachments</label>
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddLink}>
                                        + Add Link
                                    </button>
                                </div>
                                {externalLinks.map((link, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Link Name (e.g. Guidelines Document)"
                                            value={link.name}
                                            onChange={(e) => handleLinkChange(idx, 'name', e.target.value)}
                                            style={{ flex: 1 }}
                                        />
                                        <input
                                            type="url"
                                            className="form-control"
                                            placeholder="URL (https://...)"
                                            value={link.url}
                                            onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                                            style={{ flex: 1.5 }}
                                        />
                                        {externalLinks.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleRemoveLink(idx)}
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={publishing}>
                                    {publishing ? 'Publishing...' : 'Publish Circular'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCircularsManager;
