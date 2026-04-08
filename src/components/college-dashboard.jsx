import { useUser } from "../context/UserContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useState } from "react";
import * as XLSX from "xlsx";
import toast from 'react-hot-toast';
import ThemeToggle from "./ThemeToggle";
import ProgramOfficerModal from "./ProgramOfficerModal";
import VolunteerEnrolmentModal from "./VolunteerEnrolmentModal";

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
    const [showOfficerModal, setShowOfficerModal] = useState(false);
    const [programOfficers, setProgramOfficers] = useState([]);
    const [showOfficersList, setShowOfficersList] = useState(false);
    const [selectedOfficer, setSelectedOfficer] = useState(null);
    const [isOfficerReadOnly, setIsOfficerReadOnly] = useState(false);
    const [collegeData, setCollegeData] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showEnrolmentModal, setShowEnrolmentModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedOfficerForAssign, setSelectedOfficerForAssign] = useState(null);
    const [assignTargetUnit, setAssignTargetUnit] = useState("");
    const [isAssigning, setIsAssigning] = useState(false);
    const [memberCommunityFilter, setMemberCommunityFilter] = useState("");

    // Adopting Villages State
    const [showVillageModal, setShowVillageModal] = useState(false);
    const [newVillage, setNewVillage] = useState({ name: "", address: "", block: "", taluk: "", district: "", pincode: "" });
    const [isAddingVillage, setIsAddingVillage] = useState(false);

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
        const assignedName = `Unit ${units.length + 1}`;

        const prefix = (insName || "INS").replace(/\s+/g, '').substring(0, 3).toUpperCase();
        const serial = units.length + 1;
        const unitNumber = `PUNSS${prefix}${insCode}${String(serial).padStart(2, '0')}`;
        console.log(unitNumber);
        const createdDate = new Date().toISOString().split('T')[0];

        const payload = {
            username,
            name: assignedName,
            password: newUnitPassword,
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

    const fetchDashboard = async () => {
        try {
            setLoading(true);
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
                setCollegeData(res.data.user);
                setinsName(res.data.user.insName);
                setinsCode(res.data.user.code);
                setUnits(res.data.user.units || []); // Ensure units is array
                setLoading(false);
                // Fetch officers using the code from response
                fetchProgramOfficers(res.data.user.code);
            } else {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("nsstoken");
                localStorage.removeItem("nss_username");
                localStorage.removeItem("unitToken");
                localStorage.removeItem("nssunitCode");
                localStorage.removeItem("nsscollegeCode");

                toast.error("Failed to fetch dashboard details. Please login again.");
                navigate("/login");
            }
        } catch (error) {
            console.error(error);
            localStorage.removeItem("adminToken");
            localStorage.removeItem("nsstoken");
            localStorage.removeItem("nss_username");
            localStorage.removeItem("unitToken");
            localStorage.removeItem("nssunitCode");
            localStorage.removeItem("nsscollegeCode");

            toast.error("Error fetching details. Please login again.");
            navigate("/login");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [navigate, username]);

    // Auto-set unit name when modal opens
    useEffect(() => {
        if (showUnitModal) {
            setNewUnitName(`Unit ${units.length + 1}`);
        }
    }, [showUnitModal, units.length]);

    const fetchProgramOfficers = async (code) => {
        const targetCode = code || insCode;
        if (!targetCode) return;
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/program-officers/${targetCode}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("nsstoken")}` }
            });
            if (res.data.success) {
                setProgramOfficers(res.data.officers);
            }
        } catch (error) {
            console.error("Error fetching officers:", error);
        }
    };

    const handleAssignOfficer = async () => {
        if (!selectedOfficerForAssign || !assignTargetUnit) return;
        setIsAssigning(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/assign-officer-to-unit`, {
                officerId: selectedOfficerForAssign._id,
                unitNumber: assignTargetUnit,
                collegeCode: insCode
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("nsstoken")}` }
            });

            if (res.data.success) {
                toast.success(assignTargetUnit ? "Officer assigned successfully" : "Officer unassigned successfully");
                setShowAssignModal(false);
                fetchProgramOfficers();
                fetchDashboard(); // Refresh UI
            }
        } catch (error) {
            console.error("Error assigning officer:", error);
            toast.error("Failed to assign officer");
        } finally {
            setIsAssigning(false);
        }
    };

    const handleDeleteOfficer = async (officerId) => {
        if (!confirm("Are you sure you want to remove this Program Officer?")) return;
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/program-officer/${officerId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("nsstoken")}` }
            });
            if (res.data.success) {
                toast.success("Officer removed successfully");
                fetchProgramOfficers();
                fetchDashboard(); // Refresh units as well to clear heads
            }
        } catch (error) {
            console.error("Error deleting officer:", error);
            toast.error("Failed to delete officer");
        }
    };

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
        const matchesCommunity = memberCommunityFilter === "" || m.community === memberCommunityFilter;
        return matchesSearch && matchesUnit && matchesBatch && matchesCommunity;
    }).sort((a, b) => {
        const unitA = a.unitId?.unitNumber || "ZZZ";
        const unitB = b.unitId?.unitNumber || "ZZZ";
        return unitA.localeCompare(unitB);
    });

    const handleAddVillage = async () => {
        if (!newVillage.name || !newVillage.address || !newVillage.block || !newVillage.taluk || !newVillage.district || !newVillage.pincode) {
            toast.error("Please fill all village details");
            return;
        }
        setIsAddingVillage(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/add-village`, {
                username,
                village: newVillage
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("nsstoken")}` }
            });

            if (res.data.success) {
                toast.success("Village added successfully!");
                setCollegeData({ ...collegeData, adoptingVillages: res.data.user.adoptingVillages });
                setShowVillageModal(false);
                setNewVillage({ name: "", address: "", block: "", taluk: "", district: "", pincode: "" });
            }
        } catch (error) {
            console.error("Error adding village:", error);
            toast.error("Failed to add village");
        } finally {
            setIsAddingVillage(false);
        }
    };

    const handleDeleteVillage = async (index) => {
        if (!confirm("Are you sure you want to remove this village?")) return;
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/delete-village`, {
                data: { username, villageIndex: index },
                headers: { Authorization: `Bearer ${localStorage.getItem("nsstoken")}` }
            });

            if (res.data.success) {
                toast.success("Village removed successfully");
                setCollegeData({ ...collegeData, adoptingVillages: res.data.user.adoptingVillages });
            }
        } catch (error) {
            console.error("Error deleting village:", error);
            toast.error("Failed to remove village");
        }
    };

    if (loading) return (
        <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
                width: 56, height: 56,
                border: '3px solid rgba(99,102,241,0.2)',
                borderTop: '3px solid #6366f1',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ color: 'var(--txt-3)', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Loading dashboard...</span>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <header className="dashboard-header">
                <div className="container flex-between">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{
                            width: 38, height: 38,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(20,184,166,0.15))',
                            border: '1px solid rgba(99,102,241,0.25)',
                            borderRadius: '11px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem', flexShrink: 0,
                            boxShadow: '0 0 20px rgba(99,102,241,0.15)',
                        }}>🏛️</div>
                        <div>
                            <div style={{
                                fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em',
                                background: 'linear-gradient(135deg, #818cf8, #2dd4bf)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                            }}>{insName || 'College Dashboard'}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '1px' }}>
                                <span className="badge badge-primary" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>{insCode}</span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--txt-3)' }}>NSS Organization</span>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex align-items-center" style={{ gap: '0.625rem' }}>
                        <ThemeToggle />
                        <button className="btn btn-secondary btn-sm"
                            onClick={() => navigate('/explore-events', { state: { collegeCode: insCode, unitCode: 'COLLEGE', fromRole: 'college' } })}>
                            Explore Events
                        </button>
                        {isAdminViewing ? (
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin-dashboard')}>
                                ← Admin
                            </button>
                        ) : (
                            <button className="btn btn-danger btn-sm" onClick={() => { localStorage.removeItem('nsstoken'); navigate('/'); }}>
                                Sign Out
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="container main-container">
                {/* Adopting Villages Section */}
                <div className="card mb-6">
                    <div className="flex-between mb-4">
                        <h3 className="mb-0">Adopting Villages</h3>
                        <div className="d-flex gap-2">
                            {collegeData?.adoptingVillages && collegeData.adoptingVillages.length > 0 && (
                                <span className="badge badge-primary">{collegeData.adoptingVillages.length} Village(s)</span>
                            )}
                            <button
                                className="btn btn-sm btn-primary"
                                onClick={() => setShowVillageModal(true)}
                            >
                                + Add Village
                            </button>
                        </div>
                    </div>
                    {collegeData?.adoptingVillages && collegeData.adoptingVillages.length > 0 ? (
                        <div className="grid-cols-3 gap-4">
                            {collegeData.adoptingVillages.map((village, idx) => (
                                <div key={idx} className="p-4 rounded village-card" style={{
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '4px',
                                        height: '100%',
                                        background: 'var(--primary-color)'
                                    }}></div>
                                    <div className="flex-between mb-3">
                                        <h4 className="mb-0 text-primary-400" style={{ fontSize: '1.1rem' }}>{village.name}</h4>
                                        <button
                                            className="text-danger"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                            onClick={() => handleDeleteVillage(idx)}
                                            title="Remove Village"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                    <div className="d-flex flex-column gap-2">
                                        <div className="d-flex align-items-start gap-2">
                                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>📍</span>
                                            <p className="mb-0 text-sm" style={{ opacity: 0.9 }}>{village.address}</p>
                                        </div>
                                        <div className="d-flex flex-wrap gap-x-4 gap-y-1">
                                            <p className="mb-0 text-xs" style={{ opacity: 0.7 }}><strong className="text-white">Block:</strong> {village.block}</p>
                                            <p className="mb-0 text-xs" style={{ opacity: 0.7 }}><strong className="text-white">Taluk:</strong> {village.taluk}</p>
                                            <p className="mb-0 text-xs" style={{ opacity: 0.7 }}><strong className="text-white">Dist:</strong> {village.district}</p>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>📮</span>
                                            <p className="mb-0 text-sm" style={{ opacity: 0.9 }}>{village.pincode}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-6" style={{ background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                            <p className="text-muted mb-0">No villages adopted yet. Click the button above to add one.</p>
                        </div>
                    )}
                </div>

                <div className="flex-between mb-6">
                    <div>
                        <h2>NSS Units Management</h2>
                        <p>Manage your college NSS units and members</p>
                    </div>
                    <div className="d-flex gap-2 flex-wrap" style={{ flex: 1, justifyContent: 'flex-end', minWidth: 'min-content' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowMembersList(false);
                                setShowOfficersList(!showOfficersList);
                            }}
                        >
                            👥 View Program Officers
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowOfficersList(false);
                                if (!showMembersList) {
                                    fetchAllMembers();
                                } else {
                                    setShowMembersList(false);
                                }
                            }}
                        >
                            👨‍🎓 View All Students
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setSelectedOfficer(null);
                                setIsOfficerReadOnly(false);
                                setShowUnitModal(true);
                            }}
                            disabled={units.length >= 6}
                            title={units.length >= 6 ? "Maximum limit of 6 units reached" : ""}
                        >
                            + Create New Unit
                        </button>
                        <button
                            className="btn btn-success"
                            onClick={() => {
                                setSelectedOfficer(null);
                                setIsOfficerReadOnly(false);
                                setShowOfficerModal(true);
                            }}
                        >
                            📋 Register Program Officer
                        </button>
                    </div>
                </div>

                {showOfficersList && (
                    <div className="card mb-6" style={{ background: 'var(--card-bg)', animation: 'fadeIn 0.5s' }}>
                        <div className="flex-between mb-4">
                            <h3>Registered Program Officers</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowOfficersList(false)}>&times; Close</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="table w-100">
                                <thead>
                                    <tr>
                                        <th className="text-center">Photo</th>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Designation</th>
                                        <th>Department</th>
                                        <th>Unit</th>
                                        <th>Contact</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {programOfficers.length === 0 ? (
                                        <tr><td colSpan="8" className="text-center py-4">No officers registered yet.</td></tr>
                                    ) : (
                                        programOfficers.map((officer) => (
                                            <tr key={officer._id}>
                                                <td className="text-center">
                                                    <img src={officer.image || "https://via.placeholder.com/40"} alt="Officer" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                                </td>
                                                <td><span className="badge badge-secondary">{officer.officerID || "N/A"}</span></td>
                                                <td>{officer.name}</td>
                                                <td>{officer.designation}</td>
                                                <td>{officer.department}</td>
                                                <td><span className="badge badge-primary">{officer.unit || "Unassigned"}</span></td>
                                                <td>{officer.mobile}</td>
                                                <td>
                                                    <div className="d-flex gap-2 justify-content-center align-items-center h-100">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => {
                                                                setSelectedOfficer(officer);
                                                                setIsOfficerReadOnly(true);
                                                                setShowOfficerModal(true);
                                                            }}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => {
                                                                setSelectedOfficer(officer);
                                                                setIsOfficerReadOnly(false);
                                                                setShowOfficerModal(true);
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-secondary"
                                                            onClick={() => {
                                                                setSelectedOfficerForAssign(officer);
                                                                setAssignTargetUnit(officer.unit || "");
                                                                setShowAssignModal(true);
                                                            }}
                                                        >
                                                            Assign Unit
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDeleteOfficer(officer._id)}
                                                        >
                                                            Delete
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
                )}

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
                            <div className="form-group">
                                <label className="text-xs">Filter by Community</label>
                                <select
                                    className="form-input"
                                    value={memberCommunityFilter}
                                    onChange={(e) => setMemberCommunityFilter(e.target.value)}
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

                        <div style={{ overflowX: 'auto' }}>
                            <table className="styled-table" style={{ margin: 0, boxShadow: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Name</th>
                                        <th>Reg No</th>
                                        <th>Unit</th>
                                        <th>Dept</th>
                                        <th>Community</th>
                                        <th>Batch</th>
                                        <th>Contact</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAllMembers.map((m, index) => (
                                        <tr key={m._id}  >
                                            <td>{index + 1}</td>
                                            <td>{m.name}</td>
                                            <td><span className="badge badge-secondary">{m.regNo}</span></td>
                                            <td>{m.unitId?.unitNumber || "N/A"}</td>
                                            <td>{m.dept}</td>
                                            <td><span className="badge badge-secondary">{m.community || "N/A"}</span></td>
                                            <td>{m.batchFrom} - {m.batchTo}</td>
                                            <td>{m.contact}</td>
                                            <td>
                                                <button
                                                    className={`btn btn-sm ${m.isEnrolled ? 'btn-success' : 'btn-outline-primary'}`}
                                                    onClick={() => {
                                                        setSelectedMember(m);
                                                        setShowEnrolmentModal(true);
                                                    }}
                                                >
                                                    {m.isEnrolled ? "✓ View Enrolment" : "📝 Enrolment"}
                                                </button>
                                            </td>
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
                                    <p className="mb-1 text-sm"><strong className="text-white">Head:</strong> {unit.head?.name || unit.head || "Not Assigned"}</p>
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
                                <div className="form-input" style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed', opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                                    {`Unit ${units.length + 1}`}
                                </div>
                            </div>
                            <div className="form-group">
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

            <ProgramOfficerModal
                isOpen={showOfficerModal}
                onClose={() => setShowOfficerModal(false)}
                insName={insName}
                insCode={insCode}
                units={units}
                initialData={selectedOfficer}
                readOnly={isOfficerReadOnly}
                onSuccess={fetchProgramOfficers}
            />

            <VolunteerEnrolmentModal
                isOpen={showEnrolmentModal}
                onClose={() => setShowEnrolmentModal(false)}
                member={selectedMember}
                collegeData={collegeData}
                unitData={selectedMember?.unitId}
                onSuccess={fetchAllMembers}
            />

            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="flex-between mb-4">
                            <h2 className="mb-0">Assign to Unit</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowAssignModal(false)}>&times;</button>
                        </div>
                        <p className="mb-4">Select the unit you want to assign <strong>{selectedOfficerForAssign?.name}</strong> to.</p>

                        <div className="form-group mb-4">
                            <label className="form-label">Select Unit</label>
                            <select
                                className="form-input"
                                value={assignTargetUnit}
                                onChange={(e) => setAssignTargetUnit(e.target.value)}
                            >
                                <option value="">--- Select Unit ---</option>
                                <option value="UNASSIGNED">Unassigned (None)</option>
                                {units.map(u => (
                                    <option key={u.unitNumber} value={u.unitNumber}>
                                        {u.unitNumber} - {u.name} {u.head ? `(Already assigned: ${u.head.name || u.head})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="alert alert-warning mb-4" style={{ fontSize: '0.85rem' }}>
                            ⚠️ Caution: Assigning a new head will automatically unassign the current head of that unit.
                        </div>

                        <div className="flex-between pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAssignOfficer}
                                disabled={isAssigning || !assignTargetUnit}
                            >
                                {isAssigning ? 'Assigning...' : 'Assign Officer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Village Modal */}
            {showVillageModal && (
                <div className="modal-overlay" onClick={() => setShowVillageModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <div className="flex-between mb-4">
                            <h2 className="mb-0">Adopt a New Village</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowVillageModal(false)}>&times;</button>
                        </div>

                        <div className="form-group mb-3">
                            <label className="form-label">Village Name</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Melpattu Village"
                                value={newVillage.name}
                                onChange={(e) => setNewVillage({ ...newVillage, name: e.target.value })}
                            />
                        </div>

                        <div className="form-group mb-3">
                            <label className="form-label">Location / Address</label>
                            <input
                                className="form-input"
                                placeholder="e.g. Near Taluk Office"
                                value={newVillage.address}
                                onChange={(e) => setNewVillage({ ...newVillage, address: e.target.value })}
                            />
                        </div>

                        <div className="grid-cols-2 gap-3 mb-3">
                            <div className="form-group">
                                <label className="form-label">Block</label>
                                <input className="form-input" placeholder="Block" value={newVillage.block} onChange={(e) => setNewVillage({ ...newVillage, block: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Taluk</label>
                                <input className="form-input" placeholder="Taluk" value={newVillage.taluk} onChange={(e) => setNewVillage({ ...newVillage, taluk: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">District</label>
                                <input className="form-input" placeholder="District" value={newVillage.district} onChange={(e) => setNewVillage({ ...newVillage, district: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Pincode</label>
                                <input className="form-input" placeholder="Pincode" value={newVillage.pincode} onChange={(e) => setNewVillage({ ...newVillage, pincode: e.target.value })} maxLength={6} />
                            </div>
                        </div>

                        <div className="flex-between pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                            <button className="btn btn-secondary" onClick={() => setShowVillageModal(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddVillage}
                                disabled={isAddingVillage}
                            >
                                {isAddingVillage ? 'Adding...' : 'Add Village'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollegeDashboard;