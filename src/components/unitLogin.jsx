import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';
import { EyeIcon, EyeOffIcon } from './EyeIcons';

const UnitLogin = () => {
    const navigate = useNavigate();
    const [collegeCode, setCollegeCode] = useState('');
    const [unitCode, setUnitCode] = useState('');
    const [unitPassword, setUnitPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/unit-login`, {
                collegeCode, unitCode, unitPassword,
            });
            if (res.data.success) {
                localStorage.clear();
                localStorage.setItem('unitToken', res.data.token);
                localStorage.setItem('nssunitCode', unitCode);
                localStorage.setItem('nsscollegeCode', collegeCode);
                navigate('/unit-dashboard');
                toast.success('Login successful');
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 10 }}>
                <ThemeToggle />
            </div>

            <div className="login-card">
                <div className="card" style={{ padding: '2.25rem', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>

                    <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                        <div style={{
                            width: 56, height: 56,
                            background: '#dcfce7',
                            border: '1px solid #bbf7d0',
                            borderRadius: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1rem',
                            fontSize: '1.5rem',
                        }}>🏫</div>
                        <span className="badge badge-success" style={{ marginBottom: '0.75rem', letterSpacing: '0.08em' }}>
                            NSS UNIT
                        </span>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', marginTop: '0.5rem' }}>
                            Unit Sign In
                        </h2>
                        <p style={{ color: 'var(--txt-3)', fontSize: '0.875rem', margin: 0 }}>
                            Access your NSS unit dashboard
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">College Code</label>
                            <input
                                className="form-input"
                                placeholder="e.g. 507"
                                value={collegeCode}
                                onChange={(e) => setCollegeCode(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Unit Code</label>
                            <input
                                className="form-input"
                                placeholder="e.g. PUNSS..."
                                value={unitCode}
                                onChange={(e) => setUnitCode(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Enter unit password"
                                    value={unitPassword}
                                    onChange={(e) => setUnitPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '2.75rem' }}
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

export default UnitLogin;