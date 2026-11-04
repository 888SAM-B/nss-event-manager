import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { puLogoBase64, nssLogoBase64 } from "../assets/logos";

// Calculate academic year of study strictly from batch (July to May academic calendar)
export const calculateYearOfStudy = (batchFrom) => {
    if (!batchFrom) return "I Year";
    const startYear = parseInt(batchFrom, 10);
    if (isNaN(startYear)) return "I Year";

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    // Academic year is July to May: if Month >= 7 (July-Dec), academic start year is currentYear, else currentYear - 1
    const academicStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
    const yearNum = academicStartYear - startYear + 1;

    if (yearNum <= 1) return "I Year";
    if (yearNum === 2) return "II Year";
    if (yearNum === 3) return "III Year";
    if (yearNum === 4) return "IV Year";
    if (yearNum === 5) return "V Year";
    return `${yearNum} Year`;
};

const VolunteerEnrolmentModal = ({ isOpen, onClose, member, collegeData, unitData, onSuccess, isNewMember, unitCode, collegeCode, mode = "edit" }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: member?.name || "",
        regNo: member?.regNo || "",
        dept: member?.dept || "",
        course: member?.course || "",
        yearOfStudy: member?.yearOfStudy || calculateYearOfStudy(member?.batchFrom),
        batchFrom: member?.batchFrom || "",
        batchTo: member?.batchTo || "",
        community: member?.community || "OBC",
        bloodGroup: member?.bloodGroup || "",
        dob: member?.dob || "",
        contact: member?.contact || "",
        fatherName: "",
        fatherPhone: "",
        sex: member?.gender || member?.sex || "Male",
        gender: member?.gender || member?.sex || "Male",
        address: "",
        height: "",
        weight: "",
        email: "",
        aadhaar: "",
        enrolmentDate: new Date().toISOString().split('T')[0],
        culturalTalents: "",
        hobbies: "",
        universityName: collegeData?.universityName || "",
        // Office use
        enrolmentNo: "",
        remarks: ""
    });

    useEffect(() => {
        if (member) {
            setFormData(prev => ({
                ...prev,
                ...member,
                name: member.name || "",
                regNo: member.regNo || "",
                dept: member.dept || "",
                course: member.course || "",
                yearOfStudy: member.yearOfStudy || calculateYearOfStudy(member.batchFrom),
                batchFrom: member.batchFrom || "",
                batchTo: member.batchTo || "",
                sex: member.gender || member.sex || "Male",
                gender: member.gender || member.sex || "Male",
                dob: member.dob || "",
                community: (member.community === "SC" || member.community === "ST") ? member.community : "OBC",
                bloodGroup: member.bloodGroup || "",
                contact: member.contact || "",
                universityName: member.universityName || collegeData?.universityName || "",
            }));
        }
    }, [member, isOpen]);

    // Auto-trigger PDF download when mode is "download"
    useEffect(() => {
        if (isOpen && mode === "download" && member) {
            // Small delay to let the hidden PDF template render
            const timer = setTimeout(async () => {
                await generatePDF(true); // true = skip validation
                onClose();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, mode]);

    if (!isOpen) return null;

    const readOnly = mode === "view";

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === "gender") {
            setFormData(prev => ({ ...prev, gender: value, sex: value }));
        } else if (name === "sex") {
            setFormData(prev => ({ ...prev, gender: value, sex: value }));
        } else if (name === "batchFrom") {
            const autoYear = calculateYearOfStudy(value);
            setFormData(prev => ({ ...prev, batchFrom: value, yearOfStudy: autoYear }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const validateForm = () => {
        const requiredFields = [
            { key: "name", label: "Name" },
            { key: "regNo", label: "Register Number" },
            { key: "dept", label: "Department" },
            { key: "course", label: "Course" },
            { key: "batchFrom", label: "Batch From" },
            { key: "batchTo", label: "Batch To" },
            { key: "bloodGroup", label: "Blood Group" },
            { key: "dob", label: "Date of Birth" },
            { key: "contact", label: "Mobile Phone No." },
            { key: "fatherName", label: "Father/Guardian's Name" },
            { key: "fatherPhone", label: "Father/Guardian's Contact" },
            { key: "address", label: "Residential Address" },
            { key: "aadhaar", label: "Aadhaar Number" },
            { key: "email", label: "Email ID" },
            { key: "height", label: "Height" },
            { key: "weight", label: "Weight" },
        ];

        for (const field of requiredFields) {
            if (!formData[field.key] || formData[field.key].toString().trim() === "") {
                toast.error(`Please fill in: ${field.label}`);
                return false;
            }
        }

        // Validate Aadhaar - must be 12 digits
        if (!/^\d{12}$/.test(formData.aadhaar)) {
            toast.error("Aadhaar Number must be exactly 12 digits");
            return false;
        }

        // Validate phone - must be 10 digits
        if (!/^\d{10}$/.test(formData.fatherPhone)) {
            toast.error("Father/Guardian's Contact must be 10 digits");
            return false;
        }

        if (!/^\d{10}$/.test(formData.contact)) {
            toast.error("Mobile Phone No. must be 10 digits");
            return false;
        }

        return true;
    };

    const generatePDF = async (skipValidation = false) => {
        if (!skipValidation && !validateForm()) return;

        const singlePage = document.getElementById("enrolment-single-page");
        if (!singlePage) return;

        const toastId = toast.loading("Generating Single-Page Enrolment Form...");
        try {
            singlePage.style.display = "block";
            const canvas = await html2canvas(singlePage, {
                scale: 2,
                useCORS: true,
                logging: false
            });
            singlePage.style.display = "none";

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

            const imgData = canvas.toDataURL("image/png");
            const imgProps = pdf.getImageProperties(imgData);
            const renderedHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Fit cleanly onto strictly 1 page without spilling or second page
            if (renderedHeight > pdfHeight) {
                const scale = pdfHeight / renderedHeight;
                const scaledWidth = pdfWidth * scale;
                const offsetX = (pdfWidth - scaledWidth) / 2;
                pdf.addImage(imgData, "PNG", offsetX, 0, scaledWidth, pdfHeight);
            } else {
                // Header at the top
                pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, renderedHeight);
            }

            pdf.save(`NSS_Enrolment_${(formData.name || "volunteer").replace(/\s+/g, "_")}.pdf`);
            toast.dismiss(toastId);
            toast.success("Enrolment Form Downloaded (1 Page)!");
        } catch (error) {
            console.error("PDF Error:", error);
            toast.dismiss(toastId);
            toast.error("Failed to generate PDF");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        const token = localStorage.getItem("nsstoken") || localStorage.getItem("unitToken");
        try {
            const payload = {
                ...formData,
                sex: formData.gender || formData.sex || "Male",
                gender: formData.gender || formData.sex || "Male",
                isEnrolled: true
            };

            if (isNewMember) {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/add-unit-member`, {
                    unitCode: unitCode,
                    collegeCode: collegeCode,
                    member: payload
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    toast.success("Member added and enrolled successfully!");
                    if (onSuccess) onSuccess(res.data.unit);
                } else {
                    toast.error(res.data.message || "Failed to add member");
                }
            } else {
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/update-unit-member`, {
                    memberId: member._id,
                    memberData: payload
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    toast.success("Volunteer Enrolment Updated!");
                    if (onSuccess) onSuccess(res.data.member);
                } else {
                    toast.error(res.data.message || "Update failed");
                }
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Server error during enrolment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentGender = String(formData.gender || formData.sex || "Male").trim();
    const genderLower = currentGender.toLowerCase();
    const isMale = genderLower === "male" || genderLower === "m";
    const isFemale = genderLower === "female" || genderLower === "f";
    const isOther = !isMale && !isFemale && genderLower.length > 0;

    const currentCommunity = String(formData.community || "OBC").trim();
    const commUpper = currentCommunity.toUpperCase();
    const isSC = commUpper === "SC";
    const isST = commUpper === "ST";
    const isOBC = commUpper === "OBC" || (!isSC && !isST);

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "950px" }}>
                <div className="flex-between mb-6">
                    <h2 className="mb-0">
                        {mode === "view" ? "Volunteer Profile Details" :
                            isNewMember ? "Add New NSS Volunteer" : "Edit Volunteer Details"}
                    </h2>
                    <button className="btn btn-sm btn-secondary" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* SECTION 1: Basic Details */}
                    <div style={{ marginBottom: "2rem" }}>
                        <div className="form-section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> Basic Details
                        </div>
                        <div className="grid-cols-2">
                            <div className="form-group">
                                <label>Name <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Register Number <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" name="regNo" value={formData.regNo} onChange={handleInputChange} placeholder="Registration Number" required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Department <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" name="dept" value={formData.dept} onChange={handleInputChange} placeholder="e.g. CSE" required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Course <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" name="course" value={formData.course} onChange={handleInputChange} placeholder="e.g. B.E. / B.Tech" required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Year of Study <span style={{ color: "red" }}>*</span></label>
                                <select className="form-input" name="yearOfStudy" value={formData.yearOfStudy || calculateYearOfStudy(formData.batchFrom)} onChange={handleInputChange} disabled={readOnly}>
                                    <option value="I Year">I Year</option>
                                    <option value="II Year">II Year</option>
                                    <option value="III Year">III Year</option>
                                    <option value="IV Year">IV Year</option>
                                    <option value="V Year">V Year</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Community <span style={{ color: "red" }}>*</span></label>
                                <select className="form-input" name="community" value={currentCommunity} onChange={handleInputChange} disabled={readOnly}>
                                    <option value="OBC">OBC</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Batch From (Year) <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" type="number" name="batchFrom" value={formData.batchFrom} onChange={handleInputChange} placeholder="e.g. 2022" required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Batch To (Year) <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" type="number" name="batchTo" value={formData.batchTo} onChange={handleInputChange} placeholder="e.g. 2026" required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Blood Group <span style={{ color: "red" }}>*</span></label>
                                <select className="form-input" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} required disabled={readOnly}>
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
                                <label>Date of Birth <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" type="date" name="dob" value={formData.dob} onChange={handleInputChange} required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Mobile Phone No. <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" name="contact" value={formData.contact} onChange={handleInputChange} placeholder="10-digit mobile number" maxLength={10} required disabled={readOnly} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Enrolment Details */}
                    <div style={{ marginBottom: "2rem" }}>
                        <div className="form-section-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg> Enrolment Details
                        </div>
                        <div className="grid-cols-2">
                            <div className="form-group">
                                <label>Gender <span style={{ color: "red" }}>*</span></label>
                                <select className="form-input" name="gender" value={currentGender} onChange={handleInputChange} disabled={readOnly}>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Father/Guardian's Name <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Enter father/guardian's name" required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Father/Guardian's Contact <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} placeholder="10-digit mobile number" maxLength={10} required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Height (cm) <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" name="height" value={formData.height} onChange={handleInputChange} placeholder="e.g. 165" required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Weight (kg) <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="e.g. 60" required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Aadhaar Number <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" name="aadhaar" value={formData.aadhaar} onChange={handleInputChange} placeholder="12-digit Aadhaar number" maxLength={12} required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Email ID <span style={{ color: "red" }}>*</span></label>
                                <input className="form-input" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Enter email address" required disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Date of Enrolment</label>
                                <input className="form-input" type="date" name="enrolmentDate" value={formData.enrolmentDate} onChange={handleInputChange} disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Cultural Talents</label>
                                <input className="form-input" name="culturalTalents" value={formData.culturalTalents} onChange={handleInputChange} placeholder="e.g. Singing, Dancing" disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>Hobbies</label>
                                <input className="form-input" name="hobbies" value={formData.hobbies} onChange={handleInputChange} placeholder="e.g. Reading, Sports" disabled={readOnly} />
                            </div>
                            <div className="form-group">
                                <label>University Name</label>
                                <input className="form-input" name="universityName" value={formData.universityName} onChange={handleInputChange} disabled={readOnly} />
                            </div>
                            <div className="form-group col-span-2" style={{ gridColumn: '1 / -1' }}>
                                <label>Residential Address <span style={{ color: "red" }}>*</span></label>
                                <textarea className="form-input" name="address" value={formData.address} onChange={handleInputChange} rows="2" placeholder="Enter full residential address" required disabled={readOnly}></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="flex-between mt-8 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                        <button type="button" className="btn btn-outline-primary" onClick={() => generatePDF(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg> Download Enrolment PDF (1 Page)
                        </button>
                        <div className="d-flex gap-3">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                {mode === "view" ? "Close" : "Cancel"}
                            </button>
                            {mode !== "view" && (
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ minWidth: "120px" }}>
                                    {isSubmitting ? "Saving..." : (isNewMember ? "Add & Enrol" : "Save & Update")}
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* SINGLE PAGE PDF TEMPLATE (Strictly 1 Page, Well-Spaced & Symmetrical) */}
                <div id="enrolment-single-page" style={{
                    display: "none",
                    width: "210mm",
                    padding: "6mm 14mm 8mm 14mm",
                    backgroundColor: "#fff",
                    color: "#000",
                    fontFamily: "'Times New Roman', serif",
                    boxSizing: "border-box"
                }}>
                    <style>{`
                        #enrolment-single-page * { color: #000 !important; font-family: 'Times New Roman', serif; box-sizing: border-box; }
                        .enrol-single-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
                        .enrol-single-table th, .enrol-single-table td { border: 1px solid #000; padding: 4px 8px; text-align: left; font-size: 11px; line-height: 1.32; }
                        .enrol-single-table th { background: #f4f4f4; width: 32px; text-align: center; font-weight: bold; }
                    `}</style>

                    {/* Header with PU Logo (Left), Title (Center), NSS Logo (Right) */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        paddingBottom: "6px",
                        borderBottom: "1.5px solid #000"
                    }}>
                        <div style={{ width: "22mm", height: "22mm", minWidth: "22mm", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <img src={puLogoBase64} alt="Periyar University" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                        <div style={{ flex: 1, textAlign: "center", padding: "0 10px" }}>
                            <div style={{ fontSize: "14px", fontWeight: "bold", letterSpacing: "1px" }}>ANNEXURE – A</div>
                            <div style={{ fontSize: "13px", fontWeight: "bold", marginTop: "2px", letterSpacing: "0.5px" }}>NSS VOLUNTEER ENROLMENT (AT UNIT LEVEL)</div>
                        </div>
                        <div style={{ width: "22mm", height: "22mm", minWidth: "22mm", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <img src={nssLogoBase64} alt="NSS Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                    </div>

                    {/* Meta info & Photo box */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "12px" }}>
                        <table style={{ flex: 1, border: "none", borderCollapse: "collapse", fontSize: "11.5px", lineHeight: "1.55" }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: "155px", fontWeight: "bold", padding: "2.5px 0", border: "none" }}>Name of the College</td>
                                    <td style={{ width: "12px", fontWeight: "bold", padding: "2.5px 0", border: "none" }}>:</td>
                                    <td style={{ padding: "2.5px 0", border: "none" }}>{collegeData?.insName || "...................................................................."}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "2.5px 0", border: "none" }}>Address</td>
                                    <td style={{ fontWeight: "bold", padding: "2.5px 0", border: "none" }}>:</td>
                                    <td style={{ padding: "2.5px 0", border: "none" }}>{collegeData?.location || "...................................................................."}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "2.5px 0", border: "none" }}>Name of the University</td>
                                    <td style={{ fontWeight: "bold", padding: "2.5px 0", border: "none" }}>:</td>
                                    <td style={{ padding: "2.5px 0", border: "none" }}>{formData.universityName || collegeData?.universityName || "...................................................................."}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold", padding: "2.5px 0", border: "none" }}>Unit No.</td>
                                    <td style={{ fontWeight: "bold", padding: "2.5px 0", border: "none" }}>:</td>
                                    <td style={{ padding: "2.5px 0", border: "none" }}>{unitData?.unitNumber || "...................................................................."}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div style={{
                            width: "35mm",
                            height: "44mm",
                            minWidth: "35mm",
                            border: "1.5px solid #000",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "6px",
                            backgroundColor: "#fafafa"
                        }}>
                            <span style={{ fontSize: "9px", fontWeight: "600", lineHeight: "1.3", color: "#333", textAlign: "center" }}>
                                Affix Passport Size<br />Photograph<br />
                                <span style={{ fontSize: "8px", fontWeight: "normal", color: "#666" }}>(Self-Attested)</span>
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="enrol-single-table">
                        <tbody className="table-height-tbody" >
                            <tr><th>1</th><td className="table-height" style={{ width: "215px", height: "34px", fontWeight: 600 }}>Name of the Volunteer</td><td>{formData.name}</td></tr>
                            <tr><th>2</th><td style={{ fontWeight: 600 }}>Father/Guardian's Name</td><td>{formData.fatherName}</td></tr>
                            <tr><th>3</th><td style={{ fontWeight: 600 }}>Father/Guardian's Phone No.</td><td>{formData.fatherPhone}</td></tr>
                            <tr><th>4</th><td style={{ fontWeight: 600 }}>Gender</td><td>
                                <span style={{ marginRight: "24px" }}>Male [{isMale ? "✓" : " "}]</span>
                                <span style={{ marginRight: "24px" }}>Female [{isFemale ? "✓" : " "}]</span>
                                <span>Other [{isOther ? "✓" : " "}]</span>
                            </td></tr>
                            <tr><th>5</th><td style={{ fontWeight: 600 }}>Date of birth</td><td>{formData.dob}</td></tr>
                            <tr><th>6</th><td style={{ fontWeight: 600 }}>Year & Branch in which studying</td><td>
                                {[formData.yearOfStudy || calculateYearOfStudy(formData.batchFrom), formData.course, formData.dept].filter(Boolean).join(" - ")}{formData.batchFrom && formData.batchTo ? ` (${formData.batchFrom} - ${formData.batchTo})` : ""}
                            </td></tr>
                            <tr><th>7</th><td style={{ fontWeight: 600 }}>Community</td><td>
                                <span style={{ marginRight: "28px" }}>SC [{isSC ? "✓" : " "}]</span>
                                <span style={{ marginRight: "28px" }}>ST [{isST ? "✓" : " "}]</span>
                                <span>OBC [{isOBC ? "✓" : " "}]</span>
                            </td></tr>
                            <tr><th>8</th><td style={{ fontWeight: 600 }}>Residential Address</td><td style={{ minHeight: "36px", verticalAlign: "middle" }}>{formData.address}</td></tr>
                            <tr><th>9</th><td style={{ fontWeight: 600 }}>Blood Group</td><td>{formData.bloodGroup}</td></tr>
                            <tr><th>10</th><td style={{ fontWeight: 600 }}>Physical Standards</td><td>Height: <strong>{formData.height || "—"} cm</strong> &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp; Weight: <strong>{formData.weight || "—"} kg</strong></td></tr>
                            <tr><th>11</th><td style={{ fontWeight: 600 }}>Mobile Phone No.</td><td>{formData.contact}</td></tr>
                            <tr><th>12</th><td style={{ fontWeight: 600 }}>E-mail ID</td><td>{formData.email}</td></tr>
                            <tr><th>13</th><td style={{ fontWeight: 600 }}>Aadhaar Card No.</td><td>{formData.aadhaar}</td></tr>
                            <tr><th>14</th><td style={{ fontWeight: 600 }}>Date/Year of Enrolment</td><td>{formData.enrolmentDate}</td></tr>
                            <tr><th>15</th><td style={{ fontWeight: 600 }}>Cultural Talents (Please specify)</td><td>{formData.culturalTalents || "NIL"}</td></tr>
                            <tr><th>16</th><td style={{ fontWeight: 600 }}>Hobbies</td><td>{formData.hobbies || "NIL"}</td></tr>
                        </tbody>
                    </table>

                    {/* Declaration */}
                    <div style={{ marginTop: "10px", fontSize: "11px" }}>
                        <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "3px", fontSize: "11.5px", letterSpacing: "0.5px" }}>DECLARATION</div>
                        <p style={{ margin: "2px 0 8px 0", fontSize: "10.5px", textAlign: "justify", lineHeight: "1.35" }}>
                            I <strong>{formData.name}</strong> hereby agree to obey all the rules and regulations of National Service Scheme and work imbibing the spirit of the Scheme.
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <div style={{ fontSize: "10.5px", lineHeight: "1.6" }}>
                                <div><strong>Date :</strong> {formData.enrolmentDate || "............................"}</div>
                                <div><strong>Place :</strong> ............................................</div>
                            </div>
                            <div style={{ textAlign: "right", fontSize: "11px" }}>
                                <div style={{ height: "26px" }}></div>
                                <strong>Signature of the Volunteer / Applicant</strong>
                            </div>
                        </div>
                    </div>

                    {/* For office use only - Merged on same page */}
                    <div style={{
                        marginTop: "12px",
                        border: "1.5px solid #000",
                        padding: "7px 12px",
                        backgroundColor: "#fafafa"
                    }}>
                        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "11.5px", marginBottom: "6px", letterSpacing: "0.5px", textDecoration: "underline" }}>
                            FOR OFFICE USE ONLY
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10.5px", lineHeight: "1.4" }}>
                            <div><strong>Date of Enrolment:</strong> {formData.enrolmentDate}</div>
                            <div><strong>Enrolment No.:</strong> {formData.enrolmentNo || "...................................."}</div>
                            <div><strong>Remarks:</strong> {formData.remarks || "...................................."}</div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "42px" }}>
                            <div style={{ fontSize: "10px", color: "#444" }}>
                                (Office Seal)
                            </div>
                            <div style={{ textAlign: "right", fontSize: "11px" }}>
                                <strong>Signature of the Programme Officer</strong>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VolunteerEnrolmentModal;
