import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ProgramOfficerModal = ({ isOpen, onClose, insName, insCode, units }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        designation: "",
        department: "",
        unit: "",
        college: insName || "",
        dob: "",
        community: "General",
        email: "",
        mobile: "",
        address: "",
        dateOfAppointment: "",
        teachingExperience: "",
        qualification: "",
        etiCompleted: "No",
        image: null,
        seminars: [""],
        nssExperience: [""],
        specialTalent: [""]
    });

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

    const generatePDF = async () => {
        const formElement = document.getElementById("officer-form-template");
        const declElement = document.getElementById("officer-declaration-template");
        if (!formElement || !declElement) return;

        toast.loading("Generating Multi-page PDF...");
        try {
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();

            // Page 1: Nomination Form
            formElement.style.display = "block";
            const canvas1 = await html2canvas(formElement, { scale: 2, useCORS: true, logging: false });
            formElement.style.display = "none";
            const imgData1 = canvas1.toDataURL("image/png");
            const imgProps1 = pdf.getImageProperties(imgData1);
            const pdfHeight1 = (imgProps1.height * pdfWidth) / imgProps1.width;
            pdf.addImage(imgData1, "PNG", 0, 0, pdfWidth, pdfHeight1);

            // Page 2: Declaration
            pdf.addPage();
            declElement.style.display = "block";
            const canvas2 = await html2canvas(declElement, { scale: 2, useCORS: true, logging: false });
            declElement.style.display = "none";
            const imgData2 = canvas2.toDataURL("image/png");
            const imgProps2 = pdf.getImageProperties(imgData2);
            const pdfHeight2 = (imgProps2.height * pdfWidth) / imgProps2.width;
            pdf.addImage(imgData2, "PNG", 0, 0, pdfWidth, pdfHeight2);

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
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/register-program-officer`, {
                officerData: formData,
                collegeCode: insCode
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("nsstoken")}` }
            });

            if (res.data.success) {
                toast.success("Program Officer Registered Successfully!");
                // Optionally generate PDF automatically
                // generatePDF(); 
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
                    <h2 className="mb-0">Register Program Officer Pro-forma</h2>
                    <button className="btn btn-sm btn-secondary" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Main Details */}
                    <div className="mb-8">
                        <h3 className="section-title text-primary mb-4" style={{ borderBottom: "2px solid var(--primary-color)", paddingBottom: "5px" }}>Main Details</h3>
                        <div className="grid-cols-2">
                            <div className="form-group">
                                <label>Name of Program Officer</label>
                                <input className="form-input" name="name" value={formData.name} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Designation</label>
                                <input className="form-input" name="designation" value={formData.designation} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <input className="form-input" name="department" value={formData.department} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Unit</label>
                                <select className="form-input" name="unit" value={formData.unit} onChange={handleInputChange} required>
                                    <option value="">Select Unit</option>
                                    {units.map(u => <option key={u.unitNumber} value={u.unitNumber}>{u.unitNumber} - {u.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="mb-8">
                        <h3 className="section-title text-primary mb-4" style={{ borderBottom: "2px solid var(--primary-color)", paddingBottom: "5px" }}>Personal Details</h3>
                        <div className="grid-cols-2">
                            <div className="form-group">
                                <label>Profile Image</label>
                                <input type="file" className="form-input" accept="image/*" onChange={handleImageChange} />
                                {formData.image && <img src={formData.image} alt="Preview" style={{ width: "80px", height: "80px", objectFit: "cover", marginTop: "10px", borderRadius: "5px" }} />}
                            </div>
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <input type="date" className="form-input" name="dob" value={formData.dob} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Community</label>
                                <select className="form-input" name="community" value={formData.community} onChange={handleInputChange}>
                                    <option value="General">General</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                    <option value="OBC">OBC</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Email ID</label>
                                <input type="email" className="form-input" name="email" value={formData.email} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <input className="form-input" name="mobile" value={formData.mobile} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Date of Appointment in College</label>
                                <input type="date" className="form-input" name="dateOfAppointment" value={formData.dateOfAppointment} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group col-span-2" style={{ gridColumn: "1 / -1" }}>
                                <label>Total Teaching Experience (Years)</label>
                                <input className="form-input" name="teachingExperience" value={formData.teachingExperience} onChange={handleInputChange} placeholder="e.g. 10 years including previous org" />
                            </div>
                            <div className="form-group col-span-2" style={{ gridColumn: "1 / -1" }}>
                                <label>Address</label>
                                <textarea className="form-input" name="address" value={formData.address} onChange={handleInputChange} rows="3" required></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Academic */}
                    <div className="mb-8">
                        <h3 className="section-title text-primary mb-4" style={{ borderBottom: "2px solid var(--primary-color)", paddingBottom: "5px" }}>Academic</h3>
                        <div className="form-group">
                            <label>Qualification</label>
                            <input className="form-input" name="qualification" value={formData.qualification} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label className="flex-between">
                                Seminar / Workshops / Courses Attended
                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => addDynamicField("seminars")}>+</button>
                            </label>
                            {formData.seminars.map((item, idx) => (
                                <div key={idx} className="input-group mb-2">
                                    <input className="form-input" value={item} onChange={(e) => handleDynamicChange(idx, "seminars", e.target.value)} placeholder={`Item ${idx + 1}`} />
                                    {formData.seminars.length > 1 && (
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDynamicField(idx, "seminars")}>&times;</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="form-group">
                            <label>ETI Training Completed?</label>
                            <div className="d-flex gap-4">
                                <label className="form-check-label d-flex align-items-center gap-2">
                                    <input type="radio" name="etiCompleted" value="Yes" checked={formData.etiCompleted === "Yes"} onChange={handleInputChange} /> Yes
                                </label>
                                <label className="form-check-label d-flex align-items-center gap-2">
                                    <input type="radio" name="etiCompleted" value="No" checked={formData.etiCompleted === "No"} onChange={handleInputChange} /> No
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* General */}
                    <div className="mb-8">
                        <h3 className="section-title text-primary mb-4" style={{ borderBottom: "2px solid var(--primary-color)", paddingBottom: "5px" }}>General</h3>
                        <div className="form-group">
                            <label className="flex-between">
                                Previous Experience in NSS
                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => addDynamicField("nssExperience")}>+</button>
                            </label>
                            {formData.nssExperience.map((item, idx) => (
                                <div key={idx} className="input-group mb-2">
                                    <input className="form-input" value={item} onChange={(e) => handleDynamicChange(idx, "nssExperience", e.target.value)} placeholder={`Experience ${idx + 1}`} />
                                    {formData.nssExperience.length > 1 && (
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDynamicField(idx, "nssExperience")}>&times;</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="form-group">
                            <label className="flex-between">
                                Special Talent
                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => addDynamicField("specialTalent")}>+</button>
                            </label>
                            {formData.specialTalent.map((item, idx) => (
                                <div key={idx} className="input-group mb-2">
                                    <input className="form-input" value={item} onChange={(e) => handleDynamicChange(idx, "specialTalent", e.target.value)} placeholder={`Talent ${idx + 1}`} />
                                    {formData.specialTalent.length > 1 && (
                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDynamicField(idx, "specialTalent")}>&times;</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-between sticky-bottom pt-4" style={{ borderTop: "1px solid var(--border-color)", background: "var(--card-bg)", position: "sticky", bottom: "-32px", zIndex: 10 }}>
                        <div className="d-flex gap-2">
                            <button type="button" className="btn btn-success" onClick={generatePDF}>Download Form PDF</button>
                        </div>
                        <div className="d-flex gap-2">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Registering..." : "Register Officer"}
                            </button>
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
                        <p><strong>Community:</strong> {formData.community}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Mobile:</strong> {formData.mobile}</p>
                        <p><strong>Date of Appointment:</strong> {formData.dateOfAppointment}</p>
                        <p><strong>Teaching Experience:</strong> {formData.teachingExperience}</p>
                    </div>
                    <p style={{ marginTop: "10px" }}><strong>Residential Address:</strong> {formData.address}</p>

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
