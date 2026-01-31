import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const Home = () => {
    const navigate = useNavigate();
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
            {/* Navbar */}
            <nav style={{
                padding: '1.5rem 0',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--nav-bg)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div className="container flex-between">
                    <h2 style={{ margin: 0, color: 'var(--primary-400)', letterSpacing: '-0.5px' }}>NSS Portal</h2>
                    <div className="d-flex gap-2 align-items-center">
                        <ThemeToggle />
                        <button className="btn btn-secondary" onClick={() => navigate("/admin-login")}>Admin Login</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header style={{
                padding: '80px 0 60px',
                textAlign: 'center',
                background: 'radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-color) 100%)'
            }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <span className="badge badge-primary mb-4 p-2 px-3">National Service Scheme</span>
                    <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                        Manage Events with <span style={{ color: 'var(--primary-500)' }}>Efficiency</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
                        Streamline your NSS unit operations, track events, manage volunteers, and report activities - all in one unified platform.
                    </p>

                    <div className="flex-center gap-4 flex-wrap">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => navigate("/unit-login")}
                            style={{ minWidth: '200px' }}
                        >
                            Unit Login
                        </button>
                        <button
                            className="btn btn-secondary btn-lg"
                            onClick={() => navigate("/login")}
                            style={{ minWidth: '200px' }}
                        >
                            Organization Admin
                        </button>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="container py-6" style={{ paddingBottom: '80px' }}>
                <div className="grid-cols-3">
                    <div className="card text-center hover-up">
                        <div style={{
                            width: '60px', height: '60px',
                            background: 'var(--primary-900)',
                            color: 'var(--primary-400)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            fontSize: '1.5rem'
                        }}>
                            📅
                        </div>
                        <h3>Event Tracking</h3>
                        <p>Create and monitor events with detailed reports, photos, and attendance records.</p>
                    </div>
                    <div className="card text-center hover-up">
                        <div style={{
                            width: '60px', height: '60px',
                            background: 'var(--success-900)',
                            color: 'var(--success-400)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            fontSize: '1.5rem'
                        }}>
                            👥
                        </div>
                        <h3>Volunteer Management</h3>
                        <p>Keep track of all NSS volunteers, their units, and participation stats easily.</p>
                    </div>
                    <div className="card text-center hover-up">
                        <div style={{
                            width: '60px', height: '60px',
                            background: 'var(--warning-900)',
                            color: 'var(--warning-400)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            fontSize: '1.5rem'
                        }}>
                            📊
                        </div>
                        <h3>Instant Reports</h3>
                        <p>Generate comprehensive reports for specific events or overall unit performance.</p>
                    </div>
                </div>
            </section>

            <footer style={{
                marginTop: 'auto',
                padding: '2rem 0',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center',
                color: 'var(--text-tertiary)'
            }}>
                <div className="container">
                    <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} NSS Event Manager. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;