import { useUser } from "../context/UserContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useState } from "react";
import * as XLSX from "xlsx";
import toast from 'react-hot-toast';
import ThemeToggle from "./ThemeToggle";

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
    const [showMembersList, setShowMembersList] = useState(false);
    const [allMembers, setAllMembers] = useState([]);
    const [memberSearch, setMemberSearch] = useState("");
    const [filterUnit, setFilterUnit] = useState("");
    const [filterBatch, setFilterBatch] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Check if admin is viewing this dashboard
    const isAdminViewing = localStorage.getItem("adminToken") !== null;

    const handleAddMember = () => {
        setNewMembers([...newMembers, {
            name: "",
            regNo: "",
            dept: "",
            course: "",
            community: "",
            bloodGroup: "",
            dob: "",
            batchFrom: "",
            batchTo: "",
            contact: ""
        }]);
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
            toast.error("Maximum limit of 6 units reached.");
            return;
        }
        if (!newUnitName || !newUnitHead) {
            toast.error("Please fill in Unit Name and Unit Head.");
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
        setIsCreating(true);
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
                toast.success("Unit created successfully!");
            } else {
                toast.error("Failed to create unit: " + (res.data.message || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while creating the unit.");
        } finally {
            setIsCreating(false);
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
                toast.success("Unit deleted successfully");
            } else {
                toast.error("Failed to delete: " + res.data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error deleting unit");
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

    const fetchAllMembers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/college-members/${insCode}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("nsstoken")}` }
            });
            if (res.data.success) {
                setAllMembers(res.data.members);
                setShowMembersList(true);
            }
        } catch (error) {
            console.error("Error fetching members:", error);
            toast.error("Failed to fetch members list");
        }
    };

    const handleExportExcel = (data, fileName) => {
        const worksheet = XLSX.utils.json_to_sheet(data.map((m, index) => ({
            "S.No": index + 1,
            "Name": m.name,
            "Reg No": m.regNo,
            "Unit": m.unitId?.unitNumber || "N/A",
            "Dept": m.dept,
            "Course": m.course,
            "Community": m.community,
            "Blood Group": m.bloodGroup,
            "DOB": m.dob,
            "Batch": `${m.batchFrom} - ${m.batchTo}`,
            "Contact": m.contact
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const filteredAllMembers = allMembers.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
            m.regNo.toLowerCase().includes(memberSearch.toLowerCase());
        const matchesUnit = filterUnit === "" || m.unitId?.unitNumber === filterUnit;
        const matchesBatch = filterBatch === "" || m.batchFrom === filterBatch || m.batchTo === filterBatch;
        return matchesSearch && matchesUnit && matchesBatch;
    });

    if (loading) return (
        <div className="flex-center" style={{ height: '100vh' }}>
            <div className="loading"></div>
            <h2 className="ms-2">Loading College Dashboard...</h2>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
            <header className="dashboard-header" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-color)', padding: '1rem 0' }}>
                <div className="container flex-between">
                    <div>
                        <h1 className="mb-0" style={{ fontSize: '1.5rem' }}>{insName || 'College Dashboard'}</h1>
                        <span className="badge badge-primary">{insCode}</span>
                    </div>
                    <div className="d-flex gap-3 align-items-center width-set">
                        <ThemeToggle />
                        <button
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

            <main className="container main-container" style={{ marginTop: '0px' }}  >
                <div className="flex-between mb-6">
                    <div>
                        <h2>NSS Units Management</h2>
                        <p>Manage your college NSS units and members</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-secondary"
                            onClick={fetchAllMembers}
                        >
                            📊 View All Members
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowUnitModal(true)}
                            disabled={units.length >= 6}
                            title={units.length >= 6 ? "Maximum limit of 6 units reached" : ""}
                        >
                            + Create New Unit
                        </button>
                    </div>
                </div>

                {showMembersList ? (
                    <div className="card mb-6">
                        <div className="flex-between mb-4">
                            <h3>College Students List</h3>
                            <div className="d-flex gap-2">
                                <button className="btn btn-success btn-sm" onClick={() => handleExportExcel(filteredAllMembers, `${insCode}_members`)}>Export to Excel</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowMembersList(false)}>Close List</button>
                            </div>
                        </div>

                        <div className="grid-cols-4 gap-3 mb-4">
                            <div className="form-group">
                                <label className="text-xs">Search (Name/RegNo)</label>
                                <input
                                    className="form-input"
                                    placeholder="Search..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="text-xs">Filter by Unit</label>
                                <select className="form-input" value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}>
                                    <option value="">All Units</option>
                                    {units.map(u => (
                                        <option key={u.unitNumber} value={u.unitNumber}>{u.unitNumber}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="text-xs">Filter by Batch (Year)</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. 2022"
                                    value={filterBatch}
                                    onChange={(e) => setFilterBatch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="styled-table" style={{ margin: 0, boxShadow: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Name</th>
                                        <th>Reg No</th>
                                        <th>Unit</th>
                                        <th>Dept</th>
                                        <th>Batch</th>
                                        <th>Contact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAllMembers.map((m, index) => (
                                        <tr key={m._id}>
                                            <td>{index + 1}</td>
                                            <td>{m.name}</td>
                                            <td><span className="badge badge-secondary">{m.regNo}</span></td>
                                            <td>{m.unitId?.unitNumber || "N/A"}</td>
                                            <td>{m.dept}</td>
                                            <td>{m.batchFrom} - {m.batchTo}</td>
                                            <td>{m.contact}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredAllMembers.length === 0 && (
                                <p className="text-center p-4">No members found.</p>
                            )}
                        </div>
                    </div>
                ) : null}

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
                                <div key={index} className="card p-4 mb-3" style={{ background: 'var(--bg-tertiary)' }}>
                                    <div className="flex-between mb-2">
                                        <h4 className="text-sm mb-0">Member {index + 1}</h4>
                                        <button className="text-danger" style={{ background: 'none', border: 'none' }} onClick={() => handleRemoveMember(index)}>Remove</button>
                                    </div>
                                    <div className="grid-cols-2">
                                        <input className="form-input mb-2" placeholder="Full Name" value={member.name} onChange={(e) => handleMemberChange(index, "name", e.target.value)} />
                                        <input className="form-input mb-2" placeholder="Reg No" value={member.regNo} onChange={(e) => handleMemberChange(index, "regNo", e.target.value)} />
                                        <input className="form-input mb-2" placeholder="Dept (e.g. CSE)" value={member.dept} onChange={(e) => handleMemberChange(index, "dept", e.target.value)} />
                                        <input className="form-input mb-2" placeholder="Course" value={member.course} onChange={(e) => handleMemberChange(index, "course", e.target.value)} />
                                        <input className="form-input mb-2" placeholder="Community" value={member.community} onChange={(e) => handleMemberChange(index, "community", e.target.value)} />
                                        <select
                                            className="form-input mb-2"
                                            value={member.bloodGroup}
                                            onChange={(e) => handleMemberChange(index, "bloodGroup", e.target.value)}
                                        >
                                            <option value="">Blood Group</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                        <input
                                            className="form-input mb-2"
                                            type="date"
                                            placeholder="DOB"
                                            value={member.dob}
                                            onChange={(e) => handleMemberChange(index, "dob", e.target.value)}
                                        />
                                        <input
                                            className="form-input mb-2"
                                            type="number"
                                            placeholder="Batch From"
                                            value={member.batchFrom}
                                            onChange={(e) => handleMemberChange(index, "batchFrom", e.target.value)}
                                        />
                                        <input
                                            className="form-input mb-2"
                                            type="number"
                                            placeholder="Batch To"
                                            value={member.batchTo}
                                            onChange={(e) => handleMemberChange(index, "batchTo", e.target.value)}
                                        />
                                        <input className="form-input mb-2" placeholder="Contact" value={member.contact} onChange={(e) => handleMemberChange(index, "contact", e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex-between pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowUnitModal(false)} disabled={isCreating}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleCreateUnit} disabled={isCreating}>{isCreating ? 'Creating...' : 'Create Unit'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollegeDashboard;