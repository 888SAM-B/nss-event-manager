import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import "aos/dist/aos.css";
import AOS from "aos";

const Home = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();

    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
            easing: "ease-in-out",
        });
    }, []);

    const features = [
        {
            icon: "📅",
            title: "Event Tracking",
            desc: "Create, monitor, and report events with photos, attendance records, and real-time analytics.",
            color: "brand",
        },
        {
            icon: "👥",
            title: "Volunteer Management",
            desc: "Maintain comprehensive profiles for all NSS volunteers across units with enrollment forms.",
            color: "teal",
        },
        {
            icon: "📊",
            title: "Instant Reports",
            desc: "Generate detailed PDF reports for events and export unit performance data in Excel.",
            color: "warning",
        },
        {
            icon: "🏫",
            title: "Unit Management",
            desc: "Structured management of NSS units under each institution with program officer assignment.",
            color: "success",
        },
        {
            icon: "🌿",
            title: "Village Adoption",
            desc: "Track and manage village adoption initiatives for community development activities.",
            color: "accent",
        },
        {
            icon: "🔒",
            title: "Secure Access",
            desc: "Role-based authentication for Admin, College, and Unit-level access with JWT security.",
            color: "info",
        },
    ];

    const colorMap = {
        brand: { bg: '#dbeafe', clr: '#1d4ed8' },
        teal: { bg: '#dcfce7', clr: '#16a34a' },
        warning: { bg: '#fef3c7', clr: '#cd6f27ff' },
        success: { bg: '#f0fdf4', clr: '#15803d' },
        accent: { bg: '#ede9fe', clr: '#6d28d9' },
        info: { bg: '#f0f9ff', clr: '#0369a1' },
    };

    return (
        <div className="home-container" style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

            {/* ── Navbar ── */}
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




                {/* ── Features ── */}
                <section style={{ padding: "0 0 90px" }}>
                    <div className="container">
                        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
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
                            {/* <div style={{
                                width: 28, height: 28,
                                background: "linear-gradient(135deg, #6366f1, #2dd4bf)",
                                borderRadius: "8px",
                                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem",
                            }}>🎓</div> */}

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