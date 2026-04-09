import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import ThemeToggle from "./ThemeToggle";
import VolunteerEnrolmentModal from "./VolunteerEnrolmentModal";

const AdminAllStudents = () => {
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
            if (!token) {
                navigate("/admin/login");
                return;
            }

            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/all-students`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setStudents(res.data.students);
                }
            } catch (err) {
                console.error(err);
                if (err.response?.status === 401) {
                    localStorage.removeItem("adminToken");
                    navigate("/admin/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAllStudents();
    }, [navigate]);

    const filteredStudents = students.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
        const regNoMatch = s.regNo.toLowerCase().includes(searchTerm.toLowerCase());
        const collegeMatch = collegeFilter === "" || 
            s.collegeId?.insName.toLowerCase().includes(collegeFilter.toLowerCase()) ||
            s.collegeId?.code === collegeFilter;
        const communityMatch = communityFilter === "" || 
            s.community === communityFilter;
        return (nameMatch || regNoMatch) && collegeMatch && communityMatch;
    }).sort((a, b) => {
        const collegeA = a.collegeId?.insName || "";
        const collegeB = b.collegeId?.insName || "";
        return collegeA.localeCompare(collegeB);
    });

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, collegeFilter, communityFilter]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading Students...</div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
            <header className="dashboard-header" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-color)', padding: '1rem 0' }}>
                <div className="container flex-between">
                    <div>
                        <h1 className="mb-0" style={{ fontSize: '1.5rem' }}>All Students</h1>
                        <span className="badge badge-primary">Admin Access</span>
                    </div>
                    <div className="d-flex gap-2">
                        <ThemeToggle />
                        <button className="btn btn-secondary" onClick={() => navigate("/admin-dashboard")}>← Dashboard</button>
                    </div>
                </div>
            </header>

            <main className="container main-container" style={{ marginTop: '20px' }}>
                <div className="card mb-6">
                    <div className="grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Search (Name or Reg No)</label>
                            <input 
                                className="form-input" 
                                placeholder="Enter student name or reg no..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Filter by College</label>
                            <input 
                                className="form-input" 
                                placeholder="College name or code..." 
                                value={collegeFilter}
                                onChange={(e) => setCollegeFilter(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Filter by Community</label>
                            <select 
                                className="form-input" 
                                value={communityFilter}
                                onChange={(e) => setCommunityFilter(e.target.value)}
                            >
                                <option value="">All Communities</option>
                                <option value="General">General</option>
                                <option value="OBC">OBC</option>
                                <option value="MBC">MBC</option>
                                <option value="BC">BC</option>
                                <option value="SC">SC</option>
                                <option value="ST">ST</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="styled-table w-100">
                            <thead>
                                <tr>
                                    <th>Reg No</th>
                                    <th>Name</th>
                                    <th>College (Code)</th>
                                    <th>Unit</th>
                                    <th>Dept</th>
                                    <th>Community</th>
                                    <th>Batch</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedStudents.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center">No students found matching criteria.</td></tr>
                                ) : (
                                    paginatedStudents.map((s) => (
                                        <tr key={s._id}>
                                            <td><span className="badge badge-secondary">{s.regNo}</span></td>
                                            <td className="fw-bold">{s.name}</td>
                                            <td>
                                                <div>{s.collegeId?.insName}</div>
                                                <div className="text-sm text-muted">{s.collegeId?.code}</div>
                                            </td>
                                            <td><span className="badge badge-primary">{s.unitId?.unitNumber || "N/A"}</span></td>
                                            <td>{s.dept}</td>
                                            <td><span className="badge badge-secondary">{s.community || "N/A"}</span></td>
                                            <td>{s.batchFrom} - {s.batchTo}</td>
                                            <td>
                                                <button 
                                                    className={`btn btn-sm ${s.isEnrolled ? 'btn-success' : 'btn-outline-primary'}`}
                                                    onClick={() => {
                                                        setSelectedStudent(s);
                                                        setShowEnrolmentModal(true);
                                                    }}
                                                >
                                                    {s.isEnrolled ? "✓ View Enrolment" : "📝 Not Enrolled"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {filteredStudents.length > itemsPerPage && (
                    <div className="pagination-container flex-between mt-4 mb-8">
                        <div className="text-sm text-muted">
                            Showing <span className="fw-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="fw-bold">{Math.min(currentPage * itemsPerPage, filteredStudents.length)}</span> of <span className="fw-bold">{filteredStudents.length}</span> students
                        </div>
                        <div className="flex-center gap-2">
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <div className="flex-center gap-1">
                                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            className={`btn btn-sm ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                                            style={{ minWidth: '36px' }}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {showEnrolmentModal && selectedStudent && (
                <VolunteerEnrolmentModal 
                    isOpen={showEnrolmentModal}
                    onClose={() => setShowEnrolmentModal(false)}
                    member={selectedStudent}
                    collegeData={selectedStudent.collegeId}
                    unitData={selectedStudent.unitId}
                />
            )}
        </div>
    );
};

export default AdminAllStudents;
