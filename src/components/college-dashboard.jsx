import { useUser } from "../context/UserContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useState } from "react";

const CollegeDashboard = () => {
    const username = localStorage.getItem("nss_username");
    const navigate = useNavigate();
    const [insName, setinsName] = useState("");
    const [insCode, setinsCode] = useState("");
    const [units, setUnits] = useState([]);
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [newUnitName, setNewUnitName] = useState("");
    const [newUnitHead, setNewUnitHead] = useState("");
    const [newMembers, setNewMembers] = useState([]);
    const [newUnitPassword, setNewUnitPassword] = useState("");
    const [newUnitContact, setNewUnitContact] = useState("");
    const [newUnitMail, setNewUnitMail] = useState("");

    const [loading, setLoading] = useState(true);

    // Check if admin is viewing this dashboard
    const isAdminViewing = localStorage.getItem("adminToken") !== null;

    const handleAddMember = () => {
        setNewMembers([...newMembers, { name: "", dept: "", year: "", contact: "" }]);
    };

    const handleMemberChange = (index, field, value) => {
        const updatedMembers = [...newMembers];
        updatedMembers[index][field] = value;
        setNewMembers(updatedMembers);
    };

    const handleRemoveMember = (index) => {
        const updatedMembers = newMembers.filter((_, i) => i !== index);
        setNewMembers(updatedMembers);
    };

    const handleCreateUnit = async () => {

        if (units.length >= 6) {
            alert("Maximum limit of 6 units reached.");
            return;
        }
        if (!newUnitName || !newUnitHead) {
            alert("Please fill in Unit Name and Unit Head.");
            return;
        }

        const prefix = (insName || "INS").replace(/\s+/g, '').substring(0, 3).toUpperCase();
        const serial = units.length + 1;
        const unitNumber = `${prefix}${insCode}${String(serial).padStart(2, '0')}`;
        console.log(unitNumber);
        const createdDate = new Date().toISOString().split('T')[0];

        const payload = {
            username,
            name: newUnitName,
            password: newUnitPassword,
            head: newUnitHead,
            contact: newUnitContact,
            mail: newUnitMail,
            members: newMembers,
            unitNumber,
            createdDate
        };
        console.log(payload);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/addUnit`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("nsstoken")}`,
                    },
                }
            );

            if (res.data.success) {
                // Update local state assuming success or use response data if available
                const createdUnit = res.data.unit || { ...payload, id: Date.now() };
                setUnits([...units, createdUnit]);
                setShowUnitModal(false);
                setNewUnitName("");
                setNewUnitHead("");
                setNewUnitContact("");
                setNewUnitPassword("");
                setNewMembers([]);
                alert("Unit created successfully!");
            } else {
                alert("Failed to create unit: " + (res.data.message || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while creating the unit.");
        }
    };
    const handleDeleteUnit = async (unitNumber, e) => {
        e.stopPropagation(); // Prevent card click when deleting
        if (!confirm("Are you sure you want to delete this unit? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/deleteUnit`, {
                data: { username, unitNumber },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("nsstoken")}`,
                }
            });

            if (res.data.success) {
                const updatedUnits = units.filter(u => u.unitNumber !== unitNumber);
                setUnits(updatedUnits);
                alert("Unit deleted successfully");
            } else {
                alert("Failed to delete: " + res.data.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting unit");
        }
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/college-dashboard`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("nsstoken")}`,
                        },
                        params: { username } // ✅ GET request data
                    }
                );

                if (res.data.success) {
                    console.log(res.data.user);
                    setinsName(res.data.user.insName);
                    setinsCode(res.data.user.code);
                    setUnits(res.data.user.units || []); // Ensure units is array
                    setLoading(false);
                } else {
                    navigate("/");
                }
            } catch (error) {
                console.error(error);
                navigate("/");
            }
        };
        fetchDashboard();
    }, [username, navigate]);

    if (loading) return (
        <div className="flex-center" style={{ height: '100vh' }}>
            <div className="loading"></div>
            <h2 className="ms-2">Loading College Dashboard...</h2>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
            <header className="dashboard-header">
                <div className="container flex-between">
                    <div>
                        <h1 className="mb-0" style={{ fontSize: '1.5rem' }}>{insName || 'College Dashboard'}</h1>
                        <span className="badge badge-primary">{insCode}</span>
                    </div>
                    <div className="d-flex gap-3 align-items-center">
                        <button
                            style={{ marginRight: '1.5rem' }}
                            className="btn btn-primary"
                            onClick={() => navigate('/explore-events', { state: { collegeCode: insCode, unitCode: 'COLLEGE', fromRole: 'college' } })}
                        >
                            Explore Events
                        </button>
                        {isAdminViewing ? (
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    navigate("/admin-dashboard");
                                }}
                            >
                                ← Back to Admin Dashboard
                            </button>
                        ) : (
                            <button
                                className="btn btn-danger"
                                onClick={() => {
                                    localStorage.removeItem("nsstoken");
                                    navigate("/");
                                }}
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container main-container">
                <div className="flex-between mb-6">
                    <div>
                        <h2>NSS Units Management</h2>
                        <p>Manage your college NSS units and members</p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowUnitModal(true)}
                        disabled={units.length >= 6}
                        title={units.length >= 6 ? "Maximum limit of 6 units reached" : ""}
                    >
                        + Create New Unit
                    </button>
                </div>

                <div className="units-list grid-cols-3">
                    {units.length === 0 ? (
                        <div className="col-span-3 text-center p-6 card">
                            <p>No units created yet. Click the button above to create your first unit.</p>
                        </div>
                    ) : (
                        units.map((unit, idx) => (
                            <div
                                key={unit.id || idx}
                                className="unit-card"
                                onClick={() => {
                                    localStorage.setItem("nssunitCode", unit.unitNumber);
                                    localStorage.setItem("unitToken", localStorage.getItem("nsstoken"));
                                    localStorage.setItem("nsscollegeCode", insCode);
                                    navigate('/unit-dashboard')
                                }}
                                style={{ width: '100%', margin: 0 }}
                            >
                                <div className="flex-between mb-3">
                                    <h4 className="mb-0">{unit.name || unit.unitName}</h4>
                                    <span className="badge badge-success">{unit.unitNumber}</span>
                                </div>
                                <div className="mb-4">
                                    <p className="mb-1 text-sm"><strong className="text-white">Head:</strong> {unit.head || unit.unitHead}</p>
                                    <p className="mb-1 text-sm"><strong className="text-white">Created:</strong> {unit.createdDate}</p>
                                    <p className="mb-1 text-sm"><strong className="text-white">Members:</strong> {unit.members ? unit.members.length : 0}</p>
                                </div>

                                <button
                                    className="btn btn-danger btn-sm w-100"
                                    onClick={(e) => handleDeleteUnit(unit.unitNumber, e)}
                                    style={{ width: '100%' }}
                                >
                                    Delete Unit
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {showUnitModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="flex-between mb-4">
                            <h2 className="mb-0">Create New Unit</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowUnitModal(false)}>&times;</button>
                        </div>

                        <div className="grid-cols-2 mb-4">
                            <div className="form-group">
                                <label className="form-label">Unit Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newUnitName}
                                    onChange={(e) => setNewUnitName(e.target.value)}
                                    placeholder="e.g. NSS Unit A"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Unit Head</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newUnitHead}
                                    onChange={(e) => setNewUnitHead(e.target.value)}
                                    placeholder="Name of Unit Head"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Number</label>
                                <input className="form-input" placeholder="Contact" value={newUnitContact} onChange={(e) => setNewUnitContact(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" placeholder="Email" value={newUnitMail} onChange={(e) => setNewUnitMail(e.target.value)} />
                            </div>
                            <div className="form-group col-span-2" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Unit Password</label>
                                <input className="form-input" type="password" placeholder="Set a password for unit login" value={newUnitPassword} onChange={(e) => setNewUnitPassword(e.target.value)} />
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex-between mb-3">
                                <h3 className="mb-0 text-lg">Initial Members (Optional)</h3>
                                <button className="btn btn-sm btn-secondary" onClick={handleAddMember}>+ Add Member</button>
                            </div>

                            {newMembers.map((member, index) => (
                                <div key={index} className="card p-4 mb-3" style={{ background: 'var(--dark-bg-tertiary)' }}>
                                    <div className="flex-between mb-2">
                                        <h4 className="text-sm mb-0">Member {index + 1}</h4>
                                        <button className="text-danger" style={{ background: 'none', border: 'none' }} onClick={() => handleRemoveMember(index)}>Remove</button>
                                    </div>
                                    <div className="grid-cols-2">
                                        <input className="form-input mb-2" placeholder="Name" value={member.name} onChange={(e) => handleMemberChange(index, "name", e.target.value)} />
                                        <input className="form-input mb-2" placeholder="Reg No" value={member.regNo} onChange={(e) => handleMemberChange(index, "regNo", e.target.value)} />
                                        <input className="form-input mb-2" placeholder="Dept" value={member.dept} onChange={(e) => handleMemberChange(index, "dept", e.target.value)} />
                                        <input className="form-input mb-2" placeholder="Year" value={member.year} onChange={(e) => handleMemberChange(index, "year", e.target.value)} />
                                        <input className="form-input mb-2" placeholder="Contact" value={member.contact} onChange={(e) => handleMemberChange(index, "contact", e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex-between pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowUnitModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateUnit}>Create Unit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollegeDashboard;