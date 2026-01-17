import { useUser } from "../context/UserContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useState } from "react";
const CollegeDashboard = () => {
    const username = localStorage.getItem("nss_username");
    const navigate = useNavigate();
    const [insName, setinsName] = useState("");
    const [insCode, setinsCode] = useState("");
    const [units, setUnits] = useState([]);
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await axios.get(
                    "http://localhost:8000/college-dashboard",
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("nsstoken")}`,
                        },
                        params: { username } // ✅ GET request data
                    }
                );

                if (res.data.success) {
                    console.log(res.data.user);
                    setinsName(res.data.user.insName);
                    setinsCode(res.data.user.code);
                    setUnits(res.data.user.units);
                } else {
                    navigate("/");
                }
            } catch (error) {
                console.error(error);
                navigate("/");
            }
        };

        fetchDashboard();
    }, [username, navigate]);

    return (
        <>
            <h1>College Dashboard: {insName} {insCode}</h1>

            <button
                onClick={() => {
                    localStorage.removeItem("nsstoken");
                    navigate("/");
                }}
            >
                Logout
            </button>

            <h2>Welcome to the NSS Event Manager</h2>
        </>
    );
};

export default CollegeDashboard;
