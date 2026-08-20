import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import "aos/dist/aos.css";
import AOS from "aos";
import axios from "axios";

const Home = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [galleryImages, setGalleryImages] = useState([]);
    const [adminHeads, setAdminHeads] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
            easing: "ease-in-out",
        });

        const fetchGallery = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/gallery`);
                if (res.data.success) {
                    setGalleryImages(res.data.images);
                }
            } catch (error) {
                console.error("Error fetching gallery:", error);
            }
        };

        const fetchAdminHeads = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/admin-heads`);
                if (res.data.success) {
                    setAdminHeads(res.data.heads);
                }
            } catch (error) {
                console.error("Error fetching admin heads:", error);
            }
        };

        fetchGallery();
        fetchAdminHeads();
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };



    return (
        <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "var(--font-family)", color: "var(--txt-1)" }}>

            {/* Custom Animations CSS */}
            <style>{`
                .nav-link {
                    color: rgba(255, 255, 255, 0.85);
                    font-weight: 500;
                    font-size: 0.875rem;
                    text-decoration: none;
                    transition: color 0.2s;
                    cursor: pointer;
                    padding: 0.25rem 0.5rem;
                }
                .nav-link:hover {
                    color: #fff;
                }
                 /* Sidebar Drawer styles */
                 .sidebar-drawer {
                     position: fixed;
                     top: 0;
                     right: -320px;
                     width: 320px;
                     height: 100vh;
                     background: rgba(15, 23, 42, 0.96);
                     backdrop-filter: blur(16px);
                     -webkit-backdrop-filter: blur(16px);
                     box-shadow: -10px 0 35px rgba(0, 0, 0, 0.35);
                     z-index: 500;
                     transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                     display: flex;
                     flex-direction: column;
                     padding: 2.5rem 2rem;
                     box-sizing: border-box;
                     border-left: 1px solid rgba(255, 255, 255, 0.1);
                 }
                 .sidebar-drawer.open {
                     right: 0;
                 }
                 .sidebar-overlay {
                     position: fixed;
                     inset: 0;
                     background: rgba(0, 0, 0, 0.4);
                     backdrop-filter: blur(4px);
                     -webkit-backdrop-filter: blur(4px);
                     z-index: 450;
                     opacity: 0;
                     pointer-events: none;
                     transition: opacity 0.3s ease;
                 }
                 .sidebar-overlay.open {
                     opacity: 1;
                     pointer-events: auto;
                 }
                 .sidebar-header {
                     display: flex;
                     justify-content: space-between;
                     align-items: center;
                     margin-bottom: 2.5rem;
                     border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                     padding-bottom: 1.25rem;
                 }
                 .sidebar-title {
                     color: #fff;
                     font-weight: 800;
                     font-size: 1.25rem;
                     letter-spacing: -0.02em;
                 }
                 .sidebar-close-btn {
                     background: transparent;
                     border: none;
                     color: rgba(255, 255, 255, 0.6);
                     cursor: pointer;
                     display: flex;
                     align-items: center;
                     justify-content: center;
                     padding: 0.5rem;
                     border-radius: 50%;
                     transition: all 0.2s;
                 }
                 .sidebar-close-btn:hover {
                     color: #fff;
                     background: rgba(255, 255, 255, 0.1);
                 }
                 .sidebar-links {
                     display: flex;
                     flex-direction: column;
                     gap: 1.25rem;
                 }
                 .sidebar-link {
                     color: rgba(255, 255, 255, 0.75);
                     font-size: 1.05rem;
                     font-weight: 600;
                     cursor: pointer;
                     transition: all 0.25s ease;
                     display: flex;
                     align-items: center;
                     gap: 0.75rem;
                     padding: 0.75rem 1rem;
                     border-radius: 10px;
                     text-decoration: none;
                 }
                 .sidebar-link:hover {
                     color: #fff;
                     background: rgba(255, 255, 255, 0.06);
                     padding-left: 1.5rem;
                 }
                 .hamburger-btn {
                     background: rgba(255, 255, 255, 0.05);
                     border: 1px solid rgba(255, 255, 255, 0.15);
                     color: #fff;
                     cursor: pointer;
                     display: flex;
                     align-items: center;
                     justify-content: center;
                     padding: 0.6rem;
                     border-radius: 8px;
                     transition: all 0.2s;
                     height: 36px;
                     width: 36px;
                 }
                 .hamburger-btn:hover {
                     background: rgba(255, 255, 255, 0.1);
                     border-color: rgba(255, 255, 255, 0.3);
                 }
                .dropdown-item {
                    display: block;
                    width: 100%;
                    padding: 0.75rem 1.25rem;
                    text-align: left;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--txt-1);
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    transition: background 0.15s;
                    text-decoration: none;
                }
                .dropdown-item:hover {
                    background: var(--bg-2);
                    color: var(--primary-color);
                }
                .motto-banner {
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    color: #ffffff;
                    text-align: center;
                    padding: 5rem 2rem;
                    position: relative;
                    overflow: hidden;
                    box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.2);
                }
                .motto-banner::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 50%),
                                      radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 50%);
                }
                .announcement-card {
                    background: var(--card);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: var(--sh-sm);
                    transition: all 0.25s ease;
                }
                .announcement-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--sh-md);
                    border-color: var(--brand-400);
                }
                .tag {
                    display: inline-block;
                    padding: 0.25rem 0.625rem;
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    border-radius: 9999px;
                    margin-bottom: 0.75rem;
                }
                .tag-important {
                    background: var(--badge-danger-bg);
                    color: var(--badge-danger-clr);
                }
                .tag-circular {
                    background: var(--badge-primary-bg);
                    color: var(--badge-primary-clr);
                }
                .tag-camp {
                    background: var(--badge-warning-bg);
                    color: var(--badge-warning-clr);
                }
                .hero-columns {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3.5rem;
                    align-items: center;
                    margin-top: 3.5rem;
                }
                @media (max-width: 991px) {
                    .hero-columns {
                        grid-template-columns: 1fr;
                        gap: 2.5rem;
                        margin-top: 2.5rem;
                    }
                }
                 .identity-grid {
                     display: grid;
                     grid-template-columns: 1fr 1fr;
                     gap: 2rem;
                 }
                 .identity-card {
                     display: flex;
                     flex-direction: row;
                     align-items: stretch;
                     background: var(--card);
                     border-radius: 16px;
                     border: 1px solid var(--border);
                     box-shadow: var(--sh-sm);
                     overflow: hidden;
                     transition: all 0.3s ease;
                 }
                 .identity-card:hover {
                     transform: translateY(-4px);
                     box-shadow: var(--sh-md);
                 }
                 .identity-card-left {
                     width: 160px;
                     min-width: 160px;
                     display: flex;
                     align-items: center;
                     justify-content: center;
                     position: relative;
                 }
                 .identity-card-right {
                     flex: 1;
                     padding: 2.5rem 2rem;
                     display: flex;
                     flex-direction: column;
                     gap: 0.75rem;
                     justify-content: center;
                 }
                 @media (max-width: 991px) {
                     .identity-grid {
                         grid-template-columns: 1fr;
                     }
                 }
                 @media (max-width: 576px) {
                     .identity-card {
                         flex-direction: column;
                     }
                     .identity-card-left {
                         width: 100%;
                         height: 140px;
                         padding: 1.5rem;
                     }
                 }
                 .objectives-grid {
                     display: grid;
                     grid-template-columns: repeat(2, 1fr);
                     gap: 2rem;
                 }
                 @media (max-width: 991px) {
                     .objectives-grid {
                         grid-template-columns: 1fr;
                     }
                 }

                 /* Redesigned Administration Cards */
                 .admin-card {
                     background: var(--card);
                     border: 1px solid rgba(37, 99, 235, 0.12);
                     border-radius: 18px;
                     box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.03), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
                     padding: 24px;
                     display: flex;
                     flex-direction: row;
                     align-items: center;
                     gap: 24px;
                     width: 540px;
                     max-width: 100%;
                     height: 220px;
                     box-sizing: border-box;
                     transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
                 }
                 .admin-card:hover {
                     transform: translateY(-4px) scale(1.01);
                     box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -6px rgba(0, 0, 0, 0.04);
                     border-color: rgba(37, 99, 235, 0.25);
                 }
                 .admin-card-photo-wrapper {
                     width: 170px;
                     height: 170px;
                     min-width: 170px;
                     border-radius: 14px;
                     overflow: hidden;
                     border: 1px solid var(--border);
                     background: var(--bg-2);
                 }
                 .admin-card-photo {
                     width: 100%;
                     height: 100%;
                     object-fit: cover;
                     object-position: top center;
                 }
                 .admin-card-details {
                     flex: 1;
                     display: flex;
                     flex-direction: column;
                     justify-content: center;
                 }
                 .admin-card-name {
                     font-size: 20px;
                     font-weight: 700;
                     color: var(--txt-1);
                     margin: 0;
                     line-height: 1.2;
                 }
                 .admin-card-position {
                     font-size: 16px;
                     font-weight: 600;
                     color: var(--primary-color);
                     margin-top: 12px;
                     margin-bottom: 0;
                     line-height: 1.3;
                 }
                 .admin-card-designation {
                     font-size: 14px;
                     font-weight: 500;
                     color: var(--txt-3);
                     margin-top: 10px;
                     margin-bottom: 0;
                     line-height: 1.4;
                 }
                 .admin-card-qualification {
                     font-size: 14px;
                     font-weight: 500;
                     color: var(--txt-3);
                     margin-top: 4px;
                     margin-bottom: 0;
                     line-height: 1.4;
                 }
                 @media (max-width: 639px) {
                     .admin-card {
                         flex-direction: column;
                         height: auto;
                         text-align: center;
                         align-items: center;
                         padding: 24px;
                         gap: 20px;
                     }
                     .admin-card-photo-wrapper {
                         width: 170px;
                         height: 170px;
                         min-width: 170px;
                     }
                     .admin-card-details {
                         align-items: center;
                     }
                     .admin-card-name {
                         font-size: 24px;
                     }
                 }
            `}</style>

            {/* ── Sticky Navbar ── */}
            <nav style={{
                padding: "1rem 0",
                background: "#0f172a", // Dark background for premium look
                position: "sticky",
                top: 0,
                zIndex: 300,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
            }}>
                <div className="container flex-between" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {/* Brand */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <img style={{ width: 44, height: 44, objectFit: "contain" }} src="/periyar-univ-logo.png" alt="University Logo" />
                        <div>
                            <span style={{
                                fontWeight: 800, fontSize: "1.2rem",
                                letterSpacing: "-0.02em",
                                color: "#ffffff",
                                display: "block"
                            }}>NSS Portal</span>
                            <span style={{ fontSize: "0.65rem", display: "block", color: "rgba(255, 255, 255, 0.6)", marginTop: "-2px", letterSpacing: "0.08em" }}>PERIYAR UNIVERSITY</span>
                        </div>
                        <img style={{ width: 44, height: 44, objectFit: "contain" }} src="/nss-logo.png" alt="NSS Logo" />
                    </div>

                    {/* Action Group */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", position: "relative" }}>
                        <ThemeToggle />

                        {/* College Self-Registration */}
                        <button
                            className="btn btn-outline-primary btn-sm"
                            style={{ color: "#3b82f6", borderColor: "#3b82f6" }}
                            onClick={() => navigate("/college-register")}
                        >
                            College Sign-up
                        </button>

                        {/* Login Dropdown */}
                        <button
                            className="btn btn-primary btn-sm"
                            style={{ background: "#2563eb", borderColor: "#2563eb" }}
                            onClick={() => setLoginDropdownOpen(!loginDropdownOpen)}
                        >
                            Portal Login ▼
                        </button>

                        {loginDropdownOpen && (
                            <div style={{
                                position: "absolute",
                                right: 0,
                                top: "100%",
                                marginTop: "0.5rem",
                                background: "var(--card)",
                                border: "1px solid var(--border)",
                                borderRadius: "8px",
                                width: "220px",
                                boxShadow: "var(--sh-lg)",
                                zIndex: 400,
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column"
                            }}>
                                <div style={{ padding: "0.5rem 1rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--txt-3)", background: "var(--bg-2)", textTransform: "uppercase" }}>Select Portal</div>
                                <button className="dropdown-item" onClick={() => { setLoginDropdownOpen(false); navigate("/admin-login"); }}>University Admin</button>
                                <button className="dropdown-item" onClick={() => { setLoginDropdownOpen(false); navigate("/nodal-login"); }}>District Nodal Officer</button>
                                <button className="dropdown-item" onClick={() => { setLoginDropdownOpen(false); navigate("/login"); }}>College Portal</button>
                                <button className="dropdown-item" onClick={() => { setLoginDropdownOpen(false); navigate("/unit-login"); }}>NSS Unit Portal</button>
                            </div>
                        )}

                        {/* Sidebar Menu Toggle Button */}
                        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} title="Open Menu">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Close Dropdown on click outside */}
            {loginDropdownOpen && (
                <div
                    style={{ position: "fixed", inset: 0, zIndex: 250 }}
                    onClick={() => setLoginDropdownOpen(false)}
                />
            )}

            {/* ── Slide-out Sidebar Drawer ── */}
            <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />
            <div className={`sidebar-drawer ${sidebarOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <span className="sidebar-title">NSS Navigation</span>
                    <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} title="Close Menu">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className="sidebar-links">
                    <span className="sidebar-link" onClick={() => { setSidebarOpen(false); scrollToSection("intro"); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        Intro
                    </span>
                    <span className="sidebar-link" onClick={() => { setSidebarOpen(false); scrollToSection("history"); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6 2v20" /></svg>
                        History
                    </span>
                    <span className="sidebar-link" onClick={() => { setSidebarOpen(false); scrollToSection("administration"); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        Administration
                    </span>
                    <span className="sidebar-link" onClick={() => { setSidebarOpen(false); scrollToSection("objectives"); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                        Objectives
                    </span>
                    <span className="sidebar-link" onClick={() => { setSidebarOpen(false); scrollToSection("motto"); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M8 14h8" /></svg>
                        Motto
                    </span>
                    <span className="sidebar-link" onClick={() => { setSidebarOpen(false); scrollToSection("identity"); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2v20" /><path d="M2 12h20" /><path d="m16.24 7.76-8.48 8.48" /><path d="m7.76 7.76 8.48 8.48" /></svg>
                        Identity
                    </span>
                    <span className="sidebar-link" onClick={() => { setSidebarOpen(false); scrollToSection("resources"); }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                        Resources
                    </span>
                    {galleryImages.length > 0 && (
                        <span className="sidebar-link" onClick={() => { setSidebarOpen(false); scrollToSection("gallery"); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                            Gallery
                        </span>
                    )}
                </div>
            </div>

            {/* ── Section 1: Hero Section ── */}
            <section id="intro" style={{ padding: "5rem 0", background: "var(--card)" }} data-aos="fade-up">
                <div className="container">
                    {/* Centered title "NATIONAL SERVICE SCHEME" */}
                    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                        <h1 style={{
                            fontWeight: 800,
                            fontSize: "2.2rem",
                            color: "var(--txt-1)",
                            letterSpacing: "-0.01em",
                            textTransform: "uppercase",
                            margin: 0
                        }}>
                            NATIONAL SERVICE SCHEME
                        </h1>
                    </div>

                    {/* Below: left side image, right side content */}
                    <div className="hero-columns">
                        {/* Left column: Image */}
                        <div style={{
                            borderRadius: "16px",
                            overflow: "hidden",
                            boxShadow: "var(--sh-lg)",
                            border: "1px solid var(--border)",
                            position: "relative",
                            aspectRatio: "16/9"
                        }}>
                            <img
                                src="https://silveroakuni.ac.in/_next/image?url=%2Fassets%2Fimages%2Fbanner-images%2Fm_nss.webp&w=3840&q=80"
                                alt="NSS Illustration"
                                style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }}
                            />
                        </div>

                        {/* Right column: Content */}
                        <div style={{ fontSize: "1.05rem", color: "var(--txt-2)", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "1.25rem", textAlign: "justify" }}>
                            <p style={{ fontWeight: 600, fontSize: "1.2rem", color: "var(--primary-color)", lineHeight: "1.6", margin: 0 }}>
                                The National Service Scheme is a noble public service programme conducted by the Ministry of Youth Affairs and Sports, Government of India.
                            </p>
                            <p style={{ margin: 0 }}>
                                Launched in the centenary year of Mahatma Gandhi (1969), the primary objective of NSS is to develop student personality and character through voluntary community service. It acts as a bridge connecting student youth with the rural and suburban communities.
                            </p>
                            <p style={{ margin: 0 }}>
                                Student volunteers engage in various social reforms, environmental drives, blood donation camps, literacy campaigns, health care awareness, and village development initiatives. Participation in NSS instills a sense of civic responsibility, leadership capabilities, and community integration.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 1.5: History of NSS ── */}
            <section id="history" style={{ padding: "5rem 0", background: "var(--bg)" }} data-aos="fade-up">
                <div className="container">
                    <div className="hero-columns" style={{ marginTop: 0 }}>
                        {/* Left column: History description & download button */}
                        <div>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#2563eb", textTransform: "uppercase" }}>Our Legacy</span>
                            <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "0.5rem", marginBottom: "1.5rem" }}>History of NSS</h2>
                            <div style={{ fontSize: "1.05rem", color: "var(--txt-2)", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "1rem", textAlign: "justify" }}>
                                <p>
                                    The overall aim of National Service Scheme as envisaged earlier, is to give an extension dimension to the higher education system and orient the student youth to community service while they are studying in educational institution.
                                </p>
                                <p>
                                    The reason for the formulation of this objective is the general realization that the college and +2 level students have a tendency to get alienated from the village/slum masses which constitute the majority of the population of the country. The educated youth who are expected to take the reins of administration in future are found to be unaware of the problems of the village/slum community and in certain cases are indifferent towards their needs and problems.
                                </p>
                                <p>
                                    Therefore it is necessary to arouse the social conscience of the students, and to provide them an opportunity to work with the people in the villages and slums. It is felt that their interaction with the common villagers and slum dwellers will expose them to the realities of life and bring about a change in their social perception.
                                </p>
                            </div>
                            <div style={{ marginTop: "2rem" }}>
                                <a
                                    href="/The_Nss_Manual.pdf"
                                    download="The_Nss_Manual.pdf"
                                    className="btn btn-primary"
                                    style={{ padding: "0.75rem 1.5rem", textDecoration: "none" }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 8 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                    Download NSS History Book
                                </a>
                            </div>
                        </div>

                        {/* Right column: Graphic/Illustration representing History */}
                        <div style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>
                            <img
                                src="/history.jpg"
                                alt="Mahatma Gandhi & Community Service History"
                                style={{ width: "100%", height: "auto", display: "block" }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 1.6: Administration Section ── */}
            <section id="administration" style={{ padding: "5rem 0", background: "var(--bg)" }} data-aos="fade-up">
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--txt-1)", margin: "0 0 0.75rem 0" }}>Administration</h2>
                        <div style={{ width: "40px", height: "4px", background: "#2563eb", borderRadius: "2px", margin: "0 auto 1.5rem" }}></div>
                        <p style={{ color: "var(--txt-2)", fontSize: "1.05rem", maxWidth: "600px", margin: "0 auto" }}>Meet the dedicated team managing and coordinating NSS activities</p>
                    </div>

                    {adminHeads.length === 0 ? (
                        <div style={{ textAlign: "center", color: "var(--txt-3)", padding: "2rem" }}>
                            No administration heads configured.
                        </div>
                    ) : (() => {
                        const headsByRow = {};
                        adminHeads.forEach(head => {
                            const r = head.rowOrder || 1;
                            if (!headsByRow[r]) {
                                headsByRow[r] = [];
                            }
                            headsByRow[r].push(head);
                        });
                        const sortedRows = Object.keys(headsByRow).sort((a, b) => Number(a) - Number(b));

                        return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", width: "100%", alignItems: "center" }}>
                                {sortedRows.map(rowNum => (
                                    <div key={rowNum} style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "2.5rem",
                                        justifyContent: "center",
                                        width: "100%"
                                    }}>
                                        {headsByRow[rowNum].map((head) => (
                                            <div key={head._id} className="admin-card">
                                                {/* Left Section (Photo) */}
                                                <div className="admin-card-photo-wrapper">
                                                    <img
                                                        src={head.photo.startsWith('data:') || head.photo.startsWith('http') || head.photo.startsWith('/') ? head.photo : (head.photo.startsWith('uploads') ? `${import.meta.env.VITE_API_URL || ''}/${head.photo}` : "/sample-profile.png")}
                                                        alt={head.name}
                                                        className="admin-card-photo"
                                                    />
                                                </div>

                                                {/* Right Section (Details) */}
                                                <div className="admin-card-details">
                                                    <h3 className="admin-card-name">{head.name}</h3>
                                                    <div className="admin-card-position">{head.position}</div>
                                                    {head.designation && <div className="admin-card-designation">{head.designation}</div>}
                                                    {head.qualification && <div className="admin-card-qualification">{head.qualification}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </section>

            {/* ── Section 2: Objectives ── */}
            <section id="objectives" style={{ padding: "5rem 0", background: "var(--bg)" }} data-aos="fade-up">
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#2563eb", textTransform: "uppercase" }}>Core Mandates</span>
                        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "0.5rem" }}>NSS Objectives</h2>
                        <p style={{ color: "var(--txt-2)", maxWidth: "550px", margin: "0.5rem auto 0" }}>The broad objectives of National Service Scheme are to develop student volunteers through community involvement.</p>
                    </div>

                    <div className="objectives-grid">
                        {[
                            { title: "Understand Community", desc: "Understand the community in which they work" },
                            { title: "Relation to Community", desc: "Understand themselves in relation to their community" },
                            { title: "Problem Solving", desc: "Identify the needs and problems of the community and involve them in problem solving process" },
                            { title: "Civic Responsibility", desc: "Develop among themselves a sense of social and civic responsibility" },
                            { title: "Practical Solutions", desc: "Utilize their knowledge in finding practical solution to individual and community problems" },
                            { title: "Group Living Competence", desc: "Develop competence required for group living and sharing of responsibilities" },
                            { title: "Mobilize Participation", desc: "Gain skills in mobilizing community participation" },
                            { title: "Leadership Qualities", desc: "Acquire leadership qualities and democratic attitude" },
                            { title: "Emergency Readiness", desc: "Develop capacity to meet emergencies and natural disasters" },
                            { title: "Social Harmony", desc: "Practice national integration and social harmony" }
                        ].map((obj, i) => (
                            <div key={i} style={{ background: "var(--card)", padding: "2rem", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "var(--sh-sm)", transition: "all 0.3s ease", display: "flex", flexDirection: "column", height: "100%" }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                                    <div style={{ width: 36, height: 36, minWidth: 36, background: "rgba(37,99,235,0.1)", color: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1rem" }}>{i + 1}</div>
                                    <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>{obj.title}</h3>
                                </div>
                                <p style={{ color: "var(--txt-2)", fontSize: "0.95rem", lineHeight: "1.6", margin: 0, textAlign: "justify" }}>{obj.desc}.</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 3: Motto Banner ── */}
            <section id="motto" className="motto-banner" data-aos="zoom-in">
                <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", padding: "0 1.5rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#93c5fd" }}>National Motto of NSS</span>
                    <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, margin: "1rem 0", letterSpacing: "-0.03em" }}>"NOT ME, BUT YOU"</h2>
                    <p style={{ fontSize: "1.15rem", color: "#dbeafe", fontWeight: 500, lineHeight: 1.8, maxWidth: "750px", margin: "0 auto" }}>
                        The motto or watchword of the National Service Scheme is : 'NOT ME BUT YOU'. This reflects the essence of democratic living and upholds the need for selfless service and appreciation of the other person's point of view and also to show consideration for fellow human beings. It underlines that the welfare of an individual is ultimately dependent on the welfare of society on the whole. Therefore, it should be the aim of the NSS to demonstrate this motto in its day-to-day programme.
                    </p>
                </div>
            </section>

            {/* ── Section 3.5: NSS Core Identity ── */}
            <section id="identity" style={{ padding: "5rem 0", background: "var(--bg)" }} data-aos="fade-up">
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#2563eb", textTransform: "uppercase" }}>Core Elements</span>
                        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "0.5rem" }}>NSS Insignia & Identity</h2>
                        <p style={{ color: "var(--txt-2)", maxWidth: "550px", margin: "0.5rem auto 0" }}>The values and symbols that define the identity of every NSS volunteer.</p>
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1.25rem" }}>
                            <div style={{ width: "40px", height: "2px", background: "var(--border)" }}></div>
                            <div style={{ width: "20px", height: "4px", background: "#2563eb", borderRadius: "2px" }}></div>
                            <div style={{ width: "40px", height: "2px", background: "var(--border)" }}></div>
                        </div>
                    </div>

                    <div className="identity-grid">
                        {/* NSS Symbol Card */}
                        <div className="identity-card" style={{ borderLeft: "4px solid #2563eb" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563eb"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
                            <div className="identity-card-left" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0.02) 100%)" }}>
                                <img src="/nss-logo.png" alt="NSS Symbol Logo" style={{ width: "96px", height: "96px", objectFit: "contain" }} />
                            </div>
                            <div className="identity-card-right">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 2v20" /><path d="M2 12h20" /><path d="m16.24 7.76-8.48 8.48" /><path d="m7.76 7.76 8.48 8.48" /></svg>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--txt-1)" }}>NSS Symbol</h3>
                                </div>
                                <p style={{ fontSize: "0.925rem", color: "var(--txt-2)", lineHeight: "1.65", margin: 0, textAlign: "justify" }}>
                                    The symbol of the National Service Scheme is based on the 'Rath' wheel of the Konark Sun Temple situated in Orissa. These giant wheels of the Sun Temple portray the cycle of creation, preservation and release, and signify the movement in life across time and space. The design of the symbol, a simplified form of the Sun-chariot wheel primarily depicts movement. The wheel signifies the progressive cycle of life. It stands for continuity as well as change and implies the continuous striving of NSS for social transformation and upliftment.
                                </p>
                            </div>
                        </div>

                        {/* NSS Badge Card */}
                        <div className="identity-card" style={{ borderLeft: "4px solid #eab308" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#eab308"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
                            <div className="identity-card-left" style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(234,179,8,0.02) 100%)" }}>
                                <img src="/nss-logo.png" alt="NSS Badge Logo" style={{ width: "96px", height: "96px", objectFit: "contain" }} />
                            </div>
                            <div className="identity-card-right">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 2v20" /><path d="M2 12h20" /><path d="m16.24 7.76-8.48 8.48" /><path d="m7.76 7.76 8.48 8.48" /></svg>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--txt-1)" }}>NSS Badge</h3>
                                </div>
                                <p style={{ fontSize: "0.925rem", color: "var(--txt-2)", lineHeight: "1.65", margin: 0, textAlign: "justify" }}>
                                    The NSS symbol is embossed on the NSS badge. The NSS volunteers wear it while undertaking any programme of community service. The Konark wheel in the symbol has eight bars which represent the 24 hours of the day. Hence, the badge reminds the wearer to be in readiness for service of the nation round the clock i.e. for 24 hours. The red colour in the badge indicates that the NSS volunteers are full of blood i.e. lively, active, energetic and full of high spirit. The navy blue colour indicates the cosmos of which the NSS is a tiny part, ready to contribute its share for the welfare of the mankind.
                                </p>
                            </div>
                        </div>

                        {/* NSS Day Card */}
                        <div className="identity-card" style={{ borderLeft: "4px solid #10b981" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#10b981"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
                            <div className="identity-card-left" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)" }}>
                                <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <rect x="3" y="4" width="18" height="18" rx="4" ry="4" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>
                            <div className="identity-card-right">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--txt-1)" }}>NSS Day</h3>
                                </div>
                                <p style={{ fontSize: "0.925rem", color: "var(--txt-2)", lineHeight: "1.65", margin: 0, textAlign: "justify" }}>
                                    NSS was formally launched on <b>24th September, 1969</b>, the birth centenary year of the Father of the Nation. Therefore, 24 September is celebrated every year as NSS Day with appropriate programmes and activities.
                                </p>
                            </div>
                        </div>

                        {/* NSS Song Card */}
                        <div className="identity-card" style={{ borderLeft: "4px solid #8b5cf6" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#8b5cf6"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; }}>
                            <div className="identity-card-left" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 100%)" }}>
                                <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6" }}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <path d="M9 18V5l12-2v13" />
                                        <circle cx="6" cy="18" r="3" />
                                        <circle cx="18" cy="16" r="3" />
                                    </svg>
                                </div>
                            </div>
                            <div className="identity-card-right">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--txt-1)" }}>NSS Song</h3>
                                </div>
                                <p style={{ fontSize: "0.925rem", color: "var(--txt-2)", lineHeight: "1.65", margin: 0, textAlign: "justify" }}>
                                    During Silver Jubilee Year the NSS theme song has been composed. All NSS volunteers are requested to learn the theme song and sing the song during NSS programmes and celebrations.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer Note Banner */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.1)", borderRadius: "12px", padding: "1rem 2rem", marginTop: "4rem", maxWidth: "720px", marginLeft: "auto", marginRight: "auto" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span style={{ fontSize: "0.95rem", color: "var(--txt-1)", fontWeight: 500, textAlign: "center" }}>
                            These core elements inspire unity, service, and a strong sense of responsibility among NSS volunteers.
                        </span>
                    </div>
                </div>
            </section>



            {/* ── Section 7: Forms & Resources ── */}
            <section id="resources" style={{ padding: "5rem 0", background: "var(--bg)" }} data-aos="fade-up">
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#2563eb", textTransform: "uppercase" }}>Files & Formats</span>
                        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "0.5rem" }}>NSS Forms & Resource Hub</h2>
                        <p style={{ color: "var(--txt-2)", maxWidth: "550px", margin: "0.5rem auto 0" }}>Download official Word document templates for reporting and accounts.</p>
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                        gap: "1.5rem"
                    }}>
                        {[
                            { name: "Form 1 - Special Camp Proposal", file: "form1-special-camp.docx" },
                            { name: "Form 2 - Submission of Camp Report & Account", file: "form2-camp-report.docx" },
                            { name: "Form 3 - Statement of Accounts & UC", file: "form3-statement-of-accounts.docx" },
                            { name: "Form 4 - Accounts for Regular NSS Activities", file: "form4-accounts-and-regular-nss-activities.docx" },
                            { name: "Form 5 - Nomination of New Programme Officer", file: "form5-nomination-of-new-programme-officer.docx" },
                            { name: "Form 6 - NSS Volunteer Enrolment (Annexure - A)", file: "form6-nss-volunteer-enrolement-annexure-a.docx" },
                            { name: "Form 7 - Enrolment Particulars (Annexure - B)", file: "form7-enrolement-particulars-to-the-programme-co-ordinator-annexure-b.docx" },
                            { name: "Form 8 - Enrolment Particulars (Annexure - C)", file: "form8-enrolement-particulars-to-the-programme-coordinator-annexure-c.docx" },
                            { name: "Form 9 - NSS Volunteers Work Diary", file: "form9-nss-volunteers-work-diary.docx" }
                        ].map((form, idx) => (
                            <div key={idx} style={{
                                background: "var(--card)",
                                border: "1px solid var(--border)",
                                borderRadius: "10px",
                                padding: "1.25rem 1.5rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                boxShadow: "var(--sh-xs)"
                            }}>
                                <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--txt-1)", marginRight: "1rem" }}>{form.name}</div>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => window.open(`/forms/${form.file}`, "_blank")}
                                    style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                    Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 8: Event Gallery ── */}
            {galleryImages.length > 0 && (
                <section id="gallery" style={{ padding: "5rem 0", background: "var(--card)" }} data-aos="fade-up">
                    <div className="container">
                        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#2563eb", textTransform: "uppercase" }}>Moment Captures</span>
                            <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "0.5rem" }}>Event Gallery</h2>
                            <p style={{ color: "var(--txt-2)", maxWidth: "500px", margin: "0.5rem auto 0" }}>Memorable highlights from regular activities and camping programmes.</p>
                        </div>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "2rem"
                        }}>
                            {galleryImages.map((img, idx) => (
                                <div
                                    key={img._id}
                                    style={{
                                        background: "var(--card)",
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        boxShadow: "var(--sh-sm)",
                                        transition: "all 0.3s ease",
                                        cursor: "pointer",
                                        border: "1px solid var(--border)",
                                        display: "flex",
                                        flexDirection: "column"
                                    }}
                                    onClick={() => setSelectedImage(img)}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = "translateY(-4px)";
                                        e.currentTarget.style.boxShadow = "var(--sh-md)";
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "var(--sh-sm)";
                                    }}
                                >
                                    <div style={{ width: "100%", height: "200px", overflow: "hidden", background: "#f1f5f9" }}>
                                        <img
                                            src={img.image}
                                            alt={img.description}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    </div>
                                    <div style={{ padding: "1rem", flexGrow: 1 }}>
                                        <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: "500", color: "var(--txt-1)", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                            {img.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Lightbox Modal ── */}
            {selectedImage && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.92)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        backdropFilter: "blur(6px)",
                        padding: "2rem"
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        style={{
                            position: "absolute",
                            top: "1.5rem",
                            right: "1.5rem",
                            // background: "rgba(255, 255, 255, 0.1)",
                            background: "transparent",
                            border: "none",
                            color: "#fff",
                            fontSize: "2rem",
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                        onClick={() => setSelectedImage(null)}
                    >
                        &times;
                    </button>

                    <div
                        style={{ maxWidth: "90%", maxHeight: "70vh", overflow: "hidden", borderRadius: "12px", marginBottom: "1.5rem" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage.image}
                            alt={selectedImage.description}
                            style={{ maxWidth: "100%", maxHeight: "70vh", display: "block", objectFit: "contain" }}
                        />
                    </div>

                    <div
                        style={{ color: "#fff", maxWidth: "600px", textAlign: "center", padding: "1rem 2rem", background: "rgba(255, 255, 255, 0.05)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <p style={{ margin: 0, fontSize: "1rem", lineHeight: "1.6", color: "#fff" }}>{selectedImage.description}</p>
                    </div>
                </div>
            )}

            {/* ── Footer ── */}
            <footer style={{
                marginTop: "auto",
                padding: "2.5rem 0",
                background: "#0f172a",
                color: "rgba(255, 255, 255, 0.6)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                fontSize: "0.85rem"
            }}>
                <div className="container" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <img style={{ width: 36, height: 36 }} src="/periyar-univ-logo.png" alt="University Logo" />
                        <span style={{ fontWeight: 800, color: "#fff", fontSize: "1.05rem" }}>National Service Scheme</span>
                    </div>
                    <div>
                        <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: "0 0 0.25rem", fontWeight: 500 }}>Designed & Developed by Department of Computer Science, Periyar University</p>
                        <p style={{ color: "rgba(255, 255, 255, 0.4)", margin: 0 }}>© {new Date().getFullYear()} Periyar University, Salem, Tamil Nadu. All Rights Reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
