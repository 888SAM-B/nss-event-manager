import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';

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
        "Blood Donation", "Tree Plantation", "Cleanliness Drive", "Awareness Programme",
        "Conference", "Seminar", "Workshop", "Sports", "Cultural", "Health",
        "Environmental", "Social", "Exhibition", "Health care", "Creation of Assets"
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
        registeredMeriBharath: eventToEdit?.registeredMeriBharath || "No",
        meriBharathUrl: eventToEdit?.meriBharathUrl || "",
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

        if (id === 'singleDay' && checked) {
            setEventForm(prevForm => ({ ...prevForm, dateFrom: "", dateTo: "" }));
        } else if (id === 'singleDay' && !checked) {
            setEventForm(prevForm => ({ ...prevForm, date: "" }));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = [];
        const invalidFiles = [];

        // Reset errors
        setUploadError(null);
        setFileSizeError(null);

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                invalidFiles.push(file.name);
            } else {
                validFiles.push(file);
            }
        }

        if (invalidFiles.length > 0) {
            setFileSizeError(
                `The following files exceed the 250KB limit: ${invalidFiles.join(', ')}. ` +
                `They will not be uploaded. Please select smaller files.`
            );
        }

        setSelectedFiles(validFiles);
        // If there were invalid files, clear the input so the user can re-select
        if (invalidFiles.length > 0) {
            e.target.value = null;
        }
    };

    const uploadImagesToCloudinary = async () => {
        if (selectedFiles.length === 0) {
            setUploadError("Please select files to upload.");
            return;
        }

        setUploading(true);
        setUploadError(null);
        setFileSizeError(null); // Clear file size error on upload attempt

        const imageUrls = [...eventForm.images];

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

            setEventForm(prevForm => ({
                ...prevForm,
                images: imageUrls
            }));
            setSelectedFiles([]);
            toast.success("Images uploaded successfully!");
        } catch (error) {
            console.error("Error uploading images to Cloudinary:", error);
            setUploadError("Failed to upload images. Please try again.");
            toast.error("Failed to upload images");
            if (error.response) {
                console.error("Cloudinary response error:", error.response.data);
            }
        } finally {
            setUploading(false);
        }
    };

    const uploadBrochureToCloudinary = async () => {
        if (!brochureFile) return;

        setUploadingBrochure(true);
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
            toast.success("Brochure uploaded successfully!");
        } catch (error) {
            console.error("Error uploading brochure:", error);
            toast.error("Failed to upload brochure.");
        } finally {
            setUploadingBrochure(false);
        }
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
            toast.error("Please fill in all required event details.");
            return;
        }

        if (eventForm.singleDay && !eventForm.date) {
            toast.error("Please provide a date for the single-day event.");
            return;
        }
        if (!eventForm.singleDay && (!eventForm.dateFrom || !eventForm.dateTo)) {
            toast.error("Please provide 'From' and 'To' dates for the multi-day event.");
            return;
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
            registeredMeriBharath: eventForm.registeredMeriBharath,
            meriBharathUrl: eventForm.registeredMeriBharath === "Yes" ? eventForm.meriBharathUrl : "",
            images: eventForm.images,
            brochure: eventForm.brochure,
            unitCode: unitCode,
            collegeCode: collegeCode,
            collaborators: collaborators

        };

        console.log("Submitting Event Data:", eventData);
        setSubmitting(true);

        try {
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
                toast.success('Event updated successfully!');
                console.log('Backend Response:', response.data);
                navigate('/explore-events', { state: { unitCode, collegeCode } }); // Go back to explore events
            } else {
                const response = await axios.post(`${import.meta.env.VITE_API_URL}/addEvent`, { eventData: eventData }, config);
                toast.success('Event created successfully!');
                console.log('Backend Response:', response.data);
                navigate('/unit-dashboard');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            toast.error('Failed to save event. Please try again.');
            if (error.response) {
                console.error('Backend Error Details:', error.response.data);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
            <div className="container animate-fadeIn" style={{ maxWidth: '850px', marginTop: '110px', paddingBottom: '4rem' }}>
                <div className="card" style={{ padding: '2.5rem' }}>
                    <div className="form-section-header">
                        <span>📋</span> Basic Information
                    </div>
                    <form onSubmit={handleSubmit}>
                        {/* Event Name */}
                        <div className="form-group mb-3">
                            <label htmlFor="name">Event Name <span className="text-danger">*</span></label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                placeholder="Enter event name"
                                value={eventForm.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Event Description */}
                        <div className="form-group mb-3">
                            <label htmlFor="description">Event Description <span className="text-danger">*</span></label>
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
                            <label htmlFor="category">Event Category <span className="text-danger">*</span></label>
                            <select
                                className="form-control"
                                id="category"
                                value={eventForm.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Category</option>
                                <option value="Blood Donation">Blood Donation</option>
                                <option value="Tree Plantation">Tree Plantation</option>
                                <option value="Cleanliness Drive">Cleanliness Drive</option>
                                <option value="Awareness Programme">Awareness Programme</option>
                                <option value="Conference">Conference</option>
                                <option value="Seminar">Seminar</option>
                                <option value="Workshop">Workshop</option>
                                <option value="Sports">Sports</option>
                                <option value="Cultural">Cultural</option>
                                <option value="Health">Health</option>
                                <option value="Health care">Health care</option>
                                <option value="Environmental">Environmental</option>
                                <option value="Social">Social</option>
                                <option value="Exhibition">Exhibition</option>
                                <option value="Creation of Assets">Creation of Assets</option>
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
                            <label className="form-check-label ms-2" htmlFor="singleDay">This is a single-day event</label>
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
                                placeholder="Enter event venue"
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
                                <label htmlFor="level">Level of Event <span className="text-danger">*</span></label>
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

                        {/* Meri Bharath Portal Registration */}
                        <div className="grid-cols-2 mb-8">
                            <div>
                                <label htmlFor="registeredMeriBharath">Registered in May Bharat Portal? <span className="text-danger">*</span></label>
                                <select
                                    className="form-control"
                                    id="registeredMeriBharath"
                                    value={eventForm.registeredMeriBharath}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="No">No</option>
                                    <option value="Yes">Yes</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="meriBharathUrl">May Bharat Event URL {eventForm.registeredMeriBharath === "Yes" && <span className="text-danger">*</span>}</label>
                                <input
                                    type="url"
                                    className="form-control"
                                    id="meriBharathUrl"
                                    placeholder={eventForm.registeredMeriBharath === "Yes" ? "e.g. https://mybharat.gov.in/..." : "Not registered (URL disabled)"}
                                    value={eventForm.meriBharathUrl}
                                    onChange={handleChange}
                                    disabled={eventForm.registeredMeriBharath !== "Yes"}
                                    required={eventForm.registeredMeriBharath === "Yes"}
                                />
                            </div>
                        </div>

                        <div className="form-section-header">
                            <span>🖼️</span> Media & Documents
                        </div>

                        {/* Image Upload Section */}
                        <div className="form-group mb-4">
                            <label>Event Images</label>
                            <div className="input-group evt-imgs">
                                <input
                                    type="file"
                                    className="form-control choose-img "
                                    id="images"
                                    multiple
                                    onChange={handleFileChange}
                                    accept="image/*"
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={uploadImagesToCloudinary}
                                    disabled={selectedFiles.length === 0 || uploading}
                                >
                                    {uploading ? 'Uploading...' : 'Upload Selected Images'}
                                </button>
                            </div>
                            {fileSizeError && <small className="text-danger mt-1 d-block">{fileSizeError}</small>} {/* Display file size error */}
                            {uploadError && <small className="text-danger mt-1 d-block">{uploadError}</small>}

                            {/* Image Previews */}
                            <div className="d-flex flex-wrap mt-3 gap-2">
                                {eventForm.images.length > 0 && eventForm.images.map((imageUrl, index) => (
                                    <div key={index} className="position-relative" style={{ width: '100px', height: '100px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                        <img
                                            src={imageUrl}
                                            alt={`Event Image ${index + 1}`}
                                            className="img-fluid"
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                            style={{ borderRadius: '50%', width: '24px', height: '24px', padding: 0, lineHeight: '24px', fontSize: '14px', margin: '2px' }}
                                            onClick={() => handleImageRemove(index)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                {selectedFiles.length > 0 && selectedFiles.map((file, index) => (
                                    // Only show preview if the file is not yet uploaded and part of eventForm.images
                                    // We use URL.createObjectURL for fresh previews
                                    <div key={`preview-${file.name}-${index}`} className="position-relative" style={{ width: '100px', height: '100px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', opacity: uploading ? 0.6 : 1 }}>
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`Selected Image ${file.name}`}
                                            className="img-fluid"
                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                            onLoad={() => URL.revokeObjectURL(file.src)} // Clean up memory after image loads
                                        />
                                        {uploading && <div className="position-absolute top-50 start-50 translate-middle text-white fw-bold">...</div>}
                                    </div>
                                ))}
                            </div>
                            {eventForm.images.length === 0 && selectedFiles.length === 0 && !fileSizeError && !uploadError && (
                                <small className="text-muted d-block mt-2">No images selected or uploaded yet.</small>
                            )}
                        </div>

                        {/* Brochure Upload Section */}
                        <div className="form-group mb-4">
                            <label>Event Brochure (PDF)</label>
                            <div className="input-group">
                                <input
                                    type="file"
                                    className="form-control"
                                    accept=".pdf"
                                    onChange={(e) => setBrochureFile(e.target.files[0])}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={uploadBrochureToCloudinary}
                                    disabled={!brochureFile || uploadingBrochure}
                                >
                                    {uploadingBrochure ? 'Uploading...' : 'Upload Brochure'}
                                </button>
                            </div>
                            {eventForm.brochure && (
                                <div className="mt-2 p-2 border rounded d-flex justify-content-between align-items-center" style={{ background: 'var(--bg-secondary)' }}>
                                    <span className="text-sm text-success">✓ Brochure uploaded</span>
                                    <a href={eventForm.brochure} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-link text-primary">View</a>
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
                            <small className="text-muted">Selected units will receive an invitation to collaborate on this event.</small>
                        </div>

                        <div className="flex-between mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
                            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={uploading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={uploading || uploadingBrochure || submitting} style={{ minWidth: '180px' }}>
                                {submitting ? (eventToEdit ? "Updating..." : "Creating...") : (eventToEdit ? "Update Event" : "Create Event")}
                            </button>
                        </div>
        </form>
            </div>
        </div>
    );
};

export default AddEvent;