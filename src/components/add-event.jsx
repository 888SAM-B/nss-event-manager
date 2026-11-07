import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import SpecialCampProposalModal from "./SpecialCampProposalModal";
import SpecialCampFormSection, { getInitialSpecialCampDetails } from "./SpecialCampFormSection";

// Cloudinary Configuration (Replace with your actual values)
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;
const CLOUDINARY_PDF_CLOUD_NAME = import.meta.env.VITE_PDF_CLOUD_NAME;
const CLOUDINARY_PDF_UPLOAD_PRESET = import.meta.env.VITE_PDF_UPLOAD_PRESET;

// Define max file size in bytes (250KB)
const MAX_FILE_SIZE = 250 * 1024; // 250KB in bytes

const AddEvent = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const unitCode = location.state?.unitCode;
    const collegeCode = location.state?.collegeCode;
    const eventToEdit = location.state?.eventToEdit;

    const standardCategories = [
        "Special Camp",
        "Blood Donation",
        "Tree Plantation",
        "Cleanliness Drive",
        "Awareness Programme",
        "Health",
        "Health care",
        "Anti-Drug Campaign",
        "Voter Awareness - SIR",
        "Voter Awareness - SVEEP",
        "Road Safety Awareness",
        "Rallies",
        "Important Days Celebrations",
        "Pledge Taken",
        "Hosted Meetings",
        "Conference",
        "Seminar",
        "Workshop",
        "Sports",
        "Cultural",
        "Environmental",
        "Social",
        "Exhibition",
        "Creation of Assets"
    ];

    const isCustomCategory = eventToEdit && !standardCategories.includes(eventToEdit.category);

    const [eventForm, setEventForm] = useState({
        name: eventToEdit?.name || "",
        description: eventToEdit?.description || "",
        category: isCustomCategory ? "Other" : (eventToEdit?.category || ""),
        otherCategory: isCustomCategory ? eventToEdit.category : "",
        singleDay: eventToEdit?.singleDay ?? true,
        date: eventToEdit?.date || "",
        dateFrom: eventToEdit?.dateFrom || "",
        dateTo: eventToEdit?.dateTo || "",
        timeFrom: eventToEdit?.timeFrom || "",
        timeTo: eventToEdit?.timeTo || "",
        venue: eventToEdit?.venue || "",
        resourcePerson: eventToEdit?.resourcePerson || "",
        level: eventToEdit?.level || "College",
        sponsorship: eventToEdit?.sponsorship || "",
        images: eventToEdit?.images || [],
        brochure: eventToEdit?.brochure || "",
    });

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [fileSizeError, setFileSizeError] = useState(null); // New state for file size error
    const [brochureFile, setBrochureFile] = useState(null);
    const [uploadingBrochure, setUploadingBrochure] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // College & Unit Details for auto-filling Special Camp Form 1
    const [college, setCollege] = useState(null);
    const [unit, setUnit] = useState(null);
    const [specialCampDetails, setSpecialCampDetails] = useState(eventToEdit?.specialCampDetails || null);
    const [showSpecialCampProposalModal, setShowSpecialCampProposalModal] = useState(false);

    // Collaboration State
    const [availableUnits, setAvailableUnits] = useState([]);
    const [collaborators, setCollaborators] = useState([]);
    const [selectedCollaborator, setSelectedCollaborator] = useState("");

    useEffect(() => {
        // Fetch all units for dropdown
        if (collegeCode) {
            axios.get(`${import.meta.env.VITE_API_URL}/units/${collegeCode}`)
                .then(res => {
                    if (res.data.success) {
                        // Filter out current unit
                        const otherUnits = res.data.units.filter(u => u.unitNumber !== unitCode);
                        setAvailableUnits(otherUnits);
                    }
                })
                .catch(err => console.error("Error fetching units:", err));
        }

        // Fetch Unit & College profile to auto-fill Special Camp Proposal Form
        const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken");
        if (unitCode && collegeCode && token) {
            axios.get(`${import.meta.env.VITE_API_URL}/unit-dashboard/${unitCode}/${collegeCode}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                if (res.data.success) {
                    setUnit(res.data.unit);
                    setCollege(res.data.college);
                    if (eventForm.category === 'Special Camp' && !specialCampDetails) {
                        setSpecialCampDetails(eventToEdit?.specialCampDetails || getInitialSpecialCampDetails(res.data.college, res.data.unit, {
                            dateFrom: eventForm.dateFrom,
                            dateTo: eventForm.dateTo,
                            date: eventForm.date
                        }));
                    }
                }
            }).catch(e => console.error("Error fetching unit & college details:", e));
        }
    }, [collegeCode, unitCode]);

    const handleAddCollaborator = () => {
        if (selectedCollaborator && !collaborators.includes(selectedCollaborator)) {
            setCollaborators([...collaborators, selectedCollaborator]);
            setSelectedCollaborator("");
        }
    };

    const handleRemoveCollaborator = (unitToRemove) => {
        setCollaborators(collaborators.filter(c => c !== unitToRemove));
    };


    const handleChange = (e) => {
        const { id, value, type, checked } = e.target;
        setEventForm(prevForm => ({
            ...prevForm,
            [id]: type === 'checkbox' ? checked : value
        }));

        if (id === 'category') {
            const isSpecial = value === 'Special Camp';
            setEventForm(prevForm => ({
                ...prevForm,
                category: value,
                singleDay: isSpecial ? false : prevForm.singleDay
            }));
            if (isSpecial && !specialCampDetails) {
                setSpecialCampDetails(getInitialSpecialCampDetails(college, unit, {
                    dateFrom: eventForm.dateFrom,
                    dateTo: eventForm.dateTo,
                    date: eventForm.date
                }));
            }
        }

        if (id === 'singleDay' && checked) {
            setEventForm(prevForm => ({ ...prevForm, dateFrom: "", dateTo: "" }));
        } else if (id === 'singleDay' && !checked) {
            setEventForm(prevForm => ({ ...prevForm, date: "" }));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadError(null);
        setFileSizeError(null);

        const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
        if (oversized.length > 0) {
            setFileSizeError(
                `⚠️ The following file(s) exceed the 250KB limit: ${oversized.map(f => `${f.name} (${(f.size / 1024).toFixed(0)}KB)`).join(', ')}. Please remove them before submitting.`
            );
            toast.error(`⚠️ ${oversized.length} photo(s) exceed 250KB limit!`, { duration: 5000 });
        }

        setSelectedFiles(prev => [...prev, ...files]);
        e.target.value = null;
    };

    const handleBrochureFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const MAX_BROCHURE_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_BROCHURE_SIZE) {
            toast.error(`⚠️ Circular/Brochure "${file.name}" exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB)!`, { duration: 6000 });
        }
        setBrochureFile(file);
        e.target.value = null;
    };

    const handleImageRemove = (indexToRemove) => {
        setEventForm(prevForm => ({
            ...prevForm,
            images: prevForm.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!eventForm.name || !eventForm.description || !eventForm.category || !eventForm.venue) {
            toast.error("Please fill in all required activity details.");
            return;
        }

        if (eventForm.singleDay && !eventForm.date) {
            toast.error("Please provide a date for the single-day activity.");
            return;
        }
        if (!eventForm.singleDay && (!eventForm.dateFrom || !eventForm.dateTo)) {
            toast.error("Please provide 'From' and 'To' dates for the multi-day activity.");
            return;
        }

        // Check for oversized photos (> 250KB)
        const oversizedPhotos = selectedFiles.filter(f => f.size > MAX_FILE_SIZE);
        if (oversizedPhotos.length > 0) {
            toast.error(`Cannot submit: "${oversizedPhotos[0].name}" (${(oversizedPhotos[0].size / 1024).toFixed(1)} KB) exceeds 250KB limit. Please remove it using ✕ before saving.`);
            return;
        }

        // Check for oversized brochure (> 5MB)
        if (brochureFile && brochureFile.size > 5 * 1024 * 1024) {
            toast.error(`Cannot submit: Brochure "${brochureFile.name}" (${(brochureFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds 5MB limit. Please choose a smaller PDF.`);
            return;
        }

        setSubmitting(true);
        const toastId = toast.loading((selectedFiles.length > 0 || brochureFile) ? "Uploading files & saving activity..." : "Saving activity...");

        try {
            let finalImages = [...eventForm.images];
            let finalBrochure = eventForm.brochure;

            // Auto-upload selected photos to Cloudinary
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
                    const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, formData);
                    finalImages.push(res.data.secure_url);
                }
            }

            // Auto-upload brochure PDF to Cloudinary
            if (brochureFile) {
                const formData = new FormData();
                formData.append('file', brochureFile);
                formData.append('upload_preset', CLOUDINARY_PDF_UPLOAD_PRESET);
                const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUDINARY_PDF_CLOUD_NAME}/raw/upload`, formData);
                finalBrochure = res.data.secure_url;
            }

            const eventData = {
                name: eventForm.name,
                description: eventForm.description,
                category: eventForm.category === "Other" ? eventForm.otherCategory : eventForm.category,
                singleDay: eventForm.singleDay,
                date: eventForm.singleDay ? eventForm.date : undefined,
                dateFrom: !eventForm.singleDay ? eventForm.dateFrom : undefined,
                dateTo: !eventForm.singleDay ? eventForm.dateTo : undefined,
                timeFrom: eventForm.timeFrom,
                timeTo: eventForm.timeTo,
                venue: eventForm.venue,
                resourcePerson: eventForm.resourcePerson,
                level: eventForm.level,
                sponsorship: eventForm.sponsorship,
                registeredMeriBharath: "No",
                meriBharathUrl: "",
                images: finalImages,
                brochure: finalBrochure,
                unitCode: unitCode,
                collegeCode: collegeCode,
                collaborators: collaborators,
                ...(eventForm.category === "Special Camp" && {
                    specialCampDetails: specialCampDetails || getInitialSpecialCampDetails(college, unit, {
                        dateFrom: eventForm.dateFrom,
                        dateTo: eventForm.dateTo,
                        date: eventForm.date
                    })
                })
            };
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("unitToken")}`
                }
            };

            if (eventToEdit) {
                const response = await axios.put(`${import.meta.env.VITE_API_URL}/updateEvent`, {
                    eventId: eventToEdit._id,
                    eventData: eventData
                }, config);
                toast.success('Activity updated successfully!', { id: toastId });
                console.log('Backend Response:', response.data);
                navigate('/explore-events', { state: { unitCode, collegeCode } }); // Go back to explore events
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/addEvent`, { eventData: eventData }, config);
                toast.success('Activity created successfully!', { id: toastId });
                console.log('Backend Response:', response.data);
                navigate('/unit-dashboard');
            }
        } catch (error) {
            console.error('Error saving activity:', error);
            toast.error(error.response?.data?.message || 'Failed to save activity. Please try again.', { id: toastId });
            if (error.response) {
                console.error('Backend Error Details:', error.response.data);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
                <div className="container animate-fadeIn" style={{ maxWidth: eventForm.category === 'Special Camp' ? '1100px' : '850px', marginTop: '110px', paddingBottom: '4rem', transition: 'max-width 0.3s ease' }}>
                    <div className="card" style={{ padding: '2.5rem' }}>
                        <div className="form-section-header">
                            <span>📋</span> Basic Information
                        </div>
                        <form onSubmit={handleSubmit}>
                            {/* Event Name */}
                            <div className="form-group mb-3">
                                <label htmlFor="name">Activity Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="name"
                                    placeholder="Enter activity name"
                                    value={eventForm.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Event Description */}
                            <div className="form-group mb-3">
                                <label htmlFor="description">Activity Description <span className="text-danger">*</span></label>
                                <textarea
                                    className="form-control"
                                    id="description"
                                    rows="3"
                                    value={eventForm.description}
                                    onChange={handleChange}
                                    required
                                ></textarea>
                            </div>

                            {/* Event Category */}
                            <div className="form-group mb-3">
                                <label htmlFor="category">Activity Category <span className="text-danger">*</span></label>
                                <select
                                    className="form-control"
                                    id="category"
                                    value={eventForm.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {standardCategories.map((cat, i) => (
                                        <option key={i} value={cat}>{cat}</option>
                                    ))}
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            {eventForm.category === "Other" && (
                                <div className="form-group mb-3">
                                    <label htmlFor="otherCategory">Specify Category</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="otherCategory"
                                        placeholder="Enter your category"
                                        value={eventForm.otherCategory || ""}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}

                            {/* Single Day / Multi Day Toggle */}
                            <div className="form-check mb-4 p-3" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="singleDay"
                                    checked={eventForm.singleDay}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label ms-2" htmlFor="singleDay">This is a single-day activity</label>
                            </div>

                            {/* Date Fields */}
                            {eventForm.singleDay ? (
                                <div className="form-group mb-3">
                                    <label htmlFor="date">Date <span className="text-danger">*</span></label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        id="date"
                                        value={eventForm.date}
                                        onChange={handleChange}
                                        required={eventForm.singleDay}
                                    />
                                </div>
                            ) : (
                                <div className="grid-cols-2 mb-3">
                                    <div>
                                        <label htmlFor="dateFrom">Date From <span className="text-danger">*</span></label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="dateFrom"
                                            value={eventForm.dateFrom}
                                            onChange={handleChange}
                                            required={!eventForm.singleDay}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="dateTo">Date To <span className="text-danger">*</span></label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            id="dateTo"
                                            value={eventForm.dateTo}
                                            onChange={handleChange}
                                            required={!eventForm.singleDay}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Time Fields */}
                            <div className="grid-cols-2 mb-3">
                                <div>
                                    <label htmlFor="timeFrom">Time From</label>
                                    <input
                                        type="time"
                                        className="form-control"
                                        id="timeFrom"
                                        value={eventForm.timeFrom}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="timeTo">Time To</label>
                                    <input
                                        type="time"
                                        className="form-control"
                                        id="timeTo"
                                        value={eventForm.timeTo}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Venue */}
                            <div className="form-group mb-4">
                                <label htmlFor="venue">Venue <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="venue"
                                    placeholder="Enter activity venue"
                                    value={eventForm.venue}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Resource Person */}
                            <div className="form-group mb-4">
                                <label htmlFor="resourcePerson">Resource Person (Optional)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="resourcePerson"
                                    placeholder="Enter name and details of Resource Person"
                                    value={eventForm.resourcePerson}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Event Level & Sponsorship */}
                            <div className="grid-cols-2 mb-4">
                                <div>
                                    <label htmlFor="level">Level of Activity <span className="text-danger">*</span></label>
                                    <select
                                        className="form-control"
                                        id="level"
                                        value={eventForm.level}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="College">College</option>
                                        <option value="University">University</option>
                                        <option value="District">District</option>
                                        <option value="Regional">Regional</option>
                                        <option value="State">State</option>
                                        <option value="National">National</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="sponsorship">Sponsorship (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="sponsorship"
                                        placeholder="e.g. Funded / Self Financing / Sponsor name"
                                        value={eventForm.sponsorship}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-section-header">
                                <span>🖼️</span> Media & Documents
                            </div>

                            {/* Image Upload Section */}
                            <div className="form-group mb-4">
                                <label style={{ fontWeight: 600 }}>
                                    Activity Images <span style={{ fontSize: '0.85rem', color: 'var(--txt-3)', fontWeight: 'normal' }}>(Max 250KB each)</span>
                                </label>
                                <input
                                    type="file"
                                    className="form-control choose-img"
                                    id="images"
                                    multiple
                                    onChange={handleFileChange}
                                    accept="image/*"
                                />
                                <small style={{ color: 'var(--txt-3)', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                                    💡 Select one or multiple photos. They will be uploaded automatically when you submit the activity.
                                </small>

                                {fileSizeError && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#b91c1c', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        {fileSizeError}
                                    </div>
                                )}
                                {uploadError && <small className="text-danger mt-1 d-block">{uploadError}</small>}

                                {/* Image Previews */}
                                <div className="d-flex flex-wrap mt-3 gap-2">
                                    {/* Uploaded Images */}
                                    {eventForm.images.length > 0 && eventForm.images.map((imageUrl, index) => (
                                        <div key={`uploaded-${index}`} className="position-relative" style={{ width: '100px', height: '100px', border: '1.5px solid var(--success-500, #16a34a)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                            <img
                                                src={imageUrl}
                                                alt={`Activity Image ${index + 1}`}
                                                className="img-fluid"
                                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                            />
                                            <span style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(22, 163, 74, 0.85)', color: '#fff', fontSize: '9px', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>
                                                Saved ✓
                                            </span>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                                style={{ borderRadius: '50%', width: '22px', height: '22px', padding: 0, lineHeight: '22px', fontSize: '13px', margin: '2px' }}
                                                onClick={() => handleImageRemove(index)}
                                                title="Remove image"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}

                                    {/* Selected pending upload images */}
                                    {selectedFiles.length > 0 && selectedFiles.map((file, index) => {
                                        const isOversized = file.size > MAX_FILE_SIZE;
                                        return (
                                            <div 
                                                key={`preview-${file.name}-${index}`} 
                                                className="position-relative" 
                                                style={{ 
                                                    width: '100px', 
                                                    height: '100px', 
                                                    border: isOversized ? '2px solid #ef4444' : '1.5px dashed var(--primary-500, #2563eb)', 
                                                    borderRadius: 'var(--radius-md)', 
                                                    overflow: 'hidden',
                                                    background: isOversized ? '#fef2f2' : '#f8fafc'
                                                }}
                                            >
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Selected Image ${file.name}`}
                                                    className="img-fluid"
                                                    style={{ objectFit: 'cover', width: '100%', height: '100%', opacity: isOversized ? 0.7 : 1 }}
                                                />
                                                <span style={{ 
                                                    position: 'absolute', 
                                                    bottom: 2, 
                                                    left: 2, 
                                                    background: isOversized ? 'rgba(239, 68, 68, 0.9)' : 'rgba(37, 99, 235, 0.85)', 
                                                    color: '#fff', 
                                                    fontSize: '8.5px', 
                                                    padding: '1px 4px', 
                                                    borderRadius: '3px', 
                                                    fontWeight: 700 
                                                }}>
                                                    {isOversized ? `⚠️ ${(file.size / 1024).toFixed(0)}KB` : `${(file.size / 1024).toFixed(0)}KB`}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                                    style={{ 
                                                        borderRadius: '50%', 
                                                        width: '22px', 
                                                        height: '22px', 
                                                        padding: 0, 
                                                        lineHeight: '22px', 
                                                        fontSize: '13px', 
                                                        margin: '2px',
                                                        background: isOversized ? '#ef4444' : 'rgba(0,0,0,0.65)'
                                                    }}
                                                    onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                                    title={isOversized ? "Remove oversized file" : "Remove selected file"}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                {eventForm.images.length === 0 && selectedFiles.length === 0 && !fileSizeError && !uploadError && (
                                    <small className="text-muted d-block mt-2">No images selected or uploaded yet.</small>
                                )}
                            </div>

                            {/* Brochure Upload Section */}
                            <div className="form-group mb-4">
                                <label style={{ fontWeight: 600 }}>
                                    Activity Circular / Brochure PDF <span style={{ fontSize: '0.85rem', color: 'var(--txt-3)', fontWeight: 'normal' }}>(Max 5MB)</span>
                                </label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept=".pdf"
                                    onChange={handleBrochureFileChange}
                                />
                                <small style={{ color: 'var(--txt-3)', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                                    💡 Brochure PDF will be uploaded automatically when you submit the activity.
                                </small>

                                {/* Selected Brochure File */}
                                {brochureFile && (
                                    <div style={{
                                        marginTop: '0.5rem',
                                        padding: '0.5rem 0.75rem',
                                        borderRadius: '6px',
                                        border: brochureFile.size > 5 * 1024 * 1024 ? '1.5px solid #ef4444' : '1px solid var(--border)',
                                        background: brochureFile.size > 5 * 1024 * 1024 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📄</span>
                                            <div>
                                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--txt-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                                                    {brochureFile.name}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: brochureFile.size > 5 * 1024 * 1024 ? '#b91c1c' : 'var(--txt-3)' }}>
                                                    {(brochureFile.size / 1024).toFixed(1)} KB {brochureFile.size > 5 * 1024 * 1024 && '⚠️ Exceeds 5MB limit'}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setBrochureFile(null)}
                                            title="Remove brochure"
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                {/* Existing Uploaded Brochure */}
                                {eventForm.brochure && !brochureFile && (
                                    <div className="mt-2 p-2 border rounded d-flex justify-content-between align-items-center" style={{ background: 'var(--bg-secondary)' }}>
                                        <span className="text-sm text-success">✓ Current Brochure:</span>
                                        <a href={eventForm.brochure} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-link text-primary">View PDF</a>
                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => setEventForm(prev => ({ ...prev, brochure: "" }))}>Remove</button>
                                    </div>
                                )}
                            </div>

                            <div className="form-section-header">
                                <span>🤝</span> Collaboration
                            </div>
                            <div className="form-group mb-4 p-3" style={{ border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                                <label className="mb-2 fw-bold">Collaborating Units (Optional)</label>
                                <div className="d-flex gap-2 mb-2">
                                    <select
                                        className="form-control"
                                        value={selectedCollaborator}
                                        onChange={(e) => setSelectedCollaborator(e.target.value)}
                                    >
                                        <option value="">Select a Unit to Invite</option>
                                        {availableUnits.map(unit => (
                                            <option key={unit.unitNumber} value={unit.unitNumber} disabled={collaborators.includes(unit.unitNumber)}>
                                                {unit.unitNumber} - {unit.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button type="button" className="btn btn-primary" onClick={handleAddCollaborator} disabled={!selectedCollaborator}>
                                        Add
                                    </button>
                                </div>

                                {collaborators.length > 0 && (
                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                        {collaborators.map(cCode => (
                                            <span key={cCode} className="badge badge-secondary d-flex align-items-center gap-2" style={{ padding: '0.5rem 1rem' }}>
                                                Unit {cCode}
                                                <button
                                                    type="button"
                                                    className="btn-close btn-close-white"
                                                    style={{ fontSize: '0.6rem', marginLeft: '5px', cursor: 'pointer', background: 'none', border: 'none', color: 'white' }}
                                                    onClick={() => handleRemoveCollaborator(cCode)}
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <small className="text-muted">Selected units will receive an invitation to collaborate on this activity.</small>
                            </div>

                            {eventForm.category === "Special Camp" && (
                                <SpecialCampFormSection
                                    specialCampDetails={specialCampDetails || getInitialSpecialCampDetails(college, unit, {
                                        dateFrom: eventForm.dateFrom,
                                        dateTo: eventForm.dateTo,
                                        date: eventForm.date
                                    })}
                                    setSpecialCampDetails={setSpecialCampDetails}
                                    college={college}
                                    unit={unit}
                                    onPreviewPdf={() => setShowSpecialCampProposalModal(true)}
                                />
                            )}

                            <div className="flex-between mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
                                <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={uploading}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary btn-lg" disabled={uploading || uploadingBrochure || submitting} style={{ minWidth: '180px' }}>
                                    {submitting ? (eventToEdit ? "Updating..." : "Creating...") : (eventToEdit ? "Update Activity" : "Create Activity")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Official Special Camp Proposal Form 1 Modal */}
                <SpecialCampProposalModal
                    isOpen={showSpecialCampProposalModal}
                    onClose={() => setShowSpecialCampProposalModal(false)}
                    event={{
                        ...eventForm,
                        category: "Special Camp",
                        specialCampDetails: specialCampDetails || getInitialSpecialCampDetails(college, unit, {
                            dateFrom: eventForm.dateFrom,
                            dateTo: eventForm.dateTo,
                            date: eventForm.date
                        })
                    }}
                    collegeData={college}
                    unitData={unit}
                />
            </>
            );
};

            export default AddEvent;