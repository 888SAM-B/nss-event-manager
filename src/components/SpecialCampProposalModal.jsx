import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import { puLogoBase64, nssLogoBase64 } from "../assets/logos";

const SpecialCampProposalModal = ({ isOpen, onClose, event, collegeData, unitData }) => {
    const reportRef = useRef(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    if (!isOpen || !event) return null;

    const details = event.specialCampDetails || {};

    const collegeName = details.collegeName || collegeData?.insName || event.collegeId?.insName || "Periyar University Affiliated College";
    const fullPostalAddress = details.postalAddress || collegeData?.collegeLocation?.address || collegeData?.location || "";
    const collegePhone = details.collegePhone || collegeData?.collegeDetails?.phone || collegeData?.phone || collegeData?.mobile || "";
    const collegeEmail = details.collegeEmail || collegeData?.collegeDetails?.email || collegeData?.email || "";

    const principalName = details.principalName || collegeData?.principalDetails?.name || collegeData?.principal || "";
    const principalPhoneStd = details.principalPhoneStd || collegeData?.principalDetails?.phone || "";
    const principalMobile = details.principalMobile || collegeData?.principalDetails?.mobile || collegeData?.principalPhone || "";

    const poList = Array.isArray(details.poDetails) && details.poDetails.length > 0
        ? details.poDetails
        : [{
            sNo: 1,
            name: unitData?.head?.name || unitData?.head || "",
            address: unitData?.head?.address || "",
            phoneRes: unitData?.head?.phoneRes || "",
            mobile: unitData?.head?.mobile || unitData?.contact || "",
            email: unitData?.head?.email || unitData?.mail || ""
        }];

    const teachers = Array.isArray(details.teachersDeputed) && details.teachersDeputed.length > 0
        ? details.teachersDeputed
        : [{ name: "", department: "" }, { name: "", department: "" }];

    const village = details.adoptedVillage || {};
    const strength = details.campStrength || {
        organizers: 2,
        volunteers: 43,
        nonStudents: 5,
        total: 50,
        breakup: { ocMale: 15, ocFemale: 12, scMale: 8, scFemale: 6, stMale: 1, stFemale: 1, totalMale: 24, totalFemale: 19 }
    };
    const breakup = strength.breakup || { ocMale: 15, ocFemale: 12, scMale: 8, scFemale: 6, stMale: 1, stFemale: 1, totalMale: 24, totalFemale: 19 };

    const commencementDate = details.commencementDate || event.dateFrom || event.date || "";
    const valedictoryDate = details.valedictoryDate || event.dateTo || "";
    const durationDays = details.durationDays || "7 Days";

    const activities = Array.isArray(details.activities) && details.activities.length > 0
        ? details.activities
        : Array.from({ length: 7 }, (_, i) => ({
            day: i + 1,
            activityName: "",
            villageName: village.name || "",
            duration: "1",
            beneficiaries: "",
            volunteersInvolved: ""
        }));

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsGeneratingPdf(true);
        const toastId = toast.loading("Generating Official Special Camp Proposal Form 1 (A4 PDF)...");

        try {
            const pageElements = reportRef.current.querySelectorAll('.special-camp-a4-page');
            if (!pageElements || pageElements.length === 0) {
                throw new Error("No pages found to generate PDF");
            }

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true
            });

            for (let i = 0; i < pageElements.length; i++) {
                if (i > 0) {
                    pdf.addPage("a4", "portrait");
                }

                const canvas = await html2canvas(pageElements[i], {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    backgroundColor: "#ffffff"
                });

                const imgData = canvas.toDataURL("image/jpeg", 0.95);
                pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
            }

            const cleanFileName = `NSS_Special_Camp_Form1_${(collegeData?.code || "College")}_${(unitData?.unitNumber || "Unit")}.pdf`;
            pdf.save(cleanFileName);
            toast.dismiss(toastId);
            toast.success("Special Camp Proposal Form 1 Downloaded Successfully!");
        } catch (err) {
            console.error("PDF generation failed:", err);
            toast.dismiss(toastId);
            toast.error("Failed to generate PDF. You can also use the Print button.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="special-camp-modal-backdrop" style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflowY: "auto",
            padding: "20px 10px",
            backdropFilter: "blur(4px)"
        }}>
            {/* Scoped CSS for Strict A4 Print & Clean Multi-page layout */}
            <style>{`
                .special-camp-a4-page {
                    width: 210mm;
                    height: 297mm;
                    min-height: 297mm;
                    max-height: 297mm;
                    box-sizing: border-box;
                    padding: 14mm 16mm 12mm 16mm;
                    margin: 0 auto 24px auto;
                    background: #ffffff;
                    color: #000000;
                    font-family: 'Times New Roman', Times, serif;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justifyContent: space-between;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                }

                .sc-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 12px;
                }

                .sc-table th, .sc-table td {
                    border: 1px solid #000000;
                    padding: 4.5px 6px;
                    font-size: 11.5px;
                    line-height: 1.35;
                    vertical-align: top;
                }

                .sc-table th {
                    background-color: #f8fafc;
                    font-weight: bold;
                }

                .sc-section-title {
                    font-weight: bold;
                    font-size: 12.5px;
                    margin: 10px 0 6px 0;
                    color: #000000;
                }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #special-camp-printable-doc, #special-camp-printable-doc * {
                        visibility: visible !important;
                    }
                    #special-camp-printable-doc {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 210mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: transparent !important;
                        box-shadow: none !important;
                    }
                    .special-camp-a4-page {
                        width: 210mm !important;
                        height: 297mm !important;
                        max-height: 297mm !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        overflow: hidden !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Top Action Bar */}
            <div className="no-print" style={{
                width: "100%",
                maxWidth: "210mm",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#ffffff",
                padding: "0.85rem 1.25rem",
                borderRadius: "10px",
                marginBottom: "16px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "1.4rem" }}>🏕️</span>
                    <div>
                        <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                            Special Camp Proposal (Form 1)
                        </h4>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            Official 4-Page Submission to Periyar University
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        onClick={handlePrint}
                        className="btn btn-outline-primary btn-sm"
                        style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                        Print Document
                    </button>

                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPdf}
                        className="btn btn-primary btn-sm"
                        style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, background: "#1e3a8a", borderColor: "#1e3a8a" }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {isGeneratingPdf ? "Generating PDF..." : "Download Official PDF"}
                    </button>

                    <button
                        onClick={onClose}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.4rem 0.75rem" }}
                    >
                        ✕ Close
                    </button>
                </div>
            </div>

            {/* Document Container */}
            <div id="special-camp-printable-doc" ref={reportRef} style={{ width: "210mm" }}>
                
                {/* ==================== PAGE 1 ==================== */}
                <div className="special-camp-a4-page">
                    <div>
                        {/* Title Header with University Logos */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #000000", paddingBottom: "10px", marginBottom: "16px" }}>
                            <img src={nssLogoBase64} alt="NSS Logo" style={{ height: "55px", width: "55px", objectFit: "contain" }} />
                            <div style={{ textAlign: "center", flex: 1, padding: "0 10px" }}>
                                <div style={{ fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    PERIYAR UNIVERSITY — NATIONAL SERVICE SCHEME (NSS)
                                </div>
                                <div style={{ fontSize: "15px", fontWeight: "bold", textTransform: "uppercase", marginTop: "4px", textDecoration: "underline" }}>
                                    SUBMISSION OF SPECIAL CAMP PROPOSAL TO THE UNIVERSITY
                                </div>
                                <div style={{ fontSize: "11px", fontStyle: "italic", marginTop: "2px" }}>
                                    (Form - 1: Proposal for 7-Day Special Camping Programme)
                                </div>
                            </div>
                            <img src={puLogoBase64} alt="Periyar University Logo" style={{ height: "55px", width: "55px", objectFit: "contain" }} />
                        </div>

                        {/* Section 1 & 2 Table */}
                        <table className="sc-table">
                            <tbody>
                                <tr>
                                    <td style={{ width: "6%", textAlign: "center", fontWeight: "bold" }}>1.</td>
                                    <td style={{ width: "38%", fontWeight: "bold" }}>Theme:</td>
                                    <td style={{ width: "56%", fontWeight: "bold" }}>
                                        {details.theme || "-"}
                                    </td>
                                </tr>
                                <tr>
                                    <td rowSpan={4} style={{ textAlign: "center", fontWeight: "bold" }}></td>
                                    <td style={{ fontWeight: "bold" }}>1.1 Name of the college</td>
                                    <td style={{ fontWeight: "bold" }}>{collegeName}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>1.2 Full Postal Address</td>
                                    <td>{fullPostalAddress || "As per official records"}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>1.3 Telephone No. of the College with STD code & Mobile No.</td>
                                    <td>{collegePhone || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>1.4 E-Mail ID</td>
                                    <td>{collegeEmail || "N/A"}</td>
                                </tr>

                                <tr>
                                    <td style={{ textAlign: "center", fontWeight: "bold" }}>2.</td>
                                    <td style={{ fontWeight: "bold" }}>Name of the Principal</td>
                                    <td style={{ fontWeight: "bold" }}>{principalName || "The Principal"}</td>
                                </tr>
                                <tr>
                                    <td rowSpan={2} style={{ textAlign: "center", fontWeight: "bold" }}></td>
                                    <td rowSpan={2} style={{ fontWeight: "bold" }}>2.1 Telephone No. of the Principal</td>
                                    <td>with STD Code: {principalPhoneStd || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td>Mobile No.: {principalMobile || "N/A"}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Section 3: Programme Officers Table */}
                        <div className="sc-section-title">3. Details of the Programme Officer(s)</div>
                        <table className="sc-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "6%", textAlign: "center" }}>S.No</th>
                                    <th style={{ width: "32%", textAlign: "left" }}>Name of the PO(s) Conducting the Camp</th>
                                    <th style={{ width: "32%", textAlign: "left" }}>Residential Address</th>
                                    <th style={{ width: "30%", textAlign: "left" }}>Phone No.(R) & Mobile No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {poList.map((po, idx) => (
                                    <tr key={idx}>
                                        <td style={{ textAlign: "center", fontWeight: "bold" }}>{idx + 1}</td>
                                        <td style={{ fontWeight: "bold" }}>
                                            {po.name || "NSS Programme Officer"}
                                            <div style={{ fontSize: "10px", fontWeight: "normal", color: "#475569" }}>
                                                NSS Unit {unitData?.unitNumber || "1"}
                                            </div>
                                        </td>
                                        <td>{po.address || "Camp Headquarters / College Staff Quarters"}</td>
                                        <td>
                                            <div>Tel. No.(R) : {po.phoneRes || "N/A"}</div>
                                            <div style={{ marginTop: "3px" }}>Mobile No. : <strong>{po.mobile || "N/A"}</strong></div>
                                            <div style={{ marginTop: "3px" }}>E-Mail ID : {po.email || "N/A"}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Section 4: Deputed Teachers */}
                        <div className="sc-section-title">
                            4. Name of the Teachers deputed to help the Programme Officer:
                            <span style={{ fontSize: "11px", fontWeight: "normal", fontStyle: "italic", marginLeft: "6px" }}>
                                (Staff must be deputed to assist the P.O/NSS)
                            </span>
                        </div>
                        <div style={{ padding: "8px 12px", border: "1px solid #000000", background: "#ffffff", marginBottom: "10px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <span style={{ width: "25px", fontWeight: "bold" }}>1.</span>
                                    <span style={{ flex: 1, borderBottom: "1px dotted #000", paddingBottom: "2px" }}>
                                        {teachers[0]?.name ? `${teachers[0].name} (${teachers[0].department || "Department Faculty"})` : "Faculty Member 1 — (Deputed Assistant)"}
                                    </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <span style={{ width: "25px", fontWeight: "bold" }}>2.</span>
                                    <span style={{ flex: 1, borderBottom: "1px dotted #000", paddingBottom: "2px" }}>
                                        {teachers[1]?.name ? `${teachers[1].name} (${teachers[1].department || "Department Faculty"})` : "Faculty Member 2 — (Deputed Assistant)"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page 1 Footer */}
                    <div style={{ borderTop: "1px solid #000000", paddingTop: "5px", display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                        <span>NSS Special Camp Form 1 — Periyar University</span>
                        <span style={{ fontWeight: "bold" }}>Page 1 of 4</span>
                    </div>
                </div>

                {/* ==================== PAGE 2 ==================== */}
                <div className="special-camp-a4-page">
                    <div>
                        {/* Section 5: Adopted Village Table */}
                        <div className="sc-section-title">5. Adopted Village(s)</div>
                        <table className="sc-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "20%", textAlign: "left" }}>Name of the camp venue (i.e) adopted village(s)</th>
                                    <th style={{ width: "18%", textAlign: "left" }}>Name of the Panchayat Union</th>
                                    <th style={{ width: "24%", textAlign: "left" }}>Full address of the camp venue</th>
                                    <th style={{ width: "18%", textAlign: "left" }}>Mobile No and Tel.No. in the camp venue</th>
                                    <th style={{ width: "20%", textAlign: "left" }}>Name of the contact person in the adopted village and Mobile No.</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ fontWeight: "bold" }}>{village.name || "Adopted Village"}</td>
                                    <td>{village.panchayatUnion || "Panchayat Union"}</td>
                                    <td>{village.address || "Adopted Village Camp Venue, Salem District"}</td>
                                    <td>{village.venuePhone || "Village Panchayat Office / School"}</td>
                                    <td>
                                        {village.contactPerson ? `${village.contactPerson}` : "Village Head / Panchayat Leader"}
                                        {village.contactMobile ? ` — ${village.contactMobile}` : ""}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Section 6: Distance & Conveyance */}
                        <div style={{ margin: "14px 0 18px 0", fontSize: "12px", lineHeight: "1.9" }}>
                            <div style={{ display: "flex" }}>
                                <div style={{ width: "420px", fontWeight: "bold" }}>6. Distance of the camp venue from the college</div>
                                <div>: <strong>{village.distance || "15"} km</strong></div>
                            </div>
                            <div style={{ display: "flex" }}>
                                <div style={{ width: "420px", paddingLeft: "18px" }}>6.1 Mode of Conveyance</div>
                                <div>: {village.conveyanceMode || "College Bus / Government Transport"}</div>
                            </div>
                            <div style={{ display: "flex" }}>
                                <div style={{ width: "420px", paddingLeft: "18px" }}>6.2 Bus/ Train fare from the College to Camp venue</div>
                                <div>: {village.fare || "As per actuals (Nominal fare)"}</div>
                            </div>
                        </div>

                        {/* Section 7: Camp Strength Planned */}
                        <div className="sc-section-title">7. Camp Strength planned (50 campers/Unit)</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "16px" }}>
                            <div style={{ flex: 1, fontSize: "12px", lineHeight: "1.9" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", width: "260px" }}>
                                    <span>i. No.of Camp Organizers</span>
                                    <span>: <strong>{strength.organizers ?? 2}</strong></span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", width: "260px" }}>
                                    <span>ii. No.of NSS Volunteers</span>
                                    <span>: <strong>{strength.volunteers ?? 43}</strong></span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", width: "260px" }}>
                                    <span>iii. No.of Non-Student Volunteers</span>
                                    <span>: <strong>{strength.nonStudents ?? 5}</strong></span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", width: "260px", borderTop: "1px solid #000", fontWeight: "bold", marginTop: "4px", paddingTop: "2px" }}>
                                    <span>Total</span>
                                    <span>: <strong>{strength.total ?? 50}</strong></span>
                                </div>
                            </div>

                            {/* Community & Gender Table */}
                            <div style={{ flex: 1.2 }}>
                                <table className="sc-table" style={{ textAlign: "center", marginBottom: 0 }}>
                                    <thead>
                                        <tr>
                                            <th colSpan={2} style={{ textAlign: "center" }}>OC</th>
                                            <th colSpan={2} style={{ textAlign: "center" }}>SC</th>
                                            <th colSpan={2} style={{ textAlign: "center" }}>ST</th>
                                            <th colSpan={2} style={{ textAlign: "center", background: "#f1f5f9" }}>TOTAL</th>
                                        </tr>
                                        <tr>
                                            <th style={{ width: "12%", textAlign: "center" }}>M</th>
                                            <th style={{ width: "12%", textAlign: "center" }}>F</th>
                                            <th style={{ width: "12%", textAlign: "center" }}>M</th>
                                            <th style={{ width: "12%", textAlign: "center" }}>F</th>
                                            <th style={{ width: "12%", textAlign: "center" }}>M</th>
                                            <th style={{ width: "12%", textAlign: "center" }}>F</th>
                                            <th style={{ width: "14%", textAlign: "center", background: "#f1f5f9" }}>M</th>
                                            <th style={{ width: "14%", textAlign: "center", background: "#f1f5f9" }}>F</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ fontWeight: "bold" }}>{breakup.ocMale || 0}</td>
                                            <td style={{ fontWeight: "bold" }}>{breakup.ocFemale || 0}</td>
                                            <td style={{ fontWeight: "bold" }}>{breakup.scMale || 0}</td>
                                            <td style={{ fontWeight: "bold" }}>{breakup.scFemale || 0}</td>
                                            <td style={{ fontWeight: "bold" }}>{breakup.stMale || 0}</td>
                                            <td style={{ fontWeight: "bold" }}>{breakup.stFemale || 0}</td>
                                            <td style={{ fontWeight: "bold", background: "#f1f5f9" }}>{breakup.totalMale || 0}</td>
                                            <td style={{ fontWeight: "bold", background: "#f1f5f9" }}>{breakup.totalFemale || 0}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={6} style={{ textAlign: "right", fontWeight: "bold", fontSize: "11px" }}>Grand Total:</td>
                                            <td colSpan={2} style={{ fontWeight: "bold", background: "#e2e8f0", fontSize: "12px" }}>
                                                {(Number(breakup.totalMale) || 0) + (Number(breakup.totalFemale) || 0) || strength.total || 50}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Section 8: Dates and Duration */}
                        <div style={{ marginTop: "24px", fontSize: "12px", lineHeight: "2.1" }}>
                            <div style={{ display: "flex" }}>
                                <div style={{ width: "380px", fontWeight: "bold" }}>8. Date of commencement of the Camp</div>
                                <div>: <strong>{commencementDate ? new Date(commencementDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "As scheduled"}</strong></div>
                            </div>
                            <div style={{ display: "flex" }}>
                                <div style={{ width: "380px", paddingLeft: "16px", fontWeight: "bold" }}>Date of valedictory of the Camp</div>
                                <div>: <strong>{valedictoryDate ? new Date(valedictoryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "As scheduled"}</strong></div>
                            </div>
                            <div style={{ display: "flex" }}>
                                <div style={{ width: "380px", paddingLeft: "16px", fontWeight: "bold" }}>Duration of the Camp</div>
                                <div>: <strong>{durationDays}</strong></div>
                            </div>
                        </div>
                    </div>

                    {/* Page 2 Footer */}
                    <div style={{ borderTop: "1px solid #000000", paddingTop: "5px", display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                        <span>NSS Special Camp Form 1 — Periyar University</span>
                        <span style={{ fontWeight: "bold" }}>Page 2 of 4</span>
                    </div>
                </div>

                {/* ==================== PAGE 3 ==================== */}
                <div className="special-camp-a4-page">
                    <div>
                        {/* Section 9: 7-Day Day-wise Activity Programme */}
                        <div className="sc-section-title">
                            9. Activities to be completed during the Camp (detailed programme)
                        </div>
                        <table className="sc-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "7%", textAlign: "center" }}>S.No</th>
                                    <th style={{ width: "43%", textAlign: "left" }}>Name of the Activity/ Programmes planned</th>
                                    <th style={{ width: "20%", textAlign: "left" }}>Name of the Adopted Village</th>
                                    <th style={{ width: "10%", textAlign: "center" }}>Duration (Days)</th>
                                    <th style={{ width: "10%", textAlign: "center" }}>No. of beneficiaries (Villagers)</th>
                                    <th style={{ width: "10%", textAlign: "center" }}>No. of Campers involved (NSS)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.slice(0, 7).map((act, idx) => (
                                    <tr key={idx}>
                                        <td style={{ textAlign: "center", fontWeight: "bold" }}>Day {act.day || idx + 1}</td>
                                        <td style={{ fontWeight: act.activityName ? "bold" : "normal" }}>{act.activityName || "-"}</td>
                                        <td>{act.villageName || village.name || "-"}</td>
                                        <td style={{ textAlign: "center" }}>{act.duration || "1"}</td>
                                        <td style={{ textAlign: "center" }}>{act.beneficiaries !== undefined && act.beneficiaries !== "" ? act.beneficiaries : "-"}</td>
                                        <td style={{ textAlign: "center" }}>{act.volunteersInvolved !== undefined && act.volunteersInvolved !== "" ? act.volunteersInvolved : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Sections 10, 11, 12 */}
                        <div style={{ marginTop: "18px", fontSize: "12px", lineHeight: "2.1" }}>
                            <div style={{ display: "flex", marginBottom: "8px" }}>
                                <div style={{ width: "360px", fontWeight: "bold" }}>10. Details of evening guest lecture</div>
                                <div style={{ flex: 1, borderBottom: "1px dotted #000" }}>
                                    : {details.eveningLecture || "Health & Nutrition / Socio-Economic Development by Village Doctor & BDO"}
                                </div>
                            </div>

                            <div style={{ display: "flex", marginBottom: "8px" }}>
                                <div style={{ width: "360px", fontWeight: "bold" }}>
                                    11. Name of the Government Department(s)<br />
                                    <span style={{ paddingLeft: "24px", fontWeight: "normal" }}>whose co-operation is sought</span>
                                </div>
                                <div style={{ flex: 1, borderBottom: "1px dotted #000", display: "flex", alignItems: "center" }}>
                                    : {details.govtDepartments || "Primary Health Centre, Forest Department, Revenue & Village Panchayat"}
                                </div>
                            </div>

                            <div style={{ display: "flex", marginBottom: "8px" }}>
                                <div style={{ width: "360px", fontWeight: "bold" }}>
                                    12. Voluntary agencies, if any who will help for<br />
                                    <span style={{ paddingLeft: "24px", fontWeight: "normal" }}>the success of the camp</span>
                                </div>
                                <div style={{ flex: 1, borderBottom: "1px dotted #000", display: "flex", alignItems: "center" }}>
                                    : {details.voluntaryAgencies || "Local Youth Welfare Association, Red Cross Society, Lions Club"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page 3 Footer */}
                    <div style={{ borderTop: "1px solid #000000", paddingTop: "5px", display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                        <span>NSS Special Camp Form 1 — Periyar University</span>
                        <span style={{ fontWeight: "bold" }}>Page 3 of 4</span>
                    </div>
                </div>

                {/* ==================== PAGE 4 ==================== */}
                <div className="special-camp-a4-page">
                    <div>
                        {/* Section 13 & 14 */}
                        <div style={{ marginTop: "20px", fontSize: "12.5px", lineHeight: "2.4" }}>
                            <div style={{ display: "flex", marginBottom: "16px" }}>
                                <div style={{ width: "420px", fontWeight: "bold" }}>
                                    13. Date and venue of the previous camp held
                                </div>
                                <div style={{ flex: 1, borderBottom: "1px dotted #000" }}>
                                    : {details.previousCampDateVenue || "Conducted in previous academic year at adopted village venue"}
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
                                <div style={{ width: "420px", fontWeight: "bold" }}>
                                    14. Whether audited statement of accounts duly<br />
                                    <span style={{ paddingLeft: "24px", fontWeight: "bold" }}>certified by the Chartered Accountant sent</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    : &nbsp;&nbsp;
                                    <span style={{ fontWeight: (details.auditedStatementSent || "Yes") === "Yes" ? "bold" : "normal", textDecoration: (details.auditedStatementSent || "Yes") === "Yes" ? "underline" : "none" }}>
                                        [ {(details.auditedStatementSent || "Yes") === "Yes" ? "✔" : " "} ] Yes
                                    </span>
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    <span style={{ fontWeight: details.auditedStatementSent === "No" ? "bold" : "normal", textDecoration: details.auditedStatementSent === "No" ? "underline" : "none" }}>
                                        [ {details.auditedStatementSent === "No" ? "✔" : " "} ] No
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Official Signatures with seal space */}
                        <div style={{ marginTop: "160px", display: "flex", justifyContent: "space-between", padding: "0 20px" }}>
                            <div style={{ textAlign: "center", minWidth: "240px" }}>
                                <div style={{ height: "45px" }}></div>
                                <div style={{ borderTop: "1.5px solid #000000", paddingTop: "8px", fontWeight: "bold", fontSize: "13px" }}>
                                    Signature of the NSS Programme Officer(s)
                                </div>
                                <div style={{ fontSize: "11px", color: "#334155", marginTop: "3px" }}>
                                    NSS Unit {unitData?.unitNumber || "1"}
                                </div>
                            </div>

                            <div style={{ textAlign: "center", minWidth: "240px" }}>
                                <div style={{ height: "45px" }}></div>
                                <div style={{ borderTop: "1.5px solid #000000", paddingTop: "8px", fontWeight: "bold", fontSize: "13px" }}>
                                    Signature of the Principal with seal
                                </div>
                                <div style={{ fontSize: "11px", color: "#334155", marginTop: "3px" }}>
                                    {collegeName}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page 4 Footer */}
                    <div style={{ borderTop: "1px solid #000000", paddingTop: "5px", display: "flex", justifyContent: "space-between", fontSize: "10px" }}>
                        <span>NSS Special Camp Form 1 — Periyar University</span>
                        <span style={{ fontWeight: "bold" }}>Page 4 of 4</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SpecialCampProposalModal;

