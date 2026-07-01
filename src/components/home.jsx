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
    const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

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
        fetchGallery();
    }, []);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Announcements Mock Data
    const announcements = [
        {
            date: "June 28, 2026",
            tag: "Important",
            title: "NSS Portal V2 Launch & Self-Registration Open",
            desc: "All affiliated colleges can now self-register using the portal. Passkeys will be sent directly to verification emails.",
            link: "#"
        },
        {
            date: "June 20, 2026",
            tag: "Circular",
            title: "Submission of Regular Activity Reports 2025-26",
            desc: "The deadline for submitting regular activity reports for the academic year 2025-26 has been extended.",
            link: "#"
        },
        {
            date: "June 15, 2026",
            tag: "Camp Guidance",
            title: "Special Camping Programme - Guidelines",
            desc: "Please download the updated guidelines (Form 1 & 2) for conducting the 7-day Special Camping programme.",
            link: "#"
        }
    ];

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
                        <img style={{ width: 44, height: 44 }} src="/periyar-univ-logo.png" alt="University Logo" />
                        <div>
                            <span style={{
                                fontWeight: 800, fontSize: "1.2rem",
                                letterSpacing: "-0.02em",
                                color: "#ffffff",
                                display: "block"
                            }}>NSS Portal</span>
                            <span style={{ fontSize: "0.65rem", display: "block", color: "rgba(255, 255, 255, 0.6)", marginTop: "-2px", letterSpacing: "0.08em" }}>PERIYAR UNIVERSITY</span>
                        </div>
                    </div>

                    {/* Navigation Section Scroll Links */}
                    <div className="nav-links-container" style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                        <span className="nav-link" onClick={() => scrollToSection("intro")}>Intro</span>
                        <span className="nav-link" onClick={() => scrollToSection("objectives")}>Objectives</span>
                        <span className="nav-link" onClick={() => scrollToSection("motto")}>Motto</span>
                        <span className="nav-link" onClick={() => scrollToSection("activities")}>Activities</span>
                        <span className="nav-link" onClick={() => scrollToSection("university")}>University NSS</span>
                        <span className="nav-link" onClick={() => scrollToSection("announcements")}>Announcements</span>
                        <span className="nav-link" onClick={() => scrollToSection("resources")}>Resources</span>
                        {galleryImages.length > 0 && (
                            <span className="nav-link" onClick={() => scrollToSection("gallery")}>Gallery</span>
                        )}
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
                                <button className="dropdown-item" onClick={() => { setLoginDropdownOpen(false); navigate("/login?role=nodal"); }}>District Nodal Officer</button>
                                <button className="dropdown-item" onClick={() => { setLoginDropdownOpen(false); navigate("/login"); }}>College Portal</button>
                                <button className="dropdown-item" onClick={() => { setLoginDropdownOpen(false); navigate("/unit-login"); }}>NSS Unit Portal</button>
                            </div>
                        )}
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

            {/* ── Section 1: NSS Intro ── */}
            <section id="intro" style={{ padding: "5rem 0", background: "var(--card)" }} data-aos="fade-up">
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                        <img src="/nss-logo.png" alt="NSS Logo" style={{ width: 90, height: 90, marginBottom: "1rem" }} />
                        <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--txt-1)", letterSpacing: "-0.02em" }}>National Service Scheme (NSS)</h1>
                        <p style={{ fontSize: "1.1rem", color: "var(--txt-2)", maxWidth: "800px", margin: "0 auto", lineHeight: 1.7 }}>
                            The National Service Scheme is a noble public service program conducted by the Ministry of Youth Affairs and Sports, Government of India.
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2.5rem", alignItems: "center" }}>
                        <div style={{ fontSize: "1.05rem", color: "var(--txt-2)", lineHeight: "1.8" }}>
                            <p>
                                Launched in the centenary year of Mahatma Gandhi (1969), the primary objective of NSS is to develop student personality and character through voluntary community service. It acts as a bridge connecting student youth with the rural and suburban communities.
                            </p>
                            <p>
                                Student volunteers engage in various social reforms, environmental drives, blood donation camps, literacy campaigns, health care awareness, and village development initiatives. Participation in NSS instills a sense of civic responsibility, leadership capabilities, and community integration.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 2: Objectives ── */}
            <section id="objectives" style={{ padding: "5rem 0", background: "var(--bg)" }} data-aos="fade-up">
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#2563eb", textTransform: "uppercase" }}>Core Mandates</span>
                        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "0.5rem" }}>NSS Objectives</h2>
                        <p style={{ color: "var(--txt-2)", maxWidth: "550px", margin: "0.5rem auto 0" }}>Key milestones and focus points for student volunteers and units.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
                        {[
                            { title: "Understand Community", desc: "Identify the needs and problems of the community and involve volunteers in problem-solving." },
                            { title: "Develop Empathy", desc: "Develop a sense of social and civic responsibility to support underprivileged communities." },
                            { title: "Leadership Qualities", desc: "Acquire leadership qualities and democratic attitudes through organizing local camps." },
                            { title: "Teamwork & Cohesion", desc: "Build capacity to meet emergencies and natural disasters, cultivating community mobilization." }
                        ].map((obj, i) => (
                            <div key={i} style={{ background: "var(--card)", padding: "2rem", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "var(--sh-sm)" }}>
                                <div style={{ width: 44, height: 44, background: "rgba(37,99,235,0.1)", color: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.2rem", marginBottom: "1.25rem" }}>{i + 1}</div>
                                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>{obj.title}</h3>
                                <p style={{ color: "var(--txt-2)", fontSize: "0.95rem", lineHeight: "1.6", margin: 0 }}>{obj.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Section 3: Motto Banner ── */}
            <section id="motto" className="motto-banner" data-aos="zoom-in">
                <div style={{ position: "relative", zIndex: 1, maxWidth: "800px", margin: "0 auto" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#93c5fd" }}>National Motto of NSS</span>
                    <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 900, margin: "1rem 0", letterSpacing: "-0.03em" }}>"NOT ME, BUT YOU"</h2>
                    <p style={{ fontSize: "1.2rem", color: "#dbeafe", fontWeight: 500, lineHeight: 1.6, maxWidth: "600px", margin: "0 auto" }}>
                        A salute to selfless service. This motto underlines the essence of democratic living and upholds the need for mutual appreciation and the welfare of society.
                    </p>
                </div>
            </section>

            {/* ── Section 4: Activities ── */}
            <section id="activities" style={{ padding: "5rem 0", background: "var(--card)" }} data-aos="fade-up">
                <div className="container">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
                        <div>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#2563eb", textTransform: "uppercase" }}>Engagements</span>
                            <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "0.5rem", marginBottom: "1.5rem" }}>Regular Activities & Special Camps</h2>
                            <p style={{ fontSize: "1.05rem", color: "var(--txt-2)", lineHeight: "1.7" }}>
                                NSS volunteers participate in two kinds of activities: Regular community work during weekends and 7-day Special Camping programs in adopted villages.
                            </p>
                            <ul style={{ paddingLeft: "1.25rem", color: "var(--txt-2)", fontSize: "1rem", lineHeight: "2" }}>
                                <li>Health campaigns, sanitation, immunization drives.</li>
                                <li>Afforestation, tree plantation, environment awareness.</li>
                                <li>Adult education, child education campaigns.</li>
                                <li>Disaster mitigation and rehabilitation assistance.</li>
                                <li>Skill development and vocational trainings in villages.</li>
                            </ul>
                        </div>
                        <div style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "var(--sh-lg)", border: "1px solid var(--border)" }}>
                            <img src="https://silveroakuni.ac.in/_next/image?url=%2Fassets%2Fimages%2Fbanner-images%2Fm_nss.webp&w=3840&q=80" alt="Activities" style={{ width: "100%", height: "auto", display: "block" }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 5: About University NSS ── */}
            <section id="university" style={{ padding: "5rem 0", background: "var(--bg)" }} data-aos="fade-up">
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#2563eb", textTransform: "uppercase" }}>Institutional Overview</span>
                        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "0.5rem" }}>Periyar University NSS cell</h2>
                        <p style={{ color: "var(--txt-2)", maxWidth: "600px", margin: "0.5rem auto 0" }}>Managing community action across four key districts: Salem, Namakkal, Dharmapuri, and Krishnagiri.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "4rem", alignItems: "center" }}>
                        <div style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "var(--sh-lg)" }}>
                            <img src="/univ-campus.jpg" alt="University Campus" style={{ width: "100%", height: "auto", display: "block" }} />
                        </div>
                        <div>
                            <p style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "var(--txt-2)" }}>
                                Named after the great social reformer E.V. Ramasamy (Thanthai Periyar), Periyar University NSS cell drives community outreach across 118 affiliated colleges. Reaccredited by NAAC with <strong>"A++" Grade</strong> in 2021, the university is a pioneer in integrating academics with societal welfare.
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "2rem" }}>
                                <div style={{ borderLeft: "4px solid #2563eb", paddingLeft: "1rem" }}>
                                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#2563eb", lineHeight: 1 }}>110+</div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--txt-3)", fontWeight: 600, textTransform: "uppercase", marginTop: "0.25rem" }}>Active Units</div>
                                </div>
                                <div style={{ borderLeft: "4px solid #2563eb", paddingLeft: "1rem" }}>
                                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#2563eb", lineHeight: 1 }}>11,000+</div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--txt-3)", fontWeight: 600, textTransform: "uppercase", marginTop: "0.25rem" }}>Volunteers</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Section 6: Announcements Grid ── */}
            <section id="announcements" style={{ padding: "5rem 0", background: "var(--card)" }} data-aos="fade-up">
                <div className="container">
                    <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", color: "#2563eb", textTransform: "uppercase" }}>Real-time Updates</span>
                        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginTop: "0.5rem" }}>Announcements & Notifications</h2>
                        <p style={{ color: "var(--txt-2)", maxWidth: "500px", margin: "0.5rem auto 0" }}>Stay informed with the latest notifications from the university cell.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
                        {announcements.map((ann, idx) => {
                            const tagClass = ann.tag === "Important" ? "tag-important" : (ann.tag === "Circular" ? "tag-circular" : "tag-camp");
                            return (
                                <div className="announcement-card" key={idx}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span className={`tag ${tagClass}`}>{ann.tag}</span>
                                        <span style={{ fontSize: "0.75rem", color: "var(--txt-3)", fontWeight: 500 }}>{ann.date}</span>
                                    </div>
                                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0.5rem 0 1rem", lineHeight: 1.4 }}>{ann.title}</h3>
                                    <p style={{ color: "var(--txt-2)", fontSize: "0.9rem", lineHeight: "1.6", margin: 0 }}>{ann.desc}</p>
                                </div>
                            );
                        })}
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
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
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
                        <p style={{ margin: 0, fontSize: "1rem", lineHeight: "1.6" }}>{selectedImage.description}</p>
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