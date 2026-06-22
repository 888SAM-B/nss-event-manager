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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
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

    const [activeTab, setActiveTab] = useState("overview");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
                if (res.data.success) {
                    setUnit(res.data.unit);
                    setCollege(res.data.college);
                    setLoading(false);
                } else {
                    localStorage.removeItem("adminToken");
                    localStorage.removeItem("nsstoken");
                    localStorage.removeItem("nss_username");
                    localStorage.removeItem("unitToken");
                    localStorage.removeItem("nssunitCode");
                    localStorage.removeItem("nsscollegeCode");
                    toast.error("Failed to fetch unit details. Please login again.");
                    navigate("/unit-login");
                }
            })
            .catch((err) => {
                console.error(err);
                localStorage.removeItem("adminToken");
                localStorage.removeItem("nsstoken");
                localStorage.removeItem("nss_username");
                localStorage.removeItem("unitToken");
                localStorage.removeItem("nssunitCode");
                localStorage.removeItem("nsscollegeCode");
                toast.error("Session expired or error fetching unit details. Please login again.");
                navigate("/unit-login");
                setError(err.response?.data?.message || "Something went wrong");
                setLoading(false);
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
    ) || [];

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedMembers = filteredMembers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
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
        <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
                width: 56, height: 56,
                border: '3px solid rgba(20,184,166,0.2)',
                borderTop: '3px solid #14b8a6',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ color: 'var(--txt-3)', fontSize: '0.875rem', letterSpacing: '0.05em' }}>Loading unit dashboard...</span>
        </div>
    );

    if (error) {
        return (
            <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                    width: 64, height: 64,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.75rem',
                }}>⚠️</div>
                <h3 style={{ color: 'var(--danger-400)' }}>Unable to load dashboard</h3>
                <p style={{ color: 'var(--txt-3)', margin: 0 }}>{error}</p>
                <button className="btn btn-primary" onClick={() => navigate('/unit-login')}>Back to Login</button>
            </div>
        );
    }



    return (
        <div className="dashboard-layout-wrapper">
            {/* Sidebar overlay for mobile */}
            <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

            {/* Mobile Header */}
            <header className="mobile-nav-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="sidebar-brand-logo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                    </div>
                    <span className="sidebar-brand-name" style={{ fontSize: '0.9rem' }}>{unit?.name || 'Unit Portal'}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <ThemeToggle />
                    <button className="mobile-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Left Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-logo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <span className="sidebar-brand-name" style={{ display: 'block' }}>NSS PORTAL</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit Admin</span>
                    </div>
                </div>

                <div className="sidebar-menu">
                    <button className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                        Overview
                    </button>
                    <button className={`sidebar-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                        NSS Events
                    </button>
                    <button className={`sidebar-item ${activeTab === 'volunteers' ? 'active' : ''}`} onClick={() => { setActiveTab('volunteers'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Volunteers
                    </button>
                    <button className={`sidebar-item ${activeTab === 'collaborations' ? 'active' : ''}`} onClick={() => { setActiveTab('collaborations'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        Collaborations
                        {invites.length > 0 && (
                            <span className="badge badge-danger" style={{ marginLeft: 'auto', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                                {invites.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--txt-1)', fontWeight: 600 }}>Theme</span>
                        <ThemeToggle />
                    </div>
                    {isAccessedFromCollege ? (
                        <button className="sidebar-item" onClick={() => navigate('/college-dashboard')} style={{ opacity: 0.9 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                            Back to College
                        </button>
                    ) : (
                        <button className="sidebar-item" onClick={handleLogout} style={{ color: 'var(--danger-500)', opacity: 0.9 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Sign Out
                        </button>
                    )}
                </div>
            </aside>

            {/* Right Main Content Pane */}
            <main className="main-content-pane">
                {activeTab === "overview" && (
                    <div>
                        {/* Header */}
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--brand-600)' }}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>{unit?.name || 'Unit Dashboard'}</h1>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '4px' }}>
                                    <span className="badge badge-success" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>{unit?.unitNumber}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>{college?.insName}</span>
                                </div>
                            </div>
                            {isAccessedFromCollege && (
                                <button className="btn btn-secondary" onClick={() => navigate('/college-dashboard')}>
                                    ← College Dashboard
                                </button>
                            )}
                        </div>

                        {/* Quick Stats Cards */}
                        <div className="grid-cols-3 mb-6" style={{ gap: '1rem' }}>
                            <div className="card p-4 d-flex align-items-center" style={{ gap: '1rem', background: 'var(--card-bg)' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,184,166,0.1)', color: 'var(--success-color)' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)', fontWeight: 500 }}>Total Volunteers</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--txt-1)' }}>{unit?.members?.length || 0}</div>
                                </div>
                            </div>

                            <div className="card p-4 d-flex align-items-center" style={{ gap: '1rem', background: 'var(--card-bg)' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)', fontWeight: 500 }}>Active Collaborations</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--txt-1)' }}>{invites.length}</div>
                                </div>
                            </div>

                            <div className="card p-4 d-flex align-items-center" style={{ gap: '1rem', background: 'var(--card-bg)' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.1)', color: 'var(--warning-color)' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)', fontWeight: 500 }}>NSS College Code</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--txt-1)' }}>{college?.code}</div>
                                </div>
                            </div>
                        </div>

                        {/* Unit Details Card */}
                        <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                            <h3 className="mb-4 text-lg">Unit details</h3>
                            <div className="grid-cols-2 gap-4">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>UNIT CODE</span>
                                    <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>{unit?.unitNumber}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>UNIT NAME</span>
                                    <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>{unit?.name}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>UNIT HEAD / PROGRAM OFFICER</span>
                                    <div className="d-flex align-items-center gap-2">
                                        <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>{unit?.head?.name || unit?.head || "Not Assigned"}</span>
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>CONTACT NUMBER</span>
                                    <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>{unit?.head?.mobile || unit?.contact || "N/A"}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: '1 / -1' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>EMAIL ADDRESS</span>
                                    <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>{unit?.head?.email || unit?.mail || "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "events" && (
                    <div>
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>NSS Events Portal</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Create events and explore activities across other college units</p>
                            </div>
                        </div>

                        <div className="grid-cols-2 gap-4">
                            <div className="card p-6 flex-column align-items-center text-center justify-content-center" style={{ minHeight: '240px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(20,184,166,0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                </div>
                                <h3 className="mb-2">Create New Event</h3>
                                <p className="text-sm text-muted mb-4" style={{ maxWidth: '320px' }}>Create and manage events for your unit, set dates, add descriptions, and track student attendance.</p>
                                <button className="btn btn-primary btn-lg w-100" onClick={handleAddEventClick} style={{ maxWidth: '240px' }}>
                                    Create Event
                                </button>
                            </div>

                            <div className="card p-6 flex-column align-items-center text-center justify-content-center" style={{ minHeight: '240px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                </div>
                                <h3 className="mb-2">Explore All Events</h3>
                                <p className="text-sm text-muted mb-4" style={{ maxWidth: '320px' }}>Browse activities from other units, initiate collaborations, and view state or national level announcements.</p>
                                <button className="btn btn-primary btn-lg w-100" onClick={handleExploreEventClick} style={{ maxWidth: '240px' }}>
                                    Explore Events
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "volunteers" && (
                    <div>
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>Unit Volunteers</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Directory and bulk-upload tool for student volunteers</p>
                            </div>
                            <div className="d-flex gap-2">
                                <button className="btn btn-success" onClick={handleExportExcel}>
                                    Excel Export
                                </button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <label className={`btn excel btn-secondary ${isUploading ? 'disabled' : ''}`} style={{ cursor: 'pointer', marginBottom: 0 }}>
                                        {isUploading ? "Uploading..." : "Upload Excel"}
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

                        <div className="card mb-6">
                            <div className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                                <div className="form-group" style={{ maxWidth: '300px', flex: 1 }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Search members (Name/RegNo/Dept)..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                {selectedMemberIds.length > 0 && (
                                    <button className="btn btn-danger" onClick={handleBulkDelete} disabled={isDeleting}>
                                        {isDeleting ? "Deleting..." : `Delete Selected (${selectedMemberIds.length})`}
                                    </button>
                                )}
                            </div>

                            <div className="card p-0 overflow-hidden" style={{ border: 'none', boxShadow: 'none' }}>
                                {filteredMembers?.length > 0 ? (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="styled-table" style={{ margin: 0, boxShadow: 'none' }}>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '40px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={filteredMembers.length > 0 && selectedMemberIds.length === filteredMembers.length}
                                                            onChange={toggleSelectAll}
                                                        />
                                                    </th>
                                                    <th style={{ width: '60px' }}>S.No</th>
                                                    <th>Name</th>
                                                    <th>Reg No</th>
                                                    <th>Department</th>
                                                    <th>Batch</th>
                                                    <th>Contact</th>
                                                    <th className="text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedMembers.map((member, index) => {
                                                    const globalIndex = (currentPage - 1) * itemsPerPage + index;
                                                    return (
                                                        <tr key={member._id}>
                                                            <td>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedMemberIds.includes(member._id)}
                                                                    onChange={() => toggleSelectMember(member._id)}
                                                                />
                                                            </td>
                                                            <td>{globalIndex + 1}</td>
                                                            <td>{member.name}</td>
                                                            <td><span className="badge badge-secondary">{member.regNo}</span></td>
                                                            <td>{member.dept}</td>
                                                            <td>{member.batchFrom} - {member.batchTo}</td>
                                                            <td>{member.contact}</td>
                                                            <td>
                                                                <div className="d-flex gap-2 justify-content-center align-items-center h-100">
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
                                                                            style={{ display: 'inline-flex', alignItems: 'center' }}
                                                                        >
                                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                                                            PDF
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-6 text-center">
                                        <p className="mb-0 text-muted">No members found matching your search.</p>
                                    </div>
                                )}
                            </div>

                            {filteredMembers.length > itemsPerPage && (
                                <div className="pagination-container flex-between mt-4">
                                    <div className="text-sm text-muted">
                                        Showing <span className="fw-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="fw-bold">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of <span className="fw-bold">{filteredMembers.length}</span> students
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
                        </div>
                    </div>
                )}

                {activeTab === "collaborations" && (
                    <div>
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>Collaboration Invites</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Respond to joint-event collaboration requests from other NSS units</p>
                            </div>
                        </div>

                        <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                            {invites.length === 0 ? (
                                <div className="text-center p-6" style={{ background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                    <p className="text-muted mb-0">No pending collaboration invitations at this time.</p>
                                </div>
                            ) : (
                                <div className="grid-cols-2 gap-4">
                                    {invites.map(invite => (
                                        <div key={invite._id} className="p-4 rounded village-card" style={{
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
                                            <div className="flex-between mb-2">
                                                <h4 className="mb-0 text-primary-400" style={{ fontSize: '1.1rem' }}>{invite.name}</h4>
                                                <span className="badge badge-primary">{invite.category}</span>
                                            </div>
                                            <p className="text-sm mb-1"><strong className="text-white">Invited by:</strong> Unit {invite.unitId?.unitNumber} ({invite.unitId?.name})</p>
                                            <p className="text-sm mb-4 text-muted" style={{ minHeight: '40px' }}>{invite.description}</p>

                                            <div className="d-flex gap-2 justify-content-end" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
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
            </main>

            {/* Modals & Overlays */}
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
                            <p className="text-sm text-muted mb-4">Select an unassigned Program Officer for this unit ({unit?.unitNumber}):</p>
                            
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
