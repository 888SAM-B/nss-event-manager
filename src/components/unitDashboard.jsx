import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UnitDashboard = () => {
    const navigate = useNavigate();

    const [unit, setUnit] = useState(null);
    const [college, setCollege] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [memberForm, setMemberForm] = useState({ name: "", dept: "", year: "", contact: "", regNo: "" });
    const [editingIndex, setEditingIndex] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("unitToken");
        if (!token) {
            navigate("/unit-login");
            return;
        }

        const unitCode = localStorage.getItem("nssunitCode");
        if (!unitCode) {
            setError("Invalid Unit Code");
            setLoading(false);
            return;
        }

        axios
            .get(`${import.meta.env.VITE_API_URL}/unit-dashboard/${unitCode}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            .then((res) => {
                setUnit(res.data.unit);
                setCollege(res.data.college);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.response?.data?.message || "Something went wrong");
                setLoading(false);

                if (err.response?.status === 401) {
                    localStorage.removeItem("unitToken");
                    navigate("/unit-login");
                }
            });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("unitToken");
        localStorage.removeItem("nssunitCode");
        navigate("/unit-login");
    };

    const filteredMembers = unit?.members?.filter((m) =>
        `${m.name} ${m.dept} ${m.year} ${m.regNo}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const handleAddClick = () => {
        setEditingIndex(null);
        setMemberForm({ name: "", dept: "", year: "", contact: "", regNo: "" });
        setIsModalOpen(true);
    };

    const handleUpdateClick = (member) => {
        // Find ORIGINAL index in the full unit.members array
        const index = unit.members.indexOf(member);
        setEditingIndex(index);
        setMemberForm({ ...member });
        setIsModalOpen(true);
    };

    const handleEditChange = (e) => {
        setMemberForm({ ...memberForm, [e.target.name]: e.target.value });
    };

    const handleSaveMember = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("unitToken");

        try {
            if (editingIndex === null) {
                // ADD MODE
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/add-unit-member`,
                    { unitCode: unit.unitNumber, member: memberForm },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    setUnit(res.data.unit); // Server returns updated unit
                    setIsModalOpen(false);
                    alert("Member added successfully!");
                }
            } else {
                // EDIT MODE
                const updatedMembers = [...unit.members];
                updatedMembers[editingIndex] = memberForm;

                const res = await axios.put(
                    `${import.meta.env.VITE_API_URL}/update-unit-members`,
                    {
                        unitCode: unit.unitNumber,
                        members: updatedMembers
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    setUnit({ ...unit, members: updatedMembers });
                    setIsModalOpen(false);
                    alert("Member updated successfully!");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Failed to save member");
        }
    };

    if (loading) return <h2>Loading Unit Dashboard...</h2>;

    if (error) {
        return (
            <div style={{ padding: "20px" }}>
                <h2>Error</h2>
                <p>{error}</p>
            </div>
        );

    }
    const handleDeleteClick = async (member) => {
        if (!window.confirm("Are you sure you want to delete this member?")) return;
        const token = localStorage.getItem("unitToken");

        try {
            const res = await axios.delete(
                `${import.meta.env.VITE_API_URL}/delete-unit-member`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { unitCode: unit.unitNumber, member }
                }
            );
            if (res.data.success) {
                setUnit(res.data.unit);
                alert("Member deleted successfully!");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete member");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2> {college?.code} {college?.insName}  </h2>
            <h4>{college?.userName}</h4>

            <h1>Unit Dashboard</h1>

            <hr />

            <p><b>Unit Code:</b> {unit?.unitNumber}</p>
            <p><b>Unit Name:</b> {unit?.name}</p>
            <p><b>Unit Head:</b> {unit?.head}</p>
            <p><b>Contact:</b> {unit?.contact}</p>
            <p><b>Email:</b> {unit?.mail}</p>

            <hr />

            <h3>Unit Members</h3>

            <button className="btn btn-primary" onClick={handleAddClick} style={{ marginBottom: "1rem" }}>
                Add Member
            </button>

            <input
                type="text"
                placeholder="Search by name / department / year / reg no"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                    padding: "6px",
                    marginBottom: "10px",
                    width: "300px",
                }}
            />

            {filteredMembers?.length > 0 ? (
                <table
                    border="1"
                    cellPadding="8"
                    cellSpacing="0"
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                    }}
                >
                    <thead>
                        <tr style={{ backgroundColor: "#cebfbfff", color: "black" }}>
                            <th>S.No</th>
                            <th>Name</th>
                            <th>Reg No</th>
                            <th>Department</th>
                            <th>Year of Study</th>
                            <th>Contact</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.map((member, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{member.name}</td>
                                <td>{member.regNo}</td>
                                <td>{member.dept}</td>
                                <td>{member.year}</td>
                                <td>{member.contact}</td>
                                <td>
                                    <button
                                        onClick={() => handleUpdateClick(member)}
                                        className="btn btn-primary"
                                        style={{ padding: "4px 8px", fontSize: "12px" }}
                                    >
                                        Edit
                                    </button>
                                    <button onClick={() => handleDeleteClick(member)} className="btn btn-danger" style={{ padding: "4px 8px", fontSize: "12px" }}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No members found</p>
            )}

            <hr />

            <button onClick={handleLogout} className="btn btn-danger logout-btn">Logout</button>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{editingIndex === null ? "Add Member" : "Update Member"}</h2>
                        <form onSubmit={handleSaveMember}>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    className="form-input"
                                    name="name"
                                    value={memberForm.name}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reg No</label>
                                <input
                                    className="form-input"
                                    name="regNo"
                                    value={memberForm.regNo}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Department</label>
                                <input
                                    className="form-input"
                                    name="dept"
                                    value={memberForm.dept}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Year</label>
                                <input
                                    className="form-input"
                                    name="year"
                                    value={memberForm.year}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact</label>
                                <input
                                    className="form-input"
                                    name="contact"
                                    value={memberForm.contact}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button type="button" className="btn btn-danger" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitDashboard;
