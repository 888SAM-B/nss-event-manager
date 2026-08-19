import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import toast from 'react-hot-toast';
import ThemeToggle from "./ThemeToggle";
import VolunteerEnrolmentModal from "./VolunteerEnrolmentModal";
import UnitReportGenerator from "./UnitReportGenerator";
import ProgramOfficerModal from "./ProgramOfficerModal";
import EventsCalendar from "./EventsCalendar";
import CircularBellNotification from "./CircularBellNotification";
import UserCircularsView from "./UserCircularsView";

const UnitDashboard = () => {
    const navigate = useNavigate();

    const [unit, setUnit] = useState(null);
    const [college, setCollege] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [filterBatch, setFilterBatch] = useState("");
    const [filterCommunity, setFilterCommunity] = useState("");
    const [filterBloodGroup, setFilterBloodGroup] = useState("");
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

    // Adopting Villages State
    const [showVillageModal, setShowVillageModal] = useState(false);
    const [newVillage, setNewVillage] = useState({ name: "", address: "", block: "", taluk: "", district: "", pincode: "", distance: "" });
    const [isAddingVillage, setIsAddingVillage] = useState(false);
    const [showEditPoModal, setShowEditPoModal] = useState(false);

    // Events State
    const [unitEvents, setUnitEvents] = useState([]);
    const [collegeEvents, setCollegeEvents] = useState([]);
    const [externalEvents, setExternalEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Add/Edit Event Form State
    const [showEventFormModal, setShowEventFormModal] = useState(false);
    const [isEditingEvent, setIsEditingEvent] = useState(null);
    const [isExternalEventForm, setIsExternalEventForm] = useState(false);
    const [eventForm, setEventForm] = useState({
        name: "",
        description: "",
        category: "Blood Donation",
        otherCategory: "",
        singleDay: true,
        date: "",
        dateFrom: "",
        dateTo: "",
        timeFrom: "",
        timeTo: "",
        venue: "",
        resourcePerson: "",
        level: "College",
        sponsorship: "",
        registeredMeriBharath: "No",
        meriBharathUrl: "",
        images: [],
        brochure: "",
        attendees: []
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [brochureFile, setBrochureFile] = useState(null);
    const [uploadingBrochure, setUploadingBrochure] = useState(false);

    // Collaboration units
    const [availableUnits, setAvailableUnits] = useState([]);
    const [collaborators, setCollaborators] = useState([]);
    const [selectedCollaborator, setSelectedCollaborator] = useState("");

    // Bank Details States & Handlers
    const [showEditBankModal, setShowEditBankModal] = useState(false);
    const [bankOtpStep, setBankOtpStep] = useState(1); // 1: Request OTP, 2: Enter OTP & Edit
    const [bankOtpInput, setBankOtpInput] = useState("");
    const [bankOtpSending, setBankOtpSending] = useState(false);
    const [bankOtpMaskedEmail, setBankOtpMaskedEmail] = useState("");
    const [editBankDetails, setEditBankDetails] = useState({
        zbsca: { accountNo: "", bankName: "", branchName: "", ifscCode: "" },
        vendor: { vendorName: "", accountNo: "", bankName: "", branchName: "", ifscCode: "" }
    });

    const maskAcc = (acc) => {
        if (!acc) return "N/A";
        const str = String(acc).trim();
        if (str.length <= 4) return str;
        return "•".repeat(str.length - 4) + str.slice(-4);
    };

    const handleOpenBankEditModal = () => {
        setBankOtpStep(1);
        setBankOtpInput("");
        setBankOtpMaskedEmail("");
        setEditBankDetails({
            zbsca: {
                accountNo: unit?.bankDetails?.zbsca?.accountNo || "",
                bankName: unit?.bankDetails?.zbsca?.bankName || "",
                branchName: unit?.bankDetails?.zbsca?.branchName || "",
                ifscCode: unit?.bankDetails?.zbsca?.ifscCode || ""
            },
            vendor: {
                vendorName: unit?.bankDetails?.vendor?.vendorName || "",
                accountNo: unit?.bankDetails?.vendor?.accountNo || "",
                bankName: unit?.bankDetails?.vendor?.bankName || "",
                branchName: unit?.bankDetails?.vendor?.branchName || "",
                ifscCode: unit?.bankDetails?.vendor?.ifscCode || ""
            }
        });
        setShowEditBankModal(true);
    };

    const handleSendBankOtp = async () => {
        setBankOtpSending(true);
        try {
            const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken");
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/send-unit-bank-otp`,
                { unitCode: unit.unitNumber, collegeCode: college.code },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                toast.success(res.data.message || "OTP sent to Programme Officer email!");
                setBankOtpMaskedEmail(res.data.emailMasked || "");
                setBankOtpStep(2);
            } else {
                toast.error(res.data.message || "Failed to send OTP");
            }
        } catch (err) {
            console.error("Error sending bank OTP:", err);
            toast.error(err.response?.data?.message || "Server error sending OTP");
        } finally {
            setBankOtpSending(false);
        }
    };

    const handleSaveBankDetailsWithOtp = async () => {
        if (!bankOtpInput || bankOtpInput.trim().length !== 6) {
            toast.error("Please enter the 6-digit OTP code sent to email.");
            return;
        }

        if (!editBankDetails.zbsca.accountNo.trim() || !editBankDetails.zbsca.ifscCode.trim()) {
            toast.error("ZBSCA Account Number and IFSC Code are mandatory.");
            return;
        }
        if (!editBankDetails.vendor.accountNo.trim() || !editBankDetails.vendor.ifscCode.trim()) {
            toast.error("Vendor Account Number and IFSC Code are mandatory.");
            return;
        }

        setBankOtpSending(true);
        try {
            const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken");
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/update-unit-bank-details`,
                {
                    unitCode: unit.unitNumber,
                    collegeCode: college.code,
                    otp: bankOtpInput.trim(),
                    bankDetails: editBankDetails
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                toast.success("Bank account details updated successfully!");
                setUnit({ ...unit, bankDetails: res.data.bankDetails || editBankDetails });
                setShowEditBankModal(false);
            } else {
                toast.error(res.data.message || "Failed to update bank details");
            }
        } catch (err) {
            console.error("Error updating bank details:", err);
            toast.error(err.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setBankOtpSending(false);
        }
    };

    // Event Report State
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportingEvent, setReportingEvent] = useState(null);
    const [reportForm, setReportForm] = useState({
        conductedOnDate: false,
        participantsCount: 0,
        beneficiariesCount: "",
        collegesCount: 0,
        outcome: "",
        reportPhotos: [],
        guests: [""],
        treesPlanted: "",
        bloodUnitsCollected: "",
        rallyDistance: ""
    });



    // Check if accessed from college dashboard (admin or college user)
    const isAccessedFromCollege = localStorage.getItem("nsstoken") !== null;

    const [activeTab, setActiveTab] = useState("overview");
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const generatePOPDF = async () => {
        const formElement = document.getElementById("po-form-template");
        const declElement = document.getElementById("po-declaration-template");
        if (!formElement || !declElement) return;

        toast.loading("Generating Multi-page PDF...");
        try {
            const { default: jsPDF } = await import("jspdf");
            const { default: html2canvas } = await import("html2canvas");
            
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 12; // 12mm margins
            const maxWidth = pdfWidth - (margin * 2);
            const maxHeight = pdfHeight - (margin * 2);

            // Page 1: Nomination Form
            formElement.style.display = "block";
            const canvas1 = await html2canvas(formElement, { scale: 2, useCORS: true, logging: false });
            formElement.style.display = "none";
            const imgData1 = canvas1.toDataURL("image/png");
            const imgProps1 = pdf.getImageProperties(imgData1);
            
            let imgWidth1 = maxWidth;
            let imgHeight1 = (imgProps1.height * imgWidth1) / imgProps1.width;
            if (imgHeight1 > maxHeight) {
                imgHeight1 = maxHeight;
                imgWidth1 = (imgProps1.width * imgHeight1) / imgProps1.height;
            }
            const xPos1 = margin + (maxWidth - imgWidth1) / 2;
            const yPos1 = margin + (maxHeight - imgHeight1) / 2;
            pdf.addImage(imgData1, "PNG", xPos1, yPos1, imgWidth1, imgHeight1);

            // Page 1 Border
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.rect(8, 8, pdfWidth - 16, pdfHeight - 16);

            // Page 2: Declaration
            pdf.addPage();
            declElement.style.display = "block";
            const canvas2 = await html2canvas(declElement, { scale: 2, useCORS: true, logging: false });
            declElement.style.display = "none";
            const imgData2 = canvas2.toDataURL("image/png");
            const imgProps2 = pdf.getImageProperties(imgData2);
            
            let imgWidth2 = maxWidth;
            let imgHeight2 = (imgProps2.height * imgWidth2) / imgProps2.width;
            if (imgHeight2 > maxHeight) {
                imgHeight2 = maxHeight;
                imgWidth2 = (imgProps2.width * imgHeight2) / imgProps2.height;
            }
            const xPos2 = margin + (maxWidth - imgWidth2) / 2;
            const yPos2 = margin + (maxHeight - imgHeight2) / 2;
            pdf.addImage(imgData2, "PNG", xPos2, yPos2, imgWidth2, imgHeight2);

            // Page 2 Border
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.rect(8, 8, pdfWidth - 16, pdfHeight - 16);

            pdf.save(`NSS_Nomination_${unit.head.name.replace(/\s+/g, "_")}.pdf`);
            toast.dismiss();
            toast.success("Programme Officer Nomination Form Downloaded!");
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.dismiss();
            toast.error("Failed to generate PDF");
        }
    };

    const fetchDashboardData = () => {
        const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken");
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
    };

    useEffect(() => {
        fetchDashboardData();
    }, [navigate]);

    const fetchDashboardEvents = async () => {
        const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken");
        if (!token) return;

        const unitCode = localStorage.getItem("nssunitCode");
        const collegeCode = localStorage.getItem("nsscollegeCode");
        if (!unitCode || !collegeCode) return;

        setLoadingEvents(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/getEvents/${collegeCode}/${unitCode}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUnitEvents(res.data.unitEvents || []);
                setCollegeEvents(res.data.collegeEvents || []);
                setExternalEvents(res.data.externalEvents || []);
            }
        } catch (err) {
            console.error("Error fetching events:", err);
            toast.error("Failed to load events");
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        if (activeTab === "events") {
            fetchDashboardEvents();
            const collegeCode = localStorage.getItem("nsscollegeCode");
            const unitCode = localStorage.getItem("nssunitCode");
            if (collegeCode) {
                axios.get(`${import.meta.env.VITE_API_URL}/units/${collegeCode}`)
                    .then(res => {
                        if (res.data.success) {
                            const otherUnits = res.data.units.filter(u => u.unitNumber !== unitCode);
                            setAvailableUnits(otherUnits);
                        }
                    })
                    .catch(err => console.error("Error fetching units:", err));
            }
        }
    }, [activeTab]);

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

    const filteredMembers = unit?.members?.filter((m) => {
        const matchesSearch = `${m.name} ${m.dept} ${m.regNo} ${m.course} ${m.batchFrom} ${m.batchTo}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesBatch = filterBatch === "" || String(m.batchFrom) === filterBatch || String(m.batchTo) === filterBatch;
        const matchesCommunity = filterCommunity === "" || m.community === filterCommunity;
        const matchesBloodGroup = filterBloodGroup === "" || m.bloodGroup === filterBloodGroup;
        return matchesSearch && matchesBatch && matchesCommunity && matchesBloodGroup;
    }) || [];

    // Reset to page 1 when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterBatch, filterCommunity, filterBloodGroup]);

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

    // --- NSS Events Portal Methods ---
    const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
    const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;
    const CLOUDINARY_PDF_CLOUD_NAME = import.meta.env.VITE_PDF_CLOUD_NAME;
    const CLOUDINARY_PDF_UPLOAD_PRESET = import.meta.env.VITE_PDF_UPLOAD_PRESET;

    const standardCategories = [
        "Special Camp", "Blood Donation", "Tree Plantation", "Cleanliness Drive", "Awareness Programme",
        "Conference", "Seminar", "Workshop", "Sports", "Cultural", "Health",
        "Environmental", "Social", "Exhibition", "Health care", "Creation of Assets"
    ];

    const [eventsTab, setEventsTab] = useState("all"); // "all" | "my" | "college" | "external" | "calendar"
    const [dateFilterType, setDateFilterType] = useState("all"); // "all" | "this-month" | "specific" | "range"
    const [specificDate, setSpecificDate] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
    const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
    const [volunteerSearch, setVolunteerSearch] = useState("");

    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportFiles, setReportFiles] = useState({ pdf: null, photos: [] });

    const getEventStatus = (event) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate, endDate;

        if (event.singleDay) {
            startDate = new Date(event.date);
            endDate = new Date(event.date);
        } else {
            startDate = new Date(event.dateFrom);
            endDate = new Date(event.dateTo);
        }

        if (isNaN(startDate.getTime())) {
            startDate = new Date();
        }
        if (isNaN(endDate.getTime())) {
            endDate = new Date();
        }

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if (event.report && event.report.submittedAt) {
            return { label: 'Report Submitted', color: 'var(--success-500)', bg: 'rgba(34,197,94,0.1)' };
        }

        if (today > endDate) {
            return { label: 'Completed', color: 'var(--danger-500)', bg: 'rgba(239,68,68,0.1)' };
        } else if (today < startDate) {
            return { label: 'Upcoming', color: 'var(--primary-color)', bg: 'rgba(37,99,235,0.1)' };
        } else {
            return { label: 'Ongoing', color: 'var(--warning-500)', bg: 'rgba(245,158,11,0.1)' };
        }
    };

    const renderEventCard = (event, isMyEvent, isExternalEvent) => {
        const status = getEventStatus(event);
        const dateStr = event.singleDay 
            ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : `${new Date(event.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(event.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

        const isCompleted = status.label === 'Completed' || status.label === 'Report Submitted';

        return (
            <div key={event._id} className="card p-5 d-flex flex-column justify-content-between" style={{ height: '340px', background: 'var(--card)', overflow: 'hidden' }}>
                <div>
                    {/* Badges */}
                    <div className="flex-between mb-2">
                        <span className="badge" style={{ color: status.color, background: status.bg, fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            {status.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)', fontWeight: 600 }}>
                            {event.eventCode}
                        </span>
                    </div>

                    {/* Title and Category */}
                    <span className="badge badge-secondary mb-2" style={{ fontSize: '0.65rem' }}>{event.category}</span>
                    <h4 style={{ 
                        fontSize: '1.05rem', 
                        fontWeight: 700, 
                        margin: '0 0 6px', 
                        color: 'var(--txt-1)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '2.6em',
                        lineHeight: '1.3',
                        wordBreak: 'break-word'
                    }}>
                        {event.name}
                    </h4>

                    {/* Description */}
                    <p className="text-sm text-muted mb-3" style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '2.8em',
                        lineHeight: '1.4',
                        margin: 0,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                    }}>
                        {event.description}
                    </p>
                </div>

                {/* Date, Venue and Buttons */}
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--txt-2)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginBottom: '10px' }}>
                        <div className="d-flex align-items-center gap-1 mb-1" style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <span>{dateStr}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.venue}</span>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <button className="btn btn-secondary btn-sm flex-grow-1" onClick={() => { setSelectedEvent(event); setShowDetailModal(true); }}>
                            Details
                        </button>
                        {isCompleted && (isMyEvent || isExternalEvent) && (
                            <button 
                                className={`btn btn-sm ${event.report?.submittedAt ? 'btn-outline-success' : 'btn-success'} flex-grow-1`}
                                onClick={(e) => handleOpenReportModal(event, e)}
                            >
                                {event.report?.submittedAt ? 'Edit Report' : 'Submit Report'}
                            </button>
                        )}
                        {(isMyEvent || isExternalEvent) && !isCompleted && (
                            <div className="d-flex gap-1">
                                <button 
                                    className="btn btn-secondary btn-sm" 
                                    style={{ padding: '0.375rem' }} 
                                    title="Edit Event"
                                    onClick={() => handleOpenEventForm(true, event)}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button 
                                    className="btn btn-danger btn-sm" 
                                    style={{ padding: '0.375rem' }} 
                                    title="Delete Event"
                                    onClick={() => handleDeleteEventClick(event)}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const handleOpenEventForm = (isEdit, event = null, isExternal = false) => {
        setIsEditingEvent(isEdit ? event : null);
        setIsExternalEventForm(isEdit && event ? !!event.isExternal : isExternal);
        if (isEdit && event) {
            setEventForm({
                name: event.name || "",
                description: event.description || "",
                category: standardCategories.includes(event.category) ? event.category : "Other",
                otherCategory: standardCategories.includes(event.category) ? "" : (event.category || ""),
                singleDay: event.singleDay ?? true,
                date: event.date ? event.date.substring(0, 10) : "",
                dateFrom: event.dateFrom ? event.dateFrom.substring(0, 10) : "",
                dateTo: event.dateTo ? event.dateTo.substring(0, 10) : "",
                timeFrom: event.timeFrom || "",
                timeTo: event.timeTo || "",
                venue: event.venue || "",
                resourcePerson: event.resourcePerson || "",
                level: event.level || "College",
                sponsorship: event.sponsorship || "",
                registeredMeriBharath: event.registeredMeriBharath || "No",
                meriBharathUrl: event.meriBharathUrl || "",
                images: event.images || [],
                brochure: event.brochure || "",
                attendees: event.attendees ? event.attendees.map(a => typeof a === 'object' ? a._id : a) : []
            });
            setCollaborators(event.collaborators || []);
        } else {
            setEventForm({
                name: "",
                description: "",
                category: "Blood Donation",
                otherCategory: "",
                singleDay: true,
                date: "",
                dateFrom: "",
                dateTo: "",
                timeFrom: "",
                timeTo: "",
                venue: "",
                resourcePerson: "",
                level: "College",
                sponsorship: "",
                registeredMeriBharath: "No",
                meriBharathUrl: "",
                images: [],
                brochure: "",
                attendees: []
            });
            setCollaborators([]);
        }
        setSelectedFiles([]);
        setBrochureFile(null);
        setSelectedCollaborator("");
        setVolunteerSearch("");
        setShowEventFormModal(true);
    };

    const handleOpenReportModal = (event, e) => {
        if (e) e.stopPropagation();
        setReportingEvent(event);
        setReportForm({
            conductedOnDate: event.report?.conductedOnDate ?? true,
            participantsCount: event.report?.participantsCount || "",
            beneficiariesCount: event.report?.beneficiariesCount || "",
            collegesCount: event.report?.collegesCount || "",
            outcome: event.report?.outcome || "",
            reportPhotos: event.report?.reportPhotos || [],
            guests: event.report?.guests && event.report.guests.length > 0 ? event.report.guests : [""],
            treesPlanted: event.report?.treesPlanted || "",
            bloodUnitsCollected: event.report?.bloodUnitsCollected || "",
            rallyDistance: event.report?.rallyDistance || ""
        });
        setReportFiles({ pdf: null, photos: [] });
        setShowReportModal(true);
    };

    const handleReportInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setReportForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleReportFileChange = (e) => {
        const files = Array.from(e.target.files).slice(0, 5); // Max 5 photos
        setReportFiles(prev => ({ ...prev, photos: files }));
    };

    const uploadToCloudinary = async (file, resourceType = 'image', isPdf = false) => {
        const formData = new FormData();
        formData.append('file', file);

        const uploadPreset = isPdf ? CLOUDINARY_PDF_UPLOAD_PRESET : CLOUDINARY_UPLOAD_PRESET;
        const cloudName = isPdf ? CLOUDINARY_PDF_CLOUD_NAME : CLOUDINARY_CLOUD_NAME;
        const resourceType1 = isPdf ? 'raw' : 'image';
        formData.append('upload_preset', uploadPreset);
        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType1}/upload`,
            formData
        );
        return response.data.secure_url;
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (reportFiles.photos.length === 0 && reportForm.reportPhotos.length === 0) {
            toast.error("Please upload at least one photo (newspaper cutting, invitation, or certificate).");
            return;
        }
        setIsSubmittingReport(true);
        const toastId = toast.loading("Submitting report...");

        try {
            let photoUrls = [...reportForm.reportPhotos];

            if (reportFiles.photos.length > 0) {
                const uploadedPhotos = await Promise.all(
                    reportFiles.photos.map(file => uploadToCloudinary(file, 'image', false))
                );
                photoUrls = [...photoUrls.slice(0, 5 - uploadedPhotos.length), ...uploadedPhotos].slice(0, 5);
            }

            const finalReportData = {
                conductedOnDate: reportForm.conductedOnDate,
                participantsCount: Number(reportForm.participantsCount),
                // volunteersParticipated always equals participantsCount — no separate UI field
                volunteersParticipated: Number(reportForm.participantsCount) || 0,
                collegesCount: reportForm.collegesCount,
                outcome: reportForm.outcome,
                guests: reportForm.guests.filter(g => g.trim() !== ""),
                reportPhotos: photoUrls,
                submittedAt: new Date(),
                ...(reportForm.beneficiariesCount !== "" && { beneficiariesCount: Number(reportForm.beneficiariesCount) }),
                ...(reportingEvent.category === 'Tree Plantation' && reportForm.treesPlanted !== "" && { treesPlanted: Number(reportForm.treesPlanted) }),
                ...(reportingEvent.category === 'Blood Donation' && reportForm.bloodUnitsCollected !== "" && { bloodUnitsCollected: Number(reportForm.bloodUnitsCollected) }),
                ...(['Cleanliness Rally', 'Road Safety Awareness'].includes(reportingEvent.category) && reportForm.rallyDistance !== "" && { rallyDistance: Number(reportForm.rallyDistance) })
            };

            const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken");
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/submitReport`, {
                eventId: reportingEvent._id,
                reportData: finalReportData
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (res.data.success) {
                toast.success("Report submitted successfully!", { id: toastId });
                fetchDashboardEvents();
                setShowReportModal(false);
            }
        } catch (err) {
            console.error("Report submission error:", err);
            toast.error("Failed to submit report.", { id: toastId });
        } finally {
            setIsSubmittingReport(false);
        }
    };

    const handleEventFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];
        const invalidFiles = [];
        const MAX_FILE_SIZE = 250 * 1024; // 250KB

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                invalidFiles.push(file.name);
            } else {
                validFiles.push(file);
            }
        }

        if (invalidFiles.length > 0) {
            toast.error(`Files exceed 250KB limit: ${invalidFiles.join(', ')}`);
        }

        setSelectedFiles(validFiles);
    };

    const handleUploadEventImages = async () => {
        if (selectedFiles.length === 0) {
            toast.error("Please select files first.");
            return;
        }

        setUploading(true);
        const imageUrls = [...eventForm.images];
        const toastId = toast.loading("Uploading images...");

        try {
            for (const file of selectedFiles) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const response = await axios.post(
                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                    formData
                );
                imageUrls.push(response.data.secure_url);
            }

            setEventForm(prev => ({ ...prev, images: imageUrls }));
            setSelectedFiles([]);
            toast.success("Images uploaded successfully!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload images", { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleUploadEventBrochure = async () => {
        if (!brochureFile) return;

        setUploadingBrochure(true);
        const toastId = toast.loading("Uploading brochure...");
        try {
            const formData = new FormData();
            formData.append('file', brochureFile);
            formData.append('upload_preset', CLOUDINARY_PDF_UPLOAD_PRESET);

            const response = await axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_PDF_CLOUD_NAME}/raw/upload`,
                formData
            );
            setEventForm(prev => ({ ...prev, brochure: response.data.secure_url }));
            setBrochureFile(null);
            toast.success("Brochure uploaded successfully!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to upload brochure.", { id: toastId });
        } finally {
            setUploadingBrochure(false);
        }
    };

    const handleSaveEvent = async (e) => {
        e.preventDefault();

        if (!eventForm.name || !eventForm.description || !eventForm.venue) {
            toast.error("Please fill in Name, Description, and Venue.");
            return;
        }

        const categoryValue = eventForm.category === "Other" ? eventForm.otherCategory : eventForm.category;
        if (!categoryValue) {
            toast.error("Please select or enter a category.");
            return;
        }

        const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken");
        const unitCode = localStorage.getItem("nssunitCode");
        const collegeCode = localStorage.getItem("nsscollegeCode");

        const payload = {
            ...eventForm,
            category: categoryValue,
            unitCode,
            collegeCode,
            isExternal: isExternalEventForm,
            collaborators
        };

        if (!isExternalEventForm) {
            delete payload.attendees;
        }

        const toastId = toast.loading("Saving event...");
        try {
            let res;
            if (isEditingEvent) {
                res = await axios.put(`${import.meta.env.VITE_API_URL}/updateEvent`, {
                    eventId: isEditingEvent._id,
                    eventData: payload
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                res = await axios.post(`${import.meta.env.VITE_API_URL}/addEvent`, {
                    eventData: payload
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (res.data.success) {
                toast.success(isEditingEvent ? "Event updated successfully!" : "Event created successfully!", { id: toastId });
                setShowEventFormModal(false);
                fetchDashboardEvents();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save event", { id: toastId });
        }
    };

    const handleDeleteEventClick = async (event) => {
        if (!window.confirm(`Are you sure you want to delete "${event.name}"?`)) return;

        const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken");
        const unitCode = localStorage.getItem("nssunitCode");
        const collegeCode = localStorage.getItem("nsscollegeCode");

        const toastId = toast.loading("Deleting event...");
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/deleteEvent`, {
                eventId: event._id,
                unitCode,
                collegeCode
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("Event deleted successfully!", { id: toastId });
                fetchDashboardEvents();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete event", { id: toastId });
        }
    };


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

    const handleAddVillage = async () => {
        if (!newVillage.name || !newVillage.address || !newVillage.block || !newVillage.taluk || !newVillage.district || !newVillage.pincode) {
            toast.error("Please fill all village details");
            return;
        }
        if (newVillage.distance === "" || isNaN(newVillage.distance)) {
            toast.error("Please enter a valid numeric distance.");
            return;
        }
        if (Number(newVillage.distance) > 7) {
            toast.error("Distance exceeds the maximum limit of 7 KM");
            return;
        }
        setIsAddingVillage(true);
        const token = localStorage.getItem("unitToken");
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/add-village`, {
                collegeCode: college.code,
                name: newVillage.name,
                address: newVillage.address,
                block: newVillage.block,
                taluk: newVillage.taluk,
                district: newVillage.district,
                pincode: newVillage.pincode,
                distance: Number(newVillage.distance)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("Village added successfully!");
                setCollege({ ...college, adoptingVillages: res.data.adoptingVillages });
                setShowVillageModal(false);
                setNewVillage({ name: "", address: "", block: "", taluk: "", district: "", pincode: "", distance: "" });
            }
        } catch (error) {
            console.error("Error adding village:", error);
            toast.error(error.response?.data?.message || "Failed to add village");
        } finally {
            setIsAddingVillage(false);
        }
    };

    const handleDeleteVillage = async (index) => {
        if (!confirm("Are you sure you want to remove this village?")) return;
        const token = localStorage.getItem("unitToken");
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/delete-village`, {
                data: { collegeCode: college.code, villageIndex: index },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("Village removed successfully");
                setCollege({ ...college, adoptingVillages: res.data.adoptingVillages });
            }
        } catch (error) {
            console.error("Error deleting village:", error);
            toast.error(error.response?.data?.message || "Failed to remove village");
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
                    <CircularBellNotification onBellClick={() => setActiveTab('circulars')} />
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
                    <button className={`sidebar-item ${activeTab === 'circulars' ? 'active' : ''}`} onClick={() => { setActiveTab('circulars'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        Circulars & Notices
                    </button>
                    <button className={`sidebar-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => { setActiveTab('events'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                        NSS Events
                    </button>
                    <button className={`sidebar-item ${activeTab === 'volunteers' ? 'active' : ''}`} onClick={() => { setActiveTab('volunteers'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Volunteers
                    </button>
                    <button className={`sidebar-item ${activeTab === 'villages' ? 'active' : ''}`} onClick={() => { setActiveTab('villages'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        Adopted Villages
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
                    <button className={`sidebar-item ${activeTab === 'po-profile' ? 'active' : ''}`} onClick={() => { setActiveTab('po-profile'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Programme Officer
                    </button>
                    <button className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        Periodical Reports
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
                            <div className="d-flex align-items-center gap-3">
                                <CircularBellNotification onBellClick={() => setActiveTab('circulars')} />
                                {isAccessedFromCollege && (
                                    <button className="btn btn-secondary" onClick={() => navigate('/college-dashboard')}>
                                        ← College Dashboard
                                    </button>
                                )}
                            </div>
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
                                    <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>UNIT HEAD / PROGRAMME OFFICER</span>
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
                        {/* Header */}
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>NSS Events</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Manage events and track student volunteer participation</p>
                            </div>
                            <div className="d-flex gap-2">
                                <button className="btn btn-outline-primary" onClick={() => handleOpenEventForm(false, null, true)}>
                                    + Add External Event
                                </button>
                                <button className="btn btn-primary" onClick={() => handleOpenEventForm(false, null, false)}>
                                    + Add Unit Event
                                </button>
                            </div>
                        </div>

                        {/* Event Category Tabs + Date Filter */}
                        <div className="d-flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingTop: '0.5rem', paddingBottom: '1rem', overflowX: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
                            <button className={`btn btn-sm ${eventsTab === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setEventsTab('all'); setDateFilterType('all'); setSpecificDate(''); setFromDate(''); setToDate(''); }}>
                                All Events ({unitEvents.length + collegeEvents.length + externalEvents.length})
                            </button>
                            <button className={`btn btn-sm ${eventsTab === 'my' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setEventsTab('my'); setDateFilterType('all'); setSpecificDate(''); setFromDate(''); setToDate(''); }}>
                                My Events ({unitEvents.length})
                            </button>
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
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--txt-3)', marginTop: '2px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    <select
                                        className="form-control"
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
                                                className="form-control"
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
                                                className="form-control"
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
                                            className="form-control"
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
                                                className="form-control"
                                                style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem', borderRadius: '6px', height: 34, minWidth: 130 }}
                                                value={fromDate}
                                                onChange={e => setFromDate(e.target.value)}
                                                title="From date"
                                            />
                                            <span style={{ color: 'var(--txt-3)', fontSize: '0.8rem' }}>–</span>
                                            <input
                                                type="date"
                                                className="form-control"
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
                                <EventsCalendar events={unitEvents} />
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
                            const filteredUnit = unitEvents.filter(matchRange);
                            const filteredCollege = collegeEvents.filter(matchRange);
                            const filteredExternal = externalEvents.filter(matchRange);
                            const hasFilter = dateFilterType !== 'all';
                            const noResults = hasFilter && (
                                (eventsTab === 'all' && filteredUnit.length + filteredCollege.length + filteredExternal.length === 0)
                                || (eventsTab === 'my' && filteredUnit.length === 0)
                                || (eventsTab === 'college' && filteredCollege.length === 0)
                                || (eventsTab === 'external' && filteredExternal.length === 0)
                            );
                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {noResults && (
                                        <div className="card p-6 text-center text-muted" style={{ background: 'var(--card)' }}>
                                            No events found matching the selected date filter.
                                        </div>
                                    )}
                                    {/* My Events */}
                                    {(eventsTab === 'all' || eventsTab === 'my') && (
                                        <div>
                                            <div className="flex-between mb-4">
                                                <h3 className="text-lg mb-0" style={{ fontWeight: 700 }}>My Unit Events <span style={{ fontSize: '0.85rem', color: 'var(--txt-3)', fontWeight: 500 }}>({filteredUnit.length})</span></h3>
                                                {eventsTab === 'my' && (
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenEventForm(false, null, false)}>
                                                        + Add Event
                                                    </button>
                                                )}
                                            </div>
                                            {filteredUnit.length === 0 ? (
                                                <div className="card p-6 text-center text-muted" style={{ background: 'var(--card)' }}>No unit events{hasFilter ? ' in this date range' : ' created yet'}.</div>
                                            ) : (
                                                <div className="grid-cols-3 gap-4">
                                                    {filteredUnit.map(event => renderEventCard(event, true, false))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* College Events */}
                                    {(eventsTab === 'all' || eventsTab === 'college') && (
                                        <div>
                                            <h3 className="text-lg mb-4" style={{ fontWeight: 700 }}>College Events <span style={{ fontSize: '0.85rem', color: 'var(--txt-3)', fontWeight: 500 }}>({filteredCollege.length})</span></h3>
                                            {filteredCollege.length === 0 ? (
                                                <div className="card p-6 text-center text-muted" style={{ background: 'var(--card)' }}>No college events{hasFilter ? ' in this date range' : ' from other units'}.</div>
                                            ) : (
                                                <div className="grid-cols-3 gap-4">
                                                    {filteredCollege.map(event => renderEventCard(event, false, false))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* External Events */}
                                    {(eventsTab === 'all' || eventsTab === 'external') && (
                                        <div>
                                            <div className="flex-between mb-4">
                                                <h3 className="text-lg mb-0" style={{ fontWeight: 700 }}>External Events Participated <span style={{ fontSize: '0.85rem', color: 'var(--txt-3)', fontWeight: 500 }}>({filteredExternal.length})</span></h3>
                                                {eventsTab === 'external' && (
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenEventForm(false, null, true)}>
                                                        + Add External Event
                                                    </button>
                                                )}
                                            </div>
                                            {filteredExternal.length === 0 ? (
                                                <div className="card p-6 text-center text-muted" style={{ background: 'var(--card)' }}>No external participations{hasFilter ? ' in this date range' : ' logged'}.</div>
                                            ) : (
                                                <div className="grid-cols-3 gap-4">
                                                    {filteredExternal.map(event => renderEventCard(event, false, true))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
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
                            <div className="d-flex gap-3 mb-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end', width: '100%' }}>
                                <div className="form-group" style={{ flex: '2 1 200px', minWidth: '180px', marginBottom: 0 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt-3)', marginBottom: '0.25rem' }}>Search</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Search members (Name/RegNo/Dept)..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: '1 1 120px', minWidth: '100px', marginBottom: 0 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt-3)', marginBottom: '0.25rem' }}>Batch (Year)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. 2022"
                                        value={filterBatch}
                                        onChange={(e) => setFilterBatch(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: '1 1 150px', minWidth: '130px', marginBottom: 0 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt-3)', marginBottom: '0.25rem' }}>Community</label>
                                    <select
                                        className="form-input"
                                        value={filterCommunity}
                                        onChange={(e) => setFilterCommunity(e.target.value)}
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
                                <div className="form-group" style={{ flex: '1 1 150px', minWidth: '130px', marginBottom: 0 }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--txt-3)', marginBottom: '0.25rem' }}>Blood Group</label>
                                    <select
                                        className="form-input"
                                        value={filterBloodGroup}
                                        onChange={(e) => setFilterBloodGroup(e.target.value)}
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
                                {(search || filterBatch || filterCommunity || filterBloodGroup) && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ height: '38px', padding: '0 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        onClick={() => {
                                            setSearch("");
                                            setFilterBatch("");
                                            setFilterCommunity("");
                                            setFilterBloodGroup("");
                                        }}
                                        title="Clear all filters"
                                    >
                                        ✕ Clear
                                    </button>
                                )}
                                {selectedMemberIds.length > 0 && (
                                    <button className="btn btn-danger" style={{ height: '38px', marginLeft: 'auto' }} onClick={handleBulkDelete} disabled={isDeleting}>
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

                {activeTab === "villages" && (
                    <div>
                        <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>Adopted Villages</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>NSS adopted villages for community outreach</p>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowVillageModal(true)}
                            >
                                + Add Village
                            </button>
                        </div>

                        {college?.adoptingVillages && college.adoptingVillages.length > 0 ? (
                            <div className="grid-cols-3 gap-4">
                                {college.adoptingVillages.map((village, idx) => (
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
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginTop: '3px', opacity: 0.7 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                <p className="mb-0 text-sm" style={{ opacity: 0.9 }}>{village.address}</p>
                                            </div>
                                            <div className="d-flex flex-wrap gap-x-4 gap-y-1">
                                                <p className="mb-0 text-xs" style={{ opacity: 0.7 }}><strong className="text-white">Block:</strong> {village.block}</p>
                                                <p className="mb-0 text-xs" style={{ opacity: 0.7 }}><strong className="text-white">Taluk:</strong> {village.taluk}</p>
                                                <p className="mb-0 text-xs" style={{ opacity: 0.7 }}><strong className="text-white">Dist:</strong> {village.district}</p>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.7 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                                                <p className="mb-0 text-sm" style={{ opacity: 0.9 }}><strong className="text-white">Distance:</strong> {village.distance} KM</p>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.7 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
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
                )}

                {activeTab === "circulars" && (
                    <UserCircularsView userRole="unit" />
                )}

                {activeTab === "reports" && (
                    <UnitReportGenerator unit={unit} college={college} />
                )}

                {activeTab === "po-profile" && (
                    <div style={{ color: 'var(--txt-1)' }}>
                        <div className="flex-between mb-6">
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>Programme Officer Profile</h1>
                                <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Official designation, ETI training progress, and credentials for this unit's PO.</p>
                            </div>
                            {unit?.head && (
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button className="btn btn-outline-primary" onClick={() => setShowEditPoModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Edit Profile
                                    </button>
                                    <button className="btn btn-primary" onClick={generatePOPDF} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download Profile PDF
                                    </button>
                                </div>
                            )}
                        </div>

                        {!unit?.head ? (
                            <div className="card p-6 text-center" style={{ background: 'var(--card-bg)' }}>
                                <p className="text-muted mb-0">No Programme Officer is currently assigned to this unit.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
                                {/* Profile Left Card (Photo & Main) */}
                                <div className="card p-6" style={{ background: 'var(--card-bg)', textAlign: 'center' }}>
                                    <div style={{ 
                                        width: '120px', 
                                        height: '120px', 
                                        borderRadius: '50%', 
                                        border: '4px solid var(--brand-500)', 
                                        margin: '0 auto 1.25rem', 
                                        overflow: 'hidden',
                                        background: 'var(--bg-tertiary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {unit.head.image ? (
                                            <img src={unit.head.image} alt={unit.head.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{ fontSize: '2rem', color: 'var(--txt-3)', fontWeight: 'bold' }}>
                                                {unit.head.name?.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <h3 style={{ margin: '0 0 0.25rem 0', fontWeight: 800 }}>{unit.head.name}</h3>
                                    <p className="badge badge-secondary mb-3" style={{ display: 'inline-block' }}>{unit.head.officerID || 'No ID'}</p>
                                    
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '0.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                                        <div className="flex-between">
                                            <span style={{ color: 'var(--txt-3)' }}>Designation:</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.designation}</span>
                                        </div>
                                        <div className="flex-between">
                                            <span style={{ color: 'var(--txt-3)' }}>Department:</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.department}</span>
                                        </div>
                                        <div className="flex-between">
                                            <span style={{ color: 'var(--txt-3)' }}>NSS Unit:</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.unit || unit.unitNumber || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Right Card (Detailed Info) */}
                                <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                                    <h3 className="mb-4 text-primary-400" style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Personal & Academic Details</h3>
                                    <div className="grid-cols-2 gap-x-6 gap-y-4" style={{ fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>GENDER</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.gender || 'N/A'}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>DATE OF BIRTH</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.dob}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>COMMUNITY</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.community}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>QUALIFICATION</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.qualification}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>EMAIL ADDRESS</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>MOBILE NUMBER</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.mobile}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>DATE OF APPOINTMENT</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.dateOfAppointment}</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>TEACHING EXPERIENCE</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.teachingExperience || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <h3 className="mb-4 mt-6 text-primary-400" style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Training Status</h3>
                                    <div className="grid-cols-2 gap-x-6 gap-y-4" style={{ fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>ETI TRAINING COMPLETED</span>
                                            <span style={{ fontWeight: 600 }}>{unit.head.etlTraining ? 'Yes' : 'No'}</span>
                                        </div>
                                        {unit.head.etlCertificate && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--txt-3)' }}>ETI CERTIFICATE</span>
                                                <span>
                                                    <a href={unit.head.etlCertificate} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', padding: '2px 8px', fontSize: '0.75rem' }}>
                                                        View Certificate
                                                    </a>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {unit.head.achievements && (
                                        <>
                                            <h3 className="mb-3 mt-6 text-primary-400" style={{ fontSize: '1.15rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Achievements</h3>
                                            <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{unit.head.achievements}</p>
                                        </>
                                    )}
                                </div>

                                {/* Unit Bank Details Card */}
                                <div className="card p-6 mt-6" style={{ background: 'var(--card-bg)', gridColumn: '1 / -1' }}>
                                    <div className="flex-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                                        <div>
                                            <h3 className="text-primary-400 mb-1" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                                                <span>🏦</span>
                                                <span>Unit Bank Account Details (ZBSCA & Vendor)</span>
                                                <span className="badge badge-primary ml-2" style={{ fontSize: '0.72rem' }}>Funded Unit Accounts</span>
                                            </h3>
                                            <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.82rem' }}>
                                                Official Zero Balance Subsidiary Account and Vendor Account details for government grant disbursements. Account numbers are masked for security.
                                            </p>
                                        </div>
                                        <button className="btn btn-outline-primary btn-sm" onClick={handleOpenBankEditModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whitespace: 'nowrap' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> 🔒 Edit Bank Details (OTP Protected)
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                        {/* 1. ZBSCA Account Box */}
                                        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-500, #3b82f6)' }}>
                                                    1. ZBSCA Account (Zero Balance Subsidiary)
                                                </h4>
                                                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Active Account</span>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.85rem' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>Account Number (Masked)</span>
                                                    <p style={{ margin: '0.15rem 0 0', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '1px', fontSize: '0.95rem', color: 'var(--txt-1)' }}>
                                                        {maskAcc(unit?.bankDetails?.zbsca?.accountNo)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>IFSC Code</span>
                                                    <p style={{ margin: '0.15rem 0 0', fontWeight: 700, fontFamily: 'monospace', color: 'var(--txt-1)' }}>
                                                        {unit?.bankDetails?.zbsca?.ifscCode || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>Bank Name</span>
                                                    <p style={{ margin: '0.15rem 0 0', fontWeight: 600, color: 'var(--txt-1)' }}>
                                                        {unit?.bankDetails?.zbsca?.bankName || 'State Bank of India'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>Branch Name</span>
                                                    <p style={{ margin: '0.15rem 0 0', fontWeight: 600, color: 'var(--txt-1)' }}>
                                                        {unit?.bankDetails?.zbsca?.branchName || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Vendor Account Box */}
                                        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-500, #3b82f6)' }}>
                                                    2. Vendor Account Details
                                                </h4>
                                                <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Vendor Entity</span>
                                            </div>

                                            <div className="mb-2">
                                                <span style={{ fontSize: '0.72rem', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>Vendor / Entity Name</span>
                                                <p style={{ margin: '0.15rem 0 0', fontWeight: 700, color: 'var(--txt-1)' }}>
                                                    {unit?.bankDetails?.vendor?.vendorName || 'College NSS Vendor Entity'}
                                                </p>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>Account Number (Masked)</span>
                                                    <p style={{ margin: '0.15rem 0 0', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '1px', fontSize: '0.95rem', color: 'var(--txt-1)' }}>
                                                        {maskAcc(unit?.bankDetails?.vendor?.accountNo)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>IFSC Code</span>
                                                    <p style={{ margin: '0.15rem 0 0', fontWeight: 700, fontFamily: 'monospace', color: 'var(--txt-1)' }}>
                                                        {unit?.bankDetails?.vendor?.ifscCode || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>Bank Name</span>
                                                    <p style={{ margin: '0.15rem 0 0', fontWeight: 600, color: 'var(--txt-1)' }}>
                                                        {unit?.bankDetails?.vendor?.bankName || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--txt-3)', textTransform: 'uppercase', fontWeight: 700 }}>Branch Name</span>
                                                    <p style={{ margin: '0.15rem 0 0', fontWeight: 600, color: 'var(--txt-1)' }}>
                                                        {unit?.bankDetails?.vendor?.branchName || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                            <h2 className="mb-0">Assign Programme Officer</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setIsAssignModalOpen(false)}>&times;</button>
                        </div>
                        
                        <div className="p-2">
                            <p className="text-sm text-muted mb-4">Select an unassigned Programme Officer for this unit ({unit?.unitNumber}):</p>
                            
                            {unassignedOfficers.length === 0 ? (
                                <div className="text-center p-4">
                                    <p>No unassigned Programme Officers found in this college.</p>
                                    <p className="text-xs text-muted">Register a Programme Officer without assigning a unit first.</p>
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

                        <div className="form-group mb-3">
                            <label className="form-label">Distance from College (KM)</label>
                            <input
                                className="form-input"
                                type="number"
                                placeholder="e.g. 4.5 (Max 7 KM)"
                                value={newVillage.distance}
                                onChange={(e) => setNewVillage({ ...newVillage, distance: e.target.value })}
                                min="0"
                                max="7"
                                step="0.1"
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

            {/* HIDDEN PDF TEMPLATE */}
            {unit?.head && (
                <>
                    <div id="po-form-template" style={{
                        display: "none",
                        width: "210mm",
                        padding: "20mm",
                        backgroundColor: "#fff",
                        color: "#000",
                        fontFamily: "serif",
                        lineHeight: "1.6"
                    }}>
                        <style>{`
                            #po-form-template * {
                                color: #000 !important;
                            }
                            #po-form-template h1, 
                            #po-form-template h2, 
                            #po-form-template h3, 
                            #po-form-template h4, 
                            #po-form-template p, 
                            #po-form-template strong, 
                            #po-form-template li {
                                color: #000 !important;
                            }
                        `}</style>
                        <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
                            <h1 style={{ margin: "0", fontSize: "20px" }}>NOMINATION OF NEW PROGRAMME OFFICER TO LOOK AFTER</h1>
                            <h2 style={{ margin: "5px 0", fontSize: "20px" }}>THE NSS UNIT IN THE COLLEGE</h2>
                            <h3 style={{ margin: "10px 0 0 0", fontSize: "16px", textTransform: "uppercase", textDecoration: "underline" }}>{unit.head.college || college?.insName}</h3>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                            <div style={{ flex: 1 }}>
                                <p><strong>Name:</strong> {unit.head.name}</p>
                                <p><strong>Designation:</strong> {unit.head.designation}</p>
                                <p><strong>Department:</strong> {unit.head.department}</p>
                                <p><strong>Unit Assigned:</strong> {unit.head.unit}</p>
                            </div>
                            <div style={{ width: "35mm", height: "45mm", border: "1px solid #000", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                {unit.head.image ? (
                                    <img src={unit.head.image} alt="Officer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <span style={{ fontSize: "10px", textAlign: "center" }}>Affix Passport Size Photo</span>
                                )}
                            </div>
                        </div>

                        <h4 style={{ borderBottom: "1px solid #000", marginTop: "20px" }}>PERSONAL DETAILS</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                            <p><strong>Date of Birth:</strong> {unit.head.dob}</p>
                            <p><strong>Gender:</strong> {unit.head.gender || 'N/A'}</p>
                            <p><strong>Community:</strong> {unit.head.community}</p>
                            <p><strong>Email:</strong> {unit.head.email}</p>
                            <p><strong>Mobile:</strong> {unit.head.mobile}</p>
                            <p><strong>Block:</strong> {unit.head.block}</p>
                            <p><strong>Taluk:</strong> {unit.head.taluk}</p>
                            <p><strong>District:</strong> {unit.head.district}</p>
                            <p><strong>Pincode:</strong> {unit.head.pincode}</p>
                            <p><strong>Date of Appointment:</strong> {unit.head.dateOfAppointment}</p>
                            <p><strong>Teaching Experience:</strong> {unit.head.teachingExperience}</p>
                        </div>
                        <p style={{ marginTop: "10px" }}><strong>Address:</strong> {unit.head.address}</p>

                        <h4 style={{ borderBottom: "1px solid #000", marginTop: "20px" }}>ACADEMIC & ETI</h4>
                        <p><strong>Educational Qualification:</strong> {unit.head.qualification}</p>
                        <p><strong>ETI Training Completed:</strong> {unit.head.etiCompleted}</p>
                        <p><strong>Seminars / Workshops / Courses:</strong></p>
                        <ul style={{ paddingLeft: "20px" }}>
                            {unit.head.seminars && unit.head.seminars.map((s, i) => s && <li key={i}>{s}</li>)}
                        </ul>

                        <h4 style={{ borderBottom: "1px solid #000", marginTop: "20px" }}>GENERAL</h4>
                        <p><strong>NSS Experience:</strong></p>
                        <ul style={{ paddingLeft: "20px" }}>
                            {unit.head.nssExperience && unit.head.nssExperience.map((x, i) => x && <li key={i}>{x}</li>)}
                        </ul>
                        <p><strong>Special Talents / Skills:</strong></p>
                        <ul style={{ paddingLeft: "20px" }}>
                            {unit.head.specialTalent && unit.head.specialTalent.map((t, i) => t && <li key={i}>{t}</li>)}
                        </ul>

                        <div style={{ marginTop: "50px", display: "flex", justifyContent: "space-between" }}>
                            <div style={{ textAlign: "center" }}>
                                <br /><br />
                                <p>__________________________</p>
                                <p><strong>Signature of Programme Officer</strong></p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <br /><br />
                                <p>__________________________</p>
                                <p><strong>Signature of Principal / Head</strong></p>
                            </div>
                        </div>
                    </div>

                    {/* HIDDEN DECLARATION PAGE (PAGE 2) */}
                    <div id="po-declaration-template" style={{
                        display: "none",
                        width: "210mm",
                        padding: "20mm 25mm",
                        backgroundColor: "#fff",
                        color: "#000",
                        fontFamily: "serif",
                        lineHeight: "1.8",
                        minHeight: "297mm"
                    }}>
                        <style>{`
                            #po-declaration-template * {
                                color: #000 !important;
                            }
                        `}</style>
                        <div style={{ textAlign: "center", marginBottom: "50px" }}>
                            <h2 style={{ fontSize: "20px", textDecoration: "underline", fontWeight: "bold" }}>DECLARATION</h2>
                        </div>

                        <div style={{ textAlign: "justify", fontSize: "16px" }}>
                            <p>
                                I, <strong>{unit.head.name}</strong>, Designation: <strong>{unit.head.designation}</strong> ({unit.head.department}),
                                (Programme Officer-Unit-{unit.head.unit}) of <strong>{unit.head.college || college?.insName}</strong> here by assure that as NSS Programme Officer,
                                I will carry out the principles enunciated in the NSS Manual in true letter and spirit.
                            </p>
                            <p style={{ marginTop: "20px" }}>
                                I shall undergo the General Orientation Course within one year from the date of appointment as Programme Officer.
                            </p>
                            <p style={{ marginTop: "20px" }}>
                                I shall maintain the records prescribed in the Manual and handover them to the person(s) concerned as and when required.
                            </p>
                            <p style={{ marginTop: "20px" }}>
                                I shall discharge duties honestly to boost the image of the NSS and the parent Institution.
                            </p>
                        </div>

                        <div style={{ marginTop: "100px", textAlign: "right" }}>
                            <p><strong>Signature of the newly nominated NSS officer</strong></p>
                        </div>

                        <div style={{ marginTop: "80px" }}>
                            <p><strong>Countersigned</strong></p>
                        </div>

                        <div style={{ marginTop: "60px", textAlign: "right" }}>
                            <p><strong>Signature of the Principal with office seal</strong></p>
                        </div>
                    </div>
                </>
            )}
            {/* Event Details Modal */}
            {selectedEvent && !showReportModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-4">
                            <div>
                                <span className="badge badge-secondary mb-1">{selectedEvent.category}</span>
                                <h2 className="mb-0" style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedEvent.name}</h2>
                            </div>
                            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedEvent(null)}>&times;</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <p className="mb-2"><strong>Venue:</strong> {selectedEvent.venue}</p>
                                <p className="mb-2"><strong>Level:</strong> <span className="badge badge-primary">{selectedEvent.level || "College"}</span></p>
                                <p className="mb-2"><strong>Sponsorship:</strong> {selectedEvent.sponsorship || "N/A"}</p>
                            </div>
                            <div>
                                <p className="mb-2"><strong>Date:</strong> {selectedEvent.singleDay ? new Date(selectedEvent.date).toLocaleDateString() : `${new Date(selectedEvent.dateFrom).toLocaleDateString()} to ${new Date(selectedEvent.dateTo).toLocaleDateString()}`}</p>
                                <p className="mb-2"><strong>Time:</strong> {selectedEvent.timeFrom || "N/A"} - {selectedEvent.timeTo || "N/A"}</p>
                                {selectedEvent.resourcePerson && (
                                    <p className="mb-2"><strong>Resource Person:</strong> {selectedEvent.resourcePerson}</p>
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Description</h4>
                            <p className="text-muted" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{selectedEvent.description}</p>
                        </div>

                        {selectedEvent.brochure && (
                            <div className="mb-4">
                                <a href={selectedEvent.brochure} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                                    📄 Download Brochure / Circular
                                </a>
                            </div>
                        )}

                        {selectedEvent.collaborators && selectedEvent.collaborators.length > 0 && (
                            <div className="mb-4">
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Collaborators / Co-Organizers</h4>
                                <div className="d-flex flex-wrap gap-2">
                                    {selectedEvent.collaborators.map((c, i) => (
                                        <span key={i} className="badge badge-indigo" style={{ textTransform: 'none' }}>Unit {c}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                            <div className="mb-4">
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Participation List ({selectedEvent.attendees.length} Volunteers)</h4>
                                <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'var(--bg-2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <div className="d-flex flex-wrap gap-2">
                                        {selectedEvent.attendees.map(attendee => (
                                            <span key={attendee._id} className="badge badge-secondary" style={{ padding: '0.4rem 0.6rem', textTransform: 'none' }}>
                                                {attendee.name} ({attendee.regNo}) - {attendee.dept}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedEvent.images && selectedEvent.images.length > 0 && (
                            <div className="mb-4">
                                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Event Photos</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
                                    {selectedEvent.images.map((img, idx) => (
                                        <a href={img} target="_blank" rel="noopener noreferrer" key={idx} style={{ borderRadius: '6px', overflow: 'hidden', height: '90px', border: '1px solid var(--border)' }}>
                                            <img src={img} alt={`Event photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                            <button className="btn btn-secondary w-100" onClick={() => setSelectedEvent(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Add/Edit Form Modal */}
            {showEventFormModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-4">
                            <h2 className="mb-0" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                                {isEditingEvent ? "Edit" : "Create"} {isExternalEventForm ? "External Event" : "Event"}
                            </h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowEventFormModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleSaveEvent}>
                            <div className="form-group mb-3">
                                <label className="form-label">Event Name *</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={eventForm.name} 
                                    onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} 
                                    required 
                                    placeholder="e.g. Blood Donation Drive 2026"
                                />
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label">Description *</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3" 
                                    value={eventForm.description} 
                                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} 
                                    required
                                    placeholder="Briefly describe the objectives and details of the event..."
                                ></textarea>
                            </div>

                            <div className="grid-cols-2 gap-3 mb-3">
                                <div className="form-group">
                                    <label className="form-label">Category *</label>
                                    <select 
                                        className="form-control" 
                                        value={eventForm.category} 
                                        onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                                    >
                                        {standardCategories.map((cat, i) => (
                                            <option key={i} value={cat}>{cat}</option>
                                        ))}
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Event Level *</label>
                                    <select 
                                        className="form-control" 
                                        value={eventForm.level} 
                                        onChange={(e) => setEventForm({ ...eventForm, level: e.target.value })}
                                    >
                                        <option value="College">College Level</option>
                                        <option value="District">District Level</option>
                                        <option value="University">University Level</option>
                                        <option value="State">State Level</option>
                                        <option value="National">National Level</option>
                                    </select>
                                </div>
                            </div>

                            {eventForm.category === "Other" && (
                                <div className="form-group mb-3">
                                    <label className="form-label">Enter Category Name *</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={eventForm.otherCategory} 
                                        onChange={(e) => setEventForm({ ...eventForm, otherCategory: e.target.value })} 
                                        required 
                                    />
                                </div>
                            )}

                            <div className="form-group mb-3">
                                <label className="d-flex align-items-center cursor-pointer" style={{ textTransform: 'none' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={eventForm.singleDay} 
                                        onChange={(e) => setEventForm({ ...eventForm, singleDay: e.target.checked })} 
                                        className="form-check-input me-2" 
                                    />
                                    <span>Is this a single day event?</span>
                                </label>
                            </div>

                            {eventForm.singleDay ? (
                                <div className="form-group mb-3">
                                    <label className="form-label">Event Date *</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        value={eventForm.date} 
                                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} 
                                        required 
                                    />
                                </div>
                            ) : (
                                <div className="grid-cols-2 gap-3 mb-3">
                                    <div className="form-group">
                                        <label className="form-label">Start Date *</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            value={eventForm.dateFrom} 
                                            onChange={(e) => setEventForm({ ...eventForm, dateFrom: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date *</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            value={eventForm.dateTo} 
                                            onChange={(e) => setEventForm({ ...eventForm, dateTo: e.target.value })} 
                                            required 
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="grid-cols-2 gap-3 mb-3">
                                <div className="form-group">
                                    <label className="form-label">Start Time</label>
                                    <input 
                                        type="time" 
                                        className="form-control" 
                                        value={eventForm.timeFrom} 
                                        onChange={(e) => setEventForm({ ...eventForm, timeFrom: e.target.value })} 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Time</label>
                                    <input 
                                        type="time" 
                                        className="form-control" 
                                        value={eventForm.timeTo} 
                                        onChange={(e) => setEventForm({ ...eventForm, timeTo: e.target.value })} 
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label">Venue *</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    value={eventForm.venue} 
                                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })} 
                                    required 
                                    placeholder="e.g. College Seminar Hall"
                                />
                            </div>

                            <div className="grid-cols-2 gap-3 mb-3">
                                <div className="form-group">
                                    <label className="form-label">Resource Person / Guest</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={eventForm.resourcePerson} 
                                        onChange={(e) => setEventForm({ ...eventForm, resourcePerson: e.target.value })} 
                                        placeholder="e.g. Dr. John Doe"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sponsorship Details</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={eventForm.sponsorship} 
                                        onChange={(e) => setEventForm({ ...eventForm, sponsorship: e.target.value })} 
                                        placeholder="e.g. Rotary Club / Self Funded"
                                    />
                                </div>
                            </div>

                            <div className="grid-cols-2 gap-3 mb-3">
                                <div className="form-group">
                                    <label className="form-label">Register in MY Bharat Portal?</label>
                                    <select 
                                        className="form-control" 
                                        value={eventForm.registeredMeriBharath} 
                                        onChange={(e) => setEventForm({ ...eventForm, registeredMeriBharath: e.target.value })}
                                    >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </div>
                                {eventForm.registeredMeriBharath === "Yes" && (
                                    <div className="form-group">
                                        <label className="form-label">MY Bharat Event URL</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={eventForm.meriBharathUrl} 
                                            onChange={(e) => setEventForm({ ...eventForm, meriBharathUrl: e.target.value })} 
                                            placeholder="https://mybharat.gov.in/..."
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Volunteer Selection checklist ONLY FOR EXTERNAL EVENTS */}
                            {isExternalEventForm && (
                                <div className="form-group mb-4" style={{ background: 'var(--bg-2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <label className="fw-bold mb-2" style={{ fontSize: '0.8rem', color: 'var(--txt-1)' }}>Select Participating Volunteers *</label>
                                    <input 
                                        type="text" 
                                        className="form-control mb-3" 
                                        placeholder="Search volunteers by name or register number..." 
                                        value={volunteerSearch} 
                                        onChange={(e) => setVolunteerSearch(e.target.value)} 
                                    />
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--card)', padding: '10px' }}>
                                        {unit?.members?.filter(m => 
                                            m.name?.toLowerCase().includes(volunteerSearch.toLowerCase()) || 
                                            m.regNo?.toLowerCase().includes(volunteerSearch.toLowerCase())
                                        ).map(m => {
                                            const isChecked = eventForm.attendees?.includes(m._id);
                                            return (
                                                <label key={m._id} className="d-flex align-items-center mb-2 cursor-pointer text-sm" style={{ textTransform: 'none' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isChecked} 
                                                        onChange={() => {
                                                            const updated = isChecked
                                                                ? eventForm.attendees.filter(id => id !== m._id)
                                                                : [...(eventForm.attendees || []), m._id];
                                                            setEventForm(prev => ({ ...prev, attendees: updated }));
                                                        }} 
                                                        className="form-check-input me-2" 
                                                    />
                                                    <span>{m.name} ({m.regNo}) - {m.dept}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <small className="text-muted d-block mt-2">
                                        Selected: {eventForm.attendees?.length || 0} volunteer(s)
                                    </small>
                                </div>
                            )}

                            {/* Collaborations - ONLY FOR NON-EXTERNAL EVENTS */}
                            {!isExternalEventForm && (
                                <div className="form-group mb-4" style={{ background: 'var(--bg-2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <label className="fw-bold mb-2" style={{ fontSize: '0.8rem', color: 'var(--txt-1)' }}>Co-Organizing Units (Collaborations)</label>
                                    <div className="d-flex gap-2 mb-3">
                                        <select 
                                            className="form-control" 
                                            value={selectedCollaborator} 
                                            onChange={(e) => setSelectedCollaborator(e.target.value)}
                                        >
                                            <option value="">Select College Unit</option>
                                            {availableUnits.map((u, i) => (
                                                <option key={i} value={u.unitNumber}>Unit {u.unitNumber} ({u.name})</option>
                                            ))}
                                        </select>
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-primary"
                                            onClick={() => {
                                                if (selectedCollaborator && !collaborators.includes(selectedCollaborator)) {
                                                    setCollaborators([...collaborators, selectedCollaborator]);
                                                    setSelectedCollaborator("");
                                                }
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {collaborators.length > 0 && (
                                        <div className="d-flex flex-wrap gap-2">
                                            {collaborators.map((c, idx) => (
                                                <span key={idx} className="badge badge-indigo d-flex align-items-center gap-1" style={{ textTransform: 'none' }}>
                                                    Unit {c}
                                                    <span 
                                                        style={{ cursor: 'pointer', fontWeight: 'bold' }} 
                                                        onClick={() => setCollaborators(collaborators.filter(item => item !== c))}
                                                    >
                                                        ✕
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Images and Brochure Upload */}
                            <div className="grid-cols-2 gap-3 mb-4">
                                <div className="form-group">
                                    <label className="form-label">Upload Event Photos (Max 250KB each)</label>
                                    <div className="d-flex gap-2">
                                        <input 
                                            type="file" 
                                            className="form-control" 
                                            accept="image/*" 
                                            multiple 
                                            onChange={handleEventFileChange} 
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary btn-sm"
                                            disabled={uploading || selectedFiles.length === 0}
                                            onClick={handleUploadEventImages}
                                        >
                                            {uploading ? "..." : "Upload"}
                                        </button>
                                    </div>
                                    {eventForm.images && eventForm.images.length > 0 && (
                                        <small className="text-success d-block mt-1">✓ {eventForm.images.length} photos uploaded</small>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Upload Circular / Brochure (PDF)</label>
                                    <div className="d-flex gap-2">
                                        <input 
                                            type="file" 
                                            className="form-control" 
                                            accept="application/pdf" 
                                            onChange={(e) => setBrochureFile(e.target.files[0])} 
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary btn-sm"
                                            disabled={uploadingBrochure || !brochureFile}
                                            onClick={handleUploadEventBrochure}
                                        >
                                            {uploadingBrochure ? "..." : "Upload"}
                                        </button>
                                    </div>
                                    {eventForm.brochure && (
                                        <small className="text-success d-block mt-1">✓ Circular / Brochure uploaded</small>
                                    )}
                                </div>
                            </div>

                            <div className="flex-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEventFormModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">
                                    {isEditingEvent ? "Update Event" : "Create Event"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Event Report Form Modal */}
            {showReportModal && reportingEvent && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="flex-between mb-4">
                            <h2 className="mb-0" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Event Report: {reportingEvent.name}</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowReportModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleReportSubmit}>
                            <div className="form-group mb-4 p-3" style={{ background: 'var(--bg-2)', borderRadius: '8px' }}>
                                <label className="d-flex align-items-center cursor-pointer" style={{ textTransform: 'none' }}>
                                    <input
                                        type="checkbox"
                                        name="conductedOnDate"
                                        checked={reportForm.conductedOnDate}
                                        onChange={handleReportInputChange}
                                        className="form-check-input me-2"
                                    />
                                    <span>Was the event conducted on the scheduled date?</span>
                                </label>
                            </div>

                            <div className="grid-cols-2 gap-3 mb-3">
                                <div className="form-group">
                                    <label className="form-label">Total Participants *</label>
                                    <input
                                        type="number"
                                        name="participantsCount"
                                        className="form-control"
                                        value={reportForm.participantsCount}
                                        onChange={handleReportInputChange}
                                        required
                                        placeholder="e.g. 50"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Colleges Participated *</label>
                                    <input
                                        type="number"
                                        name="collegesCount"
                                        className="form-control"
                                        value={reportForm.collegesCount}
                                        onChange={handleReportInputChange}
                                        required
                                        placeholder="e.g. 1"
                                    />
                                </div>
                            </div>

                            {/* Tree Plantation specific field */}
                            {reportingEvent.category === 'Tree Plantation' && (
                                <div className="form-group mb-3 p-3" style={{ background: 'rgba(22,163,74,0.07)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '8px' }}>
                                    <label className="form-label" style={{ color: 'var(--success-600)', fontWeight: 700 }}>
                                        🌱 Number of Trees Planted *
                                    </label>
                                    <input
                                        type="number"
                                        name="treesPlanted"
                                        className="form-control"
                                        value={reportForm.treesPlanted}
                                        onChange={handleReportInputChange}
                                        required
                                        min="1"
                                        placeholder="e.g. 100"
                                    />
                                </div>
                            )}

                            {/* Blood Donation specific field */}
                            {reportingEvent.category === 'Blood Donation' && (
                                <div className="form-group mb-3 p-3" style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px' }}>
                                    <label className="form-label" style={{ color: 'var(--danger-600)', fontWeight: 700 }}>
                                        🩸 Units of Blood Donated *
                                    </label>
                                    <input
                                        type="number"
                                        name="bloodUnitsCollected"
                                        className="form-control"
                                        value={reportForm.bloodUnitsCollected}
                                        onChange={handleReportInputChange}
                                        required
                                        min="1"
                                        placeholder="e.g. 25"
                                    />
                                </div>
                            )}

                            {/* Beneficiaries count — for health camps, anti-drug, voter, road safety, hosted meetings */}
                            {['Health & Hygiene Awareness', 'Road Safety Awareness', 'Digital Literacy Workshop', 'Disaster Management Training'].includes(reportingEvent.category) && (
                                <div className="form-group mb-3 p-3" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px' }}>
                                    <label className="form-label" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>
                                        👥 Number of Beneficiaries
                                    </label>
                                    <input
                                        type="number"
                                        name="beneficiariesCount"
                                        className="form-control"
                                        value={reportForm.beneficiariesCount}
                                        onChange={handleReportInputChange}
                                        min="0"
                                        placeholder="e.g. 200"
                                    />
                                </div>
                            )}

                            {/* Rally Distance — for Cleanliness Rally / Road Safety */}
                            {['Cleanliness Rally', 'Road Safety Awareness'].includes(reportingEvent.category) && (
                                <div className="form-group mb-3 p-3" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px' }}>
                                    <label className="form-label" style={{ color: 'var(--warning-600)', fontWeight: 700 }}>
                                        📍 Rally Distance (km)
                                    </label>
                                    <input
                                        type="number"
                                        name="rallyDistance"
                                        className="form-control"
                                        value={reportForm.rallyDistance}
                                        onChange={handleReportInputChange}
                                        min="0"
                                        step="0.1"
                                        placeholder="e.g. 3.5"
                                    />
                                </div>
                            )}

                            {/* Guests Dynamic list */}
                            <div className="form-group mb-3 p-3" style={{ background: 'var(--bg-2)', borderRadius: '8px' }}>
                                <div className="flex-between mb-2">
                                    <label className="mb-0 fw-bold">Guest(s) / Resource Person(s)</label>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => setReportForm(prev => ({ ...prev, guests: [...prev.guests, ""] }))}
                                    >
                                        + Add Guest
                                    </button>
                                </div>
                                {reportForm.guests?.map((guest, idx) => (
                                    <div key={idx} className="d-flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={guest}
                                            placeholder={`Guest/Resource Person #${idx + 1}`}
                                            onChange={(e) => {
                                                const updatedGuests = [...reportForm.guests];
                                                updatedGuests[idx] = e.target.value;
                                                setReportForm(prev => ({ ...prev, guests: updatedGuests }));
                                            }}
                                            required
                                        />
                                        {reportForm.guests.length > 1 && (
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => {
                                                    const updatedGuests = reportForm.guests.filter((_, i) => i !== idx);
                                                    setReportForm(prev => ({ ...prev, guests: updatedGuests }));
                                                }}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="form-group mb-3">
                                <label className="form-label">Outcome of the Event *</label>
                                <textarea
                                    name="outcome"
                                    className="form-control"
                                    rows="3"
                                    value={reportForm.outcome}
                                    onChange={handleReportInputChange}
                                    required
                                    placeholder="Describe the impact/outcome for students and community..."
                                ></textarea>
                            </div>

                            <div className="form-group mb-4">
                                <label className="form-label">Upload Report Photos ( Newspaper cuttings, certificate or invitation ) *</label>
                                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: 'var(--warning-700)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                                    ⚠️ <strong>Required:</strong> Please upload at least one photo showing <strong>Newspaper cuttings</strong>, <strong>invitation</strong>, or <strong>certificate</strong>. (Max: 5 photos in total)
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="form-control"
                                    onChange={handleReportFileChange}
                                />
                                <small className="text-muted d-block mt-1">Select up to 5 best photos of the event.</small>
                                {(reportForm.reportPhotos && reportForm.reportPhotos.length > 0) && (
                                    <small className="text-success d-block mt-1">✓ {reportForm.reportPhotos.length} photos already attached</small>
                                )}
                            </div>

                            <div className="flex-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowReportModal(false)} disabled={isSubmittingReport}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmittingReport}>
                                    {isSubmittingReport ? "Submitting..." : "Submit Report"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditPoModal && unit?.head && (
                <ProgramOfficerModal
                    isOpen={showEditPoModal}
                    onClose={() => setShowEditPoModal(false)}
                    insName={college?.insName}
                    insCode={college?.code}
                    units={[unit.unitNumber]}
                    initialData={{ ...unit.head, unit: unit.head.unit || unit.unitNumber }}
                    readOnly={false}
                    onSuccess={() => {
                        fetchDashboardData();
                    }}
                />
            )}

            {/* Edit Bank Details OTP Protected Modal */}
            {showEditBankModal && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content" style={{ maxWidth: '650px' }}>
                        <div className="flex-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <h3 className="mb-0" style={{ fontWeight: 800, color: 'var(--txt-1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>🏦</span>
                                <span>Edit Unit Bank Account Details</span>
                            </h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowEditBankModal(false)}>&times;</button>
                        </div>

                        {bankOtpStep === 1 ? (
                            <div className="text-center py-4">
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(37,99,235,0.12)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.75rem' }}>
                                    🔒
                                </div>
                                <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--txt-1)' }}>Security OTP Verification Required</h4>
                                <p style={{ color: 'var(--txt-3)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                                    To protect sensitive grant funding bank accounts, updating Bank Details requires One-Time Password (OTP) verification. An OTP will be sent to the Programme Officer's registered email:
                                </p>
                                <div style={{ background: 'var(--bg)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'inline-block', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '1.75rem', fontSize: '0.92rem' }}>
                                    📧 {unit?.head?.email || 'Programme Officer Email'}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                    <button className="btn btn-secondary" onClick={() => setShowEditBankModal(false)} disabled={bankOtpSending}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSendBankOtp} disabled={bankOtpSending}>
                                        {bankOtpSending ? 'Sending OTP...' : '📩 Request OTP to PO Email'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.83rem', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <strong>OTP Sent!</strong> Check <span>{bankOtpMaskedEmail || unit?.head?.email}</span> for the 6-digit code.
                                    </div>
                                    <button type="button" className="btn btn-sm btn-secondary" onClick={handleSendBankOtp} disabled={bankOtpSending} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                                        Resend OTP
                                    </button>
                                </div>

                                <div className="form-group mb-4" style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '10px', border: '1.5px solid var(--primary-color)' }}>
                                    <label className="form-label" style={{ fontWeight: 800, color: 'var(--txt-1)' }}>Enter 6-Digit OTP Code <span style={{ color: 'red' }}>*</span></label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        maxLength={6}
                                        placeholder="e.g. 123456"
                                        value={bankOtpInput}
                                        onChange={(e) => setBankOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                                        style={{ letterSpacing: '4px', fontWeight: 800, fontSize: '1.1rem', textAlign: 'center', height: '44px' }}
                                    />
                                </div>

                                {/* 1. ZBSCA Account Inputs */}
                                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                                    <h5 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                        1. ZBSCA Account Details (Zero Balance Subsidiary)
                                    </h5>
                                    <div className="grid-cols-2 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">ZBSCA Account Number <span style={{ color: 'red' }}>*</span></label>
                                            <input className="form-input" type="text" placeholder="Account No" value={editBankDetails.zbsca.accountNo} onChange={(e) => setEditBankDetails({ ...editBankDetails, zbsca: { ...editBankDetails.zbsca, accountNo: e.target.value } })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">IFSC Code <span style={{ color: 'red' }}>*</span></label>
                                            <input className="form-input" type="text" placeholder="IFSC Code" value={editBankDetails.zbsca.ifscCode} onChange={(e) => setEditBankDetails({ ...editBankDetails, zbsca: { ...editBankDetails.zbsca, ifscCode: e.target.value.toUpperCase() } })} required />
                                        </div>
                                    </div>
                                    <div className="grid-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Bank Name</label>
                                            <input className="form-input" type="text" placeholder="Bank Name" value={editBankDetails.zbsca.bankName} onChange={(e) => setEditBankDetails({ ...editBankDetails, zbsca: { ...editBankDetails.zbsca, bankName: e.target.value } })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Branch Name</label>
                                            <input className="form-input" type="text" placeholder="Branch Name" value={editBankDetails.zbsca.branchName} onChange={(e) => setEditBankDetails({ ...editBankDetails, zbsca: { ...editBankDetails.zbsca, branchName: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Vendor Account Inputs */}
                                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
                                    <h5 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                                        2. Vendor Account Details
                                    </h5>
                                    <div className="form-group mb-3">
                                        <label className="form-label">Vendor Name / Entity Name</label>
                                        <input className="form-input" type="text" placeholder="Vendor Name" value={editBankDetails.vendor.vendorName} onChange={(e) => setEditBankDetails({ ...editBankDetails, vendor: { ...editBankDetails.vendor, vendorName: e.target.value } })} />
                                    </div>
                                    <div className="grid-cols-2 mb-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Vendor Account Number <span style={{ color: 'red' }}>*</span></label>
                                            <input className="form-input" type="text" placeholder="Account No" value={editBankDetails.vendor.accountNo} onChange={(e) => setEditBankDetails({ ...editBankDetails, vendor: { ...editBankDetails.vendor, accountNo: e.target.value } })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">IFSC Code <span style={{ color: 'red' }}>*</span></label>
                                            <input className="form-input" type="text" placeholder="IFSC Code" value={editBankDetails.vendor.ifscCode} onChange={(e) => setEditBankDetails({ ...editBankDetails, vendor: { ...editBankDetails.vendor, ifscCode: e.target.value.toUpperCase() } })} required />
                                        </div>
                                    </div>
                                    <div className="grid-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Bank Name</label>
                                            <input className="form-input" type="text" placeholder="Bank Name" value={editBankDetails.vendor.bankName} onChange={(e) => setEditBankDetails({ ...editBankDetails, vendor: { ...editBankDetails.vendor, bankName: e.target.value } })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Branch Name</label>
                                            <input className="form-input" type="text" placeholder="Branch Name" value={editBankDetails.vendor.branchName} onChange={(e) => setEditBankDetails({ ...editBankDetails, vendor: { ...editBankDetails.vendor, branchName: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                    <button className="btn btn-secondary" onClick={() => setShowEditBankModal(false)} disabled={bankOtpSending}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSaveBankDetailsWithOtp} disabled={bankOtpSending}>
                                        {bankOtpSending ? 'Updating...' : 'Verify OTP & Save Bank Details'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitDashboard;
