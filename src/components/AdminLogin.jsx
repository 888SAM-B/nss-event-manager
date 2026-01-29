import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (localStorage.getItem("adminToken")) {
            navigate("/admin-dashboard");
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/login`, {
                username,
                password
            });
            if (res.data.success) {
                localStorage.setItem("adminToken", res.data.token);
                navigate("/admin-dashboard");
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Invalid Admin Credentials");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="card login-card">
                <div className="text-center mb-6">
                    <div style={{
                        width: '60px', height: '60px',
                        background: 'var(--primary-900)',
                        color: 'var(--primary-400)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        fontSize: '1.5rem',
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)'
                    }}>
                        🔐
                    </div>
                    <span className="badge badge-primary mb-3">System Administrator</span>
                    <h1 className="mb-2">Admin Portal</h1>
                    <p className="text-muted">Secure Access for Management</p>
                </div>

                {error && (
                    <div className="alert alert-danger mb-4" style={{
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--danger-500)',
                        color: 'var(--danger-500)',
                        fontSize: 'var(--text-sm)',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Admin Username</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter administrator username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter secure password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mb-4" disabled={isLoading}>
                        {isLoading ? (
                            <span className="flex-center" style={{ gap: '10px' }}>
                                <span className="loading"></span>
                                Authenticating...
                            </span>
                        ) : (
                            "Access Dashboard"
                        )}
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary w-100"
                        onClick={() => navigate('/')}
                        style={{ background: 'transparent', border: '1px solid var(--border-color)' }}
                    >
                        ← Back to Home
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
