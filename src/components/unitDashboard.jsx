import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";



import axios from "axios";
import * as XLSX from "xlsx";
import toast from 'react-hot-toast';
import ThemeToggle from "./ThemeToggle";
import VolunteerEnrolmentModal from "./VolunteerEnrolmentModal";

const UnitDashboard = () => {
    const navigate = useNavigate();

    const [unit, setUnit] = useState(null);
    const [college, setCollege] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [invites, setInvites] = useState([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showEnrolmentModal, setShowEnrolmentModal] = useState(false);
    const [showExcelInfo, setShowExcelInfo] = useState(false);
    const [modalMode, setModalMode] = useState("edit"); // "edit" | "view" | "download"
    const [unassignedOfficers, setUnassignedOfficers] = useState([]);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isAssigning, setIsAssigning] = useState(false);



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
            "DOB (YYYY-MM-DD)": m.dob,
            "Batch (YYYY-YYYY)": `${m.batchFrom}-${m.batchTo}`,
            "Contact": m.contact,
            "Sex": m.sex || "",
            "Father Name": m.fatherName || "",
            "Father Contact": m.fatherPhone || "",
            "Address": m.address || "",
            "Height (cm)": m.height || "",
            "Weight (kg)": m.weight || "",
            "Email": m.email || "",
            "Aadhaar": m.aadhaar || "",
            "Enrolment Date (YYYY-MM-DD)": m.enrolmentDate || "",
            "Cultural Talents": m.culturalTalents || "",
            "Hobbies": m.hobbies || "",
            "University Name": m.universityName || ""
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Unit Members");
        XLSX.writeFile(workbook, `Unit_${unit.unitNumber}_Members.xlsx`);
    };

    const handleDownloadTemplate = () => {
        const template = [{
            "Name": "",
            "Reg No": "",
            "Dept": "",
            "Course": "",
            "Community": "",
            "Blood Group": "",
            "DOB (YYYY-MM-DD)": "",
            "Batch (YYYY-YYYY)": "",
            "Contact": "",
            "Sex": "",
            "Father Name": "",
            "Father Contact": "",
            "Address": "",
            "Height (cm)": "",
            "Weight (kg)": "",
            "Email": "",
            "Aadhaar": "",
            "Enrolment Date (YYYY-MM-DD)": "",
            "Cultural Talents": "",
            "Hobbies": "",
            "University Name": ""
        }];
        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
        XLSX.writeFile(workbook, "NSS_Member_Upload_Template.xlsx");
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
        setSelectedMember(null);
        setModalMode("edit");
        setShowEnrolmentModal(true);
    };

    const handleUpdateClick = (member) => {
        const index = unit.members.indexOf(member);
        setEditingIndex(index);
        setSelectedMember(member);
        setModalMode("edit");
        setShowEnrolmentModal(true);
    };

    const handleViewClick = (member) => {
        setSelectedMember(member);
        setModalMode("view");
        setShowEnrolmentModal(true);
    };

    const handleDownloadClick = (member) => {
        setSelectedMember(member);
        setModalMode("download");
        setShowEnrolmentModal(true);
    };

    const handleBulkUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const formatExcelDate = (value) => {
                    if (!value) return "";
                    
                    // If it's a JS Date object (thanks to cellDates: true)
                    if (value instanceof Date) {
                        return value.toISOString().split('T')[0];
                    }

                    // If it's a string already in YYYY-MM-DD
                    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

                    // Fallback for other string formats
                    try {
                        const date = new Date(value);
                        if (!isNaN(date.getTime())) {
                            return date.toISOString().split('T')[0];
                        }
                    } catch (e) {}
                    
                    return String(value);
                };

                // Map Excel headers to schema fields
                const mappedMembers = jsonData.map(row => {
                    let batchFrom = "", batchTo = "";
                    const batchCell = row["Batch (YYYY-YYYY)"] || row["Batch"] || "";
                    if (batchCell) {
                        const parts = String(batchCell).split("-");
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
                        dob: formatExcelDate(row["DOB (YYYY-MM-DD)"] || row["DOB"]),
                        batchFrom: batchFrom || row["BatchFrom"] || "",
                        batchTo: batchTo || row["BatchTo"] || "",
                        contact: String(row["Contact"] || ""),
                        sex: row["Sex"] || "Male",
                        fatherName: row["Father Name"] || "",
                        fatherPhone: String(row["Father Contact"] || ""),
                        address: row["Address"] || "",
                        height: String(row["Height (cm)"] || ""),
                        weight: String(row["Weight (kg)"] || ""),
                        email: row["Email"] || "",
                        aadhaar: String(row["Aadhaar"] || ""),
                        enrolmentDate: formatExcelDate(row["Enrolment Date (YYYY-MM-DD)"]) || new Date().toISOString().split('T')[0],
                        culturalTalents: row["Cultural Talents"] || "",
                        hobbies: row["Hobbies"] || "",
                        universityName: row["University Name"] || "",
                        isEnrolled: true
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


    const fetchUnassignedOfficers = async () => {
        const token = localStorage.getItem("nsstoken");
        if (!token) return;

        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/unassigned-officers/${college.code}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUnassignedOfficers(res.data.officers);
            }
        } catch (error) {
            console.error("Error fetching unassigned officers:", error);
        }
    };

    const handleAssignOfficer = async (officerId) => {
        setIsAssigning(true);
        const token = localStorage.getItem("nsstoken");

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/assign-officer-to-unit`, {
                officerId,
                unitNumber: unit.unitNumber,
                collegeCode: college.code
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("Officer assigned successfully!");
                // Refresh unit data
                setUnit({ ...unit, head: res.data.officer });
                setIsAssignModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to assign officer");
        } finally {
            setIsAssigning(false);
        }
    };

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
                                <div className="d-flex align-items-center gap-2">
                                    <p className="fw-bold mb-0">{unit?.head?.name || unit?.head || "N/A"}</p>
                                    {isAccessedFromCollege && (!unit?.head || (typeof unit.head === 'string' && unit.head.trim() === '')) && (
                                        <button 
                                            className="btn btn-sm btn-outline-primary" 
                                            style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}
                                            onClick={() => {
                                                fetchUnassignedOfficers();
                                                setIsAssignModalOpen(true);
                                            }}
                                        >
                                            Assign Officer
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted mb-1">CONTACT</p>
                                <p className="fw-bold">{unit?.head?.mobile || unit?.contact}</p>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <p className="text-xs text-muted mb-1">EMAIL</p>
                                <p className="fw-bold">{unit?.head?.email || unit?.mail}</p>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '10px' }}>
                            <label className={`btn excel btn-secondary ${isUploading ? 'disabled' : ''}`} style={{ cursor: 'pointer', marginBottom: 0 }}>
                                {isUploading ? "Uploading..." : "Upload via Excel"}
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleBulkUpload}
                                    disabled={isUploading}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <span
                                onClick={() => setShowExcelInfo(true)}
                                style={{
                                    cursor: 'pointer',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                                title="Excel Format Info"
                            >i</span>
                        </div>
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
                                                        className={`btn btn-sm ${member.isEnrolled ? 'btn-success' : 'btn-primary'}`}
                                                        title="Edit Details"
                                                    >
                                                        {member.isEnrolled ? "✓ Edit" : "Edit"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(member)}
                                                        className="btn btn-sm btn-danger"
                                                        title="Delete Member"
                                                    >
                                                        Delete
                                                    </button>
                                                    {member.isEnrolled && (
                                                        <button
                                                            onClick={() => handleDownloadClick(member)}
                                                            className="btn btn-sm btn-outline-success"
                                                            title="Download Enrolment Form PDF"
                                                        >
                                                            ⬇ PDF
                                                        </button>
                                                    )}
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

            <VolunteerEnrolmentModal
                isOpen={showEnrolmentModal}
                onClose={() => { setShowEnrolmentModal(false); setSelectedMember(null); }}
                member={selectedMember}
                collegeData={college}
                unitData={unit}
                isNewMember={!selectedMember}
                mode={modalMode}
                unitCode={unit?.unitNumber}
                collegeCode={college?.code}
                onSuccess={(updatedUnitOrMember) => {
                    if (updatedUnitOrMember?.members) {
                        // Full unit returned (add mode)
                        setUnit(updatedUnitOrMember);
                    } else if (selectedMember) {
                        // Updated member returned (edit mode)
                        const updatedMembers = unit.members.map(m =>
                            m._id === selectedMember._id ? { ...m, ...updatedUnitOrMember, isEnrolled: true } : m
                        );
                        setUnit({ ...unit, members: updatedMembers });
                    }
                    setShowEnrolmentModal(false);
                    setSelectedMember(null);
                }}
            />

            {/* Assign Officer Modal */}
            {isAssignModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="flex-between mb-4">
                            <h2 className="mb-0">Assign Program Officer</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setIsAssignModalOpen(false)}>&times;</button>
                        </div>
                        
                        <div className="p-2">
                            <p className="text-sm text-muted mb-4">Select an unassigned Program Officer for this unit ({unit.unitNumber}):</p>
                            
                            {unassignedOfficers.length === 0 ? (
                                <div className="text-center p-4">
                                    <p>No unassigned Program Officers found in this college.</p>
                                    <p className="text-xs text-muted">Register a Program Officer without assigning a unit first.</p>
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {unassignedOfficers.map(officer => (
                                        <div key={officer._id} className="card mb-0 p-3 flex-between" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                            <div>
                                                <h4 className="mb-0">{officer.name}</h4>
                                                <p className="text-xs text-muted mb-0">{officer.designation} - {officer.department}</p>
                                            </div>
                                            <button 
                                                className="btn btn-sm btn-primary" 
                                                onClick={() => handleAssignOfficer(officer._id)}
                                                disabled={isAssigning}
                                            >
                                                {isAssigning ? "Processing..." : "Select"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Excel Info Modal */}
            {showExcelInfo && (
                <div className="modal-overlay" onClick={() => setShowExcelInfo(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="flex-between mb-4">
                            <h2 className="mb-0">Excel Format Guidelines</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowExcelInfo(false)}>&times;</button>
                        </div>
                        <div className="p-2">
                            <ul className="text-sm" style={{ listStyle: 'disc', paddingLeft: '20px', lineHeight: '1.6' }}>
                                <li>Ensure the first row contains the exact headers.</li>
                                <li><strong>Required:</strong> Name, Reg No, Dept, Course, Community, Blood Group, DOB (YYYY-MM-DD), Batch (YYYY-YYYY), Contact</li>
                                <li><strong>Enrolment Fields:</strong> Sex, Father Name, Father Contact, Address, Height (cm), Weight (kg), Email, Aadhaar, Enrolment Date (YYYY-MM-DD), Cultural Talents, Hobbies, University Name</li>
                                <li><strong>DOB / Date Format:</strong> YYYY-MM-DD (e.g., 2005-05-15)</li>
                                <li><strong>Batch Format:</strong> YYYY-YYYY (e.g., 2022-2026)</li>
                                <li>Download the template below for the correct format.</li>
                            </ul>
                            <div className="mt-6 flex-center">
                                <button className="btn btn-success w-100" onClick={handleDownloadTemplate}>
                                    Download Template (.xlsx)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitDashboard;
