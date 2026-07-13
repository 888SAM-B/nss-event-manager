import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ProgramOfficerModal = ({ isOpen, onClose, insName, insCode, units, initialData = null, readOnly = false, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        designation: "",
        department: "",
        unit: "",
        college: insName || "",
        dob: "",
        gender: "Male",
        community: "General",
        email: "",
        mobile: "",
        address: "",
        block: "",
        taluk: "",
        district: "",
        pincode: "",
        dateOfAppointment: "",
        teachingExperience: "",
        qualification: "",
        etiCompleted: "No",
        image: null,
        seminars: [""],
        nssExperience: [""],
        specialTalent: [""],
        achievements: "",
        etlTraining: false,
        etlCertificate: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                college: initialData.college || insName || "",
                gender: initialData.gender || "Male",
                seminars: initialData.seminars?.length ? initialData.seminars : [""],
                nssExperience: initialData.nssExperience?.length ? initialData.nssExperience : [""],
                specialTalent: initialData.specialTalent?.length ? initialData.specialTalent : ["",],
                achievements: initialData.achievements || "",
                etlTraining: initialData.etlTraining || false,
                etlCertificate: initialData.etlCertificate || ""
            });
        } else {
            setFormData({
                name: "",
                designation: "",
                department: "",
                unit: "",
                college: insName || "",
                dob: "",
                gender: "Male",
                community: "General",
                email: "",
                mobile: "",
                address: "",
                block: "",
                taluk: "",
                district: "",
                pincode: "",
                dateOfAppointment: "",
                teachingExperience: "",
                qualification: "",
                etiCompleted: "No",
                image: null,
                seminars: [""],
                nssExperience: [""],
                specialTalent: [""],
                achievements: "",
                etlTraining: false,
                etlCertificate: ""
            });
        }
    }, [initialData, insName, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDynamicChange = (index, field, value) => {
        const updated = [...formData[field]];
        updated[index] = value;
        setFormData({ ...formData, [field]: updated });
    };

    const addDynamicField = (field) => {
        setFormData({ ...formData, [field]: [...formData[field], ""] });
    };

    const removeDynamicField = (index, field) => {
        if (formData[field].length > 1) {
            const updated = formData[field].filter((_, i) => i !== index);
            setFormData({ ...formData, [field]: updated });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEtlCertificateChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, etlCertificate: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEtlTrainingChange = (val) => {
        setFormData({ 
            ...formData, 
            etlTraining: val, 
            etiCompleted: val ? "Yes" : "No",
            etlCertificate: val ? formData.etlCertificate : "" 
        });
    };

    const generatePDF = async () => {
        const formElement = document.getElementById("officer-form-template");
        const declElement = document.getElementById("officer-declaration-template");
        if (!formElement || !declElement) return;

        toast.loading("Generating Multi-page PDF...");
        try {
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

            pdf.save(`NSS_Nomination_${formData.name.replace(/\s+/g, "_")}.pdf`);
            toast.dismiss();
            toast.success("Nomination Form with Declaration Downloaded!");
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.dismiss();
            toast.error("Failed to generate PDF");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = initialData
                ? `${import.meta.env.VITE_API_URL}/update-program-officer/${initialData._id}`
                : `${import.meta.env.VITE_API_URL}/register-program-officer`;

            const token = localStorage.getItem("unitToken") || localStorage.getItem("nsstoken");
            const res = await axios.post(url, {
                officerData: formData,
                collegeCode: insCode
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success(initialData ? "Programme Officer Updated Successfully!" : "Programme Officer Registered Successfully!");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                toast.error(res.data.message || "Registration failed");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Server error during registration");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "800px" }}>
                <div className="flex-between mb-6">
                    <h2 className="mb-0">{readOnly ? "Programme Officer Details" : "Register Programme Officer Pro-form-a"}</h2>
                    <button className="btn btn-sm btn-secondary" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Main Details */}
                    <div className="mb-8">
                        <div className="form-section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Main Details
                        </div>
                        <div className="grid-cols-2">
                            {formData.officerID && (
                                <div className="form-group col-span-2" style={{ gridColumn: "1 / -1" }}>
                                    <label>Official Officer ID</label>
                                    <input className="form-input" value={formData.officerID} disabled style={{ background: 'var(--bg-tertiary)', fontWeight: 'bold', color: 'var(--primary-color)' }} />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Name of Programme Officer</label>
                                <input className="form-input" name="name" value={formData.name} onChange={handleInputChange} required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Designation</label>
                                <input className="form-input" name="designation" value={formData.designation} onChange={handleInputChange} required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <input className="form-input" name="department" value={formData.department} onChange={handleInputChange} required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Unit (Optional)</label>
                                <select className="form-input" name="unit" value={formData.unit} onChange={handleInputChange} disabled={readOnly}>
                                    <option value="">Unassigned</option>
                                    {units.map(u => <option key={u.unitNumber} value={u.unitNumber}>{u.unitNumber} - {u.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="mb-8">
                        <div className="form-section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Personal Details
                        </div>
                        <div className="grid-cols-2">
                            {!readOnly && (
                                <div className="form-group">
                                    <label>Profile Image</label>
                                    <input type="file" className="form-input" accept="image/*" onChange={handleImageChange} />
                                </div>
                            )}
                            {formData.image && (
                                <div className="form-group">
                                    <label>Current Photo</label>
                                    <img src={formData.image} alt="Preview" style={{ width: "80px", height: "80px", objectFit: "cover", marginTop: "10px", borderRadius: "5px", border: "1px solid #ddd" }} />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <input type="date" className="form-input" name="dob" value={formData.dob} onChange={handleInputChange} required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Gender</label>
                                <select className="form-input" name="gender" value={formData.gender} onChange={handleInputChange} disabled={readOnly}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Transgender">Transgender</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Community</label>
                                <select className="form-input" name="community" value={formData.community} onChange={handleInputChange} disabled={readOnly}>
                                    <option value="General">General</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                    <option value="OBC">OBC</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Email ID</label>
                                <input type="email" className="form-input" name="email" value={formData.email} onChange={handleInputChange} required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <input className="form-input" name="mobile" value={formData.mobile} onChange={handleInputChange} required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Date of Appointment in College</label>
                                <input type="date" className="form-input" name="dateOfAppointment" value={formData.dateOfAppointment} onChange={handleInputChange} required disabled={readOnly} />
                            </div>
                            <div className="form-group col-span-2" style={{ gridColumn: "1 / -1" }}>
                                <label>Total Teaching Experience (Years)</label>
                                <input className="form-input" name="teachingExperience" value={formData.teachingExperience} onChange={handleInputChange} placeholder="e.g. 10 years including previous org" disabled={readOnly} />
                            </div>
                            <div className="form-group col-span-2" style={{ gridColumn: "1 / -1" }}>
                                <label>Address</label>
                                <textarea className="form-input" name="address" value={formData.address} onChange={handleInputChange} rows="2" required disabled={readOnly}></textarea>
                            </div>
                            <div className="form-group">
                                <label>Block</label>
                                <input className="form-input" name="block" value={formData.block} onChange={handleInputChange} disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Taluk</label>
                                <input className="form-input" name="taluk" value={formData.taluk} onChange={handleInputChange} disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>District</label>
                                <input className="form-input" name="district" value={formData.district} onChange={handleInputChange} disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Pincode</label>
                                <input className="form-input" name="pincode" value={formData.pincode} onChange={handleInputChange} disabled={readOnly} maxLength={6} />
                            </div>
                        </div>
                    </div>

                    {/* Academic */}
                    <div className="mb-8">
                        <div className="form-section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg> Academic & Training
                        </div>
                        <div className="form-group">
                            <label>Qualification</label>
                            <input className="form-input" name="qualification" value={formData.qualification} onChange={handleInputChange} required disabled={readOnly} />
                        </div>
                        <div className="form-group">
                            <label className="flex-between">
                                Seminar / Workshops / Courses Attended
                                {!readOnly && <button type="button" className="btn btn-sm btn-secondary" onClick={() => addDynamicField("seminars")}>+</button>}
                            </label>
                            {formData.seminars.map((item, idx) => (
                                <div key={idx} className="input-group mb-2">
                                    <input className="form-input" value={item} onChange={(e) => handleDynamicChange(idx, "seminars", e.target.value)} placeholder={`Item ${idx + 1}`} disabled={readOnly} />
                                    {!readOnly && formData.seminars.length > 1 && (
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDynamicField(idx, "seminars")}>&times;</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="form-group">
                            <label>ETI Training Completed?</label>
                            <div className="d-flex gap-4">
                                <label className="form-check-label d-flex align-items-center gap-2">
                                    <input type="radio" name="etlTraining" value="Yes" checked={formData.etlTraining === true} onChange={() => handleEtlTrainingChange(true)} disabled={readOnly} /> Yes
                                </label>
                                <label className="form-check-label d-flex align-items-center gap-2">
                                    <input type="radio" name="etlTraining" value="No" checked={formData.etlTraining === false} onChange={() => handleEtlTrainingChange(false)} disabled={readOnly} /> No
                                </label>
                            </div>
                            
                            {formData.etlTraining && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    {!readOnly && (
                                        <div className="form-group">
                                            <label style={{ fontSize: '0.8rem', color: 'var(--txt-2)' }}>ETI Training Certificate (PDF/Image)</label>
                                            <input type="file" className="form-input" accept="image/*,application/pdf" onChange={handleEtlCertificateChange} />
                                        </div>
                                    )}
                                    {formData.etlCertificate && (
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <a href={formData.etlCertificate} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> View Certificate
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* General */}
                    <div className="mb-8">
                        <div className="form-section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> General Experience
                        </div>
                        <div className="form-group">
                            <label className="flex-between">
                                Previous Experience in NSS
                                {!readOnly && <button type="button" className="btn btn-sm btn-secondary" onClick={() => addDynamicField("nssExperience")}>+</button>}
                            </label>
                            {formData.nssExperience.map((item, idx) => (
                                <div key={idx} className="input-group mb-2">
                                    <input className="form-input" value={item} onChange={(e) => handleDynamicChange(idx, "nssExperience", e.target.value)} placeholder={`Experience ${idx + 1}`} disabled={readOnly} />
                                    {!readOnly && formData.nssExperience.length > 1 && (
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDynamicField(idx, "nssExperience")}>&times;</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="form-group">
                            <label className="flex-between">
                                Special Talent
                                {!readOnly && <button type="button" className="btn btn-sm btn-secondary" onClick={() => addDynamicField("specialTalent")}>+</button>}
                            </label>
                            {formData.specialTalent.map((item, idx) => (
                                <div key={idx} className="input-group mb-2">
                                    <input className="form-input" value={item} onChange={(e) => handleDynamicChange(idx, "specialTalent", e.target.value)} placeholder={`Talent ${idx + 1}`} disabled={readOnly} />
                                    {!readOnly && formData.specialTalent.length > 1 && (
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDynamicField(idx, "specialTalent")}>&times;</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="form-group">
                            <label>Achievements</label>
                            <textarea className="form-input" name="achievements" value={formData.achievements} onChange={handleInputChange} placeholder="Enter any achievements/awards" disabled={readOnly} rows="3"></textarea>
                        </div>
                    </div>

                    <div className="flex-between sticky-bottom pt-6" style={{ borderTop: "1px solid var(--border)", background: "var(--card)", position: "sticky", bottom: "-32px", zIndex: 10 }}>
                        <div className="d-flex gap-2">
                            <button type="button" className="btn btn-outline-primary" onClick={generatePDF} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download Form PDF
                            </button>
                        </div>
                        <div className="d-flex gap-3">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                            {!readOnly && (
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ minWidth: "150px" }}>
                                    {isSubmitting ? "Registering..." : "Register Officer"}
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* HIDDEN PDF TEMPLATE */}
                <div id="officer-form-template" style={{
                    display: "none",
                    width: "210mm",
                    padding: "20mm",
                    backgroundColor: "#fff",
                    color: "#000",
                    fontFamily: "serif",
                    lineHeight: "1.6"
                }}>
                    {/* Add internal styles to force black text for all children in the PDF */}
                    <style>{`
                        #officer-form-template * {
                            color: #000 !important;
                        }
                        #officer-form-template h1, 
                        #officer-form-template h2, 
                        #officer-form-template h3, 
                        #officer-form-template h4, 
                        #officer-form-template p, 
                        #officer-form-template strong, 
                        #officer-form-template li {
                            color: #000 !important;
                        }
                    `}</style>
                    <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
                        <h1 style={{ margin: "0", fontSize: "20px" }}>NOMINATION OF NEW PROGRAMME OFFICER TO LOOK AFTER</h1>
                        <h2 style={{ margin: "5px 0", fontSize: "20px" }}>THE NSS UNIT IN THE COLLEGE</h2>
                        <h3 style={{ margin: "10px 0 0 0", fontSize: "16px", textTransform: "uppercase", textDecoration: "underline" }}>{formData.college}</h3>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                        <div style={{ flex: 1 }}>
                            <p><strong>Name:</strong> {formData.name}</p>
                            <p><strong>Designation:</strong> {formData.designation}</p>
                            <p><strong>Department:</strong> {formData.department}</p>
                            <p><strong>Unit Assigned:</strong> {formData.unit}</p>
                        </div>
                        <div style={{ width: "35mm", height: "45mm", border: "1px solid #000", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            {formData.image ? (
                                <img src={formData.image} alt="Officer" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <span style={{ fontSize: "10px", textAlign: "center" }}>Affix Passport Size Photo</span>
                            )}
                        </div>
                    </div>

                    <h4 style={{ borderBottom: "1px solid #000", marginTop: "20px" }}>PERSONAL DETAILS</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <p><strong>Date of Birth:</strong> {formData.dob}</p>
                        <p><strong>Gender:</strong> {formData.gender}</p>
                        <p><strong>Community:</strong> {formData.community}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Mobile:</strong> {formData.mobile}</p>
                        <p><strong>Block:</strong> {formData.block}</p>
                        <p><strong>Taluk:</strong> {formData.taluk}</p>
                        <p><strong>District:</strong> {formData.district}</p>
                        <p><strong>Pincode:</strong> {formData.pincode}</p>
                        <p><strong>Date of Appointment:</strong> {formData.dateOfAppointment}</p>
                        <p><strong>Teaching Experience:</strong> {formData.teachingExperience}</p>
                    </div>
                    <p style={{ marginTop: "10px" }}><strong>Address:</strong> {formData.address}</p>

                    <h4 style={{ borderBottom: "1px solid #000", marginTop: "20px" }}>ACADEMIC & ETI</h4>
                    <p><strong>Educational Qualification:</strong> {formData.qualification}</p>
                    <p><strong>ETI Training Completed:</strong> {formData.etiCompleted}</p>
                    <p><strong>Seminars / Workshops / Courses:</strong></p>
                    <ul style={{ paddingLeft: "20px" }}>
                        {formData.seminars.map((s, i) => s && <li key={i}>{s}</li>)}
                    </ul>

                    <h4 style={{ borderBottom: "1px solid #000", marginTop: "20px" }}>GENERAL</h4>
                    <p><strong>NSS Experience:</strong></p>
                    <ul style={{ paddingLeft: "20px" }}>
                        {formData.nssExperience.map((x, i) => x && <li key={i}>{x}</li>)}
                    </ul>
                    <p><strong>Special Talents / Skills:</strong></p>
                    <ul style={{ paddingLeft: "20px" }}>
                        {formData.specialTalent.map((t, i) => t && <li key={i}>{t}</li>)}
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
                <div id="officer-declaration-template" style={{
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
                        #officer-declaration-template * {
                            color: #000 !important;
                        }
                    `}</style>
                    <div style={{ textAlign: "center", marginBottom: "50px" }}>
                        <h2 style={{ fontSize: "20px", textDecoration: "underline", fontWeight: "bold" }}>DECLARATION</h2>
                    </div>

                    <div style={{ textAlign: "justify", fontSize: "16px" }}>
                        <p>
                            I, <strong>{formData.name}</strong>, Designation: <strong>{formData.designation}</strong> ({formData.department}),
                            (Programme Officer-Unit-{formData.unit}) of <strong>{formData.college}</strong> here by assure that as NSS Programme Officer,
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
            </div>
        </div>
    );
};

export default ProgramOfficerModal;
