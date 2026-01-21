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
        const unitNumber = `${prefix}${String(serial).padStart(2, '0')}`;
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
    const handleDeleteUnit = async (unitNumber) => {
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
                    setUnits(res.data.user.units);
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
    return (
        <>
            <h1>College Dashboard: {insName} {insCode}</h1>
            <button
                onClick={() => {
                    localStorage.removeItem("nsstoken");
                    navigate("/");
                }}
            >
                Logout
            </button>
            <div className="flex-between" style={{ marginBottom: "1rem" }}>
                <h2>Welcome to the NSS Event Manager</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowUnitModal(true)}
                    disabled={units.length >= 6}
                    style={units.length >= 6 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    title={units.length >= 6 ? "Maximum limit of 6 units reached" : ""}
                >
                    Create Unit
                </button>
            </div>
            <h3>Units ({units.length}/6)</h3>
            <div className="units-list">
                {units.length === 0 ? (
                    <p>No units created yet.</p>
                ) : (

                    units.map((unit, idx) => (
                        <div key={unit.id || idx} className="unit-card" onClick={()=>{
                            
                            localStorage.setItem("nssunitCode", unit.unitNumber);
                            navigate('/unit-dashboard')}} >
                            <h4>{unit.name || unit.unitName} <span style={{ fontSize: '0.8em', color: '#666' }}>({unit.unitNumber})</span></h4>
                            <p><strong>Head:</strong> {unit.head || unit.unitHead}</p>
                            <p><strong>Created:</strong> {unit.createdDate}</p>

                            <details>
                                <summary>Members ({unit.members ? unit.members.length : 0})</summary>
                                <ul>
                                    {unit.members && unit.members.map((m, i) => (
                                        <li key={i}>{m.name} - {m.dept} ({m.year})</li>
                                    ))}
                                </ul>
                            </details>
                            <button
                                className="btn btn-danger"
                                style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                                onClick={() => handleDeleteUnit(unit.unitNumber)}
                            >
                                Delete Unit
                            </button>
                        </div>
                    ))
                )}
            </div>
            {showUnitModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Create New Unit</h2>
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
                            <label className="form-label">Unit Password</label>
                            <input className="form-input" placeholder="password" value={newUnitPassword} onChange={(e) => setNewUnitPassword(e.target.value)} />
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
                            <input className="form-input" placeholder="Contact Number" value={newUnitContact} onChange={(e) => setNewUnitContact(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">E - Mail </label>
                            <input className="form-input" placeholder="E - Mail" value={newUnitMail} onChange={(e) => setNewUnitMail(e.target.value)} />
                        </div>
                        <h3>Members</h3>
                        {newMembers.map((member, index) => (
                            <div key={index} className="unit-card inside-create-unit" style={{ padding: '1rem', marginBottom: '0.5rem' }}>
                                <div className="flex-between">
                                    <h4>Member {index + 1}</h4>
                                    <button className="btn btn-danger" onClick={() => handleRemoveMember(index)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>Remove</button>
                                </div>
                                <div className="grid-cols-2">
                                    <div className="form-group">
                                        <input className="form-input" placeholder="Name" value={member.name} onChange={(e) => handleMemberChange(index, "name", e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <input className="form-input" placeholder="Reg No" value={member.regNo} onChange={(e) => handleMemberChange(index, "regNo", e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <input className="form-input" placeholder="Dept" value={member.dept} onChange={(e) => handleMemberChange(index, "dept", e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <input className="form-input" placeholder="Year" value={member.year} onChange={(e) => handleMemberChange(index, "year", e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <input className="form-input" placeholder="Contact" value={member.contact} onChange={(e) => handleMemberChange(index, "contact", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button className="btn" onClick={handleAddMember} style={{ width: '100%', marginBottom: '1rem', border: '1px dashed #ccc', marginTop: '1rem' }}>
                            + Add Member
                        </button>
                        <div className="flex-between" style={{ marginTop: '1rem' }}>
                            <button className="btn" onClick={() => setShowUnitModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateUnit}>Create Unit</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CollegeDashboard;
