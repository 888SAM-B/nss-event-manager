import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Cloudinary Configuration (Replace with your actual values)
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;

// Define max file size in bytes (250KB)
const MAX_FILE_SIZE = 250 * 1024; // 250KB in bytes

const AddEvent = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const unitCode = location.state?.unitCode;
    const collegeCode = location.state?.collegeCode;



    const [eventForm, setEventForm] = useState({
        name: "",
        description: "",
        category: "",
        singleDay: true,
        date: "",
        dateFrom: "",
        dateTo: "",
        timeFrom: "",
        timeTo: "",
        venue: "",
        images: [],
    });

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [fileSizeError, setFileSizeError] = useState(null); // New state for file size error

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
            alert("Images uploaded successfully!");
        } catch (error) {
            console.error("Error uploading images to Cloudinary:", error);
            setUploadError("Failed to upload images. Please try again.");
            if (error.response) {
                console.error("Cloudinary response error:", error.response.data);
            }
        } finally {
            setUploading(false);
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
            alert("Please fill in all required event details.");
            return;
        }

        if (eventForm.singleDay && !eventForm.date) {
            alert("Please provide a date for the single-day event.");
            return;
        }
        if (!eventForm.singleDay && (!eventForm.dateFrom || !eventForm.dateTo)) {
            alert("Please provide 'From' and 'To' dates for the multi-day event.");
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
            images: eventForm.images,
            unitCode: unitCode,
            collegeCode: collegeCode
        };

        console.log("Submitting Event Data:", eventData);

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/addEvent`, { eventData: eventData });
            alert('Event created successfully!');
            console.log('Backend Response:', response.data);
            navigate('/events');
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please try again.');
            if (error.response) {
                console.error('Backend Error Details:', error.response.data);
            }
        }
    };

    return (

        <div className="container mt-4">
            <h2>{eventForm.name ? `Add Event: ${eventForm.name}` : "Add New Event"}</h2>
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
                        <option value="Awareness Program">Awareness Program</option>
                        <option value="Conference">Conference</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Sports">Sports</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Health">Health</option>
                        <option value="Environmental">Environmental</option>
                        <option value="Social">Social</option>
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
                <div className="form-group form-check mb-3">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="singleDay"
                        checked={eventForm.singleDay}
                        onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="singleDay">This is a single-day event</label>
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
                    <div className="row mb-3">
                        <div className="col-md-6">
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
                        <div className="col-md-6">
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
                <div className="row mb-3">
                    <div className="col-md-6">
                        <label htmlFor="timeFrom">Time From</label>
                        <input
                            type="time"
                            className="form-control"
                            id="timeFrom"
                            value={eventForm.timeFrom}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-6">
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
                <div className="form-group mb-3">
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

                {/* Image Upload Section */}
                <div className="form-group mb-3">
                    <label>Event Images</label>
                    <div className="input-group">
                        <input
                            type="file"
                            className="form-control"
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
                    <div className="d-flex flex-wrap mt-3">
                        {eventForm.images.length > 0 && eventForm.images.map((imageUrl, index) => (
                            <div key={index} className="position-relative me-2 mb-2" style={{ width: '100px', height: '100px', border: '1px solid #ddd' }}>
                                <img
                                    src={imageUrl}
                                    alt={`Event Image ${index + 1}`}
                                    className="img-fluid"
                                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                    style={{ borderRadius: '50%', width: '25px', height: '25px', padding: '0', fontSize: '0.7rem' }}
                                    onClick={() => handleImageRemove(index)}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        {selectedFiles.length > 0 && selectedFiles.map((file, index) => (
                            // Only show preview if the file is not yet uploaded and part of eventForm.images
                            // We use URL.createObjectURL for fresh previews
                            <div key={`preview-${file.name}-${index}`} className="position-relative me-2 mb-2" style={{ width: '100px', height: '100px', border: '1px solid #ddd', opacity: uploading ? 0.6 : 1 }}>
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
                        <small className="text-muted">No images selected or uploaded yet.</small>
                    )}
                </div>

                <button type="submit" className="btn btn-primary mt-3" disabled={uploading}>
                    Create Event
                </button>
            </form>
        </div>
    );
};

export default AddEvent;