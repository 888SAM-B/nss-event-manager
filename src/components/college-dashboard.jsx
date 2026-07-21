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
import EventsCalendar from "./EventsCalendar";
import CircularBellNotification from "./CircularBellNotification";
import UserCircularsView from "./UserCircularsView";

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
    const [collegePasskey, setCollegePasskey] = useState("");

    // Program Officer states for Unit Creation
    const [poName, setPoName] = useState("");
    const [poDesignation, setPoDesignation] = useState("");
    const [poDepartment, setPoDepartment] = useState("");
    const [poDob, setPoDob] = useState("");
    const [poCommunity, setPoCommunity] = useState("General");
    const [poEmail, setPoEmail] = useState("");
    const [poMobile, setPoMobile] = useState("");
    const [poDateOfAppointment, setPoDateOfAppointment] = useState("");
    const [poTeachingExperience, setPoTeachingExperience] = useState("");
    const [poQualification, setPoQualification] = useState("");
    const [poEtiCompleted, setPoEtiCompleted] = useState("No");
    const [poAddress, setPoAddress] = useState("");
    const [poBlock, setPoBlock] = useState("");
    const [poTaluk, setPoTaluk] = useState("");
    const [poDistrict, setPoDistrict] = useState("");
    const [poPincode, setPoPincode] = useState("");

    const [poImage, setPoImage] = useState(null);
    const [poSeminars, setPoSeminars] = useState([""]);
    const [poNssExperience, setPoNssExperience] = useState([""]);
    const [poSpecialTalent, setPoSpecialTalent] = useState([""]);
    const [poAchievements, setPoAchievements] = useState("");
    const [poEtlTraining, setPoEtlTraining] = useState(false);
    const [poEtlCertificate, setPoEtlCertificate] = useState("");

    const handlePoImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPoImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePoEtlCertificateChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPoEtlCertificate(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePoDynamicChange = (index, field, value) => {
        if (field === 'seminars') {
            const updated = [...poSeminars];
            updated[index] = value;
            setPoSeminars(updated);
        } else if (field === 'nssExperience') {
            const updated = [...poNssExperience];
            updated[index] = value;
            setPoNssExperience(updated);
        } else if (field === 'specialTalent') {
            const updated = [...poSpecialTalent];
            updated[index] = value;
            setPoSpecialTalent(updated);
        }
    };

    const addPoDynamicField = (field) => {
        if (field === 'seminars') setPoSeminars([...poSeminars, ""]);
        else if (field === 'nssExperience') setPoNssExperience([...poNssExperience, ""]);
        else if (field === 'specialTalent') setPoSpecialTalent([...poSpecialTalent, ""]);
    };

    const removePoDynamicField = (index, field) => {
        if (field === 'seminars' && poSeminars.length > 1) {
            setPoSeminars(poSeminars.filter((_, i) => i !== index));
        } else if (field === 'nssExperience' && poNssExperience.length > 1) {
            setPoNssExperience(poNssExperience.filter((_, i) => i !== index));
        } else if (field === 'specialTalent' && poSpecialTalent.length > 1) {
            setPoSpecialTalent(poSpecialTalent.filter((_, i) => i !== index));
        }
    };

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
    const [memberBloodGroupFilter, setMemberBloodGroupFilter] = useState("");
    const [currentMemberPage, setCurrentMemberPage] = useState(1);
    const membersPerPage = 50;



    // Check if admin is viewing this dashboard
    const isAdminViewing = localStorage.getItem("adminToken") !== null;

    const [activeTab, setActiveTab] = useState("overview");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Events tab state
    const [collegeEvents, setCollegeEvents] = useState([]);
    const [externalEvents, setExternalEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [eventsTab, setEventsTab] = useState('college');
    const [eventsFetched, setEventsFetched] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventDetailModal, setShowEventDetailModal] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [dateFilterType, setDateFilterType] = useState('all'); // 'all' | 'specific-month' | 'specific' | 'range'
    const [specificDate, setSpecificDate] = useState('');
    const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
    const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));

    const fetchCollegeEvents = async (code) => {
        if (!code) return;
        setLoadingEvents(true);
        try {
            const token = localStorage.getItem("nsstoken") || localStorage.getItem("adminToken");
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/getEvents/${code}/COLLEGE`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCollegeEvents(res.data.collegeEvents || []);
                setExternalEvents(res.data.externalEvents || []);
                setEventsFetched(true);
            }
        } catch (err) {
            console.error('Error fetching college events:', err);
            toast.error('Failed to load events');
        } finally {
            setLoadingEvents(false);
        }
    };

    const getEventStatus = (event) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start, end;
        if (event.singleDay) {
            start = new Date(event.date); end = new Date(event.date);
        } else {
            start = new Date(event.dateFrom); end = new Date(event.dateTo);
        }
        start.setHours(0, 0, 0, 0); end.setHours(0, 0, 0, 0);
        if (event.report?.submittedAt) return { label: 'Report Submitted', color: '#10b981', bg: 'rgba(16,185,129,0.12)' };
        if (today > end) return { label: 'Completed', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' };
        if (today < start) return { label: 'Upcoming', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' };
        return { label: 'Ongoing', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' };
    };

    const renderCollegeEventCard = (event) => {
        const status = getEventStatus(event);
        const dateStr = event.singleDay
            ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : `${new Date(event.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(event.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        return (
            <div key={event._id} className="card p-5 d-flex flex-column justify-content-between" style={{ height: '340px', background: 'var(--card)', overflow: 'hidden' }}>
                <div>
                    <div className="flex-between mb-2">
                        <span className="badge" style={{ color: status.color, background: status.bg, fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            {status.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)', fontWeight: 600 }}>{event.eventCode}</span>
                    </div>
                    <span className="badge badge-secondary mb-2" style={{ fontSize: '0.65rem' }}>{event.category}</span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--txt-1)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.6em', lineHeight: '1.3', wordBreak: 'break-word' }}>
                        {event.name}
                    </h4>
                    <p className="text-sm text-muted mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.8em', lineHeight: '1.4', margin: 0, wordBreak: 'break-word' }}>
                        {event.description}
                    </p>
                </div>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--txt-2)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginBottom: '10px' }}>
                        <div className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            <span>{dateStr}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.venue}</span>
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button className="btn btn-secondary btn-sm flex-grow-1" onClick={() => { setSelectedEvent(event); setShowEventDetailModal(true); }}>
                            Details
                        </button>
                        {event.unitId && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--txt-3)', alignSelf: 'center', whiteSpace: 'nowrap' }}>
                                by {event.unitId?.unitNumber || 'Unknown'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

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
        if (!newUnitPassword.trim()) {
            toast.error("Please enter a unit password.");
            return;
        }
        if (!collegePasskey.trim()) {
            toast.error("Please enter the College Passkey for authorization.");
            return;
        }
        if (!poName.trim() || !poDesignation.trim() || !poDepartment.trim() || !poEmail.trim() || !poMobile.trim()) {
            toast.error("Please fill in all mandatory Program Officer details (Name, Designation, Department, Email, Mobile).");
            return;
        }
        const assignedName = `Unit ${units.length + 1}`;
        const createdDate = new Date().toISOString().split('T')[0];

        const payload = {
            collegeCode: insCode,
            collegePasskey,
            name: assignedName,
            password: newUnitPassword,
            members: newMembers,
            createdDate,
            officerData: {
                name: poName,
                designation: poDesignation,
                department: poDepartment,
                dob: poDob,
                community: poCommunity,
                email: poEmail,
                mobile: poMobile,
                dateOfAppointment: poDateOfAppointment,
                teachingExperience: poTeachingExperience,
                qualification: poQualification,
                etiCompleted: poEtlTraining ? "Yes" : "No",
                address: poAddress,
                block: poBlock,
                taluk: poTaluk,
                district: poDistrict,
                pincode: poPincode,
                image: poImage,
                seminars: poSeminars,
                nssExperience: poNssExperience,
                specialTalent: poSpecialTalent,
                achievements: poAchievements,
                etlTraining: poEtlTraining,
                etlCertificate: poEtlCertificate
            }
        };
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
                setCollegePasskey("");
                setNewMembers([]);

                // Clear PO fields
                setPoName("");
                setPoDesignation("");
                setPoDepartment("");
                setPoDob("");
                setPoCommunity("General");
                setPoEmail("");
                setPoMobile("");
                setPoDateOfAppointment("");
                setPoTeachingExperience("");
                setPoQualification("");
                setPoEtiCompleted("No");
                setPoAddress("");
                setPoBlock("");
                setPoTaluk("");
                setPoDistrict("");
                setPoPincode("");
                setPoImage(null);
                setPoSeminars([""]);
                setPoNssExperience([""]);
                setPoSpecialTalent([""]);
                setPoAchievements("");
                setPoEtlTraining(false);
                setPoEtlCertificate("");

                // Refresh Program Officers list
                fetchProgramOfficers(insCode);

                toast.success("Unit created successfully!");
            } else {
                toast.error("Failed to create unit: " + (res.data.message || "Unknown error"));
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "An error occurred while creating the unit.");
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
                if (isAdminViewing) {
                    localStorage.removeItem("nsstoken");
                    localStorage.removeItem("nss_username");
                    localStorage.removeItem("unitToken");
                    localStorage.removeItem("nssunitCode");
                    localStorage.removeItem("nsscollegeCode");
                    toast.error("Failed to fetch dashboard details.");
                    navigate("/admin-dashboard");
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
            }
        } catch (error) {
            console.error(error);
            if (isAdminViewing) {
                localStorage.removeItem("nsstoken");
                localStorage.removeItem("nss_username");
                localStorage.removeItem("unitToken");
                localStorage.removeItem("nssunitCode");
                localStorage.removeItem("nsscollegeCode");
                toast.error("Error fetching details.");
                navigate("/admin-dashboard");
            } else {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("nsstoken");
                localStorage.removeItem("nss_username");
                localStorage.removeItem("unitToken");
                localStorage.removeItem("nssunitCode");
                localStorage.removeItem("nsscollegeCode");
                toast.error("Error fetching details. Please login again.");
                navigate("/login");
            }
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
        const matchesBloodGroup = memberBloodGroupFilter === "" || m.bloodGroup === memberBloodGroupFilter;
        return matchesSearch && matchesUnit && matchesBatch && matchesCommunity && matchesBloodGroup;
    });

    // Reset member page when filters change
    useEffect(() => {
        setCurrentMemberPage(1);
    }, [memberSearch, filterUnit, filterBatch, memberCommunityFilter, memberBloodGroupFilter]);

    // Fetch members when student tab is active
    useEffect(() => {
        if (activeTab === "students" && insCode) {
            fetchAllMembers();
        }
    }, [activeTab, insCode]);

    const totalMemberPages = Math.ceil(filteredAllMembers.length / membersPerPage);
    const paginatedAllMembers = filteredAllMembers.slice(
        (currentMemberPage - 1) * membersPerPage,
        currentMemberPage * membersPerPage
    );



    const handleLogout = () => {
        if (isAdminViewing) {
            navigate("/admin-dashboard");
        } else {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("nsstoken");
            localStorage.removeItem("nss_username");
            localStorage.removeItem("unitToken");
            localStorage.removeItem("nssunitCode");
            localStorage.removeItem("nsscollegeCode");
            navigate("/");
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
        <div className="dashboard-layout-wrapper">
            {/* Sidebar overlay for mobile */}
            <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

            {/* Mobile Header */}
            <header className="mobile-nav-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="sidebar-brand-logo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></svg>
                    </div>
                    <span className="sidebar-brand-name" style={{ fontSize: '0.9rem' }}>{insName || 'College Portal'}</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <CircularBellNotification />
                    <ThemeToggle />
                    <button className="mobile-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Left Sidebar */}
            <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-logo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></svg>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <span className="sidebar-brand-name" style={{ display: 'block' }}>NSS PORTAL</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>College Admin</span>
                    </div>
                </div>

                <div className="sidebar-menu">
                    <button className={`sidebar-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
                        Overview
                    </button>
                    <button className={`sidebar-item ${activeTab === 'circulars' ? 'active' : ''}`} onClick={() => { setActiveTab('circulars'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        Circulars & Notices
                    </button>
                    <button className={`sidebar-item ${activeTab === 'units' ? 'active' : ''}`} onClick={() => { setActiveTab('units'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M12 2L2 7l10 5 10-5-10-5z" /></svg>
                        NSS Units
                    </button>
                    <button className={`sidebar-item ${activeTab === 'officers' ? 'active' : ''}`} onClick={() => { setActiveTab('officers'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Program Officers
                    </button>
                    <button className={`sidebar-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Student Records
                    </button>
                    <button className={`sidebar-item ${activeTab === 'villages' ? 'active' : ''}`} onClick={() => { setActiveTab('villages'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                        Adopted Villages
                    </button>
                    <button className={`sidebar-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); if (!eventsFetched) fetchCollegeEvents(insCode); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        Events
                    </button>
                </div>

                <div className="sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--txt-1)', fontWeight: 600 }}>Theme</span>
                        <ThemeToggle />
                    </div>
                    <button className="sidebar-item" onClick={handleLogout} style={{ color: 'var(--danger-500)', opacity: 0.9 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Sign Out
                    </button>
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
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--brand-600)' }}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>{insName || 'College Dashboard'}</h1>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '4px' }}>
                                    <span className="badge badge-primary" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>{insCode}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>NSS Organization Dashboard</span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <CircularBellNotification onBellClick={() => setActiveTab('circulars')} />
                                {isAdminViewing && (
                                    <button className="btn btn-secondary" onClick={() => navigate('/admin-dashboard')}>
                                        ← Admin
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats Cards */}
                        <div className="grid-cols-4 mb-6" style={{ gap: '1rem' }}>
                            <div className="card p-4 d-flex align-items-center" style={{ gap: '1rem', background: 'var(--card-bg)' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M12 2L2 7l10 5 10-5-10-5z" /></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)', fontWeight: 500 }}>Active Units</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--txt-1)' }}>{units.length} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--txt-3)' }}>/ 6</span></div>
                                </div>
                            </div>

                            <div className="card p-4 d-flex align-items-center" style={{ gap: '1rem', background: 'var(--card-bg)' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.1)', color: 'var(--success-color)' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)', fontWeight: 500 }}>Program Officers</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--txt-1)' }}>{programOfficers.length}</div>
                                </div>
                            </div>

                            <div className="card p-4 d-flex align-items-center" style={{ gap: '1rem', background: 'var(--card-bg)' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.1)', color: 'var(--warning-color)' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" /></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)', fontWeight: 500 }}>Total Volunteers</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--txt-1)' }}>
                                        {units.reduce((sum, u) => sum + (u.members?.length || 0), 0)}
                                    </div>
                                </div>
                            </div>

                            <div className="card p-4 d-flex align-items-center" style={{ gap: '1rem', background: 'var(--card-bg)' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(236,72,153,0.1)', color: 'var(--danger-color)' }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)', fontWeight: 500 }}>Adopted Villages</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--txt-1)' }}>{collegeData?.adoptingVillages?.length || 0}</div>
                                </div>
                            </div>
                        </div>

                        {/* College Info Card */}
                        <div className="card p-6 mb-6" style={{ background: 'var(--card-bg)' }}>
                            <h3 className="mb-4 text-lg">College Details</h3>
                            <div className="grid-cols-2 gap-4">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>Institution Name</span>
                                    <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>{insName || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>Institution Code</span>
                                    <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>{insCode || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>Login Username</span>
                                    <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>{username || 'N/A'}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>NSS Representative</span>
                                    <span style={{ fontWeight: 600, color: 'var(--txt-1)' }}>Principal / Head of Institution</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "units" && (
                    <div>
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>NSS Units Management</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Manage your college NSS units and members</p>
                            </div>
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
                                        style={{ width: '100%', margin: 0, cursor: 'default' }}
                                    >
                                        <div className="flex-between mb-3">
                                            <h4 className="mb-0">{unit.name || unit.unitName}</h4>
                                            <span className="badge badge-success">{unit.unitNumber}</span>
                                        </div>
                                        <div className="mb-4">
                                            <p className="mb-1 text-sm"><strong className="text-white">Unit Code:</strong> {unit.unitNumber}</p>
                                            <p className="mb-1 text-sm"><strong className="text-white">Head:</strong> {unit.head?.name || unit.head || "Not Assigned"}</p>
                                            <p className="mb-1 text-sm"><strong className="text-white">Created:</strong> {unit.createdDate}</p>
                                            <p className="mb-1 text-sm"><strong className="text-white">Members:</strong> {unit.members ? unit.members.length : 0}</p>
                                        </div>

                                        {/* {isAdminViewing && (
                                            <button
                                                className="btn btn-danger btn-sm w-100"
                                                onClick={(e) => handleDeleteUnit(unit.unitNumber, e)}
                                                style={{ width: '100%', marginTop: '0.5rem' }}
                                            >
                                                Delete Unit
                                            </button>
                                        )} */}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "officers" && (
                    <div>
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>Program Officers</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Registered Program Officers for college units</p>
                            </div>
                            <button
                                className="btn btn-success"
                                onClick={() => {
                                    setSelectedOfficer(null);
                                    setIsOfficerReadOnly(false);
                                    setShowOfficerModal(true);
                                }}
                            >
                                + Register Program Officer
                            </button>
                        </div>

                        <div className="card mb-6" style={{ background: 'var(--card-bg)', animation: 'fadeIn 0.5s' }}>
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
                    </div>
                )}

                {activeTab === "students" && (
                    <div>
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>Student Volunteers</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Directory of college NSS student volunteers</p>
                            </div>
                            <button className="btn btn-success" onClick={() => handleExportExcel(filteredAllMembers, `${insCode}_members`)}>Export to Excel</button>
                        </div>

                        <div className="card mb-6">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="text-xs">Search (Name/RegNo)</label>
                                    <input
                                        className="form-input"
                                        placeholder="Search..."
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="text-xs">Filter by Unit</label>
                                    <select className="form-input" value={filterUnit} onChange={(e) => setFilterUnit(e.target.value)}>
                                        <option value="">All Units</option>
                                        {units.map(u => (
                                            <option key={u.unitNumber} value={u.unitNumber}>{u.unitNumber}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="text-xs">Filter by Batch (Year)</label>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. 2022"
                                        value={filterBatch}
                                        onChange={(e) => setFilterBatch(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
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
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="text-xs">Filter by Blood Group</label>
                                    <select
                                        className="form-input"
                                        value={memberBloodGroupFilter}
                                        onChange={(e) => setMemberBloodGroupFilter(e.target.value)}
                                    >
                                        <option value="">All Blood Groups</option>
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
                                {(memberSearch || filterUnit || filterBatch || memberCommunityFilter || memberBloodGroupFilter) && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ height: '38px', padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onClick={() => {
                                            setMemberSearch("");
                                            setFilterUnit("");
                                            setFilterBatch("");
                                            setMemberCommunityFilter("");
                                            setMemberBloodGroupFilter("");
                                        }}
                                    >
                                        ✕ Clear
                                    </button>
                                )}
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
                                        {paginatedAllMembers.map((m, index) => {
                                            const globalIndex = (currentMemberPage - 1) * membersPerPage + index;
                                            return (
                                                <tr key={m._id}  >
                                                    <td>{globalIndex + 1}</td>
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
                                                            style={{ display: 'inline-flex', alignItems: 'center' }}
                                                        >
                                                            {m.isEnrolled ? (
                                                                <>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><polyline points="20 6 9 17 4 12" /></svg>
                                                                    View Enrolment
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" /></svg>
                                                                    Enrolment
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredAllMembers.length === 0 && (
                                    <p className="text-center p-4">No members found.</p>
                                )}
                            </div>

                            {filteredAllMembers.length > membersPerPage && (
                                <div className="pagination-container flex-between mt-4">
                                    <div className="text-sm text-muted">
                                        Showing <span className="fw-bold">{(currentMemberPage - 1) * membersPerPage + 1}</span> to <span className="fw-bold">{Math.min(currentMemberPage * membersPerPage, filteredAllMembers.length)}</span> of <span className="fw-bold">{filteredAllMembers.length}</span> students
                                    </div>
                                    <div className="flex-center gap-2">
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setCurrentMemberPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentMemberPage === 1}
                                        >
                                            Previous
                                        </button>
                                        <div className="flex-center gap-1">
                                            {[...Array(Math.min(5, totalMemberPages))].map((_, i) => {
                                                let pageNum;
                                                if (totalMemberPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentMemberPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentMemberPage >= totalMemberPages - 2) {
                                                    pageNum = totalMemberPages - 4 + i;
                                                } else {
                                                    pageNum = currentMemberPage - 2 + i;
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        className={`btn btn-sm ${currentMemberPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                                                        style={{ minWidth: '36px' }}
                                                        onClick={() => setCurrentMemberPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setCurrentMemberPage(prev => Math.min(prev + 1, totalMemberPages))}
                                            disabled={currentMemberPage === totalMemberPages}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "villages" && (
                    <div>
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>Adopted Villages</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>NSS adopted villages for community outreach</p>
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
                                        <h4 className="mb-0 text-primary-400" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{village.name}</h4>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6" style={{ background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                <p className="text-muted mb-0">No villages adopted yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "events" && (
                    <div>
                        {/* Header */}
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>College Events</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>All events conducted by units in this college</p>
                            </div>
                            <button className="btn btn-secondary" onClick={() => fetchCollegeEvents(insCode)}>
                                ↻ Refresh
                            </button>
                        </div>

                        {/* Tab Filter + Date Range Filter */}
                        <div className="d-flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingTop: '0.5rem', paddingBottom: '1rem', overflowX: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button className={`btn btn-sm ${eventsTab === 'college' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setEventsTab('college'); setDateFilterType('all'); setSpecificDate(''); setFromDate(''); setToDate(''); }}>
                                College Events ({collegeEvents.length})
                            </button>
                            <button className={`btn btn-sm ${eventsTab === 'external' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setEventsTab('external'); setDateFilterType('all'); setSpecificDate(''); setFromDate(''); setToDate(''); }}>
                                External Events ({externalEvents.length})
                            </button>
                            <button className={`btn btn-sm ${eventsTab === 'calendar' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setEventsTab('calendar'); setDateFilterType('all'); setSpecificDate(''); setFromDate(''); setToDate(''); }}>
                                📅 Calendar
                            </button>

                            {/* Date Filter Dropdown — hidden in Calendar view */}
                            {eventsTab !== 'calendar' && (
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, flexWrap: 'nowrap' }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--txt-3)' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    <select
                                        className="form-input"
                                        style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: '6px', height: 34, minWidth: 120 }}
                                        value={dateFilterType}
                                        onChange={e => {
                                            setDateFilterType(e.target.value);
                                            setSpecificDate('');
                                            setFromDate('');
                                            setToDate('');
                                        }}
                                    >
                                        <option value="all">All Time</option>
                                        <option value="specific-month">Specific Month</option>
                                        <option value="specific">Specific Date</option>
                                        <option value="range">Date Range</option>
                                    </select>

                                    {dateFilterType === 'specific-month' && (
                                        <>
                                            <select
                                                className="form-input"
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: '6px', height: 34, minWidth: 80 }}
                                                value={filterMonth}
                                                onChange={e => setFilterMonth(e.target.value)}
                                            >
                                                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => {
                                                    const label = new Date(2000, Number(m) - 1).toLocaleDateString('en-US', { month: 'short' });
                                                    return <option key={m} value={m}>{label}</option>;
                                                })}
                                            </select>
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="Year"
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: '6px', height: 34, minWidth: 85, maxWidth: 100 }}
                                                value={filterYear}
                                                onChange={e => setFilterYear(e.target.value)}
                                                min="1900"
                                                max="2100"
                                            />
                                        </>
                                    )}

                                    {dateFilterType === 'specific' && (
                                        <input
                                            type="date"
                                            className="form-input"
                                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: '6px', height: 34, minWidth: 130 }}
                                            value={specificDate}
                                            onChange={e => setSpecificDate(e.target.value)}
                                            title="Specific date"
                                        />
                                    )}

                                    {dateFilterType === 'range' && (
                                        <>
                                            <input
                                                type="date"
                                                className="form-input"
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: '6px', height: 34, minWidth: 130 }}
                                                value={fromDate}
                                                onChange={e => setFromDate(e.target.value)}
                                                title="From date"
                                            />
                                            <span style={{ color: 'var(--txt-3)', fontSize: '0.8rem' }}>–</span>
                                            <input
                                                type="date"
                                                className="form-input"
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: '6px', height: 34, minWidth: 130 }}
                                                value={toDate}
                                                onChange={e => setToDate(e.target.value)}
                                                title="To date"
                                            />
                                        </>
                                    )}

                                    {dateFilterType !== 'all' && (
                                        <button className="btn btn-sm btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 34 }} onClick={() => { setDateFilterType('all'); setSpecificDate(''); setFromDate(''); setToDate(''); }}>✕</button>
                                    )}
                                </div>
                            )}
                        </div>

                        {loadingEvents ? (
                            <div className="text-center py-10">
                                <div style={{ fontSize: '1rem', color: 'var(--txt-3)' }}>Loading events...</div>
                            </div>
                        ) : eventsTab === 'calendar' ? (
                            <div className="card p-5" style={{ background: 'var(--card)' }}>
                                <EventsCalendar events={collegeEvents} />
                            </div>
                        ) : (() => {
                            const matchRange = (ev) => {
                                const d = ev.singleDay ? ev.date : ev.dateFrom;
                                if (!d) return true;
                                if (dateFilterType === 'all') return true;
                                if (dateFilterType === 'specific-month') {
                                    return d.substring(0, 7) === `${filterYear}-${filterMonth}`;
                                }
                                if (dateFilterType === 'specific') {
                                    if (!specificDate) return true;
                                    if (ev.singleDay) {
                                        return ev.date === specificDate;
                                    } else {
                                        return specificDate >= ev.dateFrom && specificDate <= ev.dateTo;
                                    }
                                }
                                if (dateFilterType === 'range') {
                                    if (!fromDate && !toDate) return true;
                                    if (fromDate && toDate) return d >= fromDate && d <= toDate;
                                    if (fromDate) return d >= fromDate;
                                    return d <= toDate;
                                }
                                return true;
                            };
                            const filteredCollege = collegeEvents.filter(matchRange);
                            const filteredExternal = externalEvents.filter(matchRange);
                            const hasFilter = dateFilterType !== 'all';
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {eventsTab === 'college' && (
                                        <div>
                                            <h3 className="text-lg mb-4" style={{ fontWeight: 700 }}>College Events <span style={{ fontSize: '0.85rem', color: 'var(--txt-3)', fontWeight: 500 }}>({filteredCollege.length})</span></h3>
                                            {filteredCollege.length === 0 ? (
                                                <div className="card p-6 text-center text-muted" style={{ background: 'var(--card)' }}>No college events{hasFilter ? ' matching the selected date filter' : ''}.</div>
                                            ) : (
                                                <div className="grid-cols-3 gap-4">
                                                    {filteredCollege.map(event => renderCollegeEventCard(event))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {eventsTab === 'external' && (
                                        <div>
                                            <h3 className="text-lg mb-4" style={{ fontWeight: 700 }}>External Events <span style={{ fontSize: '0.85rem', color: 'var(--txt-3)', fontWeight: 500 }}>({filteredExternal.length})</span></h3>
                                            {filteredExternal.length === 0 ? (
                                                <div className="card p-6 text-center text-muted" style={{ background: 'var(--card)' }}>No external events{hasFilter ? ' in this date range' : ''}.</div>
                                            ) : (
                                                <div className="grid-cols-3 gap-4">
                                                    {filteredExternal.map(event => renderCollegeEventCard(event))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {activeTab === "circulars" && (
                    <UserCircularsView userRole="college" />
                )}
            </main>

            {/* Event Detail Modal */}
            {showEventDetailModal && selectedEvent && (
                <div className="modal-overlay" onClick={() => setShowEventDetailModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="flex-between mb-4">
                            <h2 className="mb-0" style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedEvent.name}</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowEventDetailModal(false)}>&times;</button>
                        </div>
                        <div className="d-flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
                            <span className="badge badge-secondary">{selectedEvent.category}</span>
                            <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary-color)' }}>{selectedEvent.level}</span>
                            {selectedEvent.eventCode && <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)', alignSelf: 'center' }}>{selectedEvent.eventCode}</span>}
                        </div>
                        <p style={{ color: 'var(--txt-2)', lineHeight: 1.6 }}>{selectedEvent.description}</p>
                        <div className="grid-cols-2 gap-3 mt-3" style={{ fontSize: '0.85rem' }}>
                            <div><span style={{ color: 'var(--txt-3)' }}>Date:</span> <strong>{selectedEvent.singleDay ? selectedEvent.date : `${selectedEvent.dateFrom} – ${selectedEvent.dateTo}`}</strong></div>
                            <div><span style={{ color: 'var(--txt-3)' }}>Venue:</span> <strong>{selectedEvent.venue}</strong></div>
                            <div><span style={{ color: 'var(--txt-3)' }}>Organising Unit:</span> <strong>{selectedEvent.unitId?.unitNumber || '—'}</strong></div>
                            <div><span style={{ color: 'var(--txt-3)' }}>Sponsorship:</span> <strong>{selectedEvent.sponsorship || '—'}</strong></div>
                            {selectedEvent.report?.submittedAt && (
                                <>
                                    <div><span style={{ color: 'var(--txt-3)' }}>Participants:</span> <strong>{selectedEvent.report.participantsCount}</strong></div>
                                    <div><span style={{ color: 'var(--txt-3)' }}>Outcome:</span> <strong>{selectedEvent.report.outcome || '—'}</strong></div>
                                </>
                            )}
                        </div>
                        {selectedEvent.images?.length > 0 && (
                            <div className="mt-4">
                                <div style={{ fontSize: '0.8rem', color: 'var(--txt-3)', marginBottom: '0.5rem' }}>Event Images</div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {selectedEvent.images.map((img, i) => (
                                        <img key={i} src={img} alt="event" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals & Overlays */}
            {showUnitModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="flex-between mb-4">
                            <h2 className="mb-0">Create New Unit</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowUnitModal(false)}>&times;</button>
                        </div>

                        <div className="grid-cols-3 mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Unit Name</label>
                                <div className="form-input" style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed', opacity: 0.8, display: 'flex', alignItems: 'center', height: '38px' }}>
                                    {`Unit ${units.length + 1}`}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Unit Password</label>
                                <input className="form-input" type="password" placeholder="Set password" value={newUnitPassword} onChange={(e) => setNewUnitPassword(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">College Passkey</label>
                                <input className="form-input" type="password" placeholder="Enter passkey" value={collegePasskey} onChange={(e) => setCollegePasskey(e.target.value)} />
                            </div>
                        </div>

                        {/* Program Officer details */}
                        <div className="mb-6" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                            <h3 className="mb-3 text-lg" style={{ color: 'var(--txt-1)', fontWeight: 700 }}>Program Officer Details (Unit Head)</h3>

                            <div className="grid-cols-2 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name <span style={{ color: 'red' }}>*</span></label>
                                    <input className="form-input" type="text" placeholder="PO Name" value={poName} onChange={(e) => setPoName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designation <span style={{ color: 'red' }}>*</span></label>
                                    <input className="form-input" type="text" placeholder="Designation" value={poDesignation} onChange={(e) => setPoDesignation(e.target.value)} required />
                                </div>
                            </div>

                            <div className="grid-cols-2 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Department <span style={{ color: 'red' }}>*</span></label>
                                    <input className="form-input" type="text" placeholder="Department" value={poDepartment} onChange={(e) => setPoDepartment(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Birth</label>
                                    <input className="form-input" type="date" value={poDob} onChange={(e) => setPoDob(e.target.value)} />
                                </div>
                            </div>

                            <div className="grid-cols-3 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Community</label>
                                    <select className="form-input" value={poCommunity} onChange={(e) => setPoCommunity(e.target.value)}>
                                        <option value="General">General</option>
                                        <option value="SC">SC</option>
                                        <option value="ST">ST</option>
                                        <option value="OBC">OBC</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email ID <span style={{ color: 'red' }}>*</span></label>
                                    <input className="form-input" type="email" placeholder="Email" value={poEmail} onChange={(e) => setPoEmail(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mobile Number <span style={{ color: 'red' }}>*</span></label>
                                    <input className="form-input" type="text" placeholder="Mobile" value={poMobile} onChange={(e) => setPoMobile(e.target.value)} required />
                                </div>
                            </div>

                            <div className="grid-cols-3 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Date of Appointment</label>
                                    <input className="form-input" type="date" value={poDateOfAppointment} onChange={(e) => setPoDateOfAppointment(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Teaching Experience (Years)</label>
                                    <input className="form-input" type="text" placeholder="e.g. 5" value={poTeachingExperience} onChange={(e) => setPoTeachingExperience(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Qualification</label>
                                    <input className="form-input" type="text" placeholder="e.g. Ph.D" value={poQualification} onChange={(e) => setPoQualification(e.target.value)} />
                                </div>
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label">Address</label>
                                <input className="form-input" type="text" placeholder="Personal Address" value={poAddress} onChange={(e) => setPoAddress(e.target.value)} />
                            </div>

                            <div className="grid-cols-4 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Block</label>
                                    <input className="form-input" type="text" placeholder="Block" value={poBlock} onChange={(e) => setPoBlock(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Taluk</label>
                                    <input className="form-input" type="text" placeholder="Taluk" value={poTaluk} onChange={(e) => setPoTaluk(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">District</label>
                                    <input className="form-input" type="text" placeholder="District" value={poDistrict} onChange={(e) => setPoDistrict(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Pincode</label>
                                    <input className="form-input" type="text" placeholder="Pincode" value={poPincode} onChange={(e) => setPoPincode(e.target.value)} maxLength={6} />
                                </div>
                            </div>

                            {/* Profile Image upload */}
                            <div className="grid-cols-2 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Profile Image</label>
                                    <input className="form-input" type="file" accept="image/*" onChange={handlePoImageChange} />
                                </div>
                                {poImage && (
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <img src={poImage} alt="PO Preview" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                                        <button type="button" className="btn btn-sm btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setPoImage(null)}>Remove Preview</button>
                                    </div>
                                )}
                            </div>

                            {/* Seminars attended list */}
                            <div className="form-group mb-3">
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Orientation / Refresher Seminars Attended</span>
                                    <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => addPoDynamicField("seminars")}>+ Add Seminar</button>
                                </label>
                                {poSeminars.map((sem, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input className="form-input" type="text" placeholder={`Seminar ${idx + 1}`} value={sem} onChange={(e) => handlePoDynamicChange(idx, "seminars", e.target.value)} style={{ flex: 1 }} />
                                        {poSeminars.length > 1 && (
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => removePoDynamicField(idx, "seminars")}>&times;</button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* NSS Experience list */}
                            <div className="form-group mb-3">
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>NSS Experience (If any)</span>
                                    <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => addPoDynamicField("nssExperience")}>+ Add Experience</button>
                                </label>
                                {poNssExperience.map((exp, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input className="form-input" type="text" placeholder={`Experience details ${idx + 1}`} value={exp} onChange={(e) => handlePoDynamicChange(idx, "nssExperience", e.target.value)} style={{ flex: 1 }} />
                                        {poNssExperience.length > 1 && (
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => removePoDynamicField(idx, "nssExperience")}>&times;</button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Special Talent list */}
                            <div className="form-group mb-3">
                                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Special Talents</span>
                                    <button type="button" className="btn btn-sm btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => addPoDynamicField("specialTalent")}>+ Add Talent</button>
                                </label>
                                {poSpecialTalent.map((tal, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input className="form-input" type="text" placeholder={`Special Talent ${idx + 1}`} value={tal} onChange={(e) => handlePoDynamicChange(idx, "specialTalent", e.target.value)} style={{ flex: 1 }} />
                                        {poSpecialTalent.length > 1 && (
                                            <button type="button" className="btn btn-danger btn-sm" onClick={() => removePoDynamicField(idx, "specialTalent")}>&times;</button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Achievements */}
                            <div className="form-group mb-3">
                                <label className="form-label">Achievements</label>
                                <textarea className="form-input" rows="2" placeholder="List any achievements..." value={poAchievements} onChange={(e) => setPoAchievements(e.target.value)} style={{ resize: 'vertical', width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-card)', color: 'var(--txt-1)' }} />
                            </div>

                            {/* ETI Training & Certificate */}
                            <div className="grid-cols-2 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'center' }}>
                                <div className="form-group">
                                    <label className="form-label">ETI Training completed?</label>
                                    <select className="form-input" value={poEtlTraining ? "Yes" : "No"} onChange={(e) => setPoEtlTraining(e.target.value === "Yes")}>
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </div>
                                {poEtlTraining && (
                                    <div className="form-group">
                                        <label className="form-label">ETI Certificate Upload</label>
                                        <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handlePoEtlCertificateChange} />
                                    </div>
                                )}
                            </div>
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

                        <div className="alert alert-warning mb-4" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            <span>Caution: Assigning a new head will automatically unassign the current head of that unit.</span>
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


        </div>
    );
};

export default CollegeDashboard;