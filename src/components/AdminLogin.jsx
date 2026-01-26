import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (localStorage.getItem("adminToken")) {
            navigate("/admin-dashboard");
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
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
            setError("Invalid Admin Credentials");
        }
    };

    return (
        <div className="login-page" style={{ background: 'var(--bg-color)' }}>
            <div className="card login-card" style={{ maxWidth: '400px', margin: 'auto', marginTop: '10vh' }}>
                <div className="text-center mb-6">
                    <h1 className="mb-2">Admin Portal</h1>
                    <p className="text-muted">Secure Access for System Administrators</p>
                </div>

                {error && <div className="alert alert-danger mb-4">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group mb-4">
                        <label className="form-label">Admin Username</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group mb-6">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100">
                        Access Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
