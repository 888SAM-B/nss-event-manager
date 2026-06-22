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
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        AOS.init({
            duration: 1000,
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
        fetchGallery();
    }, []);

    const features = [
        {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
            title: "Event Tracking",
            desc: "Create, monitor, and report events with photos, attendance records, and real-time analytics.",
            color: "brand",
        },
        {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
            title: "Volunteer Management",
            desc: "Maintain comprehensive profiles for all NSS volunteers across units with enrollment forms.",
            color: "teal",
        },
        {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
            title: "Instant Reports",
            desc: "Generate detailed PDF reports for events and export unit performance data in Excel.",
            color: "warning",
        },
        {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>,
            title: "Unit Management",
            desc: "Structured management of NSS units under each institution with program officer assignment.",
            color: "success",
        },
        {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
            title: "Village Adoption",
            desc: "Track and manage village adoption initiatives for community development activities.",
            color: "accent",
        },
        {
            icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
            title: "Secure Access",
            desc: "Role-based authentication for Admin, College, and Unit-level access with JWT security.",
            color: "info",
        },
    ];

    const colorMap = {
        brand: { bg: 'rgba(29, 78, 216, 0.1)', clr: '#1d4ed8' },
        teal: { bg: 'rgba(22, 163, 74, 0.1)', clr: '#16a34a' },
        warning: { bg: 'rgba(205, 111, 39, 0.1)', clr: '#cd6f27ff' },
        success: { bg: 'rgba(21, 128, 61, 0.1)', clr: '#15803d' },
        accent: { bg: 'rgba(109, 40, 217, 0.1)', clr: '#6d28d9' },
        info: { bg: 'rgba(3, 105, 161, 0.1)', clr: '#0369a1' },
    };

    return (
        <div className="home-container" style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

            {/* ── Navbar ── */}
            <div className="nav-and-hero">
                <nav style={{
                    padding: "1rem 0",
                    borderBottom: "1px solid var(--border)",
                    background: "#195cc8ff",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    position: "sticky",
                    top: 0,
                    zIndex: 200,
                }}>
                    <div className="container flex-between">
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{
                                width: 36, height: 6,
                                display: "flex", alignItems: "center", justifyContent: "flex-end",
                                flexShrink: 0,
                            }}><img style={{ width: 56, height: 56 }} src="/periyar-univ-logo.png" alt="NSS Logo" /></div>
                            <div>
                                <span style={{
                                    fontWeight: 800, fontSize: "1.1rem",
                                    letterSpacing: "-0.03em",
                                    color: "#ffffff",
                                }}>NSS Portal</span>
                                <span style={{ fontSize: "0.65rem", display: "block", color: "#ffffff", marginTop: "-2px", letterSpacing: "0.08em" }}>PERIYAR UNIVERSITY</span>
                            </div>
                        </div>
                        <div className="d-flex align-items-center" style={{ gap: "0.75rem" }}>
                            <ThemeToggle />
                            <button
                                className="btn  btn-sm"
                                onClick={() => navigate("/admin-login")}
                            >
                                Admin Login
                                <span style={{ opacity: 0.7 }}>→</span>
                            </button>
                        </div>
                    </div>
                </nav>

                {/* ── Hero ── */}
                <div className="hero"
                    style={{
                        backgroundImage: theme === "light" ? "linear-gradient(#FFF, #bdbabaff)" : "none",

                    }}
                >
                    <div className="bg-container">
                        <div className="bg-logo">
                            <img src="./nss-logo.png" alt="" />
                        </div>
                    </div>
                    <header style={{ padding: "90px 0 70px", textAlign: "center", position: "relative", overflow: "hidden" }}>
                        {/* Ambient orbs */}
                        <div className="container" style={{ maxWidth: 780, position: "relative", zIndex: 1 }} data-aos="fade-up">
                            <h1 style={{
                                fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
                                marginTop: "30px",
                                marginBottom: "1.5rem",
                                lineHeight: 1.2,
                                letterSpacing: "-0.04em",
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,

                            }}>
                                <span style={{
                                    color: theme === "light" ? "#154ba2ff" : "#458cffff",
                                    marginBottom: "-90px",
                                }}>Periyar University</span>

                                <span style={{
                                    color: "var(--txt-1)",
                                    marginTop: "100px",
                                }}>
                                    NSS Portal
                                </span>
                            </h1>

                            <p style={{ fontSize: "1.15rem", color: "var(--txt-2)", marginBottom: "0.75rem", lineHeight: 1.7 }} data-aos="fade-up" data-aos-delay="200">
                                Official platform for Periyar University, Salem — streamlining NSS
                                unit operations, event tracking, and community service reporting.
                            </p>

                            <div className="flex-center" style={{ gap: "1rem", flexWrap: "wrap", marginTop: "2.5rem" }} data-aos="fade-up" data-aos-delay="400">
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={() => navigate("/unit-login")}
                                    style={{ minWidth: 185, gap: "0.5rem" }}
                                >
                                    <span>Unit Login </span>
                                    <span style={{ opacity: 0.7 }}>→</span>
                                </button>
                                <button
                                    className="btn btn-tretiary btn-lg"
                                    onClick={() => navigate("/login")}
                                    style={{ minWidth: 185 }}
                                >
                                    <span>College Login </span>
                                    <span style={{ opacity: 0.7 }}>→</span>
                                </button>
                            </div>

                            {/* Decorative divider */}
                            <div style={{
                                marginTop: "4rem",
                                height: 1,

                            }} />
                        </div>
                    </header>
                </div>
            </div>
            {/* ── Stats Strip ── */}
            <div className="below-hero" style={{ zIndex: 100, paddingTop: '50px', background: theme === 'light' ? '#fff' : 'inherit' }} >

                <div className="about-nss" id="about-nss">
                    <h1 style={{ textAlign: "center", fontWeight: 800, fontSize: "2rem", marginBottom: "2rem" }} data-aos="fade-up">NSS - National Service Scheme  </h1>

                    <div className="container content-container">
                        <div className="content-img" data-aos="fade-right">
                            <img src="https://silveroakuni.ac.in/_next/image?url=%2Fassets%2Fimages%2Fbanner-images%2Fm_nss.webp&w=3840&q=80" alt="" />
                        </div>
                        <div className="content-content" data-aos="fade-left">
                            <p>
                                The National Service Scheme (NSS) is a Government of India initiative launched in 1969 to develop students’ personality through community service. It aims to create socially responsible and active citizens. The motto of NSS, <span style={{
                                    fontWeight: 800,
                                    color: '#f03a40ff'
                                }}>“Not Me, But You”</span>, highlights the importance of selfless service and caring for others.
                                <br />
                                Through NSS, students participate in activities like social service, environmental awareness, health and hygiene programs, rural development, and blood donation camps. These activities help students understand real-life social issues and contribute to society. NSS also encourages teamwork, leadership, and discipline among students. It provides opportunities to work with communities and make a positive impact. By engaging in NSS, students develop empathy and a sense of responsibility. Overall, NSS plays an important role in shaping students into responsible citizens and future leaders.
                            </p>
                        </div>
                    </div>
                    <div className="container cards-container">
                        <div className="cards1" data-aos="fade-up" data-aos-delay="100">
                            <h2
                                style={{ color: theme === 'light' ? '#195CC8' : '#195CC8' }}
                            >Objectives</h2>
                            <ul className="cards1-list">
                                <li>To develop students’ personality through community service</li>
                                <li>To make students socially aware and responsible</li>
                                <li>To engage students in activities that benefit society</li>
                                <li>To help students understand community needs and real-life problems</li>
                                <li>To promote values like unity, discipline, and selfless service</li>
                            </ul>
                        </div>

                        <div className="cards1" data-aos="fade-up" data-aos-delay="200">
                            <h2 style={{ color: theme === 'light' ? '#195CC8' : '#195CC8' }} >Activities</h2>
                            <ul className="cards1-list">
                                <li>Organizing awareness programs on health, sanitation, and environment</li>
                                <li>Conducting blood donation camps</li>
                                <li>Participating in rural development projects</li>
                                <li>Helping people during natural disasters</li>
                                <li>Conducting special camps in villages for community service</li>
                            </ul>
                        </div>

                        <div className="cards1" data-aos="fade-up" data-aos-delay="300">
                            <h2
                                style={{ color: theme === 'light' ? '#195CC8' : '#195CC8' }}
                            >Benefits</h2>
                            <ul className="cards1-list">
                                <li>Improves leadership skills</li>
                                <li>Enhances communication and teamwork</li>
                                <li>Provides real-world experience through community interaction</li>
                                <li>Builds social responsibility and empathy</li>
                                <li>Adds value to academic profile and career opportunitie</li>
                            </ul>
                        </div>
                    </div>

                </div>

                <div className="about-nss" id="about-nss">
                    <h1 style={{
                        textAlign: "center", fontWeight: 800, fontSize: "2rem", marginBottom: "2rem",
                        marginTop: "2rem"
                    }} data-aos="fade-up">Periyar University</h1>

                    <div className="container content-container">

                        <div className="content-content" data-aos="fade-right">
                            <p>
                                The Government of Tamil Nadu established Periyar University in Salem on , <span style={{
                                    fontWeight: 800,
                                    color: '#f03a40ff'
                                }}>17th September 1997</span> as per the provisions of the Periyar University Act, 1997. The University covers the area comprising four districts namely Salem, Namakkal, Dharmapuri, and Krishnagiri. The University obtained 12(B) and 2(f) status from the University Grants Commission, New Delhi and it was reaccredited by the , <span style={{
                                    fontWeight: 800,
                                    color: '#f03a40ff'
                                }}>NAAC with “A++”</span> Grade in 2021. The University secured <span style={{
                                    fontWeight: 800, color: '#f03a40ff'
                                }}>56th rank</span> among Indian Universities by MoE NIRF 2024.
                                <br />
                                The University is named after the Great Social Reformer, <span style={{
                                    fontWeight: 800,
                                    color: '#f03a40ff'
                                }}> E.V. Ramasamy</span>, affectionately called as “Thanthai Periyar”. The University aims at developing knowledge in various fields to realize the maxim inscribed in the logo , <span style={{
                                    fontWeight: 800,
                                    color: '#f03a40ff'
                                }}>“Arival Vilayum Ulagu” (Wisdom Maketh the World).</span> “Holistic development of the students” is the primary objective of the University.
                                <br />
                                Periyar University imparts higher education through three modes: Departments of Study and Research, the affiliated Colleges, and Centre for Distance and Online Education - (CDOE). The University has , <span style={{
                                    fontWeight: 800,
                                    color: '#f03a40ff'
                                }}>27 departments</span> and , <span style={{
                                    fontWeight: 800,
                                    color: '#f03a40ff'
                                }}>118 affiliated colleges.</span>
                            </p>
                        </div>
                        <div className="content-img" data-aos="fade-left">
                            <img src="/univ-campus.jpg" alt="" />
                        </div>
                    </div>

                    <div className="container cards-container">
                        <div className="cards1 full" data-aos="fade-up">
                            <h2
                                style={{ color: theme === 'light' ? '#195CC8' : '#195CC8' }}
                            >Mission & Vission</h2>
                            <ul className="cards1-list ">
                                <li>Periyar University aims towards excellence in teaching, research, outreach, imparting new-age skills and preserving cultural identity for future generation.</li>
                                <li>To offer need based, society driven, industrially relevant academic programmes with a view to make future ready citizens</li>
                                <li>To provide a vibrant learning environment, fostering innovation and creativity inspired by cutting edge research</li>
                                <li>To aspire as a national leader in developing educated contributors, career ready learners and global citizens</li>
                                <li>To make a significant, consistent and sustainable contribution towards social, cultural and economic life</li>
                                <li>To adopt Hassle free, distributed, committed and transparent governance</li>
                            </ul>
                        </div>

                        <div className="cards1 sm" data-aos="fade-up" data-aos-delay="100">
                            <h2 style={{ color: theme === 'light' ? '#195CC8' : '#195CC8' }} >Values</h2>
                            <ul className="cards1-list">
                                <li>Motivation of students to be responsible citizens making them aware of their societal role</li>
                                <li>Inculcate scientific temper, honesty, integrity, transparency, empathy and ethical values amidst students</li>
                                <li>Impart a desire for lifelong learning to foster patriotic sensibility, accountability and holistic well being</li>
                                <li>Creating conducive and acceptable environment for innovation and critical thinking</li>
                                <li>Imbibe value based education leading to inclusive growth</li>
                            </ul>
                        </div>

                        <div className="cards1 sm" data-aos="fade-up" data-aos-delay="200">
                            <h2
                                style={{ color: theme === 'light' ? '#195CC8' : '#195CC8' }}
                            >Benefits</h2>
                            <ul className="cards1-list">
                                <li>Become a global leader in teaching, research, invention and innovation</li>
                                <li>Make significant contribution to advancement of knowledge through quality teaching and innovative research</li>
                                <li>Produce graduates possessing creativity and reflective thoughts, strong analytical skills and a passion for learning</li>
                                <li>Be a part in social and economic upliftment of society to infuse sense of social and national responsibility among students.</li>
                            </ul>
                        </div>
                    </div>


                </div>


                {/* ── Event Gallery Section ── */}
                {galleryImages.length > 0 && (
                    <div className="gallery-section" style={{ padding: "80px 0 40px", background: "var(--bg)" }}>
                        <div className="container">
                            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--brand-400)", textTransform: "uppercase" }}>Gallery</span>
                                <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", marginTop: "0.75rem", marginBottom: "1rem", fontWeight: 800 }}>
                                    Event Gallery
                                </h2>
                                <p style={{ color: "var(--txt-2)", maxWidth: 600, margin: "0 auto", fontSize: "1.1rem" }}>
                                    Highlights and memorable moments from our NSS camps and community activities.
                                </p>
                            </div>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: "2rem",
                                padding: "0 10px"
                            }}>
                                {galleryImages.map((img, idx) => (
                                    <div 
                                        key={img._id} 
                                        data-aos="fade-up"
                                        data-aos-delay={idx * 50}
                                        style={{
                                            background: "var(--card)",
                                            borderRadius: "16px",
                                            overflow: "hidden",
                                            boxShadow: "var(--sh)",
                                            transition: "all 0.3s ease",
                                            cursor: "pointer",
                                            border: "1px solid var(--border)",
                                            display: "flex",
                                            flexDirection: "column"
                                        }}
                                        onClick={() => setSelectedImage(img)}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = "translateY(-6px)";
                                            e.currentTarget.style.boxShadow = "var(--sh-md)";
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "var(--sh)";
                                        }}
                                    >
                                        <div style={{
                                            width: "100%",
                                            height: "220px",
                                            overflow: "hidden",
                                            position: "relative",
                                            background: "#f1f5f9"
                                        }}>
                                            <img 
                                                src={img.image} 
                                                alt={img.description} 
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    transition: "transform 0.5s ease"
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
                                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                                            />
                                        </div>
                                        <div style={{ padding: "1.25rem", flexGrow: 1, display: "flex", alignItems: "center" }}>
                                            <p style={{ 
                                                margin: 0, 
                                                fontSize: "0.95rem", 
                                                fontWeight: "500", 
                                                color: "var(--txt-1)",
                                                lineHeight: "1.5",
                                                display: "-webkit-box",
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden"
                                            }}>
                                                {img.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Lightbox Modal ── */}
                {selectedImage && (
                    <div 
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(15, 23, 42, 0.9)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 1000,
                            backdropFilter: "blur(8px)",
                            padding: "2rem",
                            animation: "modalFadeIn 0.25s ease"
                        }}
                        onClick={() => setSelectedImage(null)}
                    >
                        <button 
                            style={{
                                position: "absolute",
                                top: "1.5rem",
                                right: "1.5rem",
                                background: "rgba(255, 255, 255, 0.1)",
                                border: "none",
                                color: "#fff",
                                fontSize: "2rem",
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s"
                            }}
                            onClick={() => setSelectedImage(null)}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
                        >
                            &times;
                        </button>
                        
                        <div 
                            style={{
                                maxWidth: "90%",
                                maxHeight: "75vh",
                                overflow: "hidden",
                                borderRadius: "12px",
                                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                                marginBottom: "1.5rem"
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <img 
                                src={selectedImage.image} 
                                alt={selectedImage.description} 
                                style={{
                                    maxWidth: "100%",
                                    maxHeight: "75vh",
                                    display: "block",
                                    objectFit: "contain"
                                }}
                            />
                        </div>
                        
                        <div 
                            style={{
                                color: "#fff",
                                maxWidth: "700px",
                                textAlign: "center",
                                padding: "1rem 2rem",
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "12px",
                                border: "1px solid rgba(255, 255, 255, 0.1)"
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <p style={{ margin: 0, fontSize: "1.1rem", lineHeight: "1.6" }}>
                                {selectedImage.description}
                            </p>
                        </div>
                    </div>
                )}


                {/*=== Form download ===*/}

                <div className="form-section">
                    <div className="container">
                        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--brand-400)", textTransform: "uppercase" }}>Resources</span>
                            <h2 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", marginTop: "0.75rem", marginBottom: "1rem", fontWeight: 800 }}>
                                National Service Scheme Forms
                            </h2>
                            <p style={{ color: "var(--txt-2)", maxWidth: 600, margin: "0 auto", fontSize: "1.1rem" }}>
                                Download official NSS forms and documents for special camps, regular activities, and volunteer enrollment.
                            </p>
                        </div>

                        <div className="form-conteiner">
                            {[
                                { name: "Form 1 - Special Camp", file: "form1-special-camp.docx" },
                                { name: "Form 2 - Submission of Camp Report and Account", file: "form2-camp-report.docx" },
                                { name: "Form 3 - Statement of Accounts and UC for NSS Special Camp", file: "form3-statement-of-accounts.docx" },
                                { name: "Form 4 - Accounts and Regular NSS Activities", file: "form4-accounts-and-regular-nss-activities.docx" },
                                { name: "Form 5 - Nomination of New Programme Officer", file: "form5-nomination-of-new-programme-officer.docx" },
                                { name: "Form 6 - NSS Volunteer Enrolment - Annexure - A", file: "form6-nss-volunteer-enrolement-annexure-a.docx" },
                                { name: "Form 7 - Enrolment Particulars to the Programme Co-ordinator - Annexure - B", file: "form7-enrolement-particulars-to-the-programme-co-ordinator-annexure-b.docx" },
                                { name: "Form 8 - Enrolment Particulars to the Programme Co-ordinator - Annexure - C", file: "form8-enrolement-particulars-to-the-programme-coordinator-annexure-c.docx" },
                                { name: "Form 9 - NSS Volunteers Work Diary", file: "form9-nss-volunteers-work-diary.docx" }
                            ].map((form, idx) => (
                                <div className="forms" key={idx} data-aos="fade-up" data-aos-delay={idx * 50}>
                                    <div className="form-name">{form.name}</div>
                                    <button
                                        onClick={() => window.open(`/forms/${form.file}`, "_blank")}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                                    >
                                        <span>Download Form</span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>


                {/* ── Features ── */}
                <section style={{ padding: "0 0 90px" }}>
                    <div className="container">
                        <div style={{ textAlign: "center", marginBottom: "3rem", marginTop: "2rem" }}>
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--brand-400)", textTransform: "uppercase" }}>Platform Features</span>
                            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", marginTop: "0.75rem", marginBottom: "0.75rem", letterSpacing: "-0.03em" }}>
                                Everything you need, in one place
                            </h2>
                            <p style={{ color: "var(--txt-2)", maxWidth: 480, margin: "0 auto" }}>
                                A complete ecosystem for managing NSS activities across all colleges under Periyar University.
                            </p>
                        </div>

                        <div className="grid-cols-3" style={{ gap: "1.25rem" }}>
                            {features.map((f, i) => {
                                const c = colorMap[f.color];
                                return (
                                    <div key={f.title}
                                        data-aos="fade-up"
                                        data-aos-delay={i * 100}
                                        style={{
                                            background: 'var(--card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '1rem',
                                            padding: '1.75rem',
                                            transition: 'all 0.2s ease',
                                            cursor: 'default',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = 'var(--sh-md)';
                                            e.currentTarget.style.borderColor = c.clr + '55';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                        }}
                                    >
                                        <div style={{
                                            width: 48, height: 48,
                                            background: c.bg,
                                            borderRadius: '12px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.35rem',
                                            marginBottom: '1.25rem',
                                        }}>{f.icon}</div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--txt-1)' }}>{f.title}</h4>
                                        <p style={{ color: 'var(--txt-2)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── Footer ── */}
                <footer style={{
                    marginTop: "auto",
                    padding: "2rem 0",
                    borderTop: "1px solid var(--border)",
                    background: "var(--bg-2)",
                }}>
                    <div className="container flex-between" style={{ flexWrap: "wrap", gap: "1rem" }}>
                        <div className="foot" style={{
                            width: '100%',
                            display: "flex", alignItems: "center",
                            justifyContent: "space-around"
                        }}>


                            <span style={{ fontWeight: 700, color: "var(--txt-2)", fontSize: "0.75rem" }}>Designed & Developed by Department of Computer Science,  Periyar University</span>
                            <span style={{ margin: 0, color: "var(--txt-3)", fontSize: "0.8rem" }}>  © {new Date().getFullYear()} National Service Scheme, Periyar University, Salem, Tamil Nadu</span>
                        </div>
                        <p >

                        </p>
                    </div>
                </footer>
            </div>
        </div >
    );
};

export default Home;