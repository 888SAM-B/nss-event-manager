import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import VolunteerEnrolmentModal from "./VolunteerEnrolmentModal";

const AdminAllStudents = ({ subview = false }) => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [collegeFilter, setCollegeFilter] = useState("");
    const [communityFilter, setCommunityFilter] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showEnrolmentModal, setShowEnrolmentModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    useEffect(() => {
        const fetchAllStudents = async () => {
            const token = localStorage.getItem("adminToken");
            if (!token) { navigate("/admin-login"); return; }
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/all-students`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) setStudents(res.data.students);
            } catch (err) {
                if (err.response?.status === 401) { localStorage.removeItem("adminToken"); navigate("/admin-login"); }
            } finally { setLoading(false); }
        };
        fetchAllStudents();
    }, [navigate]);

    const filteredStudents = students.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const regNoMatch = s.regNo.toLowerCase().includes(searchTerm.toLowerCase());
        const collegeMatch = collegeFilter === "" || s.collegeId?.insName.toLowerCase().includes(collegeFilter.toLowerCase()) || s.collegeId?.code === collegeFilter;
        const communityMatch = communityFilter === "" || s.community === communityFilter;
        return (nameMatch || regNoMatch) && collegeMatch && communityMatch;
    }).sort((a, b) => (a.collegeId?.insName || "").localeCompare(b.collegeId?.insName || ""));

    useEffect(() => { setCurrentPage(1); }, [searchTerm, collegeFilter, communityFilter]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return (
        <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--txt-3)', fontSize: '0.875rem' }}>
            <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTop: '2px solid var(--brand-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading student records...
        </div>
    );

    return (
        <div>
            {/* Filter Bar */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Search</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input className="form-input" style={{ paddingLeft: '2rem', fontSize: '0.8125rem', padding: '0.45rem 0.75rem 0.45rem 2rem' }} placeholder="Name or Reg No..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>College</label>
                    <input className="form-input" style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem' }} placeholder="College name or code..." value={collegeFilter} onChange={e => setCollegeFilter(e.target.value)} />
                </div>
                <div style={{ flex: '0 1 160px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Community</label>
                    <select className="form-input" style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem' }} value={communityFilter} onChange={e => setCommunityFilter(e.target.value)}>
                        <option value="">All</option>
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="MBC">MBC</option>
                        <option value="BC">BC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                    </select>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)', whiteSpace: 'nowrap', paddingBottom: '0.1rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--txt-1)' }}>{filteredStudents.length}</span> of {students.length}
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                                {['Reg No', 'Name', 'College', 'Unit', 'Dept', 'Community', 'Batch', ''].map(h => (
                                    <th key={h} style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.675rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStudents.length === 0 ? (
                                <tr><td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--txt-3)', fontSize: '0.875rem' }}>No students found matching the criteria.</td></tr>
                            ) : paginatedStudents.map((s, i) => (
                                <tr key={s._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg)'}
                                >
                                    <td style={{ padding: '0.625rem 0.875rem', whiteSpace: 'nowrap' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '0.15rem 0.4rem', borderRadius: '3px', color: 'var(--txt-2)' }}>{s.regNo}</span>
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem', fontWeight: 600, color: 'var(--txt-1)', whiteSpace: 'nowrap' }}>{s.name}</td>
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--txt-1)', fontWeight: 500 }}>{s.collegeId?.insName}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--txt-3)' }}>{s.collegeId?.code}</div>
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 600, background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>{s.unitId?.unitNumber || '—'}</span>
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem', color: 'var(--txt-2)', fontSize: '0.78rem' }}>{s.dept}</td>
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <span style={{ fontSize: '0.68rem', background: 'var(--bg-2)', color: 'var(--txt-2)', border: '1px solid var(--border)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>{s.community || '—'}</span>
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem', fontSize: '0.78rem', color: 'var(--txt-3)', whiteSpace: 'nowrap' }}>{s.batchFrom}–{s.batchTo}</td>
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <button
                                            style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.625rem', borderRadius: '4px', border: s.isEnrolled ? '1px solid var(--success-500)' : '1px solid var(--border)', background: s.isEnrolled ? 'var(--success-50)' : 'var(--card)', color: s.isEnrolled ? 'var(--success-700)' : 'var(--txt-3)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                            onClick={() => { setSelectedStudent(s); setShowEnrolmentModal(true); }}
                                        >
                                            {s.isEnrolled ? 'View Enrolment' : 'Not Enrolled'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredStudents.length > itemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 1rem', borderTop: '1px solid var(--border)', background: 'var(--bg)', fontSize: '0.75rem', color: 'var(--txt-3)' }}>
                        <span>Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length}</span>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button style={{ padding: '0.3rem 0.625rem', fontSize: '0.72rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1 }} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>← Prev</button>
                            <span style={{ padding: '0.3rem 0.75rem', fontWeight: 600, color: 'var(--txt-1)' }}>{currentPage} / {totalPages}</span>
                            <button style={{ padding: '0.3rem 0.625rem', fontSize: '0.72rem', border: '1px solid var(--border)', background: 'var(--card)', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1 }} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next →</button>
                        </div>
                    </div>
                )}
            </div>

            {showEnrolmentModal && selectedStudent && (
                <VolunteerEnrolmentModal
                    isOpen={showEnrolmentModal}
                    onClose={() => setShowEnrolmentModal(false)}
                    member={selectedStudent}
                    collegeData={selectedStudent.collegeId}
                    unitData={selectedStudent.unitId}
                    mode="view"
                />
            )}
        </div>
    );
};

export default AdminAllStudents;
