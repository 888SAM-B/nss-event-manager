import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import ThemeToggle from './ThemeToggle';

const AddOrg = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [villages, setVillages] = useState([{ name: '', address: '', block: '', taluk: '', district: '', pincode: '' }]);

    const addVillage = () => {
        setVillages([...villages, { name: '', address: '', block: '', taluk: '', district: '', pincode: '' }]);
    };

    const removeVillage = (index) => {
        if (villages.length > 1) {
            const newVillages = villages.filter((_, i) => i !== index);
            setVillages(newVillages);
        } else {
            setVillages([{ name: '', address: '', block: '', taluk: '', district: '', pincode: '' }]);
        }
    };

    const handleVillageChange = (index, field, value) => {
        const newVillages = [...villages];
        newVillages[index][field] = value;
        setVillages(newVillages);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.target);
        
        // Filter out empty villages
        const filteredVillages = villages.filter(v => v.name.trim() !== "" || v.address.trim() !== "" || v.pincode.trim() !== "");

        const data = {
            insName: formData.get("insName"),
            location: formData.get("location"),
            block: formData.get("block"),
            taluk: formData.get("taluk"),
            district: formData.get("district"),
            pincode: formData.get("pincode"),
            code: formData.get("code"),
            username: formData.get("username"),
            password: formData.get("password"),
            adoptingVillages: filteredVillages
        };

        axios.post(`${import.meta.env.VITE_API_URL}/add-organization`, data)
            .then((response) => {
                toast.success("College Registered Successfully");
                e.target.reset();
                setVillages([{ name: '', address: '', block: '', taluk: '', district: '', pincode: '' }]);
                navigate('/admin-dashboard');
            })
            .catch((error) => {
                console.error("There was an error registering the college!", error);
                const errorMessage = error.response?.data?.message || "Failed to register college. Please try again.";
                toast.error(errorMessage);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    return (
        <div className="login-page">
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <ThemeToggle />
            </div>
            <div className="card login-card" style={{ maxWidth: '600px' }}>
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
                    <h1 className="mb-2">Register College</h1>
                    <p className="text-muted">Register a new college or institution in the system</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Institution Name</label>
                        <input
                            type="text"
                            name="insName"
                            className="form-input"
                            placeholder="e.g. ABC College of Arts and Science"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Location</label>
                        <input
                            type="text"
                            name="location"
                            className="form-input"
                            placeholder="e.g. Salem"
                            required
                        />
                    </div>

                    <div className="grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">Block</label>
                            <input type="text" name="block" className="form-input" placeholder="Block name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Taluk</label>
                            <input type="text" name="taluk" className="form-input" placeholder="Taluk name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">District</label>
                            <input type="text" name="district" className="form-input" placeholder="District name" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Pincode</label>
                            <input type="text" name="pincode" className="form-input" placeholder="6-digit pincode" maxLength={6} />
                        </div>
                    </div>

                    <div className="grid-cols-2">
                        <div className="form-group">
                            <label className="form-label">College Code</label>
                            <input
                                type="text"
                                name="code"
                                className="form-input"
                                placeholder="e.g.507"
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
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="Set a secure password"
                            required
                        />
                    </div>

                    {/* Adopting Villages Section */}
                    <div className="mt-6 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Adopting Villages</h3>
                            <button 
                                type="button" 
                                onClick={addVillage}
                                className="btn btn-primary"
                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                            >
                                + ADD VILLAGE
                            </button>
                        </div>
                        
                        {villages.map((village, index) => (
                            <div key={index} className="village-entry mb-4 p-3" style={{ 
                                border: '1px solid var(--border)', 
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.02)'
                            }}>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted small">Village #{index + 1}</span>
                                    {villages.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => removeVillage(index)}
                                            style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                                <div className="form-group mb-2">
                                    <input
                                        type="text"
                                        placeholder="Village Name"
                                        className="form-input"
                                        value={village.name}
                                        onChange={(e) => handleVillageChange(index, 'name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid-cols-2">
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Location/Address"
                                            className="form-input"
                                            value={village.address}
                                            onChange={(e) => handleVillageChange(index, 'address', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Block"
                                            className="form-input"
                                            value={village.block}
                                            onChange={(e) => handleVillageChange(index, 'block', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Taluk"
                                            className="form-input"
                                            value={village.taluk}
                                            onChange={(e) => handleVillageChange(index, 'taluk', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="District"
                                            className="form-input"
                                            value={village.district}
                                            onChange={(e) => handleVillageChange(index, 'district', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <input
                                            type="text"
                                            placeholder="Pincode"
                                            className="form-input"
                                            value={village.pincode}
                                            onChange={(e) => handleVillageChange(index, 'pincode', e.target.value)}
                                            pattern="[0-9]{6}"
                                            title="Pincode must be exactly 6 digits"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="d-flex gap-2 mt-6">
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={isLoading}
                            style={{ flex: 2 }}
                        >
                            {isLoading ? "Registering..." : "Register College"}
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