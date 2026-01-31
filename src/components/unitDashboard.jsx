import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";



import axios from "axios";
import * as XLSX from "xlsx";
import toast from 'react-hot-toast';
import ThemeToggle from "./ThemeToggle";

const UnitDashboard = () => {
    const navigate = useNavigate();

    const [unit, setUnit] = useState(null);
    const [college, setCollege] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [memberForm, setMemberForm] = useState({
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
    });
    const [editingIndex, setEditingIndex] = useState(null);
    const [invites, setInvites] = useState([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);


    // Check if accessed from college dashboard (admin or college user)
    const isAccessedFromCollege = localStorage.getItem("nsstoken") !== null;

    useEffect(() => {
        const token = localStorage.getItem("unitToken");
        if (!token) {
            navigate("/unit-login");
            return;
        }

        const unitCode = localStorage.getItem("nssunitCode");
        const collegeCode = localStorage.getItem("nsscollegeCode");
        if (!unitCode || !collegeCode) {
            setError("Invalid Unit Code");
            setLoading(false);
            return;
        }

        axios
            .get(`${import.meta.env.VITE_API_URL}/unit-dashboard/${unitCode}/${collegeCode}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                setUnit(res.data.unit);
                setCollege(res.data.college);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.response?.data?.message || "Something went wrong");
                setLoading(false);

                if (err.response?.status === 401) {
                    localStorage.removeItem("unitToken");
                    navigate("/unit-login");
                }
            });

        // Fetch Notifications (Invites)
        axios.get(`${import.meta.env.VITE_API_URL}/unit-notifications/${unitCode}/${collegeCode}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (res.data.success) {
                    setInvites(res.data.invites);
                }
            })
            .catch(err => console.error("Error fetching notifications:", err));

    }, [navigate]);

    const handleExportExcel = () => {
        if (!filteredMembers) return;

        const dataToExport = filteredMembers.map((m, index) => ({
            "S.No": index + 1,
            "Name": m.name,
            "Reg No": m.regNo,
            "Dept": m.dept,
            "Course": m.course,
            "Community": m.community,
            "Blood Group": m.bloodGroup,
            "DOB": m.dob,
            "Batch": `${m.batchFrom} - ${m.batchTo}`,
            "Contact": m.contact
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Unit Members");
        XLSX.writeFile(workbook, `Unit_${unit.unitNumber}_Members.xlsx`);
    };

    const handleRespondInvite = async (eventId, response) => {
        const token = localStorage.getItem("unitToken");
        const unitCode = localStorage.getItem("nssunitCode");
        const collegeCode = localStorage.getItem("nsscollegeCode");

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/respond-collaboration`, {
                eventId,
                unitCode,
                response,
                collegeCode
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success(`Invitation ${response}`);
                // Remove from list
                setInvites(invites.filter(i => i._id !== eventId));
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to respond");
        }
    };


    const handleLogout = () => {
        localStorage.removeItem("unitToken");
        localStorage.removeItem("nssunitCode");
        localStorage.removeItem("nsscollegeCode");
        navigate("/");
    };

    const filteredMembers = unit?.members?.filter((m) =>
        `${m.name} ${m.dept} ${m.regNo} ${m.course} ${m.batchFrom} ${m.batchTo}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const handleAddClick = () => {
        setEditingIndex(null);
        setMemberForm({
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
        });
        setIsModalOpen(true);
    };

    const handleUpdateClick = (member) => {
        // Find ORIGINAL index in the full unit.members array
        const index = unit.members.indexOf(member);
        setEditingIndex(index);
        setMemberForm({ ...member });
        setIsModalOpen(true);
    };

    const handleEditChange = (e) => {
        setMemberForm({ ...memberForm, [e.target.name]: e.target.value });
    };

    const handleBulkUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Map Excel headers to schema fields
                const mappedMembers = jsonData.map(row => {
                    let batchFrom = "", batchTo = "";
                    if (row["Batch"]) {
                        const parts = String(row["Batch"]).split("-");
                        batchFrom = parts[0]?.trim() || "";
                        batchTo = parts[1]?.trim() || "";
                    }

                    return {
                        name: row["Name"] || "",
                        regNo: row["Reg No"] || "",
                        dept: row["Dept"] || "",
                        course: row["Course"] || "",
                        community: row["Community"] || "",
                        bloodGroup: row["Blood Group"] || "",
                        dob: row["DOB"] || "",
                        batchFrom: batchFrom || row["BatchFrom"] || "",
                        batchTo: batchTo || row["BatchTo"] || "",
                        contact: row["Contact"] || ""
                    };
                });

                if (mappedMembers.length === 0) {
                    toast.error("No valid data found in the Excel file.");
                    return;
                }

                if (!window.confirm(`Are you sure you want to upload ${mappedMembers.length} members?`)) return;

                setIsUploading(true);
                const toastId = toast.loading("Uploading members...");
                const token = localStorage.getItem("unitToken");
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/bulk-add-members`,
                    {
                        unitCode: unit.unitNumber,
                        collegeCode: college.code,
                        members: mappedMembers
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.data.success) {
                    setUnit(res.data.unit);
                    toast.success(res.data.message, { id: toastId });
                }
            } catch (error) {
                console.error("Error processing bulk upload:", error);
                toast.error("Failed to process Excel file. Please ensure it matches the export format.", { id: toastId });
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
        // Reset input
        e.target.value = null;
    };

    const handleSaveMember = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("unitToken");
        setIsSaving(true);

        try {
            if (editingIndex === null) {
                // ADD MODE
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/add-unit-member`,
                    { unitCode: unit.unitNumber, collegeCode: college.code, member: memberForm },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    setUnit(res.data.unit); // Server returns updated unit populated with members
                    setIsModalOpen(false);
                    toast.success("Member added successfully!");
                }
            } else {
                // EDIT MODE
                const memberId = memberForm._id;
                const res = await axios.put(
                    `${import.meta.env.VITE_API_URL}/update-unit-member`,
                    {
                        memberId: memberId,
                        memberData: memberForm
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    const updatedMembers = [...unit.members];
                    updatedMembers[editingIndex] = res.data.member;
                    setUnit({ ...unit, members: updatedMembers });
                    setIsModalOpen(false);
                    toast.success("Member updated successfully!");
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to save member");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = async (member) => {
        if (!window.confirm("Are you sure you want to delete this member?")) return;
        const token = localStorage.getItem("unitToken");

        try {
            const res = await axios.delete(
                `${import.meta.env.VITE_API_URL}/delete-unit-member`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { unitCode: unit.unitNumber, collegeCode: college.code, memberId: member._id }
                }
            );
            if (res.data.success) {
                setUnit(res.data.unit);
                toast.success("Member deleted successfully!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete member");
        }
    };

    const toggleSelectAll = () => {
        if (selectedMemberIds.length === filteredMembers.length) {
            setSelectedMemberIds([]);
        } else {
            setSelectedMemberIds(filteredMembers.map(m => m._id));
        }
    };

    const toggleSelectMember = (memberId) => {
        if (selectedMemberIds.includes(memberId)) {
            setSelectedMemberIds(selectedMemberIds.filter(id => id !== memberId));
        } else {
            setSelectedMemberIds([...selectedMemberIds, memberId]);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedMemberIds.length} selected members?`)) return;
        const token = localStorage.getItem("unitToken");
        setIsDeleting(true);

        try {
            const res = await axios.delete(
                `${import.meta.env.VITE_API_URL}/bulk-delete-members`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { unitCode: unit.unitNumber, collegeCode: college.code, memberIds: selectedMemberIds }
                }
            );
            if (res.data.success) {
                setUnit(res.data.unit);
                setSelectedMemberIds([]);
                toast.success("Selected members deleted successfully!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete selected members");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddEventClick = () => {
        navigate('/events', { state: { unitCode: unit.unitNumber, collegeCode: college.code } });
    };

    const handleExploreEventClick = () => {
        navigate('/explore-events', { state: { unitCode: unit.unitNumber, collegeCode: college.code } })
    }


    if (loading) return (
        <div className="flex-center" style={{ height: '100vh' }}>
            <div className="loading"></div>
            <h2 className="ms-2">Loading Unit Dashboard...</h2>
        </div>
    );

    if (error) {
        return (
            <div className="container p-6">
                <div className="card text-center">
                    <h2 className="text-danger mb-2">Error</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/unit-login')}>Go to Login</button>
                </div>
            </div>
        );
    }



    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
            <header className="dashboard-header">
                <div className="container flex-between">
                    <div>
                        <span className="badge badge-primary">Unit Dashboard</span>
                        <h1 className="mb-0" style={{ fontSize: '1.5rem', marginTop: '1rem', marginBottom: '0.3rem' }}>{college?.code} - {college?.insName} </h1>
                    </div>
                    {isAccessedFromCollege ? (
                        <div className="d-flex align-items-center width-set gap-3">
                            <ThemeToggle />
                            <button
                                onClick={() => navigate("/college-dashboard")}
                                className="btn btn-secondary"
                                style={{ width: '50%' }}
                            >
                                ← Back to Dashboard
                            </button>
                        </div>
                    ) : (
                        <div className="d-flex align-items-center gap-3 width-set " >
                            <ThemeToggle />
                            <div className="position-relative bells " style={{ cursor: 'pointer', marginRight: '1rem' }} onClick={() => setIsInviteModalOpen(true)}>
                                <span style={{ fontSize: '1.5rem' }}>🔔</span>
                                {invites.length > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.7rem' }}>
                                        {invites.length}
                                    </span>
                                )}
                            </div>
                            <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                        </div>
                    )}
                </div>
            </header>

            <main className="container main-container" >
                <div className="grid-cols-2 mb-6">
                    <div className="card">
                        <h3 className="mb-4">Unit Details</h3>
                        <div className="grid-cols-2">
                            <div>
                                <p className="text-xs text-muted mb-1">UNIT CODE</p>
                                <p className="fw-bold">{unit?.unitNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted mb-1">UNIT NAME</p>
                                <p className="fw-bold">{unit?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted mb-1">UNIT HEAD</p>
                                <p className="fw-bold">{unit?.head}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted mb-1">CONTACT</p>
                                <p className="fw-bold">{unit?.contact}</p>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <p className="text-xs text-muted mb-1">EMAIL</p>
                                <p className="fw-bold">{unit?.mail}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card  flex-column text-center">
                        <h3 className="mb-4">Quick Actions</h3>
                        <div className="flex-center actionbuttons" >
                            <div className="one">
                                <button className="btn btn-primary btn-lg w-100 mb-3" onClick={handleAddEventClick}>
                                    Create Events
                                </button>
                                <p className="text-sm text-muted">Manage events, volunteers and more from here.</p>
                            </div>
                            <div className="one">
                                <button className="btn btn-primary btn-lg w-100 mb-3" onClick={handleExploreEventClick}>
                                    Explore Events
                                </button>
                                <p className="text-sm text-muted">Explore events created by other units.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-between member mb-4 align-items-end">
                    <div className="unit-members-header" >
                        <h3 className="mb-1 ">Unit Members</h3>
                        <p className="text-sm">Manage student volunteers</p>
                    </div>
                    <div className="d-flex gap-2 add-member ">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Search members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {selectedMemberIds.length > 0 && (
                            <button className="btn btn-danger" onClick={handleBulkDelete} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : `Delete Selected (${selectedMemberIds.length})`}
                            </button>
                        )}
                        <button className="btn btn-success" onClick={handleExportExcel} style={{ marginRight: '10px' }}>
                            Excel Export
                        </button>
                        <label className={`btn excel btn-secondary ${isUploading ? 'disabled' : ''}`} style={{ marginRight: '10px', cursor: 'pointer', marginBottom: 0 }}>
                            {isUploading ? "Uploading..." : "Upload via Excel"}
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleBulkUpload}
                                disabled={isUploading}
                                style={{ display: 'none' }}
                            />
                        </label>
                        <button className="btn add-btn btn-primary" onClick={handleAddClick}>
                            + Add Member
                        </button>
                    </div>
                </div>

                <div className="card p-0 overflow-hidden">
                    {filteredMembers?.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="styled-table" style={{ margin: 0, boxShadow: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>
                                            <input
                                                type="checkbox"
                                                checked={filteredMembers.length > 0 && selectedMemberIds.length === filteredMembers.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th>S.No</th>
                                        <th>Name</th>
                                        <th>Reg No</th>
                                        <th>Department</th>
                                        <th>Batch</th>
                                        <th>Contact</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.map((member, index) => (
                                        <tr key={member._id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMemberIds.includes(member._id)}
                                                    onChange={() => toggleSelectMember(member._id)}
                                                />
                                            </td>
                                            <td>{index + 1}</td>
                                            <td>{member.name}</td>
                                            <td><span className="badge badge-secondary">{member.regNo}</span></td>
                                            <td>{member.dept}</td>
                                            <td>{member.batchFrom} - {member.batchTo}</td>
                                            <td>{member.contact}</td>
                                            <td>
                                                <div className="d-flex ed gap-2">
                                                    <button
                                                        onClick={() => handleUpdateClick(member)}
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(member)}
                                                        className="btn btn-sm btn-danger"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-center">
                            <p className="mb-0">No members found matching your search.</p>
                        </div>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="flex-between mb-4">
                            <h2 className="mb-0">{editingIndex === null ? "Add New Member" : "Edit Member"}</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleSaveMember}>
                            <div className="grid-cols-2">
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        className="form-input"
                                        name="name"
                                        value={memberForm.name}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reg No</label>
                                    <input
                                        className="form-input"
                                        name="regNo"
                                        value={memberForm.regNo}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="Registration Number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <input
                                        className="form-input"
                                        name="dept"
                                        value={memberForm.dept}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="e.g. CSE"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Course</label>
                                    <input
                                        className="form-input"
                                        name="course"
                                        value={memberForm.course}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="e.g. B.E. / B.Tech"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Community</label>
                                    <input
                                        className="form-input"
                                        name="community"
                                        value={memberForm.community}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="e.g. BC/MBC/SC/ST"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Blood Group</label>
                                    <select
                                        className="form-input"
                                        name="bloodGroup"
                                        value={memberForm.bloodGroup}
                                        onChange={handleEditChange}
                                        required
                                    >
                                        <option value="">Select Blood Group</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Birth</label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        name="dob"
                                        value={memberForm.dob}
                                        onChange={handleEditChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Batch From (Year)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        name="batchFrom"
                                        value={memberForm.batchFrom}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="e.g. 2022"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Batch To (Year)</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        name="batchTo"
                                        value={memberForm.batchTo}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="e.g. 2026"
                                    />
                                </div>
                                <div className="form-group col-span-2" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Contact Number</label>
                                    <input
                                        className="form-input"
                                        name="contact"
                                        value={memberForm.contact}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="Phone Number"
                                    />
                                </div>
                            </div>

                            <div className="flex-between pt-4 mt-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Member'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notifications Modal */}
            {isInviteModalOpen && (
                <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="flex-between mb-4">
                            <h2 className="mb-0">Collaboration Invites</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setIsInviteModalOpen(false)}>&times;</button>
                        </div>

                        {invites.length === 0 ? (
                            <p className="text-center text-muted">No pending invitations.</p>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {invites.map(invite => (
                                    <div key={invite._id} className="card p-3 mb-0" style={{ background: 'var(--bg-secondary)' }}>
                                        <div className="flex-between mb-2">
                                            <h4 className="mb-0">{invite.name}</h4>
                                            <span className="badge badge-primary">{invite.category}</span>
                                        </div>
                                        <p className="text-sm mb-1"><strong>Invited by:</strong> Unit {invite.unitId?.unitNumber} ({invite.unitId?.name})</p>
                                        <p className="text-sm mb-3 text-muted">{invite.description.substring(0, 100)}...</p>

                                        <div className="d-flex gap-2 justify-content-end">
                                            <button className="btn btn-sm btn-success" onClick={() => handleRespondInvite(invite._id, 'accepted')}>Accept</button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleRespondInvite(invite._id, 'rejected')}>Decline</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitDashboard;
