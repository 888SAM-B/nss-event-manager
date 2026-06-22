import React, { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import { EyeIcon, EyeOffIcon } from './EyeIcons';

const Login = () => {
    const { setUsername } = useUser();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('nsstoken')) navigate('/college-dashboard');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        setLoading(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Login successful');
                localStorage.setItem('nsstoken', data.token);
                setUsername(username);
                localStorage.setItem('nss_username', username);
                navigate('/college-dashboard');
            } else {
                toast.error(data.message || 'Invalid credentials');
            }
        } catch (error) {
            console.log(error);
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Theme toggle */}
            <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 10 }}>
                <ThemeToggle />
            </div>

            <div className="login-card">
                <div className="card" style={{ padding: '2.25rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>

                    <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                        <div style={{
                            width: 56, height: 56,
                            background: 'rgba(37, 99, 235, 0.1)',
                            border: '1px solid rgba(37, 99, 235, 0.2)',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem',
                            color: '#2563eb',
                        }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                        </div>
                        <span className="badge badge-primary" style={{ marginBottom: '0.75rem', letterSpacing: '0.08em' }}>
                            ORGANIZATION
                        </span>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', marginTop: '0.5rem' }}>
                            Organization Sign In
                        </h2>
                        <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', margin: 0 }}>
                            Access your college NSS dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter your username"
                                name="username"
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Enter your password"
                                    name="password"
                                    required
                                    style={{ paddingRight: '2.75rem' }}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: 'absolute', right: '0.75rem',
                                        top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        color: 'var(--txt-3)', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center',
                                        padding: '0.25rem', transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-1)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-3)'}
                                    tabIndex={-1}
                                >
                                    {showPass ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-100 btn-lg"
                            disabled={loading} style={{ marginBottom: '0.75rem' }}>
                            {loading
                                ? <span className="flex-center" style={{ gap: '0.5rem' }}>
                                    <span className="loading" />Signing in...
                                  </span>
                                : 'Sign In'
                            }
                        </button>

                        <button type="button" className="btn btn-secondary w-100"
                            onClick={() => navigate('/')}>
                            ← Back to Home
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;