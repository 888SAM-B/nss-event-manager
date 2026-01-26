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

            <button onClick={() => {
                localStorage.removeItem("nsstoken");
                navigate("/");
            }}>Logout
            </button>
            <div>
                {units.map((unit) => (
                    <div key={unit.no} style={{ border: '1px solid #000' }}>
                        <h3>{unit.name}</h3>
                        <p><strong>No:</strong> {unit.no}</p>
                        <p><strong>Head:</strong> {unit.head}</p>
                        <p><strong>Members:</strong> {unit.members}</p>
                        <p><strong>Member Details:</strong> {unit.mDetails.length > 0 ? unit.mDetails.join(', ') : 'None'}</p>
                        <p><strong>Staffs:</strong> {unit.staffs.length > 0 ? unit.staffs.join(', ') : 'None'}</p>
                    </div>
                ))}
            </div>



            <h2>Welcome to the NSS Event Manager</h2>
            <h1>Units</h1>


        </>
    );
};

export default CollegeDashboard;
