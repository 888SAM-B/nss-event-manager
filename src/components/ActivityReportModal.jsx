import React, { useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import { puLogoBase64, nssLogoBase64 } from "../assets/logos";

const ActivityReportModal = ({ isOpen, onClose, event, collegeData, unitData }) => {
    const reportRef = useRef(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    if (!isOpen || !event) return null;

    const report = event.report || {};
    const collegeName = collegeData?.insName || event.collegeId?.insName || "Periyar University Affiliated College";
    const collegeCode = collegeData?.code || event.collegeId?.code || "";
    const collegeAddress = collegeData?.collegeLocation?.address || collegeData?.location || "";
    const unitNo = unitData?.unitNumber || (typeof event.unitId === 'object' ? event.unitId?.unitNumber : null) || "NSS Unit";
    const poName = unitData?.head?.name || "NSS Programme Officer";
    const poPhone = unitData?.head?.phone || "";

    const dateFormatted = event.singleDay
        ? new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : `${new Date(event.dateFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} to ${new Date(event.dateTo).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;

    const submissionDate = report.submittedAt
        ? new Date(report.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
        : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    const timeFormatted = event.timeFrom && event.timeTo
        ? `${event.timeFrom} - ${event.timeTo}`
        : (event.timeFrom || "As per schedule");

    const reportPhotos = report.reportPhotos && report.reportPhotos.length > 0
        ? report.reportPhotos
        : (event.images && event.images.length > 0 ? event.images : []);

    const guestsList = Array.isArray(report.guests) && report.guests.length > 0
        ? report.guests.filter(g => g && g.trim() !== "")
        : (event.resourcePerson ? [event.resourcePerson] : []);

    const hasPhotos = reportPhotos.length > 0;
    const totalPages = hasPhotos ? 2 : 1;

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsGeneratingPdf(true);
        const toastId = toast.loading("Generating Official A4 PDF Report...");

        try {
            const pageElements = reportRef.current.querySelectorAll('.report-a4-page');
            if (!pageElements || pageElements.length === 0) {
                throw new Error("No report pages found to generate PDF");
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

            const cleanFileName = `NSS_Activity_Report_${(event.eventCode || event.name || "Event").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
            pdf.save(cleanFileName);
            toast.dismiss(toastId);
            toast.success("Activity Report Downloaded Successfully!");
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
        <div className="activity-report-modal-backdrop" style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflowY: "auto",
            padding: "1.5rem 1rem",
            backdropFilter: "blur(4px)"
        }}>
            {/* Scoped CSS for Strict A4 Print & Clean Multi-page layout */}
            <style>{`
                .report-a4-page {
                    width: 210mm;
                    height: 297mm;
                    min-height: 297mm;
                    max-height: 297mm;
                    box-sizing: border-box;
                    padding: 10mm 14mm 8mm 14mm;
                    margin: 0 auto 24px auto;
                    background: #ffffff;
                    color: #0f172a;
                    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justifyContent: space-between;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                }

                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #activity-printable-report, #activity-printable-report * {
                        visibility: visible !important;
                    }
                    #activity-printable-report {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 210mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: transparent !important;
                        box-shadow: none !important;
                    }
                    .report-a4-page {
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
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                marginBottom: "1rem"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>📄</span>
                    <div>
                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                            Official Activity Completion Report
                        </h4>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            Ref: {event.eventCode || "NSS-ACTIVITY"} • {totalPages} {totalPages === 1 ? "Page (Strict A4)" : "Pages (Strict A4)"}
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.85rem", fontSize: "0.8rem", borderRadius: "6px" }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                        Print
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadPDF}
                        disabled={isGeneratingPdf}
                        className="btn btn-primary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 0.85rem", fontSize: "0.8rem", borderRadius: "6px" }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        {isGeneratingPdf ? "Generating PDF..." : "Download Official PDF"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.45rem 0.75rem", fontSize: "0.85rem", borderRadius: "6px" }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Document Container */}
            <div id="activity-printable-report" ref={reportRef} style={{ width: "210mm" }}>
                {/* ==================== PAGE 1 ==================== */}
                <div className="report-a4-page">
                    <div>
                        {/* Official University Header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottom: "2px solid #1e3a8a",
                            paddingBottom: "10px",
                            marginBottom: "12px"
                        }}>
                            <div style={{ width: "65px", height: "65px", minWidth: "65px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <img src={puLogoBase64} alt="Periyar University Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            </div>
                            <div style={{ flex: 1, textAlign: "center", padding: "0 10px" }}>
                                <h2 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "#1e3a8a", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                                    PERIYAR UNIVERSITY
                                </h2>
                                <h3 style={{ fontSize: "12.5px", fontWeight: 700, margin: "2px 0 0", color: "#b91c1c", letterSpacing: "0.03em" }}>
                                    NATIONAL SERVICE SCHEME (NSS)
                                </h3>
                                <div style={{ fontSize: "10.5px", fontWeight: 700, margin: "3px 0 0", color: "#334155", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                    ACTIVITY COMPLETION & IMPACT REPORT
                                </div>
                            </div>
                            <div style={{ width: "65px", height: "65px", minWidth: "65px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <img src={nssLogoBase64} alt="NSS Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                            </div>
                        </div>

                        {/* Institution & Metadata Box */}
                        <div style={{
                            background: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            padding: "8px 12px",
                            marginBottom: "12px",
                            fontSize: "10.5px",
                            lineHeight: 1.45
                        }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "8px" }}>
                                <div>
                                    <div><strong>College:</strong> {collegeName} {collegeCode ? `(${collegeCode})` : ""}</div>
                                    {collegeAddress && <div style={{ color: "#475569" }}><strong>Address:</strong> {collegeAddress}</div>}
                                    <div><strong>NSS Unit:</strong> Unit {unitNo}</div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div><strong>Event Code:</strong> <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1e40af" }}>{event.eventCode || "NSS-EVT"}</span></div>
                                    <div><strong>Programme Officer:</strong> {poName}</div>
                                    {poPhone && <div><strong>Contact:</strong> {poPhone}</div>}
                                    <div><strong>Report Date:</strong> {submissionDate}</div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION I: Activity Particulars */}
                        <div style={{ marginBottom: "12px" }}>
                            <div style={{
                                background: "#1e3a8a",
                                color: "#ffffff",
                                padding: "4px 8px",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                borderRadius: "4px 4px 0 0",
                                textTransform: "uppercase"
                            }}>
                                I. Activity Particulars
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #cbd5e1", fontSize: "11px" }}>
                                <tbody>
                                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                        <td style={{ width: "24%", padding: "5px 8px", background: "#f1f5f9", fontWeight: 600 }}>Activity Title:</td>
                                        <td style={{ width: "76%", padding: "5px 8px", fontWeight: 700, color: "#0f172a" }}>{event.name}</td>
                                    </tr>
                                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                        <td style={{ padding: "5px 8px", background: "#f1f5f9", fontWeight: 600 }}>Category & Level:</td>
                                        <td style={{ padding: "5px 8px" }}>
                                            <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "1px 7px", borderRadius: "4px", fontWeight: 600, fontSize: "10.5px" }}>
                                                {event.category}
                                            </span>
                                            <span style={{ marginLeft: "12px" }}><strong>Level:</strong> {event.level || "College"}</span>
                                            {event.sponsorship && <span style={{ marginLeft: "12px" }}><strong>Sponsorship:</strong> {event.sponsorship}</span>}
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                        <td style={{ padding: "5px 8px", background: "#f1f5f9", fontWeight: 600 }}>Date & Duration:</td>
                                        <td style={{ padding: "5px 8px" }}>
                                            <strong>{dateFormatted}</strong> &nbsp;|&nbsp; <strong>Time:</strong> {timeFormatted}
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                        <td style={{ padding: "5px 8px", background: "#f1f5f9", fontWeight: 600 }}>Venue / Location:</td>
                                        <td style={{ padding: "5px 8px" }}>{event.venue}</td>
                                    </tr>
                                    {guestsList.length > 0 && (
                                        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                                            <td style={{ padding: "5px 8px", background: "#f1f5f9", fontWeight: 600 }}>Resource Person(s) / Guests:</td>
                                            <td style={{ padding: "5px 8px", color: "#0f172a" }}>
                                                {guestsList.join(", ")}
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td style={{ padding: "5px 8px", background: "#f1f5f9", fontWeight: 600, verticalAlign: "top" }}>Activity Objectives:</td>
                                        <td style={{ padding: "5px 8px", textAlign: "justify", color: "#334155", lineHeight: 1.4 }}>{event.description}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* SECTION II: Quantitative Impact */}
                        <div style={{ marginBottom: "12px" }}>
                            <div style={{
                                background: "#1e3a8a",
                                color: "#ffffff",
                                padding: "4px 8px",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                borderRadius: "4px 4px 0 0",
                                textTransform: "uppercase"
                            }}>
                                II. Participation & Impact Statistics
                            </div>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(115px, 1fr))",
                                gap: "8px",
                                border: "1px solid #cbd5e1",
                                borderTop: "none",
                                padding: "10px",
                                background: "#f8fafc"
                            }}>
                                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "6px", textAlign: "center" }}>
                                    <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>NSS Volunteers</div>
                                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1e40af", marginTop: "2px" }}>
                                        {report.participantsCount ?? report.volunteersParticipated ?? "0"}
                                    </div>
                                </div>

                                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "6px", textAlign: "center" }}>
                                    <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Beneficiaries</div>
                                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>
                                        {report.beneficiariesCount ?? "N/A"}
                                    </div>
                                </div>

                                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "6px", textAlign: "center" }}>
                                    <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Colleges Represented</div>
                                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#7c3aed", marginTop: "2px" }}>
                                        {report.collegesCount ?? 1}
                                    </div>
                                </div>

                                {report.treesPlanted !== undefined && report.treesPlanted !== null && report.treesPlanted !== "" && (
                                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "6px", textAlign: "center" }}>
                                        <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#15803d", textTransform: "uppercase" }}>Trees Planted</div>
                                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#15803d", marginTop: "2px" }}>{report.treesPlanted}</div>
                                    </div>
                                )}

                                {report.bloodUnitsCollected !== undefined && report.bloodUnitsCollected !== null && report.bloodUnitsCollected !== "" && (
                                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "6px", textAlign: "center" }}>
                                        <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#dc2626", textTransform: "uppercase" }}>Blood Units Donated</div>
                                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#dc2626", marginTop: "2px" }}>{report.bloodUnitsCollected}</div>
                                    </div>
                                )}

                                {report.rallyDistance !== undefined && report.rallyDistance !== null && report.rallyDistance !== "" && (
                                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "6px", textAlign: "center" }}>
                                        <div style={{ fontSize: "9.5px", fontWeight: 600, color: "#d97706", textTransform: "uppercase" }}>Rally Distance</div>
                                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>{report.rallyDistance} km</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* SECTION III: Detailed Outcome */}
                        <div style={{ marginBottom: "12px" }}>
                            <div style={{
                                background: "#1e3a8a",
                                color: "#ffffff",
                                padding: "4px 8px",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                borderRadius: "4px 4px 0 0",
                                textTransform: "uppercase"
                            }}>
                                III. Executive Summary & Impact Narrative
                            </div>
                            <div style={{
                                border: "1px solid #cbd5e1",
                                borderTop: "none",
                                padding: "8px 12px",
                                background: "#ffffff",
                                textAlign: "justify",
                                fontSize: "11px",
                                color: "#1e293b",
                                lineHeight: 1.45,
                                whiteSpace: "pre-line"
                            }}>
                                {report.outcome || "The activity was executed successfully in accordance with NSS guidelines. Volunteers actively contributed to the noble cause and created meaningful community awareness."}
                            </div>
                        </div>

                        {/* If NO photos exist, place PO Signature on Page 1 */}
                        {!hasPhotos && (
                            <div style={{ marginTop: "24px" }}>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <div style={{ textAlign: "center", minWidth: "240px" }}>
                                        <div style={{ height: "45px" }}></div>
                                        <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: "5px", fontWeight: 700, fontSize: "11.5px", color: "#0f172a" }}>
                                            Signature of Programme Officer
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
                                            {poName ? `${poName} — ` : ""}NSS Unit {unitNo}
                                        </div>
                                        <div style={{ fontSize: "9px", color: "#64748b", fontStyle: "italic", marginTop: "1px" }}>
                                            (College Seal & Endorsement)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Page 1 Footer */}
                    <div style={{
                        paddingTop: "6px",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "9px",
                        color: "#94a3b8"
                    }}>
                        <span>National Service Scheme (NSS) — Periyar University, Salem, Tamil Nadu</span>
                        <span style={{ fontWeight: 700, color: "#64748b" }}>Page 1 of {totalPages}</span>
                    </div>
                </div>

                {/* ==================== PAGE 2 (When Photos Exist) ==================== */}
                {hasPhotos && (
                    <div className="report-a4-page">
                        <div>
                            {/* Running Sub-Header for Page 2 */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                borderBottom: "1.5px solid #1e3a8a",
                                paddingBottom: "8px",
                                marginBottom: "14px"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <img src={puLogoBase64} alt="PU Logo" style={{ width: "30px", height: "30px", objectFit: "contain" }} />
                                    <img src={nssLogoBase64} alt="NSS Logo" style={{ width: "30px", height: "30px", objectFit: "contain" }} />
                                    <div>
                                        <div style={{ fontSize: "11px", fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase" }}>
                                            PERIYAR UNIVERSITY • NSS ACTIVITY REPORT
                                        </div>
                                        <div style={{ fontSize: "9.5px", color: "#64748b" }}>
                                            {collegeName} (Unit {unitNo})
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#1e40af" }}>
                                        Ref: {event.eventCode || "NSS-EVT"}
                                    </div>
                                    <div style={{ fontSize: "9px", color: "#64748b" }}>
                                        {event.name}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION IV: Photographic Evidence & Visual Documentation */}
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{
                                    background: "#1e3a8a",
                                    color: "#ffffff",
                                    padding: "5px 10px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.04em",
                                    borderRadius: "4px 4px 0 0",
                                    textTransform: "uppercase"
                                }}>
                                    IV. Photographic Evidence & Visual Documentation
                                </div>
                                <div style={{
                                    border: "1px solid #cbd5e1",
                                    borderTop: "none",
                                    padding: "12px",
                                    background: "#f8fafc"
                                }}>
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: reportPhotos.length === 1 ? "1fr" : "repeat(2, 1fr)",
                                        gap: "12px"
                                    }}>
                                        {reportPhotos.slice(0, 4).map((photoUrl, idx) => (
                                            <div key={idx} style={{
                                                background: "#ffffff",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "6px",
                                                padding: "8px",
                                                textAlign: "center"
                                            }}>
                                                <div style={{ height: "135px", width: "100%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9", borderRadius: "4px" }}>
                                                    <img
                                                        src={photoUrl}
                                                        alt={`Activity Evidence #${idx + 1}`}
                                                        crossOrigin="anonymous"
                                                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                                    />
                                                </div>
                                                <div style={{ fontSize: "10px", color: "#475569", marginTop: "6px", fontWeight: 600 }}>
                                                    Photo Evidence #{idx + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {reportPhotos.length > 4 && (
                                        <div style={{ marginTop: "10px", textAlign: "center", fontSize: "9.5px", color: "#64748b", fontStyle: "italic" }}>
                                            + {reportPhotos.length - 4} additional photograph(s) archived in digital record.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECTION V: Official Endorsement (PO Signature Only) */}
                            <div style={{
                                marginTop: "32px",
                                paddingTop: "14px",
                                borderTop: "1px dashed #cbd5e1"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                    <div style={{ fontSize: "10px", color: "#64748b", maxWidth: "340px", lineHeight: 1.4 }}>

                                    </div>
                                    <div style={{ textAlign: "center", minWidth: "240px" }}>
                                        <div style={{ height: "45px" }}></div>
                                        <div style={{ borderTop: "1.5px solid #0f172a", paddingTop: "5px", fontWeight: 700, fontSize: "11.5px", color: "#0f172a" }}>
                                            Signature of Programme Officer
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#475569", marginTop: "2px" }}>
                                            {poName ? `${poName} — ` : ""}NSS Unit {unitNo}
                                        </div>
                                        <div style={{ fontSize: "9px", color: "#64748b", fontStyle: "italic", marginTop: "1px" }}>
                                            (College Seal & Endorsement)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Page 2 Footer */}
                        <div style={{
                            paddingTop: "6px",
                            borderTop: "1px solid #e2e8f0",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "9px",
                            color: "#94a3b8"
                        }}>
                            <span>National Service Scheme (NSS) — Periyar University, Salem, Tamil Nadu</span>
                            <span style={{ fontWeight: 700, color: "#64748b" }}>Page 2 of 2</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityReportModal;
