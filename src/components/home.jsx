import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();
    return (
        <>
            <div className="home" id="home">
                <h1>NSS EVENT MANAGER</h1>
                <p>Manage your events with ease</p>
                <button onClick={() => navigate("/login")} >LOGIN</button>
            </div>
        </>
    );
};

export default Home;