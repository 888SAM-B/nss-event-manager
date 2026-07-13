import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
                <div>
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

                    <div>
                        <button className="btn btn-primary w-100" style={{ height: '42px' }} onClick={fetchReports}>
                            Apply Filters
                        </button>
                    </div>
                </div>

                <div className="grid-cols-2 gap-4 mt-4">
                    <div className="form-group">
                        <label className="form-label">From Date</label>
                        <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">To Date</label>
                        <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Reports List */}
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
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>1</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Blood Donation Camps</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.blood_donation?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.blood_donation?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Units Donated: {rep.activities?.blood_donation?.bloodUnits || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>2</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Health Camps</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.health_camps?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.health_camps?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Beneficiaries: {rep.activities?.health_camps?.beneficiaries || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>3</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Anti Drug Camps</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.anti_drug?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.anti_drug?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Beneficiaries: {rep.activities?.anti_drug?.beneficiaries || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>4</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Voters Awareness SIR</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.voter_sir?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.voter_sir?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Beneficiaries: {rep.activities?.voter_sir?.beneficiaries || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>5</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Voters Awareness SVEEP</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.voter_sveep?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.voter_sveep?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Beneficiaries: {rep.activities?.voter_sveep?.beneficiaries || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>6</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Road Safety Awareness</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.road_safety?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.road_safety?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Beneficiaries: {rep.activities?.road_safety?.beneficiaries || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>7</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Tree Plantation</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.tree_plantation?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.tree_plantation?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Saplings Planted: {rep.activities?.tree_plantation?.saplings || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>8</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Important Days Celebrations</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.important_days?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.important_days?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Date: {rep.activities?.important_days?.date || 'N/A'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>9</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Pledges Taken</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.pledge?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.pledge?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>-</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>10</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Rallies conducted</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.rallies?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.rallies?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Date: {rep.activities?.rallies?.date || 'N/A'} | Dist: {rep.activities?.rallies?.distance || 0} KM</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>11</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Hosted Meetings</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.hosted_meetings?.programmes || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{rep.activities?.hosted_meetings?.volunteers || 0}</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px' }}>Guests: {rep.activities?.hosted_meetings?.guestName || 'None'} | Benefic: {rep.activities?.hosted_meetings?.beneficiaries || 0}</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>12</td>
                                                            <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>Any Other Programs</td>
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

export default AdminReportGenerator;
