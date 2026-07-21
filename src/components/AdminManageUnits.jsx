import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminManageUnits = () => {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedCollege, setSelectedCollege] = useState('');
    const [selectedType, setSelectedType] = useState('');

    // Detailed unit view modal
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [activeDetailTab, setActiveDetailTab] = useState('profile'); // profile, volunteers, events
    const [selectedEvent, setSelectedEvent] = useState(null); // for showing full event modal

    // Pagination/display
    const [currentPage, setCurrentPage] = useState(1);
    const unitsPerPage = 10;

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/all-units`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUnits(res.data.units || []);
            }
        } catch (error) {
            console.error("Error fetching units:", error);
            toast.error("Failed to load units list");
        } finally {
            setLoading(false);
        }
    };

    // Extract unique filter lists from data
    const districts = [...new Set(units.map(u => u.college?.district).filter(Boolean))].sort();
    const colleges = [...new Set(units.map(u => u.college?.insName).filter(Boolean))].sort();
    const collegeTypes = [...new Set(units.map(u => u.college?.collegeType).filter(Boolean))].sort();

    // Filter units
    const filteredUnits = units.filter(u => {
        const matchesSearch = 
            u.unitNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.head?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDistrict = !selectedDistrict || u.college?.district === selectedDistrict;
        const matchesCollege = !selectedCollege || u.college?.insName === selectedCollege;
        const matchesType = !selectedType || u.college?.collegeType === selectedType;

        return matchesSearch && matchesDistrict && matchesCollege && matchesType;
    });

    // Pagination calculation
    const indexOfLastUnit = currentPage * unitsPerPage;
    const indexOfFirstUnit = indexOfLastUnit - unitsPerPage;
    const currentUnits = filteredUnits.slice(indexOfFirstUnit, indexOfLastUnit);
    const totalPages = Math.ceil(filteredUnits.length / unitsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Close unit modal
    const closeDetailModal = () => {
        setSelectedUnit(null);
        setActiveDetailTab('profile');
    };

    // Fetch and display members for selected unit in detail view
    const [unitMembers, setUnitMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        if (selectedUnit && activeDetailTab === 'volunteers') {
            fetchUnitMembers(selectedUnit._id);
        }
    }, [selectedUnit, activeDetailTab]);

    const fetchUnitMembers = async (unitId) => {
        setLoadingMembers(true);
        try {
            const token = localStorage.getItem("adminToken");
            // Since we are admin/nodal, we can fetch all students or filtered students.
            // Let's filter students by unit id.
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/all-students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const members = res.data.students.filter(s => s.unitId?._id === unitId || s.unitId === unitId);
                setUnitMembers(members);
            }
        } catch (error) {
            console.error("Error fetching unit members:", error);
            toast.error("Failed to load unit volunteers");
        } finally {
            setLoadingMembers(false);
        }
    };

    return (
        <div style={{ color: 'var(--txt-1)' }}>
            {/* Header section */}
            <div className="flex-between mb-6">
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>NSS Units Directory</h1>
                    <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Comprehensive database, activity tracker, and read-only access to all NSS Units.</p>
                </div>
            </div>

            {/* Filter controls */}
            <div className="card p-6 mb-6" style={{ background: 'var(--card-bg)' }}>
                <h3 className="mb-4 text-lg">Filter Units</h3>
                <div className="grid-cols-4 gap-4">
                    <div className="form-group">
                        <label className="form-label">Search</label>
                        <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Unit Code, PO Name..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">District</label>
                        <select 
                            className="form-input" 
                            value={selectedDistrict} 
                            onChange={(e) => { setSelectedDistrict(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Districts</option>
                            {districts.map((d, i) => (
                                <option key={i} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">College</label>
                        <select 
                            className="form-input" 
                            value={selectedCollege} 
                            onChange={(e) => { setSelectedCollege(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Colleges</option>
                            {colleges.map((c, i) => (
                                <option key={i} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">College Type</label>
                        <select 
                            className="form-input" 
                            value={selectedType} 
                            onChange={(e) => { setSelectedType(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">All Types</option>
                            {collegeTypes.map((t, i) => (
                                <option key={i} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Units list table */}
            <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--txt-3)' }}>Loading units...</div>
                ) : filteredUnits.length === 0 ? (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--txt-3)' }}>No units found matching filters.</div>
                ) : (
                    <>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="styled-table" style={{ margin: 0, boxShadow: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Unit Number</th>
                                        <th>College Name</th>
                                        <th>District</th>
                                        <th>Programme Officer</th>
                                        <th className="text-center">Volunteers</th>
                                        <th className="text-center">Events</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentUnits.map((u, index) => (
                                        <tr key={u._id}>
                                            <td>{indexOfFirstUnit + index + 1}</td>
                                            <td><span className="badge badge-secondary" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}>{u.unitNumber}</span></td>
                                            <td style={{ fontWeight: 600 }}>{u.college?.insName}</td>
                                            <td>{u.college?.district}</td>
                                            <td>
                                                <div style={{ fontWeight: 550 }}>{u.head?.name || 'Not assigned'}</div>
                                                {u.head?.mobile && <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>{u.head.mobile}</div>}
                                            </td>
                                            <td className="text-center" style={{ fontWeight: 'bold' }}>{u.membersCount}</td>
                                            <td className="text-center" style={{ fontWeight: 'bold' }}><span className="badge badge-success">{u.events?.length || 0}</span></td>
                                            <td className="text-center">
                                                <button 
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => setSelectedUnit(u)}
                                                >
                                                    View Login Access
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination controls */}
                        {totalPages > 1 && (
                            <div className="flex-center mt-6 gap-2">
                                <button 
                                    className="btn btn-sm btn-outline-secondary" 
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                >
                                    Previous
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button 
                                        key={i}
                                        className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-outline-secondary'}`}
                                        onClick={() => handlePageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button 
                                    className="btn btn-sm btn-outline-secondary" 
                                    disabled={currentPage === totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Read-Only Unit Login Access Modal */}
            {selectedUnit && (
                <div className="modal-overlay" onClick={closeDetailModal} style={{ zIndex: 1000 }}>
                    <div 
                        className="modal-content" 
                        onClick={(e) => e.stopPropagation()} 
                        style={{ 
                            maxWidth: '90%', 
                            width: '1000px', 
                            maxHeight: '90vh', 
                            overflowY: 'auto',
                            padding: 0,
                            borderRadius: '16px'
                        }}
                    >
                        {/* Simulation top bar */}
                        <div style={{
                            background: 'linear-gradient(135deg, var(--brand-700) 0%, var(--brand-900) 100%)',
                            color: '#fff',
                            padding: '1.25rem 2rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTopLeftRadius: '16px',
                            borderTopRightRadius: '16px'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ 
                                        background: 'rgba(255,255,255,0.15)', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 700, 
                                        padding: '0.2rem 0.6rem', 
                                        borderRadius: '4px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>Read-Only Access</span>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Unit Dashboard</h3>
                                </div>
                                <p style={{ margin: '0.25rem 0 0 0', opacity: 0.8, fontSize: '0.8rem' }}>
                                    {selectedUnit.college?.insName} &mdash; Unit Code: {selectedUnit.unitNumber}
                                </p>
                            </div>
                            <button 
                                onClick={closeDetailModal}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    color: '#fff',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Simulation Tab Selection */}
                        <div style={{
                            display: 'flex',
                            borderBottom: '1px solid var(--border)',
                            background: 'var(--card-bg)',
                            padding: '0 2rem'
                        }}>
                            {[
                                { id: 'profile', label: 'Unit Profile & Villages' },
                                { id: 'volunteers', label: `Enrolled Volunteers (${selectedUnit.membersCount})` },
                                { id: 'events', label: `Events Conducted (${selectedUnit.events?.length || 0})` }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveDetailTab(tab.id)}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: activeDetailTab === tab.id ? '3px solid var(--brand-600)' : '3px solid transparent',
                                        color: activeDetailTab === tab.id ? 'var(--brand-600)' : 'var(--txt-3)',
                                        fontWeight: activeDetailTab === tab.id ? 700 : 500,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body Content */}
                        <div style={{ padding: '2rem', minHeight: '300px', background: 'var(--bg)' }}>
                            
                            {/* Profile Tab */}
                            {activeDetailTab === 'profile' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
                                    
                                    {/* PO & Unit details */}
                                    <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                                        <h4 className="mb-4 text-primary-400" style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Programme Officer Information</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Name:</span>
                                                <span style={{ fontWeight: 700 }}>{selectedUnit.head?.name || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Gender:</span>
                                                <span>{selectedUnit.head?.gender || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Designation:</span>
                                                <span>{selectedUnit.head?.designation || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Qualification:</span>
                                                <span>{selectedUnit.head?.qualification || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>ETI Training:</span>
                                                <span>{selectedUnit.head?.etlTraining ? 'Yes' : 'No'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Email:</span>
                                                <span>{selectedUnit.head?.email || selectedUnit.mail || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Mobile:</span>
                                                <span>{selectedUnit.head?.mobile || selectedUnit.contact || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Created Date:</span>
                                                <span>{selectedUnit.createdDate || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Adopted Villages */}
                                    <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                                        <h4 className="mb-4 text-primary-400" style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Adopted Villages</h4>
                                        {selectedUnit.college?.adoptingVillages && selectedUnit.college.adoptingVillages.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {selectedUnit.college.adoptingVillages.map((village, idx) => (
                                                    <div key={idx} style={{
                                                        padding: '0.75rem 1rem',
                                                        background: 'var(--bg-tertiary)',
                                                        borderRadius: '8px',
                                                        borderLeft: '4px solid var(--brand-500)'
                                                    }}>
                                                        <h5 style={{ margin: '0 0 0.25rem 0', color: 'var(--brand-400)' }}>{village.name}</h5>
                                                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--txt-2)' }}>{village.address}</p>
                                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.72rem', color: 'var(--txt-3)' }}>
                                                            Block: {village.block} | District: {village.district}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ color: 'var(--txt-3)', fontSize: '0.85rem' }}>No villages adopted by this college/unit yet.</p>
                                        )}
                                    </div>

                                </div>
                            )}

                            {/* Volunteers Tab */}
                            {activeDetailTab === 'volunteers' && (
                                <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                                    <h4 className="mb-4 text-primary-400" style={{ fontSize: '1.1rem' }}>Volunteers List</h4>
                                    {loadingMembers ? (
                                        <p style={{ color: 'var(--txt-3)' }}>Loading volunteers...</p>
                                    ) : unitMembers.length === 0 ? (
                                        <p style={{ color: 'var(--txt-3)' }}>No volunteers registered in this unit yet.</p>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="styled-table" style={{ margin: 0, boxShadow: 'none' }}>
                                                <thead>
                                                    <tr>
                                                        <th>S.No</th>
                                                        <th>Name</th>
                                                        <th>Register No</th>
                                                        <th>Gender</th>
                                                        <th>Enrolment Year</th>
                                                        <th>Email</th>
                                                        <th>Mobile</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {unitMembers.map((m, idx) => (
                                                        <tr key={m._id}>
                                                            <td>{idx + 1}</td>
                                                            <td style={{ fontWeight: 600 }}>{m.name}</td>
                                                            <td>{m.regNo}</td>
                                                            <td>{m.gender}</td>
                                                            <td>{m.enrolYear}</td>
                                                            <td>{m.email}</td>
                                                            <td>{m.mobile}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Events Tab */}
                            {activeDetailTab === 'events' && (
                                <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                                    <h4 className="mb-4 text-primary-400" style={{ fontSize: '1.1rem' }}>Conducted / Co-organized Events</h4>
                                    {!selectedUnit.events || selectedUnit.events.length === 0 ? (
                                        <p style={{ color: 'var(--txt-3)' }}>No events conducted by this unit yet.</p>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="styled-table" style={{ margin: 0, boxShadow: 'none' }}>
                                                <thead>
                                                    <tr>
                                                        <th>S.No</th>
                                                        <th>Event Name</th>
                                                        <th>Category</th>
                                                        <th>Event Code</th>
                                                        <th>Date</th>
                                                        <th className="text-center">Volunteers</th>
                                                        <th className="text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedUnit.events.map((e, idx) => (
                                                        <tr key={e._id}>
                                                            <td>{idx + 1}</td>
                                                            <td style={{ fontWeight: 600 }}>{e.name}</td>
                                                            <td><span className="badge badge-secondary">{e.category}</span></td>
                                                            <td><code>{e.eventCode}</code></td>
                                                            <td>{e.singleDay ? e.date : `${e.dateFrom} to ${e.dateTo}`}</td>
                                                            <td className="text-center" style={{ fontWeight: 600 }}>{e.volunteersCount}</td>
                                                            <td className="text-center">
                                                                <button 
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={() => setSelectedEvent(e)}
                                                                >
                                                                    Details
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            borderTop: '1px solid var(--border)',
                            padding: '1.25rem 2rem',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            background: 'var(--card-bg)',
                            borderBottomLeftRadius: '16px',
                            borderBottomRightRadius: '16px'
                        }}>
                            <button className="btn btn-secondary" onClick={closeDetailModal}>
                                Close Access
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Nested Event Details Modal */}
            {selectedEvent && (
                <div className="modal-overlay" onClick={() => setSelectedEvent(null)} style={{ zIndex: 1100 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="flex-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Event Details</h3>
                            <button 
                                onClick={() => setSelectedEvent(null)}
                                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--txt-3)' }}
                            >
                                &times;
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Event Name:</span>
                                <span style={{ fontWeight: 700 }}>{selectedEvent.name}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Category:</span>
                                <span>{selectedEvent.category}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Event Code:</span>
                                <span><code>{selectedEvent.eventCode}</code></span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Date:</span>
                                <span>{selectedEvent.singleDay ? selectedEvent.date : `${selectedEvent.dateFrom} to ${selectedEvent.dateTo}`}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Venue:</span>
                                <span>{selectedEvent.venue || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Volunteers:</span>
                                <span style={{ fontWeight: 700 }}>{selectedEvent.volunteersCount}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Beneficiaries:</span>
                                <span style={{ fontWeight: 700 }}>{selectedEvent.beneficiariesCount || 0}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr' }}>
                                <span style={{ fontWeight: 600, color: 'var(--txt-3)' }}>Organized By:</span>
                                <span>{selectedEvent.collegeId?.insName}</span>
                            </div>
                            {selectedEvent.description && (
                                <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--txt-3)', display: 'block', marginBottom: '0.25rem' }}>Description:</span>
                                    <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.85rem' }}>{selectedEvent.description}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex-end mt-6">
                            <button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManageUnits;
