import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import ThemeToggle from "./ThemeToggle";

const CollegeRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [collegeCode, setCollegeCode] = useState("");
    const [collegeInfo, setCollegeInfo] = useState({ insName: "", collegeType: "" });

    // OTP Verification State
    const [otpInput, setOtpInput] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");

    // Step 2 Form State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [principalName, setPrincipalName] = useState("");
    const [principalContact, setPrincipalContact] = useState("");
    const [principalEmail, setPrincipalEmail] = useState("");

    const [collegeEmail, setCollegeEmail] = useState("");
    const [collegeContact, setCollegeContact] = useState("");
    const [collegeWebsite, setCollegeWebsite] = useState("");

    const [address, setAddress] = useState("");
    const [block, setBlock] = useState("");
    const [taluk, setTaluk] = useState("");
    const [district, setDistrict] = useState("");
    const [pincode, setPincode] = useState("");

    // Bank Details (For Funded only)
    const [accountNo, setAccountNo] = useState("");
    const [bankName, setBankName] = useState("");
    const [branch, setBranch] = useState("");
    const [ifsc, setIfsc] = useState("");

    // Result State
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [generatedPasskey, setGeneratedPasskey] = useState("");

    const handleValidateCode = async (e) => {
        e.preventDefault();
        if (!collegeCode.trim()) {
            return toast.error("Please enter your College Code");
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/send-college-otp`, { code: collegeCode });
            if (res.data.success) {
                setCollegeInfo({
                    insName: res.data.insName,
                    collegeType: res.data.collegeType
                });
                setMaskedEmail(res.data.emailMasked);
                toast.success(`OTP sent to college email: ${res.data.emailMasked}`);
                setStep(1.5);
            }
        } catch (error) {
            console.error("Validation error:", error);
            const msg = error.response?.data?.message || "Invalid College Code or Connection Error";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otpInput.trim() || otpInput.length < 6) {
            return toast.error("Please enter 6-digit OTP");
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/verify-college-otp`, {
                code: collegeCode,
                otp: otpInput
            });
            if (res.data.success) {
                toast.success("OTP Verified Successfully!");
                if (res.data.email) {
                    setCollegeEmail(res.data.email);
                }
                setStep(2);
            }
        } catch (error) {
            console.error("OTP Verification Error:", error);
            const msg = error.response?.data?.message || "OTP verification failed";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitRegistration = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error("Passwords do not match");
        }
        if (password.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }

        const data = {
            code: collegeCode,
            password,
            principalDetails: {
                name: principalName,
                contact: principalContact,
                email: principalEmail
            },
            collegeDetails: {
                email: collegeEmail,
                contact: collegeContact,
                website: collegeWebsite
            },
            collegeLocation: {
                address,
                block,
                taluk,
                district,
                pincode
            }
        };

        if (collegeInfo.collegeType && collegeInfo.collegeType.toLowerCase().includes("funded")) {
            data.bankDetails = {
                accountNo,
                bankName,
                branch,
                ifsc
            };
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/register-college`, data);
            if (res.data.success) {
                setGeneratedPasskey(res.data.passkey);
                setRegistrationSuccess(true);
                toast.success("Registration completed successfully!");
                setStep(3);
            }
        } catch (error) {
            console.error("Registration error:", error);
            const msg = error.response?.data?.message || "Registration failed. Please try again.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg)", padding: "2rem" }}>
            <div style={{ position: "absolute", top: "20px", right: "20px" }}>
                <ThemeToggle />
            </div>

            <div style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "2.5rem",
                width: "100%",
                maxWidth: step === 2 ? "800px" : "500px",
                boxShadow: "var(--sh-lg)",
                transition: "all 0.3s ease"
            }}>
                {/* Step indicator */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>College Registration</h2>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--brand-500)", textTransform: "uppercase" }}>Step {step} of 3</span>
                </div>

                {/* STEP 1: Code Verification */}
                {step === 1 && (
                    <form onSubmit={handleValidateCode} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <p style={{ color: "var(--txt-3)", fontSize: "0.9rem", margin: 0 }}>
                            Please enter your official College Code provided by the university admin to initiate profile setup.
                        </p>
                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.75rem" }}>College Code</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. 507"
                                value={collegeCode}
                                onChange={(e) => setCollegeCode(e.target.value)}
                                required
                                style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border)", outline: "none" }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                            style={{ background: "#2563eb", border: "none", color: "#fff", padding: "0.75rem", borderRadius: "8px", fontWeight: 600 }}
                        >
                            {isLoading ? "Sending OTP..." : "Send Verification OTP"}
                        </button>
                    </form>
                )}

                {/* STEP 1.5: OTP Verification */}
                {step === 1.5 && (
                    <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div style={{ background: "var(--bg-2)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", textAlign: "center" }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--txt-3)", textTransform: "uppercase" }}>Institution Recognized</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2563eb", marginTop: "0.25rem" }}>{collegeInfo.insName}</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--txt-2)", marginTop: "0.5rem" }}>
                                An OTP email has been sent to: <strong style={{ color: "#2563eb" }}>{maskedEmail}</strong>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase", marginBottom: "0.5rem", display: "block" }}>
                                Enter 6-Digit OTP Code
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                className="form-input"
                                placeholder="e.g. 123456"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                                required
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", outline: "none", letterSpacing: "4px", fontSize: "1.2rem", textAlign: "center" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setStep(1)}
                                style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", fontWeight: 600 }}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                                style={{ flex: 2, background: "#2563eb", border: "none", color: "#fff", padding: "0.75rem", borderRadius: "8px", fontWeight: 600 }}
                            >
                                {isLoading ? "Verifying..." : "Verify OTP & Continue"}
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2: Comprehensive Details Wizard */}
                {step === 2 && (
                    <form onSubmit={handleSubmitRegistration} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        
                        {/* College Info header */}
                        <div style={{ background: "var(--bg-2)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--txt-3)", textTransform: "uppercase" }}>Validating Institution</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#2563eb" }}>{collegeInfo.insName}</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--txt-2)", marginTop: "0.25rem" }}>Code: {collegeCode} | Type: {collegeInfo.collegeType}</div>
                        </div>

                        {/* Account credentials */}
                        <div>
                            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--brand-500)", borderBottom: "1px solid var(--border)", paddingBottom: "0.25rem" }}>1. Account Credentials</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Min 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)" }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Confirm Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid var(--border)" }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Principal Details */}
                        <div>
                            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--brand-500)", borderBottom: "1px solid var(--border)", paddingBottom: "0.25rem" }}>2. Principal Details</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Principal Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Principal Name"
                                        value={principalName}
                                        onChange={(e) => setPrincipalName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Contact Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Mobile / Phone"
                                        value={principalContact}
                                        onChange={(e) => setPrincipalContact(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Email ID</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="principal@college.edu"
                                        value={principalEmail}
                                        onChange={(e) => setPrincipalEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* College Contact details */}
                        <div>
                            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--brand-500)", borderBottom: "1px solid var(--border)", paddingBottom: "0.25rem" }}>3. College Contact & Profile</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Office Email (Username)</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="nsscell@college.edu"
                                        value={collegeEmail}
                                        onChange={(e) => setCollegeEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Office Contact</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Office Landline / Contact"
                                        value={collegeContact}
                                        onChange={(e) => setCollegeContact(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>College Website</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="www.college.edu"
                                        value={collegeWebsite}
                                        onChange={(e) => setCollegeWebsite(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* College Location */}
                        <div>
                            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--brand-500)", borderBottom: "1px solid var(--border)", paddingBottom: "0.25rem" }}>4. Location Details</h3>
                            <div className="form-group" style={{ marginBottom: "1rem" }}>
                                <label className="form-label" style={{ fontSize: "0.7rem" }}>Full Postal Address</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Enter complete postal address of the institution"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                    style={{ minHeight: "60px" }}
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Block</label>
                                    <input type="text" className="form-input" placeholder="e.g. Salem" value={block} onChange={(e) => setBlock(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Taluk</label>
                                    <input type="text" className="form-input" placeholder="e.g. Omalur" value={taluk} onChange={(e) => setTaluk(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>District</label>
                                    <select className="form-input" value={district} onChange={(e) => setDistrict(e.target.value)} required>
                                        <option value="">Select District</option>
                                        <option value="Salem">Salem</option>
                                        <option value="Namakkal">Namakkal</option>
                                        <option value="Dharmapuri">Dharmapuri</option>
                                        <option value="Krishnagiri">Krishnagiri</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: "0.7rem" }}>Pincode</label>
                                    <input type="text" className="form-input" placeholder="6 digits" maxLength={6} value={pincode} onChange={(e) => setPincode(e.target.value)} required />
                                </div>
                            </div>
                        </div>

                        {/* Bank Details (Funded / Funded & Self-Financing Only) */}
                        {collegeInfo.collegeType && collegeInfo.collegeType.toLowerCase().includes("funded") && (
                            <div>
                                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--brand-500)", borderBottom: "1px solid var(--border)", paddingBottom: "0.25rem" }}>5. Bank Details (NSS Funded Account)</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: "0.7rem" }}>Account Number</label>
                                        <input type="text" className="form-input" placeholder="Account No" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: "0.7rem" }}>Bank Name</label>
                                        <input type="text" className="form-input" placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: "0.7rem" }}>Branch Name</label>
                                        <input type="text" className="form-input" placeholder="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontSize: "0.7rem" }}>IFSC Code</label>
                                        <input type="text" className="form-input" placeholder="IFSC" value={ifsc} onChange={(e) => setIfsc(e.target.value)} required />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setStep(1)}
                                style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)" }}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                                style={{ flex: 2, background: "#2563eb", border: "none", color: "#fff", padding: "0.75rem", borderRadius: "8px", fontWeight: 600 }}
                            >
                                {isLoading ? "Submitting..." : "Complete Registration"}
                            </button>
                        </div>

                    </form>
                )}

                {/* STEP 3: Success Display & Next Steps */}
                {step === 3 && registrationSuccess && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", textAlign: "center" }}>
                        <div style={{
                            width: "64px", height: "64px",
                            background: "rgba(22, 163, 74, 0.1)",
                            color: "#16a34a",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                            fontSize: "2rem"
                        }}>
                            ✓
                        </div>
                        <div>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 0.5rem" }}>Registration Successful!</h3>
                            <p style={{ color: "var(--txt-3)", fontSize: "0.9rem", margin: 0 }}>
                                Your profile details have been registered. You can now log in to the NSS Portal.
                            </p>
                        </div>

                        <div style={{ background: "var(--bg-2)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.85rem", textAlign: "left", color: "var(--txt-2)", lineHeight: "1.5" }}>
                            <strong>Next Steps:</strong>
                            <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                                <li>Use your registered email and password to log in.</li>
                                <li>You will be able to create units, manage Programme Officers, and submit periodical reports.</li>
                            </ul>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={() => navigate("/login")}
                            style={{ background: "#2563eb", border: "none", color: "#fff", padding: "0.75rem", borderRadius: "8px", fontWeight: 600 }}
                        >
                            Go to Login
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default CollegeRegister;
