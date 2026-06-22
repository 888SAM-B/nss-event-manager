import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ProgramOfficerModal from "./ProgramOfficerModal";

const AdminAllOfficers = ({ subview = false }) => {
    const navigate = useNavigate();
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [collegeFilter, setCollegeFilter] = useState("");
    const [selectedOfficer, setSelectedOfficer] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(true);

    const loadOfficers = async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) { navigate("/admin-login"); return; }
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/all-program-officers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setOfficers(res.data.officers);
        } catch (err) {
            if (err.response?.status === 401) { localStorage.removeItem("adminToken"); navigate("/admin-login"); }
        } finally { setLoading(false); }
    };

    useEffect(() => { loadOfficers(); }, [navigate]);

    const filteredOfficers = officers.filter(o => {
        const nameMatch = o.name.toLowerCase().includes(searchTerm.toLowerCase());
        const collegeMatch = collegeFilter === "" || o.collegeId?.insName.toLowerCase().includes(collegeFilter.toLowerCase()) || o.collegeId?.code === collegeFilter;
        return nameMatch && collegeMatch;
    });

    if (loading) return (
        <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--txt-3)', fontSize: '0.875rem' }}>
            <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTop: '2px solid var(--brand-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading program officers...
        </div>
    );

    return (
        <div>
            {/* Filter Bar */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Search by Name</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input className="form-input" style={{ paddingLeft: '2rem', fontSize: '0.8125rem', padding: '0.45rem 0.75rem 0.45rem 2rem' }} placeholder="Officer name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>College</label>
                    <input className="form-input" style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem' }} placeholder="College name or code..." value={collegeFilter} onChange={e => setCollegeFilter(e.target.value)} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)', whiteSpace: 'nowrap', paddingBottom: '0.1rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--txt-1)' }}>{filteredOfficers.length}</span> of {officers.length}
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                                {['Officer ID', 'Name', 'College', 'Unit', 'Department', 'Mobile', ''].map(h => (
                                    <th key={h} style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.675rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOfficers.length === 0 ? (
                                <tr><td colSpan="7" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--txt-3)', fontSize: '0.875rem' }}>No program officers found matching the criteria.</td></tr>
                            ) : filteredOfficers.map((officer, i) => (
                                <tr key={officer._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg)'}
                                >
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '0.15rem 0.4rem', borderRadius: '3px', color: 'var(--txt-2)' }}>{officer.officerID || '—'}</span>
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem', fontWeight: 600, color: 'var(--txt-1)', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {officer.image ? (
                                                <img src={officer.image} alt={officer.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
                                            ) : (
                                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-50)', border: '1px solid var(--brand-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--brand-600)' }}>{officer.name?.charAt(0)}</span>
                                                </div>
                                            )}
                                            {officer.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--txt-1)', fontWeight: 500 }}>{officer.collegeId?.insName}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--txt-3)' }}>{officer.collegeId?.code}</div>
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 600, background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>{officer.unit || 'Unassigned'}</span>
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem', color: 'var(--txt-2)', fontSize: '0.78rem' }}>{officer.department}</td>
                                    <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.78rem', color: 'var(--txt-3)', fontFamily: 'var(--font-mono)' }}>{officer.mobile}</td>
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                                            <button
                                                style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.625rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--txt-2)', cursor: 'pointer' }}
                                                onClick={() => { setSelectedOfficer(officer); setIsReadOnly(true); setShowModal(true); }}
                                            >View</button>
                                            <button
                                                style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.625rem', borderRadius: '4px', border: '1px solid var(--brand-300)', background: 'var(--brand-50)', color: 'var(--brand-700)', cursor: 'pointer' }}
                                                onClick={() => { setSelectedOfficer(officer); setIsReadOnly(false); setShowModal(true); }}
                                            >Edit</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && selectedOfficer && (
                <ProgramOfficerModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    insName={selectedOfficer.collegeId?.insName}
                    insCode={selectedOfficer.collegeId?.code}
                    units={[]}
                    initialData={selectedOfficer}
                    readOnly={isReadOnly}
                    onSuccess={loadOfficers}
                />
            )}
        </div>
    );
};

export default AdminAllOfficers;
