import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const activitiesConfig = [
    { key: "blood_donation", label: "Blood Donation Camps", beneficiaryField: "bloodUnits", beneficiaryLabel: "Units of Blood" },
    { key: "health_camps", label: "Health Camps", beneficiaryField: "beneficiaries", beneficiaryLabel: "" },
    { key: "anti_drug", label: "Anti Drug Camps", beneficiaryField: "beneficiaries", beneficiaryLabel: "" },
    { key: "voter_sir", label: "Voters Awareness SIR", beneficiaryField: "beneficiaries", beneficiaryLabel: "" },
    { key: "voter_sveep", label: "Voters Awareness SVEEP", beneficiaryField: "beneficiaries", beneficiaryLabel: "" },
    { key: "road_safety", label: "Road Safety Awareness", beneficiaryField: "beneficiaries", beneficiaryLabel: "" },
    { key: "tree_plantation", label: "Tree Plantation", beneficiaryField: "saplings", beneficiaryLabel: "Saplings" },
    { key: "important_days", label: "Important Days Celebrations", beneficiaryField: null, beneficiaryLabel: "-" },
    { key: "pledge", label: "Pledge taken", beneficiaryField: null, beneficiaryLabel: "-" },
    { key: "rallies", label: "Rallies conducted", beneficiaryField: "distance", beneficiaryLabel: "KMs" },
    { key: "hosted_meetings", label: "Hosted Meetings", beneficiaryField: "beneficiaries", beneficiaryLabel: "" },
    { key: "any_other", label: "Any Other Programmes", beneficiaryField: "beneficiaries", beneficiaryLabel: "" }
];

const isValidSocialLink = (url) => {
    if (!url) return false;
    const clean = url.trim().toLowerCase();
    return clean !== "" && 
           clean !== "nil" && 
           clean !== "-" && 
           clean !== "none" && 
           clean !== "no link" && 
           clean !== "n/a" && 
           clean !== "na" &&
           clean !== "nil.";
};

const AdminReportGenerator = () => {
    const [colleges, setColleges] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedCollegeId, setSelectedCollegeId] = useState('');
    const [selectedUnitId, setSelectedUnitId] = useState('');
    const [reportType, setReportType] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    // New Cumulative and Drill-down states
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [activeView, setActiveView] = useState('cumulative'); // 'cumulative' | 'individual'
    const [hoveredCell, setHoveredCell] = useState(null);
    const [hoveredSocial, setHoveredSocial] = useState(null);
    const [drillDownData, setDrillDownData] = useState(null);
    const [activePreviewReport, setActivePreviewReport] = useState(null);

    useEffect(() => {
        fetchColleges();
        fetchReports();
    }, []);

    useEffect(() => {
        if (selectedCollegeId) {
            const college = colleges.find(c => c._id === selectedCollegeId);
            setUnits(college?.units || []);
            setSelectedUnitId('');
        } else {
            setUnits([]);
            setSelectedUnitId('');
        }
    }, [selectedCollegeId, colleges]);

    const fetchColleges = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin/colleges`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setColleges(res.data.colleges || []);
            }
        } catch (error) {
            console.error("Error fetching colleges:", error);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin-periodical-reports`, {
                params: {
                    collegeId: selectedCollegeId,
                    unitId: selectedUnitId,
                    reportType,
                    fromDate,
                    toDate
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setReports(res.data.reports || []);
            }
        } catch (error) {
            console.error("Error fetching reports:", error);
            toast.error("Failed to fetch reports");
        } finally {
            setLoading(false);
        }
    };

    // Extract unique districts from colleges and reports
    const uniqueDistricts = useMemo(() => {
        const distSet = new Set();
        colleges.forEach(c => {
            if (c.district) distSet.add(c.district);
        });
        reports.forEach(r => {
            const dist = r.collegeDetails?.district || r.collegeId?.district;
            if (dist) distSet.add(dist);
        });
        return [...distSet].sort();
    }, [colleges, reports]);

    // Extract unique periods from reports
    const uniquePeriods = useMemo(() => {
        const periodSet = new Set();
        reports.forEach(r => {
            if (r.periodLabel) periodSet.add(r.periodLabel);
        });
        return [...periodSet].sort();
    }, [reports]);

    // Client-side filtering for District and Period Label
    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const dist = r.collegeDetails?.district || r.collegeId?.district || '';
            if (selectedDistrict && dist.toLowerCase() !== selectedDistrict.toLowerCase()) return false;
            if (selectedPeriod && r.periodLabel !== selectedPeriod) return false;
            return true;
        });
    }, [reports, selectedDistrict, selectedPeriod]);

    // Real-time Aggregation Logic
    const aggregatedMetrics = useMemo(() => {
        const metrics = activitiesConfig.map(act => {
            let programmesSum = 0;
            let volunteersSum = 0;
            let beneficiarySum = 0;
            const contributors = [];

            // Unique colleges tracker
            const collegeIdsSet = new Set();

            filteredReports.forEach(rep => {
                const activityData = rep.activities?.[act.key] || {};
                const progCount = activityData.programmes || 0;
                
                if (progCount > 0) {
                    programmesSum += progCount;
                    volunteersSum += activityData.volunteers || 0;
                    
                    if (rep.collegeId?._id) {
                        collegeIdsSet.add(rep.collegeId._id);
                    }

                    let val = 0;
                    if (act.beneficiaryField) {
                        val = activityData[act.beneficiaryField] || 0;
                        beneficiarySum += val;
                    }

                    contributors.push({
                        report: rep,
                        value: val,
                        programmes: progCount,
                        volunteers: activityData.volunteers || 0
                    });
                }
            });

            return {
                ...act,
                programmes: programmesSum,
                collegesCount: collegeIdsSet.size,
                volunteers: volunteersSum,
                beneficiaryValue: beneficiarySum,
                contributors
            };
        });

        const socialMediaPlatforms = [
            { key: "instagram", label: "Instagram" },
            { key: "facebook", label: "Facebook" },
            { key: "youtube", label: "YouTube" },
            { key: "twitter", label: "X (Twitter)" },
            { key: "other", label: "Other Platforms" }
        ];

        const socialMetrics = socialMediaPlatforms.map(platform => {
            let activeCount = 0;
            const contributors = [];

            filteredReports.forEach(rep => {
                const linkVal = rep.socialMedia?.[platform.key] || '';
                if (isValidSocialLink(linkVal)) {
                    activeCount++;
                    contributors.push({
                        report: rep,
                        value: linkVal
                    });
                }
            });

            return {
                key: platform.key,
                label: platform.label,
                count: activeCount,
                contributors
            };
        });

        return {
            activities: metrics,
            socialMedia: socialMetrics
        };
    }, [filteredReports]);

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm("Are you sure you want to delete this report permanently?")) return;

        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/delete-periodical-report/${reportId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success("Report deleted successfully");
                fetchReports();
            }
        } catch (error) {
            console.error("Error deleting report:", error);
            toast.error("Failed to delete report");
        }
    };

    const exportToExcel = (reportData) => {
        const act = reportData.activities;
        const rowData = [
            { Category: "1. Blood Donation Camps", Detail: "No of Programmes Conducted", Value: act.blood_donation?.programmes || 0 },
            { Category: "1. Blood Donation Camps", Detail: "Number of Volunteers Participated", Value: act.blood_donation?.volunteers || 0 },
            { Category: "1. Blood Donation Camps", Detail: "No of Units of Blood Donated", Value: act.blood_donation?.bloodUnits || 0 },

            { Category: "2. Health Camps", Detail: "No of Programmes Conducted", Value: act.health_camps?.programmes || 0 },
            { Category: "2. Health Camps", Detail: "Number of Volunteers Participated", Value: act.health_camps?.volunteers || 0 },
            { Category: "2. Health Camps", Detail: "No of Beneficiaries", Value: act.health_camps?.beneficiaries || 0 },

            { Category: "3. Anti Drug Camps", Detail: "No of Programmes Conducted", Value: act.anti_drug?.programmes || 0 },
            { Category: "3. Anti Drug Camps", Detail: "Number of Volunteers Participated", Value: act.anti_drug?.volunteers || 0 },
            { Category: "3. Anti Drug Camps", Detail: "No of Beneficiaries", Value: act.anti_drug?.beneficiaries || 0 },

            { Category: "4. Voters Awareness SIR", Detail: "No of Programmes Conducted", Value: act.voter_sir?.programmes || 0 },
            { Category: "4. Voters Awareness SIR", Detail: "Number of Volunteers Participated", Value: act.voter_sir?.volunteers || 0 },
            { Category: "4. Voters Awareness SIR", Detail: "No of Beneficiaries", Value: act.voter_sir?.beneficiaries || 0 },

            { Category: "5. Voters Awareness SVEEP", Detail: "No of Programmes Conducted", Value: act.voter_sveep?.programmes || 0 },
            { Category: "5. Voters Awareness SVEEP", Detail: "Number of Volunteers Participated", Value: act.voter_sveep?.volunteers || 0 },
            { Category: "5. Voters Awareness SVEEP", Detail: "No of Beneficiaries", Value: act.voter_sveep?.beneficiaries || 0 },

            { Category: "6. Road Safety", Detail: "No of Programmes Conducted", Value: act.road_safety?.programmes || 0 },
            { Category: "6. Road Safety", Detail: "Number of Volunteers Participated", Value: act.road_safety?.volunteers || 0 },
            { Category: "6. Road Safety", Detail: "No of Beneficiaries", Value: act.road_safety?.beneficiaries || 0 },

            { Category: "7. Tree Plantation", Detail: "No of Programmes Conducted", Value: act.tree_plantation?.programmes || 0 },
            { Category: "7. Tree Plantation", Detail: "Number of Volunteers Participated", Value: act.tree_plantation?.volunteers || 0 },
            { Category: "7. Tree Plantation", Detail: "No of Saplings Planted", Value: act.tree_plantation?.saplings || 0 },

            { Category: "8. Important Days Celebrations", Detail: "No of Programmes Conducted", Value: act.important_days?.programmes || 0 },
            { Category: "8. Important Days Celebrations", Detail: "Number of Volunteers Participated", Value: act.important_days?.volunteers || 0 },
            { Category: "8. Important Days Celebrations", Detail: "Date of Conduct", Value: act.important_days?.date || "" },

            { Category: "9. Pledge taken", Detail: "No of Programmes Conducted", Value: act.pledge?.programmes || 0 },
            { Category: "9. Pledge taken", Detail: "Number of Volunteers Participated", Value: act.pledge?.volunteers || 0 },

            { Category: "10. Rallies", Detail: "No of Programmes Conducted", Value: act.rallies?.programmes || 0 },
            { Category: "10. Rallies", Detail: "Number of Volunteers Participated", Value: act.rallies?.volunteers || 0 },
            { Category: "10. Rallies", Detail: "Date of Conduct", Value: act.rallies?.date || "" },
            { Category: "10. Rallies", Detail: "Distance Covered (KM)", Value: act.rallies?.distance || 0 },

            { Category: "11. Hosted Meetings", Detail: "No of Programmes Conducted", Value: act.hosted_meetings?.programmes || 0 },
            { Category: "11. Hosted Meetings", Detail: "Guest Name", Value: act.hosted_meetings?.guestName || "" },
            { Category: "11. Hosted Meetings", Detail: "Number of Volunteers Participated", Value: act.hosted_meetings?.volunteers || 0 },
            { Category: "11. Hosted Meetings", Detail: "No of Beneficiaries", Value: act.hosted_meetings?.beneficiaries || 0 },

            { Category: "12. Any Other Programmes", Detail: "No of Programmes Conducted", Value: act.any_other?.programmes || 0 },
            { Category: "12. Any Other Programmes", Detail: "No of Colleges Participated", Value: act.any_other?.colleges || 0 },
            { Category: "12. Any Other Programmes", Detail: "Number of Volunteers Participated", Value: act.any_other?.volunteers || 0 },
            { Category: "12. Any Other Programmes", Detail: "No of Beneficiaries", Value: act.any_other?.beneficiaries || 0 },
            { Category: "12. Any Other Programmes", Detail: "Remarks/Outcome", Value: act.any_other?.remarks || "" }
        ];

        const worksheet = XLSX.utils.json_to_sheet(rowData);
        const workbook = XLSX.utils.book_new();

        const meta = [
            ["NATIVE NSS REPORT"],
            [`College: ${reportData.collegeId?.insName}`],
            [`Unit Code: ${reportData.unitId?.unitNumber}`],
            [`Period: ${reportData.periodLabel}`],
            [`PO Details: ${reportData.poDetails?.name} (${reportData.poDetails?.mobile})`],
            []
        ];
        XLSX.utils.sheet_add_aoa(worksheet, meta, { origin: "A1" });
        XLSX.utils.sheet_add_json(worksheet, rowData, { origin: "A7", skipHeader: false });

        XLSX.utils.book_append_sheet(workbook, worksheet, "NSS Report");
        XLSX.writeFile(workbook, `NSS_Report_${reportData.unitId?.unitNumber}_${reportData.periodLabel.replace(/\s+/g, '_')}.xlsx`);
    };

    const downloadPDF = (reportData) => {
        toast.loading("Generating PDF...", { id: "pdf-admin" });
        const element = document.getElementById(`pdf-preview-pane-admin-${reportData._id}`);
        if (!element) {
            toast.error("Preview element not found", { id: "pdf-admin" });
            return;
        }

        const originalStyle = element.style.display;
        element.style.display = "block";

        html2canvas(element, { scale: 2, useCORS: true }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`NSS_Report_${reportData.unitId?.unitNumber}_${reportData.periodLabel.replace(/\s+/g, '_')}.pdf`);
            element.style.display = originalStyle;
            toast.success("PDF Downloaded successfully!", { id: "pdf-admin" });
        }).catch(err => {
            console.error(err);
            toast.error("Failed to generate PDF", { id: "pdf-admin" });
        });
    };

    const downloadCumulativePDF = () => {
        toast.loading("Generating Cumulative PDF...", { id: "cum-pdf" });
        const element = document.getElementById("cumulative-pdf-pane");
        if (!element) {
            toast.error("Print template not found", { id: "cum-pdf" });
            return;
        }

        const originalStyle = element.style.display;
        element.style.display = "block";

        html2canvas(element, { scale: 2, useCORS: true }).then((canvas) => {
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pdfWidth = 297;
            const pdfHeight = 210;
            const margin = 12; // 12mm margins
            const printableWidth = pdfWidth - (margin * 2);
            const printableHeight = pdfHeight - (margin * 2);

            const imgData = canvas.toDataURL('image/png');
            
            let imgWidth = printableWidth;
            let imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            if (imgHeight > printableHeight) {
                imgHeight = printableHeight;
                imgWidth = (canvas.width * imgHeight) / canvas.height;
            }
            
            const xPos = margin + (printableWidth - imgWidth) / 2;
            const yPos = margin + (printableHeight - imgHeight) / 2;

            pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);

            // Draw a beautiful page border
            pdf.setDrawColor(0, 0, 0);
            pdf.setLineWidth(0.5);
            pdf.rect(8, 8, pdfWidth - 16, pdfHeight - 16);

            const periodLabelSafe = selectedPeriod ? selectedPeriod.replace(/\s+/g, '_') : 'All_Periods';
            pdf.save(`NSS_Cumulative_Report_${selectedDistrict || 'All_Districts'}_${periodLabelSafe}.pdf`);
            element.style.display = originalStyle;
            toast.success("Cumulative PDF Downloaded successfully!", { id: "cum-pdf" });
        }).catch(err => {
            console.error("PDF generation error:", err);
            toast.error("Failed to generate PDF", { id: "cum-pdf" });
        });
    };

    // Bulk/Consolidated Excel Export for all filtered units
    const handleConsolidatedExport = () => {
        if (reports.length === 0) {
            toast.error("No reports found to export.");
            return;
        }

        const headers = [
            "College Code", "College Name", "District", "Unit Code", "PO Name", "PO Mobile", "PO Email", "Period",
            "1. Blood camps", "1. Blood vols", "1. Blood units",
            "2. Health camps", "2. Health vols", "2. Health benef",
            "3. Anti-drug camps", "3. Anti-drug vols", "3. Anti-drug benef",
            "4. Voter SIR camps", "4. Voter SIR vols", "4. Voter SIR benef",
            "5. Voter SVEEP camps", "5. Voter SVEEP vols", "5. Voter SVEEP benef",
            "6. Road safety camps", "6. Road safety vols", "6. Road safety benef",
            "7. Tree camps", "7. Tree vols", "7. Saplings",
            "8. Days camps", "8. Days vols", "8. Days date",
            "9. Pledge camps", "9. Pledge vols",
            "10. Rally camps", "10. Rally vols", "10. Rally date", "10. Rally distance",
            "11. Meet camps", "11. Meet guests", "11. Meet vols", "11. Meet benef",
            "12. Other camps", "12. Other colleges", "12. Other vols", "12. Other benef", "12. Other remarks"
        ];

        const rows = reports.map(r => {
            const act = r.activities || {};
            return [
                r.collegeId?.code || '',
                r.collegeId?.insName || '',
                r.collegeDetails?.district || r.collegeId?.district || '',
                r.unitId?.unitNumber || '',
                r.poDetails?.name || '',
                r.poDetails?.mobile || '',
                r.poDetails?.email || '',
                r.periodLabel || '',
                act.blood_donation?.programmes || 0, act.blood_donation?.volunteers || 0, act.blood_donation?.bloodUnits || 0,
                act.health_camps?.programmes || 0, act.health_camps?.volunteers || 0, act.health_camps?.beneficiaries || 0,
                act.anti_drug?.programmes || 0, act.anti_drug?.volunteers || 0, act.anti_drug?.beneficiaries || 0,
                act.voter_sir?.programmes || 0, act.voter_sir?.volunteers || 0, act.voter_sir?.beneficiaries || 0,
                act.voter_sveep?.programmes || 0, act.voter_sveep?.volunteers || 0, act.voter_sveep?.beneficiaries || 0,
                act.road_safety?.programmes || 0, act.road_safety?.volunteers || 0, act.road_safety?.beneficiaries || 0,
                act.tree_plantation?.programmes || 0, act.tree_plantation?.volunteers || 0, act.tree_plantation?.saplings || 0,
                act.important_days?.programmes || 0, act.important_days?.volunteers || 0, act.important_days?.date || '',
                act.pledge?.programmes || 0, act.pledge?.volunteers || 0,
                act.rallies?.programmes || 0, act.rallies?.volunteers || 0, act.rallies?.date || '', act.rallies?.distance || 0,
                act.hosted_meetings?.programmes || 0, act.hosted_meetings?.guestName || '', act.hosted_meetings?.volunteers || 0, act.hosted_meetings?.beneficiaries || 0,
                act.any_other?.programmes || 0, act.any_other?.colleges || 0, act.any_other?.volunteers || 0, act.any_other?.beneficiaries || 0, act.any_other?.remarks || ''
            ];
        });

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Consolidated Report");
        XLSX.writeFile(workbook, `Consolidated_NSS_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div style={{ color: 'var(--txt-1)' }}>
            <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>Unit Periodical Reports</h1>
                    <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Monitor, verify, search, and export periodical reports submitted by colleges and units.</p>
                </div>
                <div className="d-flex gap-2">
                    {activeView === 'cumulative' && (
                        <button className="btn btn-primary" onClick={downloadCumulativePDF}>
                            Download Cumulative PDF (Landscape)
                        </button>
                    )}
                    <button className="btn btn-success" onClick={handleConsolidatedExport}>
                        Export Consolidated Excel
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="card p-6 mb-6" style={{ background: 'var(--card-bg)' }}>
                <h3 className="mb-4 text-lg">Filters</h3>
                <div className="grid-cols-4 gap-4 align-items-end">
                    <div className="form-group">
                        <label className="form-label">College</label>
                        <select 
                            className="form-input" 
                            value={selectedCollegeId} 
                            onChange={(e) => setSelectedCollegeId(e.target.value)}
                        >
                            <option value="">All Colleges</option>
                            {colleges.map(c => (
                                <option key={c._id} value={c._id}>{c.insName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Unit</label>
                        <select 
                            className="form-input" 
                            value={selectedUnitId} 
                            onChange={(e) => setSelectedUnitId(e.target.value)}
                            disabled={!selectedCollegeId}
                        >
                            <option value="">All Units</option>
                            {units.map(u => (
                                <option key={u._id} value={u._id}>{u.unitNumber}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Report Type</label>
                        <select 
                            className="form-input" 
                            value={reportType} 
                            onChange={(e) => setReportType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Halfyearly">Half-yearly</option>
                            <option value="Annual">Annual</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">District</label>
                        <select 
                            className="form-input" 
                            value={selectedDistrict} 
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                        >
                            <option value="">All Districts</option>
                            {uniqueDistricts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid-cols-4 gap-4 mt-4 align-items-end">
                    <div className="form-group">
                        <label className="form-label">Reporting Period</label>
                        <select 
                            className="form-input" 
                            value={selectedPeriod} 
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                        >
                            <option value="">All Periods</option>
                            {uniquePeriods.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">From Date</label>
                        <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">To Date</label>
                        <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>

                    <div>
                        <button className="btn btn-primary w-100" style={{ height: '42px' }} onClick={fetchReports}>
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* View Sub-tab Toggles */}
            <div className="flex gap-4 mb-6">
                <button 
                    className={`btn ${activeView === 'cumulative' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveView('cumulative')}
                >
                    Cumulative Summary View
                </button>
                <button 
                    className={`btn ${activeView === 'individual' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setActiveView('individual')}
                >
                    Detailed Submissions List
                </button>
            </div>

            {/* Main Views Container */}
            {activeView === 'cumulative' ? (
                <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                    <h3 className="mb-4 text-lg">Consolidated Performance Metrics</h3>
                    {loading ? (
                        <p className="text-muted">Loading metrics...</p>
                    ) : filteredReports.length === 0 ? (
                        <p className="text-muted">No reports matching filters found.</p>
                    ) : (
                        <>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    marginTop: '1rem',
                                    fontSize: '0.95rem',
                                    color: 'var(--txt-1)',
                                    textAlign: 'left'
                                }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--border)', background: 'none' }}>
                                            <th style={{ padding: '12px 8px', fontWeight: '800', width: '5%' }}>S.No</th>
                                            <th style={{ padding: '12px 8px', fontWeight: '800', width: '35%' }}>Activity / Event Scope</th>
                                            <th style={{ padding: '12px 8px', fontWeight: '800', textAlign: 'center', width: '15%' }}>No. of Programmes Conducted</th>
                                            <th style={{ padding: '12px 8px', fontWeight: '800', textAlign: 'center', width: '15%' }}>No. of Colleges Participated</th>
                                            <th style={{ padding: '12px 8px', fontWeight: '800', textAlign: 'center', width: '15%' }}>No. of NSS Volunteers Participated</th>
                                            <th style={{ padding: '12px 8px', fontWeight: '800', textAlign: 'left', width: '15%' }}>Beneficiary Metrics / Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aggregatedMetrics.activities.map((act, index) => {
                                            return (
                                                <tr 
                                                    key={act.key} 
                                                    style={{ borderBottom: '1px solid var(--border)' }}
                                                >
                                                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>{index + 1}</td>
                                                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{act.label}</td>
                                                    
                                                    {/* Programmes Conducted Cell */}
                                                    <td 
                                                        onClick={() => {
                                                            if (act.programmes > 0) {
                                                                setDrillDownData({
                                                                    title: `${act.label} - Programmes Conducted`,
                                                                    contributors: act.contributors.map(c => ({
                                                                        collegeName: c.report.collegeId?.insName,
                                                                        district: c.report.collegeDetails?.district || c.report.collegeId?.district,
                                                                        poName: c.report.poDetails?.name,
                                                                        value: c.programmes,
                                                                        report: c.report
                                                                    })),
                                                                    isLink: false
                                                                });
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '12px 8px',
                                                            textAlign: 'center',
                                                            cursor: act.programmes > 0 ? 'pointer' : 'default',
                                                            backgroundColor: (act.programmes > 0 && hoveredCell === `${act.key}-prog`) ? '#e3f2fd' : 'transparent',
                                                            color: (act.programmes > 0 && hoveredCell === `${act.key}-prog`) ? '#0d47a1' : 'inherit',
                                                            fontWeight: act.programmes > 0 ? 'bold' : 'normal',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                        onMouseEnter={() => act.programmes > 0 && setHoveredCell(`${act.key}-prog`)}
                                                        onMouseLeave={() => setHoveredCell(null)}
                                                    >
                                                        {act.programmes}
                                                    </td>

                                                    {/* Colleges Participated Cell */}
                                                    <td 
                                                        onClick={() => {
                                                            if (act.collegesCount > 0) {
                                                                const uniqueCollegeReports = [];
                                                                const seenColleges = new Set();
                                                                act.contributors.forEach(c => {
                                                                    if (c.report.collegeId?._id && !seenColleges.has(c.report.collegeId._id)) {
                                                                        seenColleges.add(c.report.collegeId._id);
                                                                        uniqueCollegeReports.push(c);
                                                                    }
                                                                });

                                                                setDrillDownData({
                                                                    title: `${act.label} - Participating Colleges`,
                                                                    contributors: uniqueCollegeReports.map(c => ({
                                                                        collegeName: c.report.collegeId?.insName,
                                                                        district: c.report.collegeDetails?.district || c.report.collegeId?.district,
                                                                        poName: c.report.poDetails?.name,
                                                                        value: c.programmes,
                                                                        report: c.report
                                                                    })),
                                                                    isLink: false
                                                                });
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '12px 8px',
                                                            textAlign: 'center',
                                                            cursor: act.collegesCount > 0 ? 'pointer' : 'default',
                                                            backgroundColor: (act.collegesCount > 0 && hoveredCell === `${act.key}-colleges`) ? '#e3f2fd' : 'transparent',
                                                            color: (act.collegesCount > 0 && hoveredCell === `${act.key}-colleges`) ? '#0d47a1' : 'inherit',
                                                            fontWeight: act.collegesCount > 0 ? 'bold' : 'normal',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                        onMouseEnter={() => act.collegesCount > 0 && setHoveredCell(`${act.key}-colleges`)}
                                                        onMouseLeave={() => setHoveredCell(null)}
                                                    >
                                                        {act.collegesCount}
                                                    </td>

                                                    {/* Volunteers Cell */}
                                                    <td 
                                                        onClick={() => {
                                                            if (act.volunteers > 0) {
                                                                setDrillDownData({
                                                                    title: `${act.label} - Volunteers Participated`,
                                                                    contributors: act.contributors.map(c => ({
                                                                        collegeName: c.report.collegeId?.insName,
                                                                        district: c.report.collegeDetails?.district || c.report.collegeId?.district,
                                                                        poName: c.report.poDetails?.name,
                                                                        value: c.volunteers,
                                                                        report: c.report
                                                                    })),
                                                                    isLink: false
                                                                });
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '12px 8px',
                                                            textAlign: 'center',
                                                            cursor: act.volunteers > 0 ? 'pointer' : 'default',
                                                            backgroundColor: (act.volunteers > 0 && hoveredCell === `${act.key}-vols`) ? '#e3f2fd' : 'transparent',
                                                            color: (act.volunteers > 0 && hoveredCell === `${act.key}-vols`) ? '#0d47a1' : 'inherit',
                                                            fontWeight: act.volunteers > 0 ? 'bold' : 'normal',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                        onMouseEnter={() => act.volunteers > 0 && setHoveredCell(`${act.key}-vols`)}
                                                        onMouseLeave={() => setHoveredCell(null)}
                                                    >
                                                        {act.volunteers}
                                                    </td>

                                                    {/* Beneficiaries/Key Details Cell */}
                                                    <td 
                                                        onClick={() => {
                                                            if (act.beneficiaryValue > 0 && act.beneficiaryField) {
                                                                setDrillDownData({
                                                                    title: `${act.label} - ${act.beneficiaryLabel || 'Beneficiaries'}`,
                                                                    contributors: act.contributors.map(c => ({
                                                                        collegeName: c.report.collegeId?.insName,
                                                                        district: c.report.collegeDetails?.district || c.report.collegeId?.district,
                                                                        poName: c.report.poDetails?.name,
                                                                        value: c.value,
                                                                        report: c.report
                                                                    })),
                                                                    isLink: false
                                                                });
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '12px 8px',
                                                            cursor: (act.beneficiaryValue > 0 && act.beneficiaryField) ? 'pointer' : 'default',
                                                            backgroundColor: (act.beneficiaryValue > 0 && act.beneficiaryField && hoveredCell === `${act.key}-beneficiary`) ? '#e3f2fd' : 'transparent',
                                                            color: (act.beneficiaryValue > 0 && act.beneficiaryField && hoveredCell === `${act.key}-beneficiary`) ? '#0d47a1' : 'inherit',
                                                            fontWeight: (act.beneficiaryValue > 0 && act.beneficiaryField) ? 'bold' : 'normal',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                        onMouseEnter={() => act.beneficiaryValue > 0 && act.beneficiaryField && setHoveredCell(`${act.key}-beneficiary`)}
                                                        onMouseLeave={() => setHoveredCell(null)}
                                                    >
                                                        {act.beneficiaryField ? (
                                                            act.key === 'blood_donation' ? (
                                                                `${act.beneficiaryValue} Units of Blood`
                                                            ) : act.key === 'tree_plantation' ? (
                                                                `${act.beneficiaryValue} Saplings`
                                                            ) : act.key === 'rallies' ? (
                                                                `${act.beneficiaryValue} KMs`
                                                            ) : (
                                                                act.beneficiaryValue
                                                            )
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Inline Social Media Row */}
                            <div className="card p-4 mt-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                                <h4 className="mb-3 text-md" style={{ fontWeight: 'bold' }}>Social Media Campaign Metrics</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.95rem' }}>
                                    {aggregatedMetrics.socialMedia.map((sm, idx) => (
                                        <div 
                                            key={sm.key}
                                            onClick={() => {
                                                if (sm.count > 0) {
                                                    setDrillDownData({
                                                        title: `Active College Submissions - ${sm.label}`,
                                                        contributors: sm.contributors.map(c => ({
                                                            collegeName: c.report.collegeId?.insName,
                                                            district: c.report.collegeDetails?.district || c.report.collegeId?.district,
                                                            poName: c.report.poDetails?.name,
                                                            value: c.value,
                                                            report: c.report
                                                        })),
                                                        isLink: true
                                                    });
                                                }
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '4px',
                                                cursor: sm.count > 0 ? 'pointer' : 'default',
                                                backgroundColor: (sm.count > 0 && hoveredSocial === sm.key) ? '#e3f2fd' : 'transparent',
                                                color: (sm.count > 0 && hoveredSocial === sm.key) ? '#0d47a1' : 'inherit',
                                                transition: 'all 0.15s ease'
                                            }}
                                            onMouseEnter={() => sm.count > 0 && setHoveredSocial(sm.key)}
                                            onMouseLeave={() => setHoveredSocial(null)}
                                        >
                                            <strong>{idx + 1}. {sm.label}:</strong> <span className="badge badge-secondary" style={{ marginLeft: '4px' }}>{sm.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                    <h3 className="mb-4 text-lg">Reports List</h3>
                    {loading ? (
                        <p className="text-muted">Loading reports...</p>
                    ) : reports.length === 0 ? (
                        <p className="text-muted">No reports matching filters found.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="styled-table" style={{ margin: 0, boxShadow: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>College Name</th>
                                        <th>Unit Number</th>
                                        <th>District</th>
                                        <th>Report Period</th>
                                        <th>Submitted Date</th>
                                        <th className="text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map((rep, idx) => (
                                        <tr key={rep._id}>
                                            <td>{idx + 1}</td>
                                            <td>{rep.collegeId?.insName}</td>
                                            <td><span className="badge badge-secondary">{rep.unitId?.unitNumber}</span></td>
                                            <td>{rep.collegeDetails?.district || rep.collegeId?.district || 'N/A'}</td>
                                            <td>{rep.periodLabel}</td>
                                            <td>{new Date(rep.submittedAt).toLocaleDateString()}</td>
                                            <td>
                                                <div className="d-flex gap-2 justify-content-center">
                                                    <button className="btn btn-sm btn-success" onClick={() => exportToExcel(rep)}>
                                                        Excel
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-success" onClick={() => downloadPDF(rep)}>
                                                        PDF
                                                    </button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteReport(rep._id)}>
                                                        Delete
                                                    </button>
                                                </div>

                                                {/* Hidden PDF Template element for each report */}
                                                <div 
                                                    id={`pdf-preview-pane-admin-${rep._id}`} 
                                                    style={{
                                                        display: 'none',
                                                        position: 'absolute',
                                                        left: '-9999px',
                                                        top: '-9999px',
                                                        width: '794px',
                                                        padding: '40px',
                                                        background: '#ffffff',
                                                        color: '#000000',
                                                        fontFamily: "'Courier New', Courier, monospace"
                                                    }}
                                                >
                                                    <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '15px', marginBottom: '20px' }}>
                                                        <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>NATIONAL SERVICE SCHEME (NSS)</h2>
                                                        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'normal' }}>PERIODICAL ACTIVITY REPORT</h3>
                                                        <div style={{ fontSize: '14px', fontWeight: 'bold', background: '#f0f0f0', padding: '5px 10px', display: 'inline-block', borderRadius: '4px' }}>
                                                            Period: {rep.periodLabel} ({rep.reportType})
                                                        </div>
                                                    </div>

                                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
                                                        <tbody>
                                                            <tr>
                                                                <td style={{ width: '180px', padding: '6px', fontWeight: 'bold', border: '1px solid #ddd' }}>College Name:</td>
                                                                <td style={{ padding: '6px', border: '1px solid #ddd' }}>{rep.collegeId?.insName}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ padding: '6px', fontWeight: 'bold', border: '1px solid #ddd' }}>District:</td>
                                                                <td style={{ padding: '6px', border: '1px solid #ddd' }}>{rep.collegeDetails?.district || rep.collegeId?.district}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ padding: '6px', fontWeight: 'bold', border: '1px solid #ddd' }}>Unit Code:</td>
                                                                <td style={{ padding: '6px', border: '1px solid #ddd' }}>{rep.unitId?.unitNumber}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ padding: '6px', fontWeight: 'bold', border: '1px solid #ddd' }}>Program Officer:</td>
                                                                <td style={{ padding: '6px', border: '1px solid #ddd' }}>{rep.poDetails?.name}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ padding: '6px', fontWeight: 'bold', border: '1px solid #ddd' }}>PO Contact Info:</td>
                                                                <td style={{ padding: '6px', border: '1px solid #ddd' }}>Mobile: {rep.poDetails?.mobile} | Email: {rep.poDetails?.email}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <h4 style={{ fontSize: '15px', borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px', marginTop: '30px' }}>ACTIVITY-WISE SUMMARY</h4>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                                        <thead>
                                                            <tr style={{ background: '#f5f5f5' }}>
                                                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '5%' }}>S.No</th>
                                                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '35%' }}>Activity / Event Scope</th>
                                                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%' }}>Programmes</th>
                                                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%' }}>Volunteers</th>
                                                                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '30%' }}>Key Metrics / Details</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {activitiesConfig.map((act, index) => {
                                                                const repAct = rep.activities?.[act.key] || {};
                                                                return (
                                                                    <tr key={act.key}>
                                                                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                                                                        <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{act.label}</td>
                                                                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{repAct.programmes || 0}</td>
                                                                        <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{repAct.volunteers || 0}</td>
                                                                        <td style={{ border: '1px solid #000', padding: '8px' }}>
                                                                            {act.beneficiaryField ? (
                                                                                `${act.beneficiaryLabel ? act.beneficiaryLabel + ': ' : ''}${repAct[act.beneficiaryField] || 0}`
                                                                            ) : (
                                                                                act.key === 'important_days' ? `Date: ${repAct.date || 'N/A'}` : '-'
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>

                                                    <div style={{ marginTop: '30px', fontSize: '12px' }}>
                                                        <p><strong>Social Media Links:</strong></p>
                                                        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                                            {rep.socialMedia?.instagram && <li>Instagram: {rep.socialMedia.instagram}</li>}
                                                            {rep.socialMedia?.facebook && <li>Facebook: {rep.socialMedia.facebook}</li>}
                                                            {rep.socialMedia?.youtube && <li>YouTube: {rep.socialMedia.youtube}</li>}
                                                            {rep.socialMedia?.twitter && <li>Twitter: {rep.socialMedia.twitter}</li>}
                                                        </ul>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', fontSize: '13px' }}>
                                                        <div style={{ textAlign: 'center', width: '200px' }}>
                                                            <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
                                                                Signature of the PO
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'center', width: '200px' }}>
                                                            <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
                                                                Signature of the Principal
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Hidden Landscape PDF Template for Cumulative Report */}
            <div 
                id="cumulative-pdf-pane" 
                style={{
                    display: 'none',
                    position: 'absolute',
                    left: '-9999px',
                    top: '-9999px',
                    width: '1060px', // Matches A4 landscape aspect ratio at standard resolution
                    padding: '40px',
                    background: '#ffffff',
                    color: '#000000',
                    fontFamily: 'serif'
                }}
            >
                <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '15px', marginBottom: '20px' }}>
                    <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', textTransform: 'uppercase', color: '#000' }}>NATIONAL SERVICE SCHEME (NSS)</h2>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#000' }}>CONSOLIDATED PERFORMANCE METRICS</h3>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', background: '#f0f0f0', padding: '5px 10px', display: 'inline-block', color: '#000' }}>
                        District: {selectedDistrict || 'All Districts'} | Period: {selectedPeriod || 'All Periods'}
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#000' }}>
                    <thead>
                        <tr style={{ background: '#f2f2f2' }}>
                            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '5%', color: '#000' }}>S.No</th>
                            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '35%', color: '#000' }}>Activity / Event Scope</th>
                            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%', color: '#000' }}>No. of Programmes Conducted</th>
                            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%', color: '#000' }}>No. of Colleges Participated</th>
                            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%', color: '#000' }}>No. of NSS Volunteers Participated</th>
                            <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '15%', color: '#000' }}>Beneficiary Metrics / Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {aggregatedMetrics.activities.map((act, index) => (
                            <tr key={act.key}>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#000' }}>{index + 1}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', color: '#000' }}>{act.label}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#000' }}>{act.programmes}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#000' }}>{act.collegesCount}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#000' }}>{act.volunteers}</td>
                                <td style={{ border: '1px solid #000', padding: '8px', color: '#000' }}>
                                    {act.beneficiaryField ? (
                                        act.key === 'blood_donation' ? (
                                            `${act.beneficiaryValue} Units of Blood`
                                        ) : act.key === 'tree_plantation' ? (
                                            `${act.beneficiaryValue} Saplings`
                                        ) : act.key === 'rallies' ? (
                                            `${act.beneficiaryValue} KMs`
                                        ) : (
                                            act.beneficiaryValue
                                        )
                                    ) : (
                                        '-'
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ marginTop: '25px', padding: '12px', border: '1px solid #000', fontSize: '11px', color: '#000' }}>
                    <strong style={{ display: 'block', marginBottom: '6px', color: '#000' }}>Social Media Campaigns (Units Active):</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', color: '#000' }}>
                        {aggregatedMetrics.socialMedia.map((sm, idx) => (
                            <span key={sm.key} style={{ color: '#000' }}>
                                <strong>{idx + 1}. {sm.label}:</strong> {sm.count}
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', fontSize: '12px', color: '#000' }}>
                    <div style={{ textAlign: 'center', width: '250px', color: '#000' }}>
                        <div style={{ borderTop: '1px solid #000', paddingTop: '5px', color: '#000' }}>
                            NSS Program Coordinator Signature
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', width: '250px', color: '#000' }}>
                        <div style={{ borderTop: '1px solid #000', paddingTop: '5px', color: '#000' }}>
                            University Registrar Signature
                        </div>
                    </div>
                </div>
            </div>

            {/* Drill-down Dialog */}
            {drillDownData && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div className="card p-6" style={{
                        background: 'var(--card-bg)',
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border)'
                    }}>
                        <div className="flex-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem' }}>{drillDownData.title}</h3>
                            <button 
                                onClick={() => setDrillDownData(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--txt-3)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    lineHeight: 1
                                }}
                            >
                                &times;
                            </button>
                        </div>
                        
                        {drillDownData.contributors.length === 0 ? (
                            <p className="text-muted text-center py-4">No contributors found.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="styled-table" style={{ margin: 0, width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>College Name</th>
                                            <th>District</th>
                                            <th>Programme Officer</th>
                                            <th>Submitted Value</th>
                                            <th className="text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drillDownData.contributors.map((c, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 'bold' }}>{c.collegeName}</td>
                                                <td>{c.district}</td>
                                                <td>{c.poName}</td>
                                                <td>
                                                    {drillDownData.isLink ? (
                                                        <a 
                                                            href={c.value} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            style={{ color: 'var(--brand-500)', textDecoration: 'underline', wordBreak: 'break-all' }}
                                                        >
                                                            {c.value}
                                                        </a>
                                                    ) : (
                                                        <span className="badge badge-primary">{c.value}</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <button 
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            setDrillDownData(null);
                                                            setActivePreviewReport(c.report);
                                                        }}
                                                    >
                                                        View Report
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        <div className="text-right mt-4">
                            <button className="btn btn-secondary" onClick={() => setDrillDownData(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Document Preview Modal */}
            {activePreviewReport && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1010,
                    padding: '20px'
                }}>
                    <div className="card p-6" style={{
                        background: '#ffffff',
                        color: '#000000',
                        maxWidth: '900px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        borderRadius: '12px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        border: '1px solid #ddd'
                    }}>
                        <div className="flex-between mb-4 pb-2" style={{ borderBottom: '2px solid #333' }}>
                            <h3 style={{ margin: 0, fontWeight: 800, color: '#333' }}>Detailed Report View</h3>
                            <button 
                                onClick={() => setActivePreviewReport(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#666',
                                    fontSize: '1.8rem',
                                    cursor: 'pointer',
                                    lineHeight: 1
                                }}
                            >
                                &times;
                            </button>
                        </div>
                        
                        {/* Report Content styled matching PDF standard */}
                        <div style={{ padding: '10px', color: '#000000', fontFamily: 'serif' }}>
                            <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '15px', marginBottom: '20px' }}>
                                <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', textTransform: 'uppercase', color: '#000' }}>NATIONAL SERVICE SCHEME (NSS)</h2>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'normal', color: '#000' }}>PERIODICAL ACTIVITY REPORT</h3>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', background: '#f0f0f0', padding: '5px 10px', display: 'inline-block', borderRadius: '4px', color: '#000' }}>
                                    Period: {activePreviewReport.periodLabel} ({activePreviewReport.reportType})
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px', color: '#000' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '180px', padding: '8px', fontWeight: 'bold', border: '1px solid #ddd', color: '#000' }}>College Name:</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', color: '#000' }}>{activePreviewReport.collegeId?.insName}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontWeight: 'bold', border: '1px solid #ddd', color: '#000' }}>District:</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', color: '#000' }}>{activePreviewReport.collegeDetails?.district || activePreviewReport.collegeId?.district}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontWeight: 'bold', border: '1px solid #ddd', color: '#000' }}>Unit Code:</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', color: '#000' }}>{activePreviewReport.unitId?.unitNumber}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontWeight: 'bold', border: '1px solid #ddd', color: '#000' }}>Program Officer:</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', color: '#000' }}>{activePreviewReport.poDetails?.name}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', fontWeight: 'bold', border: '1px solid #ddd', color: '#000' }}>PO Contact Info:</td>
                                        <td style={{ padding: '8px', border: '1px solid #ddd', color: '#000' }}>Mobile: {activePreviewReport.poDetails?.mobile} | Email: {activePreviewReport.poDetails?.email}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <h4 style={{ fontSize: '16px', borderBottom: '1px solid #000', paddingBottom: '5px', marginBottom: '10px', marginTop: '30px', color: '#000' }}>ACTIVITY-WISE SUMMARY</h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#000' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5' }}>
                                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '5%', color: '#000' }}>S.No</th>
                                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '35%', color: '#000' }}>Activity / Event Scope</th>
                                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%', color: '#000' }}>Programmes</th>
                                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%', color: '#000' }}>Volunteers</th>
                                        <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', width: '30%', color: '#000' }}>Key Metrics / Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activitiesConfig.map((act, index) => {
                                        const repAct = activePreviewReport.activities?.[act.key] || {};
                                        return (
                                            <tr key={act.key}>
                                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#000' }}>{index + 1}</td>
                                                <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold', color: '#000' }}>{act.label}</td>
                                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#000' }}>{repAct.programmes || 0}</td>
                                                <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', color: '#000' }}>{repAct.volunteers || 0}</td>
                                                <td style={{ border: '1px solid #000', padding: '8px', color: '#000' }}>
                                                    {act.beneficiaryField ? (
                                                        `${act.beneficiaryLabel ? act.beneficiaryLabel + ': ' : ''}${repAct[act.beneficiaryField] || 0}`
                                                    ) : (
                                                        act.key === 'important_days' ? `Date: ${repAct.date || 'N/A'}` : '-'
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div style={{ marginTop: '30px', fontSize: '13px', color: '#000' }}>
                                <p style={{ color: '#000' }}><strong>Social Media Links:</strong></p>
                                <ul style={{ margin: '5px 0', paddingLeft: '20px', color: '#000' }}>
                                    {activePreviewReport.socialMedia?.instagram && <li style={{ color: '#000' }}>Instagram: <a href={activePreviewReport.socialMedia.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>{activePreviewReport.socialMedia.instagram}</a></li>}
                                    {activePreviewReport.socialMedia?.facebook && <li style={{ color: '#000' }}>Facebook: <a href={activePreviewReport.socialMedia.facebook} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>{activePreviewReport.socialMedia.facebook}</a></li>}
                                    {activePreviewReport.socialMedia?.youtube && <li style={{ color: '#000' }}>YouTube: <a href={activePreviewReport.socialMedia.youtube} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>{activePreviewReport.socialMedia.youtube}</a></li>}
                                    {activePreviewReport.socialMedia?.twitter && <li style={{ color: '#000' }}>Twitter: <a href={activePreviewReport.socialMedia.twitter} target="_blank" rel="noopener noreferrer" style={{ color: 'blue', textDecoration: 'underline' }}>{activePreviewReport.socialMedia.twitter}</a></li>}
                                </ul>
                            </div>
                        </div>
                        
                        <div className="text-right mt-6 pt-4" style={{ borderTop: '1px solid #eee' }}>
                            <button className="btn btn-secondary mr-2" onClick={() => setActivePreviewReport(null)}>
                                Close
                            </button>
                            <button className="btn btn-primary" onClick={() => {
                                downloadPDF(activePreviewReport);
                            }}>
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReportGenerator;
