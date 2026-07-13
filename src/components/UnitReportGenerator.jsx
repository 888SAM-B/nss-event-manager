import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const UnitReportGenerator = ({ unit, college }) => {
    const [reportType, setReportType] = useState('Monthly');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [selectedQuarter, setSelectedQuarter] = useState('Q1'); // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
    const [selectedHalfYear, setSelectedHalfYear] = useState('H1'); // H1: Apr-Sep, H2: Oct-Mar
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [customFromDate, setCustomFromDate] = useState('');
    const [customToDate, setCustomToDate] = useState('');

    const [poName, setPoName] = useState('');
    const [poMobile, setPoMobile] = useState('');
    const [poEmail, setPoEmail] = useState('');
    const [district, setDistrict] = useState('');

    const [activities, setActivities] = useState({
        blood_donation: { programmes: 0, volunteers: 0, bloodUnits: 0 },
        health_camps: { programmes: 0, volunteers: 0, beneficiaries: 0 },
        anti_drug: { programmes: 0, volunteers: 0, beneficiaries: 0 },
        voter_sir: { programmes: 0, volunteers: 0, beneficiaries: 0 },
        voter_sveep: { programmes: 0, volunteers: 0, beneficiaries: 0 },
        road_safety: { programmes: 0, volunteers: 0, beneficiaries: 0 },
        tree_plantation: { programmes: 0, volunteers: 0, saplings: 0 },
        important_days: { programmes: 0, volunteers: 0, date: "" },
        pledge: { programmes: 0, volunteers: 0 },
        rallies: { programmes: 0, volunteers: 0, date: "", distance: 0 },
        hosted_meetings: { programmes: 0, guestName: "", volunteers: 0, beneficiaries: 0 },
        any_other: { programmes: 0, colleges: 0, volunteers: 0, beneficiaries: 0, remarks: "" }
    });

    const [socialMedia, setSocialMedia] = useState({
        instagram: '',
        facebook: '',
        youtube: '',
        twitter: '',
        other: ''
    });

    const [submittedReports, setSubmittedReports] = useState([]);
    const [loadingPrefill, setLoadingPrefill] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [isEditingReportId, setIsEditingReportId] = useState(null);

    const pdfRef = useRef(null);

    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        if (unit) {
            setPoName(unit.head?.name || unit.head || '');
            setPoMobile(unit.head?.mobile || unit.contact || '');
            setPoEmail(unit.head?.email || unit.mail || '');
        }
        if (college) {
            setDistrict(college.district || '');
        }
        fetchHistory();
    }, [unit, college]);

    const fetchHistory = async () => {
        if (!unit || !college) return;
        setLoadingHistory(true);
        try {
            const token = localStorage.getItem("unitToken");
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/unit-periodical-reports/${unit.unitNumber}/${college.code}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setSubmittedReports(res.data.reports);
            }
        } catch (error) {
            console.error("Error fetching reports history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Calculate dates based on period selection
    const getPeriodDates = () => {
        let from = '';
        let to = '';
        let label = '';

        if (reportType === 'Monthly') {
            const m = String(selectedMonth).padStart(2, '0');
            from = `${selectedYear}-${m}-01`;
            const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
            to = `${selectedYear}-${m}-${lastDay}`;
            label = `${monthNames[selectedMonth - 1]} ${selectedYear}`;
        } else if (reportType === 'Quarterly') {
            if (selectedQuarter === 'Q1') {
                from = `${selectedYear}-04-01`;
                to = `${selectedYear}-06-30`;
                label = `April - June ${selectedYear}`;
            } else if (selectedQuarter === 'Q2') {
                from = `${selectedYear}-07-01`;
                to = `${selectedYear}-09-30`;
                label = `July - September ${selectedYear}`;
            } else if (selectedQuarter === 'Q3') {
                from = `${selectedYear}-10-01`;
                to = `${selectedYear}-12-31`;
                label = `October - December ${selectedYear}`;
            } else {
                from = `${selectedYear + 1}-01-01`;
                to = `${selectedYear + 1}-03-31`;
                label = `January - March ${selectedYear + 1}`;
            }
        } else if (reportType === 'Halfyearly') {
            if (selectedHalfYear === 'H1') {
                from = `${selectedYear}-04-01`;
                to = `${selectedYear}-09-30`;
                label = `April - September ${selectedYear}`;
            } else {
                from = `${selectedYear}-10-01`;
                to = `${selectedYear + 1}-03-31`;
                label = `October ${selectedYear} - March ${selectedYear + 1}`;
            }
        } else if (reportType === 'Annual') {
            from = `${selectedYear}-04-01`;
            to = `${selectedYear + 1}-03-31`;
            label = `Annual Report ${selectedYear} - ${selectedYear + 1}`;
        } else {
            from = customFromDate;
            to = customToDate;
            label = `Custom Period (${customFromDate} to ${customToDate})`;
        }

        return { fromDate: from, toDate: to, periodLabel: label };
    };

    const handleGeneratePrefill = async () => {
        const { fromDate, toDate } = getPeriodDates();
        if (!fromDate || !toDate) {
            toast.error("Please select a valid date range");
            return;
        }

        setLoadingPrefill(true);
        try {
            const token = localStorage.getItem("unitToken");
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/unit-periodical-report-prefill`, {
                params: {
                    unitCode: unit.unitNumber,
                    collegeCode: college.code,
                    fromDate,
                    toDate
                },
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setActivities(res.data.activities);
                toast.success("Aggregated event data pre-filled successfully!");
            }
        } catch (error) {
            console.error("Error fetching prefill:", error);
            toast.error("Failed to fetch prefill data");
        } finally {
            setLoadingPrefill(false);
        }
    };

    const handleActivityChange = (category, field, value) => {
        const parsedValue = field === 'date' || field === 'guestName' || field === 'remarks' ? value : Number(value) || 0;
        setActivities(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: parsedValue
            }
        }));
    };

    const handleSocialMediaChange = (field, value) => {
        setSocialMedia(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        const { fromDate, toDate, periodLabel } = getPeriodDates();
        if (!fromDate || !toDate || !periodLabel) {
            toast.error("Invalid reporting period.");
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem("unitToken");
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/submit-periodical-report`, {
                unitCode: unit.unitNumber,
                collegeCode: college.code,
                reportType,
                month: reportType === 'Monthly' ? monthNames[selectedMonth - 1] : '',
                fromDate,
                toDate,
                periodLabel,
                poDetails: { name: poName, mobile: poMobile, email: poEmail },
                collegeDetails: { name: college.insName, district },
                activities,
                socialMedia
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success(res.data.message);
                setIsEditingReportId(null);
                fetchHistory();
            }
        } catch (error) {
            console.error("Error submitting report:", error);
            toast.error(error.response?.data?.message || "Failed to submit report");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditReport = (rep) => {
        setIsEditingReportId(rep._id);
        setReportType(rep.reportType);
        
        // Match specific date configurations back to dropdown selections
        if (rep.reportType === 'Monthly') {
            const monthIdx = monthNames.indexOf(rep.month);
            if (monthIdx !== -1) setSelectedMonth(monthIdx + 1);
        }
        
        setPoName(rep.poDetails?.name || '');
        setPoMobile(rep.poDetails?.mobile || '');
        setPoEmail(rep.poDetails?.email || '');
        setDistrict(rep.collegeDetails?.district || '');
        setActivities(rep.activities);
        setSocialMedia(rep.socialMedia || {
            instagram: '',
            facebook: '',
            youtube: '',
            twitter: '',
            other: ''
        });

        // Scroll to edit form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm("Are you sure you want to delete this report?")) return;

        try {
            const token = localStorage.getItem("unitToken");
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/delete-periodical-report/${reportId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success("Report deleted successfully!");
                fetchHistory();
            }
        } catch (error) {
            console.error("Error deleting report:", error);
            toast.error("Failed to delete report");
        }
    };

    const exportToExcel = (reportData) => {
        const act = reportData.activities;
        const rowData = [
            { Category: "1. Blood Donation Camps", Detail: "No of Programmes Conducted", Value: act.blood_donation.programmes },
            { Category: "1. Blood Donation Camps", Detail: "Number of Volunteers Participated", Value: act.blood_donation.volunteers },
            { Category: "1. Blood Donation Camps", Detail: "No of Units of Blood Donated", Value: act.blood_donation.bloodUnits },

            { Category: "2. Health Camps", Detail: "No of Programmes Conducted", Value: act.health_camps.programmes },
            { Category: "2. Health Camps", Detail: "Number of Volunteers Participated", Value: act.health_camps.volunteers },
            { Category: "2. Health Camps", Detail: "No of Beneficiaries", Value: act.health_camps.beneficiaries },

            { Category: "3. Anti Drug Camps", Detail: "No of Programmes Conducted", Value: act.anti_drug.programmes },
            { Category: "3. Anti Drug Camps", Detail: "Number of Volunteers Participated", Value: act.anti_drug.volunteers },
            { Category: "3. Anti Drug Camps", Detail: "No of Beneficiaries", Value: act.anti_drug.beneficiaries },

            { Category: "4. Voters Awareness SIR", Detail: "No of Programmes Conducted", Value: act.voter_sir.programmes },
            { Category: "4. Voters Awareness SIR", Detail: "Number of Volunteers Participated", Value: act.voter_sir.volunteers },
            { Category: "4. Voters Awareness SIR", Detail: "No of Beneficiaries", Value: act.voter_sir.beneficiaries },

            { Category: "5. Voters Awareness SVEEP", Detail: "No of Programmes Conducted", Value: act.voter_sveep.programmes },
            { Category: "5. Voters Awareness SVEEP", Detail: "Number of Volunteers Participated", Value: act.voter_sveep.volunteers },
            { Category: "5. Voters Awareness SVEEP", Detail: "No of Beneficiaries", Value: act.voter_sveep.beneficiaries },

            { Category: "6. Road Safety", Detail: "No of Programmes Conducted", Value: act.road_safety.programmes },
            { Category: "6. Road Safety", Detail: "Number of Volunteers Participated", Value: act.road_safety.volunteers },
            { Category: "6. Road Safety", Detail: "No of Beneficiaries", Value: act.road_safety.beneficiaries },

            { Category: "7. Tree Plantation", Detail: "No of Programmes Conducted", Value: act.tree_plantation.programmes },
            { Category: "7. Tree Plantation", Detail: "Number of Volunteers Participated", Value: act.tree_plantation.volunteers },
            { Category: "7. Tree Plantation", Detail: "No of Saplings Planted", Value: act.tree_plantation.saplings },

            { Category: "8. Important Days Celebrations", Detail: "No of Programmes Conducted", Value: act.important_days.programmes },
            { Category: "8. Important Days Celebrations", Detail: "Number of Volunteers Participated", Value: act.important_days.volunteers },
            { Category: "8. Important Days Celebrations", Detail: "Date of Conduct", Value: act.important_days.date },

            { Category: "9. Pledge taken", Detail: "No of Programmes Conducted", Value: act.pledge.programmes },
            { Category: "9. Pledge taken", Detail: "Number of Volunteers Participated", Value: act.pledge.volunteers },

            { Category: "10. Rallies", Detail: "No of Programmes Conducted", Value: act.rallies.programmes },
            { Category: "10. Rallies", Detail: "Number of Volunteers Participated", Value: act.rallies.volunteers },
            { Category: "10. Rallies", Detail: "Date of Conduct", Value: act.rallies.date },
            { Category: "10. Rallies", Detail: "Distance Covered (KM)", Value: act.rallies.distance },

            { Category: "11. Hosted Meetings", Detail: "No of Programmes Conducted", Value: act.hosted_meetings.programmes },
            { Category: "11. Hosted Meetings", Detail: "Guest Name", Value: act.hosted_meetings.guestName },
            { Category: "11. Hosted Meetings", Detail: "Number of Volunteers Participated", Value: act.hosted_meetings.volunteers },
            { Category: "11. Hosted Meetings", Detail: "No of Beneficiaries", Value: act.hosted_meetings.beneficiaries },

            { Category: "12. Any Other Programmes", Detail: "No of Programmes Conducted", Value: act.any_other.programmes },
            { Category: "12. Any Other Programmes", Detail: "No of Colleges Participated", Value: act.any_other.colleges },
            { Category: "12. Any Other Programmes", Detail: "Number of Volunteers Participated", Value: act.any_other.volunteers },
            { Category: "12. Any Other Programmes", Detail: "No of Beneficiaries", Value: act.any_other.beneficiaries },
            { Category: "12. Any Other Programmes", Detail: "Remarks/Outcome", Value: act.any_other.remarks }
        ];

        const worksheet = XLSX.utils.json_to_sheet(rowData);
        const workbook = XLSX.utils.book_new();

        // Add metadata at the top
        const meta = [
            ["NATIVE NSS REPORT"],
            [`College: ${reportData.collegeDetails?.name || college.insName}`],
            [`Unit Code: ${unit.unitNumber}`],
            [`Period: ${reportData.periodLabel}`],
            [`PO Details: ${reportData.poDetails?.name} (${reportData.poDetails?.mobile})`],
            []
        ];
        XLSX.utils.sheet_add_aoa(worksheet, meta, { origin: "A1" });

        // Offset original rows by 6 to account for metadata
        XLSX.utils.sheet_add_json(worksheet, rowData, { origin: "A7", skipHeader: false });

        XLSX.utils.book_append_sheet(workbook, worksheet, "NSS Report");
        XLSX.writeFile(workbook, `NSS_Report_${unit.unitNumber}_${reportData.periodLabel.replace(/\s+/g, '_')}.xlsx`);
    };

    const downloadPDF = (reportData) => {
        toast.loading("Generating PDF...", { id: "pdf" });
        const element = document.getElementById(`pdf-preview-pane-${reportData._id}`);
        if (!element) {
            toast.error("Could not generate PDF: Preview template element not found", { id: "pdf" });
            return;
        }

        // Show the element temporarily if it's hidden
        const originalStyle = element.style.display;
        element.style.display = "block";

        html2canvas(element, { scale: 2, useCORS: true }).then((canvas) => {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = 210;
            const pdfHeight = 297;
            const margin = 12; // 12mm margins
            const printableWidth = pdfWidth - (margin * 2);
            const printableHeight = pdfHeight - (margin * 2);

            // Height of one page chunk in pixels
            const pageHeightPx = (canvas.width * printableHeight) / printableWidth;
            const totalHeight = canvas.height;

            let srcY = 0;
            let pageNum = 1;

            while (srcY < totalHeight) {
                if (pageNum > 1) {
                    pdf.addPage();
                }

                // Slice a page-sized chunk from the canvas
                const pageCanvas = document.createElement("canvas");
                pageCanvas.width = canvas.width;
                const chunkHeight = Math.min(pageHeightPx, totalHeight - srcY);
                pageCanvas.height = chunkHeight;

                const ctx = pageCanvas.getContext("2d");
                ctx.drawImage(canvas, 0, srcY, canvas.width, chunkHeight, 0, 0, canvas.width, chunkHeight);

                const pageImgData = pageCanvas.toDataURL("image/png");
                const destWidth = printableWidth;
                const destHeight = (chunkHeight * destWidth) / canvas.width;

                // Render image inside margins
                pdf.addImage(pageImgData, 'PNG', margin, margin, destWidth, destHeight);

                // Draw a beautiful page border
                pdf.setDrawColor(0, 0, 0);
                pdf.setLineWidth(0.5);
                pdf.rect(8, 8, pdfWidth - 16, pdfHeight - 16);

                srcY += pageHeightPx;
                pageNum++;
            }

            pdf.save(`NSS_Report_${unit.unitNumber}_${reportData.periodLabel.replace(/\s+/g, '_')}.pdf`);
            element.style.display = originalStyle;
            toast.success("PDF Downloaded successfully!", { id: "pdf" });
        }).catch(err => {
            console.error("PDF generation error:", err);
            toast.error("Failed to generate PDF", { id: "pdf" });
        });
    };

    return (
        <div style={{ color: 'var(--txt-1)' }}>
            {/* Header Title */}
            <div className="flex-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--txt-1)' }}>Periodical Report Submission</h1>
                    <p style={{ margin: 0, color: 'var(--txt-3)', fontSize: '0.9rem' }}>Generate, review, modify, and submit periodical activity reports to administration.</p>
                </div>
            </div>

            {/* Selection Options & Prefill Trigger */}
            <div className="card p-6 mb-6" style={{ background: 'var(--card-bg)' }}>
                <h3 className="mb-4 text-lg">1. Choose Reporting Period</h3>
                <div className="grid-cols-4 gap-4 align-items-end">
                    <div className="form-group">
                        <label className="form-label">Report Scope</label>
                        <select className="form-input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                            <option value="Monthly">Monthly Report</option>
                            <option value="Quarterly">Quarterly Report</option>
                            <option value="Halfyearly">Half-yearly Report</option>
                            <option value="Annual">Annual Report</option>
                            <option value="Custom">Custom Range</option>
                        </select>
                    </div>

                    {reportType === 'Monthly' && (
                        <div className="form-group">
                            <label className="form-label">Select Month</label>
                            <select className="form-input" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                                {monthNames.map((m, idx) => (
                                    <option key={idx} value={idx + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {reportType === 'Quarterly' && (
                        <div className="form-group">
                            <label className="form-label">Select Quarter</label>
                            <select className="form-input" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                                <option value="Q1">Q1 (April - June)</option>
                                <option value="Q2">Q2 (July - September)</option>
                                <option value="Q3">Q3 (October - December)</option>
                                <option value="Q4">Q4 (January - March)</option>
                            </select>
                        </div>
                    )}

                    {reportType === 'Halfyearly' && (
                        <div className="form-group">
                            <label className="form-label">Select Half Year</label>
                            <select className="form-input" value={selectedHalfYear} onChange={(e) => setSelectedHalfYear(e.target.value)}>
                                <option value="H1">H1 (April - September)</option>
                                <option value="H2">H2 (October - March)</option>
                            </select>
                        </div>
                    )}

                    {reportType !== 'Custom' && (
                        <div className="form-group">
                            <label className="form-label">Year</label>
                            <input 
                                type="number" 
                                className="form-input" 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))} 
                                min={2020} 
                                max={2035}
                            />
                        </div>
                    )}

                    {reportType === 'Custom' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">From Date</label>
                                <input type="date" className="form-input" value={customFromDate} onChange={(e) => setCustomFromDate(e.target.value)}/>
                            </div>
                            <div className="form-group">
                                <label className="form-label">To Date</label>
                                <input type="date" className="form-input" value={customToDate} onChange={(e) => setCustomToDate(e.target.value)}/>
                            </div>
                        </>
                    )}

                    <div>
                        <button 
                            className="btn btn-primary w-100" 
                            style={{ height: '42px' }}
                            onClick={handleGeneratePrefill}
                            disabled={loadingPrefill}
                        >
                            {loadingPrefill ? "Prefilling..." : "Generate Prefill Data"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Form Fields */}
            <form onSubmit={handleSubmitReport}>
                {/* Basic Info and PO Details */}
                <div className="grid-cols-2 gap-4 mb-6">
                    <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                        <h3 className="mb-4 text-lg">2. Basic Information</h3>
                        <div className="form-group mb-3">
                            <label className="form-label">College Name</label>
                            <input type="text" className="form-input" value={college?.insName || ''} disabled />
                        </div>
                        <div className="form-group mb-3">
                            <label className="form-label">District</label>
                            <input type="text" className="form-input" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" />
                        </div>
                    </div>

                    <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                        <h3 className="mb-4 text-lg">3. Programme Officer Details</h3>
                        <div className="form-group mb-3">
                            <label className="form-label">Programme Officer Name</label>
                            <input type="text" className="form-input" value={poName} onChange={(e) => setPoName(e.target.value)} required />
                        </div>
                        <div className="grid-cols-2 gap-2">
                            <div className="form-group">
                                <label className="form-label">Mobile Number</label>
                                <input type="text" className="form-input" value={poMobile} onChange={(e) => setPoMobile(e.target.value)} required maxLength={10} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input type="email" className="form-input" value={poEmail} onChange={(e) => setPoEmail(e.target.value)} required />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Wise Forms */}
                <div className="card p-6 mb-6" style={{ background: 'var(--card-bg)' }}>
                    <h3 className="mb-6 text-lg" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>4. Activity-wise Report Details</h3>
                    
                    <div className="d-flex flex-column gap-6">
                        {/* 1. Blood Donation */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">1. Blood Donation Camps</h4>
                            <div className="grid-cols-3 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.blood_donation.programmes} onChange={(e) => handleActivityChange('blood_donation', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.blood_donation.volunteers} onChange={(e) => handleActivityChange('blood_donation', 'volunteers', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">No of Units of Blood Donated *</label>
                                    <input type="number" className="form-input" value={activities.blood_donation.bloodUnits} onChange={(e) => handleActivityChange('blood_donation', 'bloodUnits', e.target.value)} min={0}/>
                                </div>
                            </div>
                        </div>

                        {/* 2. Health Camps */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">2. Health Camps</h4>
                            <div className="grid-cols-3 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.health_camps.programmes} onChange={(e) => handleActivityChange('health_camps', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.health_camps.volunteers} onChange={(e) => handleActivityChange('health_camps', 'volunteers', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">No of Beneficiaries *</label>
                                    <input type="number" className="form-input" value={activities.health_camps.beneficiaries} onChange={(e) => handleActivityChange('health_camps', 'beneficiaries', e.target.value)} min={0}/>
                                </div>
                            </div>
                        </div>

                        {/* 3. Anti Drug Camps */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">3. Anti Drug Camps</h4>
                            <div className="grid-cols-3 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.anti_drug.programmes} onChange={(e) => handleActivityChange('anti_drug', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.anti_drug.volunteers} onChange={(e) => handleActivityChange('anti_drug', 'volunteers', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">No of Beneficiaries *</label>
                                    <input type="number" className="form-input" value={activities.anti_drug.beneficiaries} onChange={(e) => handleActivityChange('anti_drug', 'beneficiaries', e.target.value)} min={0}/>
                                </div>
                            </div>
                        </div>

                        {/* 4. Voters Awareness SIR */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">4. Voters Awareness SIR</h4>
                            <div className="grid-cols-3 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.voter_sir.programmes} onChange={(e) => handleActivityChange('voter_sir', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.voter_sir.volunteers} onChange={(e) => handleActivityChange('voter_sir', 'volunteers', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">No of Beneficiaries *</label>
                                    <input type="number" className="form-input" value={activities.voter_sir.beneficiaries} onChange={(e) => handleActivityChange('voter_sir', 'beneficiaries', e.target.value)} min={0}/>
                                </div>
                            </div>
                        </div>

                        {/* 5. Voters Awareness SVEEP */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">5. Voters Awareness SVEEP</h4>
                            <div className="grid-cols-3 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.voter_sveep.programmes} onChange={(e) => handleActivityChange('voter_sveep', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.voter_sveep.volunteers} onChange={(e) => handleActivityChange('voter_sveep', 'volunteers', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">No of Beneficiaries *</label>
                                    <input type="number" className="form-input" value={activities.voter_sveep.beneficiaries} onChange={(e) => handleActivityChange('voter_sveep', 'beneficiaries', e.target.value)} min={0}/>
                                </div>
                            </div>
                        </div>

                        {/* 6. Road Safety */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">6. Road Safety</h4>
                            <div className="grid-cols-3 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.road_safety.programmes} onChange={(e) => handleActivityChange('road_safety', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.road_safety.volunteers} onChange={(e) => handleActivityChange('road_safety', 'volunteers', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">No of Beneficiaries *</label>
                                    <input type="number" className="form-input" value={activities.road_safety.beneficiaries} onChange={(e) => handleActivityChange('road_safety', 'beneficiaries', e.target.value)} min={0}/>
                                </div>
                            </div>
                        </div>

                        {/* 7. Tree Plantation */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">7. Tree Plantation</h4>
                            <div className="grid-cols-3 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.tree_plantation.programmes} onChange={(e) => handleActivityChange('tree_plantation', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.tree_plantation.volunteers} onChange={(e) => handleActivityChange('tree_plantation', 'volunteers', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">No of Saplings Planted *</label>
                                    <input type="number" className="form-input" value={activities.tree_plantation.saplings} onChange={(e) => handleActivityChange('tree_plantation', 'saplings', e.target.value)} min={0}/>
                                </div>
                            </div>
                        </div>

                        {/* 8. Important Days */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">8. Important Days Celebrations</h4>
                            <div className="grid-cols-3 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.important_days.programmes} onChange={(e) => handleActivityChange('important_days', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.important_days.volunteers} onChange={(e) => handleActivityChange('important_days', 'volunteers', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Conduct *</label>
                                    <input type="text" className="form-input" value={activities.important_days.date} onChange={(e) => handleActivityChange('important_days', 'date', e.target.value)} placeholder="YYYY-MM-DD" />
                                </div>
                            </div>
                        </div>

                        {/* 9. Pledge */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">9. Pledge Taken</h4>
                            <div className="grid-cols-2 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.pledge.programmes} onChange={(e) => handleActivityChange('pledge', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.pledge.volunteers} onChange={(e) => handleActivityChange('pledge', 'volunteers', e.target.value)} min={0}/>
                                </div>
                            </div>
                        </div>

                        {/* 10. Rallies */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">10. Rallies</h4>
                            <div className="grid-cols-4 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.rallies.programmes} onChange={(e) => handleActivityChange('rallies', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.rallies.volunteers} onChange={(e) => handleActivityChange('rallies', 'volunteers', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Conduct *</label>
                                    <input type="text" className="form-input" value={activities.rallies.date} onChange={(e) => handleActivityChange('rallies', 'date', e.target.value)} placeholder="YYYY-MM-DD" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Distance Covered (KM) *</label>
                                    <input type="number" className="form-input" value={activities.rallies.distance} onChange={(e) => handleActivityChange('rallies', 'distance', e.target.value)} min={0} step="0.1"/>
                                </div>
                            </div>
                        </div>

                        {/* 11. Hosted Meetings */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">11. Hosted Meetings</h4>
                            <div className="grid-cols-4 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.hosted_meetings.programmes} onChange={(e) => handleActivityChange('hosted_meetings', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Guest Name *</label>
                                    <input type="text" className="form-input" value={activities.hosted_meetings.guestName} onChange={(e) => handleActivityChange('hosted_meetings', 'guestName', e.target.value)} placeholder="e.g. Dr. Ramesh Kumar" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.hosted_meetings.volunteers} onChange={(e) => handleActivityChange('hosted_meetings', 'volunteers', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">No of Beneficiaries *</label>
                                    <input type="number" className="form-input" value={activities.hosted_meetings.beneficiaries} onChange={(e) => handleActivityChange('hosted_meetings', 'beneficiaries', e.target.value)} min={0}/>
                                </div>
                            </div>
                        </div>

                        {/* 12. Any Other */}
                        <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                            <h4 className="mb-3 text-primary-400">12. Any Other Programmes</h4>
                            <div className="grid-cols-3 gap-3 mb-3">
                                <div className="form-group">
                                    <label className="form-label">No of Programmes Conducted *</label>
                                    <input type="number" className="form-input" value={activities.any_other.programmes} onChange={(e) => handleActivityChange('any_other', 'programmes', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">No of Colleges Participated *</label>
                                    <input type="number" className="form-input" value={activities.any_other.colleges} onChange={(e) => handleActivityChange('any_other', 'colleges', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Number of Volunteers *</label>
                                    <input type="number" className="form-input" value={activities.any_other.volunteers} onChange={(e) => handleActivityChange('any_other', 'volunteers', e.target.value)} min={0}/>
                                </div>
                            </div>
                            <div className="grid-cols-2 gap-3">
                                <div className="form-group">
                                    <label className="form-label">No of Beneficiaries *</label>
                                    <input type="number" className="form-input" value={activities.any_other.beneficiaries} onChange={(e) => handleActivityChange('any_other', 'beneficiaries', e.target.value)} min={0}/>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Remarks/Outcome *</label>
                                    <input type="text" className="form-input" value={activities.any_other.remarks} onChange={(e) => handleActivityChange('any_other', 'remarks', e.target.value)} placeholder="e.g. Conducted a cleaning campaign" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media Links */}
                <div className="card p-6 mb-6" style={{ background: 'var(--card-bg)' }}>
                    <h3 className="mb-4 text-lg">5. Social Media Upload Details</h3>
                    <div className="grid-cols-3 gap-3">
                        <div className="form-group">
                            <label className="form-label">Instagram Link</label>
                            <input type="text" className="form-input" value={socialMedia.instagram} onChange={(e) => handleSocialMediaChange('instagram', e.target.value)} placeholder="https://instagram.com/..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Facebook Link</label>
                            <input type="text" className="form-input" value={socialMedia.facebook} onChange={(e) => handleSocialMediaChange('facebook', e.target.value)} placeholder="https://facebook.com/..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">YouTube Link</label>
                            <input type="text" className="form-input" value={socialMedia.youtube} onChange={(e) => handleSocialMediaChange('youtube', e.target.value)} placeholder="https://youtube.com/..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Twitter Link</label>
                            <input type="text" className="form-input" value={socialMedia.twitter} onChange={(e) => handleSocialMediaChange('twitter', e.target.value)} placeholder="https://twitter.com/..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Other Upload Link</label>
                            <input type="text" className="form-input" value={socialMedia.other} onChange={(e) => handleSocialMediaChange('other', e.target.value)} placeholder="e.g. Blog Link" />
                        </div>
                    </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex-end gap-3 mb-8">
                    {isEditingReportId && (
                        <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={() => {
                                setIsEditingReportId(null);
                                setActivities({
                                    blood_donation: { programmes: 0, volunteers: 0, bloodUnits: 0 },
                                    health_camps: { programmes: 0, volunteers: 0, beneficiaries: 0 },
                                    anti_drug: { programmes: 0, volunteers: 0, beneficiaries: 0 },
                                    voter_sir: { programmes: 0, volunteers: 0, beneficiaries: 0 },
                                    voter_sveep: { programmes: 0, volunteers: 0, beneficiaries: 0 },
                                    road_safety: { programmes: 0, volunteers: 0, beneficiaries: 0 },
                                    tree_plantation: { programmes: 0, volunteers: 0, saplings: 0 },
                                    important_days: { programmes: 0, volunteers: 0, date: "" },
                                    pledge: { programmes: 0, volunteers: 0 },
                                    rallies: { programmes: 0, volunteers: 0, date: "", distance: 0 },
                                    hosted_meetings: { programmes: 0, guestName: "", volunteers: 0, beneficiaries: 0 },
                                    any_other: { programmes: 0, colleges: 0, volunteers: 0, beneficiaries: 0, remarks: "" }
                                });
                            }}
                        >
                            Cancel Edit
                        </button>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? "Saving..." : isEditingReportId ? "Update & Submit to Admin" : "Verify & Submit to Admin"}
                    </button>
                </div>
            </form>

            {/* History Table */}
            <div className="card p-6" style={{ background: 'var(--card-bg)' }}>
                <h3 className="mb-4 text-lg">Report Submission History</h3>
                {loadingHistory ? (
                    <p className="text-muted">Loading history...</p>
                ) : submittedReports.length === 0 ? (
                    <p className="text-muted">No periodical reports submitted yet.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="styled-table" style={{ margin: 0, boxShadow: 'none' }}>
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Report Period</th>
                                    <th>Report Type</th>
                                    <th>Submitted Date</th>
                                    <th>Status</th>
                                    <th className="text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submittedReports.map((rep, idx) => (
                                    <tr key={rep._id}>
                                        <td>{idx + 1}</td>
                                        <td>{rep.periodLabel}</td>
                                        <td>{rep.reportType}</td>
                                        <td>{new Date(rep.submittedAt).toLocaleDateString()}</td>
                                        <td><span className="badge badge-success">Submitted</span></td>
                                        <td>
                                            <div className="d-flex gap-2 justify-content-center">
                                                <button className="btn btn-sm btn-primary" onClick={() => handleEditReport(rep)}>
                                                    Edit
                                                </button>
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
                                                id={`pdf-preview-pane-${rep._id}`} 
                                                style={{
                                                    display: 'none',
                                                    position: 'absolute',
                                                    left: '-9999px',
                                                    top: '-9999px',
                                                    width: '794px', // Standard pixels for A4 width at 96 DPI
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
                                                            <td style={{ padding: '6px', border: '1px solid #ddd' }}>{college?.insName}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ padding: '6px', fontWeight: 'bold', border: '1px solid #ddd' }}>District:</td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd' }}>{rep.collegeDetails?.district || district}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ padding: '6px', fontWeight: 'bold', border: '1px solid #ddd' }}>Unit Code:</td>
                                                            <td style={{ padding: '6px', border: '1px solid #ddd' }}>{unit?.unitNumber}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ padding: '6px', fontWeight: 'bold', border: '1px solid #ddd' }}>Programme Officer:</td>
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
                                                        {/* Blood Donation */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>1</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Blood Donation Camps</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.blood_donation?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.blood_donation?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Units Donated: {rep.activities?.blood_donation?.bloodUnits || 0}</td>
                                                        </tr>
                                                        {/* Health Camps */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>2</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Health Camps</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.health_camps?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.health_camps?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Beneficiaries: {rep.activities?.health_camps?.beneficiaries || 0}</td>
                                                        </tr>
                                                        {/* Anti Drug */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>3</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Anti Drug Camps</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.anti_drug?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.anti_drug?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Beneficiaries: {rep.activities?.anti_drug?.beneficiaries || 0}</td>
                                                        </tr>
                                                        {/* Voter SIR */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>4</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Voters Awareness SIR</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.voter_sir?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.voter_sir?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Beneficiaries: {rep.activities?.voter_sir?.beneficiaries || 0}</td>
                                                        </tr>
                                                        {/* Voter SVEEP */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>5</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Voters Awareness SVEEP</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.voter_sveep?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.voter_sveep?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Beneficiaries: {rep.activities?.voter_sveep?.beneficiaries || 0}</td>
                                                        </tr>
                                                        {/* Road Safety */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>6</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Road Safety Awareness</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.road_safety?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.road_safety?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Beneficiaries: {rep.activities?.road_safety?.beneficiaries || 0}</td>
                                                        </tr>
                                                        {/* Tree Plantation */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>7</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Tree Plantation</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.tree_plantation?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.tree_plantation?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Saplings Planted: {rep.activities?.tree_plantation?.saplings || 0}</td>
                                                        </tr>
                                                        {/* Important Days */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>8</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Important Days Celebrations</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.important_days?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.important_days?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Date: {rep.activities?.important_days?.date || 'N/A'}</td>
                                                        </tr>
                                                        {/* Pledge */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>9</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Pledges Taken</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.pledge?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.pledge?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>-</td>
                                                        </tr>
                                                        {/* Rallies */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>10</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Rallies conducted</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.rallies?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.rallies?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Date: {rep.activities?.rallies?.date || 'N/A'} | Dist: {rep.activities?.rallies?.distance || 0} KM</td>
                                                        </tr>
                                                        {/* Hosted Meetings */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>11</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Hosted Meetings</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.hosted_meetings?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.hosted_meetings?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Guests: {rep.activities?.hosted_meetings?.guestName || 'None'} | Benefic: {rep.activities?.hosted_meetings?.beneficiaries || 0}</td>
                                                        </tr>
                                                        {/* Any Other */}
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>12</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Any Other Programmes</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.any_other?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.any_other?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Colleges: {rep.activities?.any_other?.colleges || 0} | Remarks: {rep.activities?.any_other?.remarks || 'N/A'}</td>
                                                        </tr>
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
        </div>
    );
};

export default UnitReportGenerator;
