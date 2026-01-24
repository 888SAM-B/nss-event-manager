import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react';
import axios from 'axios';

const UnitLogin = () => {
  const navigate = useNavigate();
  const [collegeCode, setCollegeCode] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [unitPassword, setUnitPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const payload = {
      collegeCode,
      unitCode,
      unitPassword
    };
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/unit-login`, payload);
      if (res.data.success) {
        localStorage.setItem("unitToken", res.data.token);
        localStorage.setItem("nssunitCode", unitCode);
        localStorage.setItem("nsscollegeCode", collegeCode); // Store College code as well
        navigate("/unit-dashboard");

        alert("Login successful");

      }
    } catch (error) {
      console.log(error);
      alert("Login failed");
    }
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="text-center mb-6">
          <h1 className="mb-2">Unit Login</h1>
          <p>Login to manage your NSS Unit</p>
        </div>

        <form onSubmit={(e) => handleLogin(e)}>
          <div className="form-group">
            <label className="form-label">College Code</label>
            <input
              className="form-input"
              placeholder="Enter College Code"
              value={collegeCode}
              onChange={(e) => setCollegeCode(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Unit Code</label>
            <input
              className="form-input"
              placeholder="Enter Unit Code"
              value={unitCode}
              onChange={(e) => setUnitCode(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Unit Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter Unit Password"
              value={unitPassword}
              onChange={(e) => setUnitPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default UnitLogin