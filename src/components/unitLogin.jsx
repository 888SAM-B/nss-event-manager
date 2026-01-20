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
        navigate("/unit-dashboard");

        alert("Login successful");

      }
    } catch (error) {
      console.log(error);
      alert("Login failed");
    }
  };

  return (
    <div>
      <h1>Unit Login</h1>
      <form onSubmit={(e) => handleLogin(e)} >
        <div className="form-group">
          <label className="form-label">College Code</label>
          <input className="form-input" placeholder="College Code" value={collegeCode} onChange={(e) => setCollegeCode(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Unit Code</label>
          <input className="form-input" placeholder="Unit Code" value={unitCode} onChange={(e) => setUnitCode(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Unit Password</label>
          <input className="form-input" placeholder="Unit Password" value={unitPassword} onChange={(e) => setUnitPassword(e.target.value)} />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default UnitLogin