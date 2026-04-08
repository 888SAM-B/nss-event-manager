import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import ThemeToggle from "./ThemeToggle";
import ProgramOfficerModal from "./ProgramOfficerModal";

const AdminAllOfficers = () => {
    const navigate = useNavigate();
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [collegeFilter, setCollegeFilter] = useState("");
    const [selectedOfficer, setSelectedOfficer] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(true);

    useEffect(() => {
        const fetchAllOfficers = async () => {
            const token = localStorage.getItem("adminToken");
            if (!token) {
                navigate("/admin/login");
                return;
            }

            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/all-program-officers`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setOfficers(res.data.officers);
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

        fetchAllOfficers();
    }, [navigate]);

    const filteredOfficers = officers.filter(o => {
        const nameMatch = o.name.toLowerCase().includes(searchTerm.toLowerCase());
        const collegeMatch = collegeFilter === "" || 
            o.collegeId?.insName.toLowerCase().includes(collegeFilter.toLowerCase()) ||
            o.collegeId?.code === collegeFilter;
        return nameMatch && collegeMatch;
    });

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading Program Officers...</div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
            <header className="dashboard-header" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-color)', padding: '1rem 0' }}>
                <div className="container flex-between">
                    <div>
                        <h1 className="mb-0" style={{ fontSize: '1.5rem' }}>All Program Officers</h1>
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
                            <label className="form-label">Search by Name</label>
                            <input 
                                className="form-input" 
                                placeholder="Enter officer name..." 
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
                    </div>
                </div>

                <div className="card">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="styled-table w-100">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Officer Name</th>
                                    <th>College (Code)</th>
                                    <th>Unit</th>
                                    <th>Department</th>
                                    <th>Contact</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOfficers.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center">No officers found matching criteria.</td></tr>
                                ) : (
                                    filteredOfficers.map((officer) => (
                                        <tr key={officer._id}>
                                            <td><span className="badge badge-secondary">{officer.officerID || "N/A"}</span></td>
                                            <td className="fw-bold">{officer.name}</td>
                                            <td>
                                                <div>{officer.collegeId?.insName}</div>
                                                <div className="text-sm text-muted">{officer.collegeId?.code}</div>
                                            </td>
                                            <td><span className="badge badge-primary">{officer.unit || "Unassigned"}</span></td>
                                            <td>{officer.department}</td>
                                            <td>{officer.mobile}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => {
                                                            setSelectedOfficer(officer);
                                                            setIsReadOnly(true);
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            setSelectedOfficer(officer);
                                                            setIsReadOnly(false);
                                                            setShowModal(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {showModal && selectedOfficer && (
                <ProgramOfficerModal 
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    insName={selectedOfficer.collegeId?.insName}
                    insCode={selectedOfficer.collegeId?.code}
                    units={[]} // Not adding units for read-only view
                    initialData={selectedOfficer}
                    readOnly={isReadOnly}
                    onSuccess={() => {
                        // Refresh data
                        const token = localStorage.getItem("adminToken");
                        axios.get(`${import.meta.env.VITE_API_URL}/admin/all-program-officers`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }).then(res => {
                            if (res.data.success) setOfficers(res.data.officers);
                        });
                    }}
                />
            )}
        </div>
    );
};

export default AdminAllOfficers;
