import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import * as XLSX from 'xlsx';

const AddOrg = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("single");
    const [bulkColleges, setBulkColleges] = useState([]);

    React.useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            navigate("/admin-login");
        }
    }, [navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);
        
        const data = {
            insName: formData.get("insName"),
            code: formData.get("code"),
            collegeType: formData.get("collegeType")
        };

        const token = localStorage.getItem("adminToken");
        axios.post(`${import.meta.env.VITE_API_URL}/add-organization`, data, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((response) => {
                toast.success("College Shell Registered Successfully");
                e.target.reset();
                navigate('/admin-dashboard');
            })
            .catch((error) => {
                console.error("There was an error registering the college!", error);
                const errorMessage = error.response?.data?.message || "Failed to register college. Please try again.";
                toast.error(errorMessage);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    const handleDownloadTemplate = () => {
        const templateData = [
            { "College Name": "Example College of Arts and Science", "College Code": "507", "Funding Type": "Funded" },
            { "College Name": "Another Self Financing College", "College Code": "508", "Funding Type": "Self-Financing" }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Colleges");
        XLSX.writeFile(wb, "NSS_Colleges_Registration_Template.xlsx");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                // Map the JSON key to schema properties
                const formatted = data.map(row => {
                    const insName = row["College Name"] || row["collegeName"] || row["insName"];
                    const code = String(row["College Code"] || row["collegeCode"] || row["code"] || "").trim();
                    const collegeType = row["Funding Type"] || row["collegeType"] || row["type"] || "Self-Financing";
                    return { insName, code, collegeType };
                });
                
                const valid = formatted.filter(item => item.insName && item.code);
                if (valid.length === 0) {
                    toast.error("No valid college records found. Please check column headers.");
                    return;
                }
                
                setBulkColleges(valid);
                toast.success(`Successfully parsed ${valid.length} colleges. Click Register to save them.`);
            } catch (err) {
                console.error(err);
                toast.error("Failed to parse the Excel file.");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkSubmit = async (e) => {
        e.preventDefault();
        if (bulkColleges.length === 0) {
            toast.error("Please upload an Excel file with valid college records first.");
            return;
        }
        setIsLoading(true);
        const token = localStorage.getItem("adminToken");
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/bulk-add-organizations`, 
                { colleges: bulkColleges }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                toast.success(res.data.message || "Colleges registered successfully!");
                setBulkColleges([]);
                const fileInput = document.getElementById("bulk-file-input");
                if (fileInput) fileInput.value = "";
                navigate('/admin-dashboard');
            } else {
                toast.error(res.data.message || "Failed to register colleges.");
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to bulk register colleges.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg)', padding: '2rem' }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <ThemeToggle />
            </div>
            <div className="card login-card" style={{ maxWidth: '600px', width: '100%', padding: '2.5rem', background: 'var(--card)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--sh-lg)' }}>
                <div className="text-center mb-6" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '60px', height: '60px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#2563eb',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        fontSize: '1.5rem',
                    }}>
                        🏢
                    </div>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', background: 'var(--badge-primary-bg)', color: 'var(--badge-primary-clr)', borderRadius: '9999px', marginBottom: '0.75rem' }}>System Administration</span>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Register College</h1>
                    <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', margin: 0 }}>Create college shells to allow colleges to complete their registration profiles.</p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                    <button
                        type="button"
                        onClick={() => { setActiveTab("single"); setBulkColleges([]); }}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: 'none',
                            background: 'none',
                            color: activeTab === 'single' ? '#2563eb' : 'var(--txt-3)',
                            fontWeight: 600,
                            borderBottom: activeTab === 'single' ? '2px solid #2563eb' : 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Single Registration
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("bulk")}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: 'none',
                            background: 'none',
                            color: activeTab === 'bulk' ? '#2563eb' : 'var(--txt-3)',
                            fontWeight: 600,
                            borderBottom: activeTab === 'bulk' ? '2px solid #2563eb' : 'none',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Bulk Upload (Excel)
                    </button>
                </div>

                {activeTab === "single" ? (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Institution Name</label>
                            <input
                                type="text"
                                name="insName"
                                className="form-input"
                                placeholder="e.g. ABC College of Arts and Science"
                                required
                                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                            />
                        </div>

                        <div className="grid-cols-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>College Code</label>
                                <input
                                    type="text"
                                    name="code"
                                    className="form-input"
                                    placeholder="e.g. 507"
                                    required
                                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>Funding Type</label>
                                <select
                                    name="collegeType"
                                    className="form-input"
                                    required
                                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                                >
                                    <option value="Funded">Funded</option>
                                    <option value="Self-Financing">Self-Financing</option>
                                </select>
                            </div>
                        </div>

                        <div className="d-flex gap-2" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                                style={{ flex: 2, background: '#2563eb', border: 'none', color: '#fff', padding: '0.75rem', borderRadius: '8px', fontWeight: 600 }}
                            >
                                {isLoading ? "Registering..." : "Create Shell"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/admin-dashboard')}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', fontWeight: 600, border: '1px solid var(--border)', background: 'transparent' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--txt-2)' }}>1. Download the Excel format template:</span>
                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="btn btn-secondary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                                📥 Download Template
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--txt-2)' }}>2. Upload your completed file:</span>
                            <input
                                id="bulk-file-input"
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                style={{ padding: '0.5rem', border: '1px dashed var(--border)', borderRadius: '8px', background: 'var(--bg-tertiary)' }}
                            />
                        </div>

                        {bulkColleges.length > 0 && (
                            <div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Preview Colleges ({bulkColleges.length})</h3>
                                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)' }}>
                                                <th style={{ padding: '0.5rem' }}>Name</th>
                                                <th style={{ padding: '0.5rem' }}>Code</th>
                                                <th style={{ padding: '0.5rem' }}>Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bulkColleges.map((c, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.5rem' }}>{c.insName}</td>
                                                    <td style={{ padding: '0.5rem' }}>{c.code}</td>
                                                    <td style={{ padding: '0.5rem' }}>{c.collegeType}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="d-flex gap-2" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                                type="button"
                                onClick={handleBulkSubmit}
                                className="btn btn-primary"
                                disabled={isLoading || bulkColleges.length === 0}
                                style={{ flex: 2, background: '#2563eb', border: 'none', color: '#fff', padding: '0.75rem', borderRadius: '8px', fontWeight: 600, opacity: bulkColleges.length === 0 ? 0.6 : 1 }}
                            >
                                {isLoading ? "Registering All..." : `Register ${bulkColleges.length} Colleges`}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/admin-dashboard')}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', fontWeight: 600, border: '1px solid var(--border)', background: 'transparent' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddOrg;