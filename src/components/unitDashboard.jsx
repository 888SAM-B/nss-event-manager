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

    // Check if accessed from college dashboard (admin or college user)
    const isAccessedFromCollege = localStorage.getItem("nsstoken") !== null;

    useEffect(() => {
        const token = localStorage.getItem("unitToken");
        if (!token) {
            navigate("/unit-login");
            return;
        }

        const unitCode = localStorage.getItem("nssunitCode");
        const collegeCode = localStorage.getItem("nsscollegeCode");
        if (!unitCode || !collegeCode) {
            setError("Invalid Unit Code");
            setLoading(false);
            return;
        }

        axios
            .get(`${import.meta.env.VITE_API_URL}/unit-dashboard/${unitCode}/${collegeCode}`, {
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
        localStorage.removeItem("nsscollegeCode");
        navigate("/");
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
                console.log(unit.unitNumber);
                console.log(college.code);
                const res = await axios.post(
                    `${import.meta.env.VITE_API_URL}/add-unit-member`,
                    { unitCode: unit.unitNumber, collegeCode: college.code, member: memberForm },
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
                        collegeCode: college.code,
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

    const handleDeleteClick = async (member) => {
        if (!window.confirm("Are you sure you want to delete this member?")) return;
        const token = localStorage.getItem("unitToken");

        try {
            const res = await axios.delete(
                `${import.meta.env.VITE_API_URL}/delete-unit-member`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { unitCode: unit.unitNumber, collegeCode: college.code, member }
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

    const handleAddEventClick = () => {
        navigate('/events', { state: { unitCode: unit.unitNumber, collegeCode: college.code } });
    };

    const handleExploreEventClick = () => {
        navigate('/explore-events', { state: { unitCode: unit.unitNumber, collegeCode: college.code } })
    }


    if (loading) return (
        <div className="flex-center" style={{ height: '100vh' }}>
            <div className="loading"></div>
            <h2 className="ms-2">Loading Unit Dashboard...</h2>
        </div>
    );

    if (error) {
        return (
            <div className="container p-6">
                <div className="card text-center">
                    <h2 className="text-danger mb-2">Error</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/unit-login')}>Go to Login</button>
                </div>
            </div>
        );
    }



    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
            <header className="dashboard-header">
                <div className="container flex-between">
                    <div>
                        <span className="badge badge-primary">Unit Dashboard</span>
                        <h1 className="mb-0" style={{ fontSize: '1.5rem', marginTop: '1rem', marginBottom: '0.3rem' }}>{college?.code} - {college?.insName} </h1>
                    </div>
                    {isAccessedFromCollege ? (
                        <button
                            onClick={() => navigate("/college-dashboard")}
                            className="btn btn-secondary"
                        >
                            ← Back to College Dashboard
                        </button>
                    ) : (
                        <button onClick={handleLogout} className="btn btn-danger">Logout</button>
                    )}
                </div>
            </header>

            <main className="container main-container" >
                <div className="grid-cols-2 mb-6">
                    <div className="card">
                        <h3 className="mb-4">Unit Details</h3>
                        <div className="grid-cols-2">
                            <div>
                                <p className="text-xs text-muted mb-1">UNIT CODE</p>
                                <p className="fw-bold">{unit?.unitNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted mb-1">UNIT NAME</p>
                                <p className="fw-bold">{unit?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted mb-1">UNIT HEAD</p>
                                <p className="fw-bold">{unit?.head}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted mb-1">CONTACT</p>
                                <p className="fw-bold">{unit?.contact}</p>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <p className="text-xs text-muted mb-1">EMAIL</p>
                                <p className="fw-bold">{unit?.mail}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card  flex-column text-center">
                        <h3 className="mb-4">Quick Actions</h3>
                        <div className="flex-center actionbuttons" >
                            <div className="one">
                                <button className="btn btn-primary btn-lg w-100 mb-3" onClick={handleAddEventClick}>
                                    Create Events
                                </button>
                                <p className="text-sm text-muted">Manage events, volunteers and more from here.</p>
                            </div>
                            <div className="one">
                                <button className="btn btn-primary btn-lg w-100 mb-3" onClick={handleExploreEventClick}>
                                    Explore Events
                                </button>
                                <p className="text-sm text-muted">Explore events created by other units.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-between member mb-4 align-items-end">
                    <div className="unit-members-header" >
                        <h3 className="mb-1 ">Unit Members</h3>
                        <p className="text-sm">Manage student volunteers</p>
                    </div>
                    <div className="d-flex gap-2 add-member ">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Search members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="btn add-btn btn-primary" onClick={handleAddClick}>
                            + Add Member
                        </button>
                    </div>
                </div>

                <div className="card p-0 overflow-hidden">
                    {filteredMembers?.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="styled-table" style={{ margin: 0, boxShadow: 'none' }}>
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Name</th>
                                        <th>Reg No</th>
                                        <th>Department</th>
                                        <th>Year</th>
                                        <th>Contact</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.map((member, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{member.name}</td>
                                            <td><span className="badge badge-secondary">{member.regNo}</span></td>
                                            <td>{member.dept}</td>
                                            <td>{member.year}</td>
                                            <td>{member.contact}</td>
                                            <td>
                                                <div className="d-flex ed gap-2">
                                                    <button
                                                        onClick={() => handleUpdateClick(member)}
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(member)}
                                                        className="btn btn-sm btn-danger"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-center">
                            <p className="mb-0">No members found matching your search.</p>
                        </div>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="flex-between mb-4">
                            <h2 className="mb-0">{editingIndex === null ? "Add New Member" : "Edit Member"}</h2>
                            <button className="btn btn-sm btn-secondary" onClick={() => setIsModalOpen(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleSaveMember}>
                            <div className="grid-cols-2">
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        className="form-input"
                                        name="name"
                                        value={memberForm.name}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="Full Name"
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
                                        placeholder="Registration Number"
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
                                        placeholder="e.g. CSE"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Year of Study</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="1"
                                        max={5}
                                        name="year"
                                        value={memberForm.year}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="e.g. 3"
                                    />
                                </div>
                                <div className="form-group col-span-2" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Contact Number</label>
                                    <input
                                        className="form-input"
                                        name="contact"
                                        value={memberForm.contact}
                                        onChange={handleEditChange}
                                        required
                                        placeholder="Phone Number"
                                    />
                                </div>
                            </div>

                            <div className="flex-between pt-4 mt-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Member</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnitDashboard;
