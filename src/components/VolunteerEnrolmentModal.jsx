import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const VolunteerEnrolmentModal = ({ isOpen, onClose, member, collegeData, unitData, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: member?.name || "",
        fatherName: "",
        fatherPhone: "",
        sex: "Male",
        dob: member?.dob || "",
        dept: member?.dept || "",
        course: member?.course || "",
        batchFrom: member?.batchFrom || "",
        batchTo: member?.batchTo || "",
        community: member?.community || "General",
        address: "",
        bloodGroup: member?.bloodGroup || "",
        height: "",
        weight: "",
        contact: member?.contact || "",
        email: "",
        aadhaar: "",
        enrolmentDate: new Date().toISOString().split('T')[0],
        culturalTalents: "",
        hobbies: "",
        image: null,
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
                sex: member.sex || "Male",
                dob: member.dob || "",
                community: member.community || "General",
                bloodGroup: member.bloodGroup || "",
                contact: member.contact || ""
            }));
        }
    }, [member, isOpen]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
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
        const page1 = document.getElementById("enrolment-page-1");
        const page2 = document.getElementById("enrolment-page-2");
        if (!page1 || !page2) return;

        toast.loading("Generating Enrolment Form...");
        try {
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();

            // Page 1
            page1.style.display = "block";
            const canvas1 = await html2canvas(page1, { scale: 2, useCORS: true, logging: false });
            page1.style.display = "none";
            const imgData1 = canvas1.toDataURL("image/png");
            const imgProps1 = pdf.getImageProperties(imgData1);
            const pdfHeight1 = (imgProps1.height * pdfWidth) / imgProps1.width;
            pdf.addImage(imgData1, "PNG", 0, 0, pdfWidth, pdfHeight1);

            // Page 2
            pdf.addPage();
            page2.style.display = "block";
            const canvas2 = await html2canvas(page2, { scale: 2, useCORS: true, logging: false });
            page2.style.display = "none";
            const imgData2 = canvas2.toDataURL("image/png");
            const imgProps2 = pdf.getImageProperties(imgData2);
            const pdfHeight2 = (imgProps2.height * pdfWidth) / imgProps2.width;
            pdf.addImage(imgData2, "PNG", 0, 0, pdfWidth, pdfHeight2);

            pdf.save(`NSS_Enrolment_${formData.name.replace(/\s+/g, "_")}.pdf`);
            toast.dismiss();
            toast.success("Enrolment Form Downloaded!");
        } catch (error) {
            console.error("PDF Error:", error);
            toast.dismiss();
            toast.error("Failed to generate PDF");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/update-unit-member`, {
                memberId: member._id,
                memberData: { ...formData, isEnrolled: true }
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem("nsstoken") || localStorage.getItem("unitToken")}` }
            });

            if (res.data.success) {
                toast.success("Volunteer Enrolment Completed!");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                toast.error(res.data.message || "Update failed");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Server error during enrolment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "900px" }}>
                <div className="flex-between mb-6">
                    <h2 className="mb-0">Volunteer Enrolment Details</h2>
                    <button className="btn btn-sm btn-secondary" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid-cols-2">
                        <div className="form-group">
                            <label>Profile Image (Passport Size)</label>
                            <input type="file" className="form-input" accept="image/*" onChange={handleImageChange} />
                            {formData.image && <img src={formData.image} alt="Preview" style={{ width: "80px", height: "100px", marginTop: "10px", objectFit: "cover" }} />}
                        </div>
                        <div className="form-group">
                            <label>Sex</label>
                            <select className="form-input" name="sex" value={formData.sex} onChange={handleInputChange}>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Father/Guardian's Name</label>
                            <input className="form-input" name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Father/Guardian's Contact</label>
                            <input className="form-input" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Height (cm)</label>
                            <input className="form-input" name="height" value={formData.height} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Weight (kg)</label>
                            <input className="form-input" name="weight" value={formData.weight} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Aadhaar Number</label>
                            <input className="form-input" name="aadhaar" value={formData.aadhaar} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Email ID</label>
                            <input className="form-input" type="email" name="email" value={formData.email} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Cultural Talents</label>
                            <input className="form-input" name="culturalTalents" value={formData.culturalTalents} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Hobbies</label>
                            <input className="form-input" name="hobbies" value={formData.hobbies} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>University Name</label>
                            <input className="form-input" name="universityName" value={formData.universityName} onChange={handleInputChange} />
                        </div>
                        <div className="form-group col-span-2">
                            <label>Residential Address</label>
                            <textarea className="form-input" name="address" value={formData.address} onChange={handleInputChange} rows="2"></textarea>
                        </div>
                    </div>

                    <div className="flex-between mt-6">
                        <button type="button" className="btn btn-success" onClick={generatePDF}>Download Enrolment PDF</button>
                        <div className="d-flex gap-2">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Details"}
                            </button>
                        </div>
                    </div>
                </form>

                {/* PDF TEMPLATE PAGE 1 */}
                <div id="enrolment-page-1" style={{
                    display: "none",
                    width: "210mm",
                    padding: "15mm 20mm",
                    backgroundColor: "#fff",
                    color: "#000",
                    fontFamily: "serif",
                    lineHeight: "1.2"
                }}>
                    <style>{`
                        #enrolment-page-1 *, #enrolment-page-2 * { color: #000 !important; font-family: 'Times New Roman', serif; }
                        .enrolment-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        .enrolment-table th, .enrolment-table td { border: 1px solid #000; padding: 6px 10px; text-align: left; font-size: 13px; }
                        .enrolment-table th { background: #f0f0f0; width: 40px; text-align: center; }
                    `}</style>

                    <div style={{ textAlign: "center", marginBottom: "15px" }}>
                        <h3 style={{ margin: "0", fontSize: "16px", fontWeight: "bold" }}>ANNEXURE – A</h3>
                        <h2 style={{ margin: "5px 0", fontSize: "15px", fontWeight: "bold" }}>NSS VOLUNTEER ENROLMENT (AT UNIT LEVEL)</h2>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                        <div style={{ flex: 1, fontSize: "14px" }}>
                            <p style={{ margin: "8px 0" }}><strong>Name of the College: </strong> {collegeData?.insName || "...................................................................................."}</p>
                            <p style={{ margin: "8px 0" }}><strong>Address: </strong> {collegeData?.location || "...................................................................................."}</p>
                            <p style={{ margin: "8px 0" }}><strong>Name of the University: </strong> {formData.universityName || "........................................................................."}</p>
                            <p style={{ margin: "8px 0" }}><strong>Unit No: </strong> {unitData?.unitNumber || "...................................................................................."}</p>
                        </div>
                        <div style={{ width: "30mm", height: "35mm", border: "1px solid #000", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {formData.image ? <img src={formData.image} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "9px" }}>Affix passport size photo</span>}
                        </div>
                    </div>

                    <table className="enrolment-table">
                        <tbody>
                            <tr><th>1</th><td>Name of the Volunteer</td><td>{formData.name}</td></tr>
                            <tr><th>2</th><td>Father/Guardian’s Name</td><td>{formData.fatherName}</td></tr>
                            <tr><th>3</th><td>Father/Guardian’s Phone No.</td><td>{formData.fatherPhone}</td></tr>
                            <tr><th>4</th><td>Sex</td><td>
                                <span style={{ marginRight: "20px" }}>Male {formData.sex === "Male" ? "[✓]" : "[ ]"}</span>
                                <span>Female {formData.sex === "Female" ? "[✓]" : "[ ]"}</span>
                            </td></tr>
                            <tr><th>5</th><td>Date of birth</td><td>{formData.dob}</td></tr>
                            <tr><th>6</th><td>Year & Branch in which studying</td><td>{formData.course} - {formData.dept}</td></tr>
                            <tr><th>7</th><td>Community</td><td>
                                <span style={{ marginRight: "10px" }}>General {formData.community === "General" ? "[✓]" : "[ ]"}</span>
                                <span style={{ marginRight: "10px" }}>SC {formData.community === "SC" ? "[✓]" : "[ ]"}</span>
                                <span style={{ marginRight: "10px" }}>ST {formData.community === "ST" ? "[✓]" : "[ ]"}</span>
                                <span>OBC {formData.community === "OBC" ? "[✓]" : "[ ]"}</span>
                            </td></tr>
                            <tr><th>8</th><td>Residential Address</td><td style={{ height: "40px" }}>{formData.address}</td></tr>
                            <tr><th>9</th><td>Blood Group</td><td>{formData.bloodGroup}</td></tr>
                            <tr><th>10</th><td colSpan="1">Height in {formData.height} (cm)</td><td>Weight {formData.weight} kg</td></tr>
                            <tr><th>11</th><td>Mobile Phone No.</td><td>{formData.contact}</td></tr>
                            <tr><th>12</th><td>E-mail ID</td><td>{formData.email}</td></tr>
                            <tr><th>13</th><td>Aadhaar Card No.</td><td>{formData.aadhaar}</td></tr>
                            <tr><th>14</th><td>Date/Year of Enrolment</td><td>{formData.enrolmentDate}</td></tr>
                            <tr><th>15</th><td>Cultural Talents (Please specify)</td><td>{formData.culturalTalents}</td></tr>
                            <tr><th>16</th><td>Hobbies</td><td>{formData.hobbies}</td></tr>
                        </tbody>
                    </table>

                    <div style={{ marginTop: "20px", fontSize: "14px", textAlign: "center" }}>
                        <p style={{ fontWeight: "bold" }}>Declaration</p>
                    </div>
                    <div style={{ fontSize: "13px", textAlign: "justify", lineHeight: "1.4" }}>
                        <p>I <strong>{formData.name}</strong> hereby agree to obey all the rules and regulations of National Service Scheme and work imbibing the spirit of the Scheme.</p>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px" }}>
                            <div>
                                <p>Date: {formData.enrolmentDate}</p>
                                <p>Place:</p>
                            </div>
                            <div style={{ textAlign: "right", marginTop: "30px" }}>
                                <p><strong>Signature of the applicant</strong></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PDF TEMPLATE PAGE 2 */}
                <div id="enrolment-page-2" style={{
                    display: "none",
                    width: "210mm",
                    height: "297mm",
                    padding: "20mm 20mm",
                    backgroundColor: "#fff",
                    color: "#000",
                    fontFamily: "serif",
                }}>
                    <div style={{ borderTop: "1px solid #000", paddingTop: "10px", textAlign: "center" }}>
                        <p style={{ fontWeight: "bold", fontSize: "14px" }}>For office use only</p>
                    </div>
                    <div style={{ marginTop: "30px", fontSize: "14px" }}>
                        <p style={{ margin: "15px 0" }}>Date of Enrolment: {formData.enrolmentDate}</p>
                        <p style={{ margin: "15px 0" }}>Enrolment No. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {formData.enrolmentNo || "..........................................."}</p>
                        <p style={{ margin: "15px 0" }}>Remarks if any &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {formData.remarks || "..........................................."}</p>
                    </div>
                    <div style={{ marginTop: "100px", textAlign: "right" }}>
                        <p><strong>Signature of the Programme Officer</strong></p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VolunteerEnrolmentModal;
