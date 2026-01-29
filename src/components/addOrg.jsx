import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddOrg = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);
        const data = {
            insName: formData.get("insName"),
            location: formData.get("location"),
            code: formData.get("code"),
            username: formData.get("username"),
            password: formData.get("password"),
        };

        axios.post(`${import.meta.env.VITE_API_URL}/add-organization`, data)
            .then((response) => {
                alert("Organization Added Successfully");
                e.target.reset();
                navigate('/admin-dashboard');
            })
            .catch((error) => {
                console.error("There was an error adding the organization!", error);
                alert("Failed to add organization. Please try again.");
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    return (
        <div className="login-page">
            <div className="card login-card" style={{ maxWidth: '500px' }}>
                <div className="text-center mb-6">
                    <div style={{
                        width: '60px', height: '60px',
                        background: 'var(--success-900)',
                        color: 'var(--success-400)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        fontSize: '1.5rem',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
                    }}>
                        🏢
                    </div>
                    <span className="badge badge-primary mb-3">System Administration</span>
                    <h1 className="mb-2">Add Organization</h1>
                    <p className="text-muted">Register a new college or institution in the system</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Institution Name</label>
                        <input
                            type="text"
                            name="insName"
                            className="form-input"
                            placeholder="e.g. Dynamic Engineering College"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Location</label>
                        <input
                            type="text"
                            name="location"
                            className="form-input"
                            placeholder="e.g. Chennai, Tamil Nadu"
                            required
                        />
                    </div>

                    <div className="grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">College Code</label>
                            <input
                                type="text"
                                name="code"
                                className="form-input"
                                placeholder="e.g. DEC001"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Admin Email</label>
                            <input
                                type="email"
                                name="username"
                                className="form-input"
                                placeholder="collegename@edu.in"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">  Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="Set a secure   password"
                            required
                        />
                    </div>

                    <div className="d-flex gap-2 mt-6">
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={isLoading}
                            style={{ flex: 2 }}
                        >
                            {isLoading ? "Adding..." : "Add Organization"}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary flex-1"
                            onClick={() => navigate('/admin-dashboard')}
                            style={{ flex: 1 }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddOrg;