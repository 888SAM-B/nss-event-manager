import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { EyeIcon, EyeOffIcon } from './EyeIcons';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('adminToken')) navigate('/admin-dashboard');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/login`, { username, password });
            if (res.data.success) {
                localStorage.setItem('adminToken', res.data.token);
                navigate('/admin-dashboard');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid administrator credentials. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="card" style={{ padding: '2.25rem', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>

                    {/* Logo + Header */}
                    <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                        <div style={{
                            width: 56, height: 56,
                            background: '#dbeafe',
                            border: '1px solid #bfdbfe',
                            borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem',
                            fontSize: '1.5rem',
                        }}>🛡️</div>
                        <span className="badge badge-primary" style={{ marginBottom: '0.75rem', letterSpacing: '0.08em' }}>
                            SYSTEM ADMINISTRATOR
                        </span>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', marginTop: '0.5rem' }}>
                            Admin Sign In
                        </h2>
                        <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', margin: 0 }}>
                            Periyar University NSS Portal
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            background: '#fff1f2',
                            border: '1px solid #fecaca',
                            borderRadius: '0.75rem',
                            color: '#b91c1c',
                            fontSize: '0.875rem',
                            marginBottom: '1.25rem',
                            display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                        }}>
                            <span style={{ flexShrink: 0 }}>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter admin username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                                        padding: '0.25rem',
                                        transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--txt-1)'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--txt-3)'}
                                    tabIndex={-1}
                                >
                                    {showPass
                                        ? <EyeOffIcon size={17} />
                                        : <EyeIcon size={17} />
                                    }
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-100 btn-lg"
                            disabled={isLoading} style={{ marginBottom: '0.75rem' }}>
                            {isLoading
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

export default AdminLogin;
