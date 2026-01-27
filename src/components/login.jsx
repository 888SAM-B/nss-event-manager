import React from 'react'
import { useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { setUsername } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem("nsstoken")) {
            navigate("/college-dashboard");
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            console.log(data);
            if (data.success) {
                localStorage.setItem("nsstoken", data.token);
                setUsername(username);
                localStorage.setItem("nss_username", username);
                navigate("/college-dashboard");
            }
            else {
                alert(data.message)
            }
        }
        catch (error) {
            console.log(error)
        }

    };

    return (
        <div className="login-page">
            <div className="card login-card">
                <div className="text-center mb-6">
                    <h1 className="mb-2">Admin Login</h1>
                    <p>Enter your credentials to access the dashboard</p>
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
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter your password"
                            name="password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Login to Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;