import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AdminAllNodalOfficers = () => {
    const navigate = useNavigate();
    const [nodals, setNodals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [districtFilter, setDistrictFilter] = useState("");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedNodal, setSelectedNodal] = useState(null); // null means "Create" mode
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        district: "",
        password: ""
    });
    const [submitting, setSubmitting] = useState(false);

    const loadNodalOfficers = async () => {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            navigate("/admin-login");
            return;
        }
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/nodal-officers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setNodals(res.data.nodals);
            }
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401) {
                localStorage.removeItem("adminToken");
                navigate("/admin-login");
            } else {
                toast.error("Failed to load nodal officers");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNodalOfficers();
    }, [navigate]);

    const handleOpenCreateModal = () => {
        setSelectedNodal(null);
        setFormData({
            name: "",
            email: "",
            mobile: "",
            district: "",
            password: ""
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (nodal) => {
        setSelectedNodal(nodal);
        setFormData({
            name: nodal.name,
            email: nodal.email,
            mobile: nodal.mobile,
            district: nodal.district,
            password: "" // Optional for edit
        });
        setShowModal(true);
    };

    const handleDeleteNodal = async (nodal) => {
        if (!window.confirm(`Are you sure you want to delete Nodal Officer: ${nodal.name}?`)) {
            return;
        }
        const token = localStorage.getItem("adminToken");
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/admin/nodal-officer/${nodal._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success(res.data.message || "Nodal officer deleted successfully!");
                loadNodalOfficers();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to delete nodal officer");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Simple client-side validations
        if (!formData.name || !formData.email || !formData.mobile || !formData.district) {
            toast.error("Please fill in all required fields.");
            return;
        }
        if (!selectedNodal && !formData.password) {
            toast.error("Password is required for new Nodal Officers.");
            return;
        }

        setSubmitting(true);
        const token = localStorage.getItem("adminToken");

        try {
            if (selectedNodal) {
                // Edit mode
                const payload = {
                    name: formData.name,
                    email: formData.email,
                    mobile: formData.mobile,
                    district: formData.district
                };
                if (formData.password) {
                    payload.password = formData.password;
                }
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/admin/nodal-officer/${selectedNodal._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    toast.success(res.data.message || "Nodal officer updated successfully");
                    setShowModal(false);
                    loadNodalOfficers();
                }
            } else {
                // Create mode
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/nodal-officer`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    toast.success(res.data.message || "Nodal officer created successfully");
                    setShowModal(false);
                    loadNodalOfficers();
                }
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save Nodal Officer details");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredNodals = nodals.filter(n => {
        const nameMatch = n.name.toLowerCase().includes(searchTerm.toLowerCase()) || n.email.toLowerCase().includes(searchTerm.toLowerCase());
        const districtMatch = districtFilter === "" || n.district.toLowerCase().includes(districtFilter.toLowerCase());
        return nameMatch && districtMatch;
    });

    if (loading) return (
        <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--txt-3)', fontSize: '0.875rem' }}>
            <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTop: '2px solid var(--brand-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading Nodal Officers...
        </div>
    );

    return (
        <div>
            {/* Header / Actions Bar */}
            <div className="flex-between mb-4" style={{ flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--txt-1)" }}>District Nodal Officers</h2>
                    <p style={{ margin: 0, color: "var(--txt-3)", fontSize: "0.8125rem" }}>Create and manage district-scoped administrative users</p>
                </div>
                <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                    + Add Nodal Officer
                </button>
            </div>

            {/* Filter Bar */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Search Name / Email</label>
                    <div style={{ position: 'relative' }}>
                        <svg style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--txt-3)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input className="form-input" style={{ paddingLeft: '2rem', fontSize: '0.8125rem', padding: '0.45rem 0.75rem 0.45rem 2rem' }} placeholder="Officer name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>District</label>
                    <input className="form-input" style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem' }} placeholder="District name..." value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--txt-3)', whiteSpace: 'nowrap', paddingBottom: '0.1rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--txt-1)' }}>{filteredNodals.length}</span> of {nodals.length}
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                                {['Name', 'Email', 'Mobile', 'Assigned District', 'Created At', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '0.625rem 0.875rem', textAlign: 'left', fontSize: '0.675rem', fontWeight: 700, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredNodals.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--txt-3)', fontSize: '0.875rem' }}>
                                        No District Nodal Officers found.
                                    </td>
                                </tr>
                            ) : filteredNodals.map((nodal, i) => (
                                <tr key={nodal._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg)'}
                                >
                                    <td style={{ padding: '0.625rem 0.875rem', fontWeight: 600, color: 'var(--txt-1)', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--badge-primary-bg)', border: '1px solid var(--badge-primary-clr)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--badge-primary-clr)' }}>{nodal.name?.charAt(0)}</span>
                                            </div>
                                            {nodal.name}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem', color: 'var(--txt-2)' }}>{nodal.email}</td>
                                    <td style={{ padding: '0.625rem 0.875rem', color: 'var(--txt-3)', fontFamily: 'var(--font-mono)' }}>{nodal.mobile}</td>
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 600, background: 'var(--badge-success-bg)', color: 'var(--badge-success-clr)', border: '1px solid var(--success-400)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>
                                            {nodal.district}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem', color: 'var(--txt-3)' }}>
                                        {new Date(nodal.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '0.625rem 0.875rem' }}>
                                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                                            <button
                                                style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.625rem', borderRadius: '4px', border: '1px solid var(--brand-300)', background: 'var(--brand-50)', color: 'var(--brand-700)', cursor: 'pointer' }}
                                                onClick={() => handleOpenEditModal(nodal)}
                                            >Edit</button>
                                            <button
                                                style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.625rem', borderRadius: '4px', border: '1px solid var(--danger-100)', background: 'var(--danger-50)', color: 'var(--danger-700)', cursor: 'pointer' }}
                                                onClick={() => handleDeleteNodal(nodal)}
                                            >Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Add / Edit */}
            {showModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(15, 23, 42, 0.4)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    animation: "fadeIn 0.2s ease"
                }}>
                    <div style={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "0.75rem",
                        width: "100%",
                        maxWidth: "460px",
                        padding: "1.5rem",
                        boxShadow: "var(--sh-lg)",
                        animation: "scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}>
                        <div className="flex-between mb-4 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--txt-1)" }}>
                                {selectedNodal ? "Edit Nodal Officer" : "Add Nodal Officer"}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: "none", border: "none", color: "var(--txt-3)", cursor: "pointer", fontSize: "1.25rem", padding: 0 }}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group mb-3">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="Enter email address"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label">Mobile Number</label>
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="10-digit mobile number"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                    pattern="[0-9]{10}"
                                    required
                                />
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label">Assigned District</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Salem"
                                    value={formData.district}
                                    onChange={e => setFormData({ ...formData, district: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">
                                    Password {selectedNodal && <span style={{ fontWeight: 400, color: "var(--txt-3)", fontSize: "0.75rem" }}>(Leave blank to keep current)</span>}
                                </label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!selectedNodal}
                                />
                            </div>

                            <div className="flex-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? "Saving..." : "Save Details"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAllNodalOfficers;
