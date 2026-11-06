import React from "react";

export const getInitialSpecialCampDetails = (college = null, unit = null, eventDates = {}) => {
    const firstVillage = (college?.adoptingVillages && college.adoptingVillages.length > 0)
        ? college.adoptingVillages[0]
        : null;

    const collegeAddressParts = [
        college?.collegeLocation?.address || college?.location || "",
        college?.collegeLocation?.taluk || college?.taluk || "",
        college?.collegeLocation?.district || college?.district || "",
        (college?.collegeLocation?.pincode || college?.pincode) ? `PIN: ${college?.collegeLocation?.pincode || college?.pincode}` : ""
    ].filter(Boolean);
    const fullCollegeAddress = collegeAddressParts.join(", ");

    let ocMale = 0, ocFemale = 0, scMale = 0, scFemale = 0, stMale = 0, stFemale = 0;
    if (unit?.members && Array.isArray(unit.members)) {
        unit.members.forEach(m => {
            if (typeof m === 'object' && m !== null) {
                const comm = (m.community || "").toUpperCase();
                const gen = (m.gender || m.sex || "").toUpperCase();
                const isMale = gen.startsWith("M");
                const isFemale = gen.startsWith("F");

                if (comm.includes("ST")) {
                    if (isMale) stMale++;
                    else if (isFemale) stFemale++;
                } else if (comm.includes("SC")) {
                    if (isMale) scMale++;
                    else if (isFemale) scFemale++;
                } else {
                    if (isMale) ocMale++;
                    else if (isFemale) ocFemale++;
                }
            }
        });
    }

    const defaultActivities = Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        activityName: "",
        villageName: firstVillage?.name || "",
        duration: "1",
        beneficiaries: "",
        volunteersInvolved: ""
    }));

    return {
        theme: "",
        collegeName: college?.insName || "",
        postalAddress: fullCollegeAddress || "",
        collegePhone: college?.collegeDetails?.phone || college?.phone || college?.mobile || "",
        collegeEmail: college?.collegeDetails?.email || college?.email || college?.userName || "",
        principalName: college?.principalDetails?.name || college?.principal || "",
        principalPhoneStd: college?.principalDetails?.phone || "",
        principalMobile: college?.principalDetails?.mobile || college?.principalPhone || "",
        poDetails: [{
            sNo: 1,
            name: unit?.head?.name || unit?.head || "",
            address: unit?.head?.address || "",
            phoneRes: unit?.head?.phoneRes || "",
            mobile: unit?.head?.mobile || unit?.contact || "",
            email: unit?.head?.email || unit?.mail || ""
        }],
        teachersDeputed: [
            { sNo: 1, name: "", department: "" },
            { sNo: 2, name: "", department: "" }
        ],
        adoptedVillage: {
            name: firstVillage?.name || "",
            panchayatUnion: firstVillage?.block || firstVillage?.taluk || "",
            address: firstVillage?.address || "",
            venuePhone: "",
            contactPerson: "",
            contactMobile: "",
            distance: firstVillage?.distance || 15,
            conveyanceMode: "College Bus / Government Transport",
            fare: "As per actuals (Nominal fare)"
        },
        campStrength: {
            organizers: 2,
            volunteers: 43,
            nonStudents: 5,
            total: 50,
            breakup: {
                ocMale: ocMale || 15,
                ocFemale: ocFemale || 12,
                scMale: scMale || 8,
                scFemale: scFemale || 6,
                stMale: stMale || 1,
                stFemale: stFemale || 1,
                totalMale: (ocMale || 15) + (scMale || 8) + (stMale || 1),
                totalFemale: (ocFemale || 12) + (scFemale || 6) + (stFemale || 1)
            }
        },
        commencementDate: eventDates.dateFrom || eventDates.date || "",
        valedictoryDate: eventDates.dateTo || "",
        durationDays: "7 Days",
        activities: defaultActivities,
        eveningLecture: "",
        govtDepartments: "",
        voluntaryAgencies: "",
        previousCampDateVenue: "",
        auditedStatementSent: ""
    };
};

const SpecialCampFormSection = ({
    specialCampDetails,
    setSpecialCampDetails,
    college,
    unit,
    onPreviewPdf
}) => {
    const details = specialCampDetails || {};

    const updateField = (path, value) => {
        setSpecialCampDetails(prev => {
            const next = { ...prev };
            const keys = path.split(".");
            let current = next;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return next;
        });
    };

    const handleSelectVillage = (villageName) => {
        const v = college?.adoptingVillages?.find(vil => vil.name === villageName);
        if (v) {
            setSpecialCampDetails(prev => ({
                ...prev,
                adoptedVillage: {
                    ...prev.adoptedVillage,
                    name: v.name,
                    panchayatUnion: v.block || v.taluk || prev.adoptedVillage?.panchayatUnion || "",
                    address: v.address || prev.adoptedVillage?.address || "",
                    distance: v.distance || prev.adoptedVillage?.distance || 15
                },
                activities: (prev.activities || []).map(act => ({
                    ...act,
                    villageName: v.name
                }))
            }));
        }
    };

    const handleBreakupChange = (field, val) => {
        const num = Number(val) || 0;
        setSpecialCampDetails(prev => {
            const curBreakup = { ...(prev.campStrength?.breakup || {}), [field]: num };
            const totalM = (Number(curBreakup.ocMale) || 0) + (Number(curBreakup.scMale) || 0) + (Number(curBreakup.stMale) || 0);
            const totalF = (Number(curBreakup.ocFemale) || 0) + (Number(curBreakup.scFemale) || 0) + (Number(curBreakup.stFemale) || 0);
            curBreakup.totalMale = totalM;
            curBreakup.totalFemale = totalF;

            return {
                ...prev,
                campStrength: {
                    ...(prev.campStrength || {}),
                    breakup: curBreakup,
                    volunteers: totalM + totalF
                }
            };
        });
    };

    const handleStrengthTotalChange = (field, val) => {
        const num = Number(val) || 0;
        setSpecialCampDetails(prev => {
            const cur = { ...(prev.campStrength || {}), [field]: num };
            cur.total = (Number(cur.organizers) || 0) + (Number(cur.volunteers) || 0) + (Number(cur.nonStudents) || 0);
            return {
                ...prev,
                campStrength: cur
            };
        });
    };

    const handleActivityChange = (index, field, val) => {
        setSpecialCampDetails(prev => {
            const newActs = [...(prev.activities || [])];
            newActs[index] = { ...newActs[index], [field]: val };
            return { ...prev, activities: newActs };
        });
    };

    const handleReSyncAutofill = () => {
        const resynced = getInitialSpecialCampDetails(college, unit, {
            dateFrom: details.commencementDate,
            dateTo: details.valedictoryDate
        });
        if (details.theme) resynced.theme = details.theme;
        if (details.activities && details.activities.some(a => a.activityName)) {
            resynced.activities = details.activities;
        }
        setSpecialCampDetails(resynced);
    };

    return (
        <div style={{
            background: "var(--card-bg, #ffffff)",
            border: "2px solid #2563eb",
            borderRadius: "12px",
            padding: "1.25rem",
            marginTop: "1.25rem",
            marginBottom: "1.25rem",
            boxShadow: "0 4px 16px rgba(37, 99, 235, 0.08)"
        }}>
            {/* Header with Badges */}
            <div className="flex-between mb-3" style={{ flexWrap: "wrap", gap: "10px", borderBottom: "1.5px solid var(--border)", paddingBottom: "10px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.35rem" }}>🏕️</span>
                        <h4 style={{ margin: 0, fontWeight: 800, color: "var(--txt-1)", fontSize: "1.1rem" }}>
                            Special Camp Proposal Details (Form 1)
                        </h4>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 600, marginTop: "3px" }}>
                        ✔ University Form 1 details auto-filled from Institution & Unit Profile
                    </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={handleReSyncAutofill}
                        className="btn btn-sm btn-outline-primary"
                        style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                        title="Re-fetch all institutional details from profile"
                    >
                        🔄 Re-sync Profile
                    </button>
                    {onPreviewPdf && (
                        <button
                            type="button"
                            onClick={onPreviewPdf}
                            className="btn btn-sm btn-primary"
                            style={{ fontSize: "0.8rem", padding: "4px 10px", background: "#1e3a8a", borderColor: "#1e3a8a" }}
                        >
                            👁️ Preview Form 1 PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Adopted Village Selection */}
            {college?.adoptingVillages && college.adoptingVillages.length > 0 && (
                <div className="p-3 mb-4 rounded" style={{ background: "rgba(37, 99, 235, 0.06)", border: "1px solid rgba(37, 99, 235, 0.2)" }}>
                    <label className="form-label" style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "0.85rem" }}>
                        📍 Quick-Select Adopted Village to Auto-fill Venue & Distance
                    </label>
                    <select
                        className="form-control"
                        value={details.adoptedVillage?.name || ""}
                        onChange={(e) => handleSelectVillage(e.target.value)}
                    >
                        <option value="">-- Choose from College Adopted Villages --</option>
                        {college.adoptingVillages.map((v, i) => (
                            <option key={i} value={v.name}>
                                {v.name} ({v.block || v.taluk || "Block"} — {v.distance || 0} km away)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* 1. Theme & Institution Details */}
            <div className="mb-4">
                <h5 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--txt-1)", marginBottom: "8px" }}>
                    1. Theme & Institution Details
                </h5>
                <div className="form-group mb-2">
                    <label className="form-label">Theme of the Special Camp *</label>
                    <input
                        type="text"
                        className="form-control"
                        value={details.theme || ""}
                        onChange={(e) => updateField("theme", e.target.value)}
                        placeholder="e.g. Youth for Cleanliness and Green Environment"
                    />
                </div>
                <div className="grid-cols-2 gap-3 mb-2">
                    <div className="form-group">
                        <label className="form-label">Name of College</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.collegeName || ""}
                            onChange={(e) => updateField("collegeName", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">College Phone (with STD Code) & Mobile</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.collegePhone || ""}
                            onChange={(e) => updateField("collegePhone", e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid-cols-2 gap-3">
                    <div className="form-group">
                        <label className="form-label">Full Postal Address of College</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.postalAddress || ""}
                            onChange={(e) => updateField("postalAddress", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">College E-Mail ID</label>
                        <input
                            type="email"
                            className="form-control"
                            value={details.collegeEmail || ""}
                            onChange={(e) => updateField("collegeEmail", e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 2. Principal Details */}
            <div className="mb-4">
                <h5 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--txt-1)", marginBottom: "8px" }}>
                    2. Principal Details
                </h5>
                <div className="grid-cols-3 gap-3">
                    <div className="form-group">
                        <label className="form-label">Name of the Principal</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.principalName || ""}
                            onChange={(e) => updateField("principalName", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Telephone (with STD Code)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.principalPhoneStd || ""}
                            onChange={(e) => updateField("principalPhoneStd", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Principal Mobile No.</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.principalMobile || ""}
                            onChange={(e) => updateField("principalMobile", e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Programme Officer Details */}
            <div className="mb-4">
                <h5 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--txt-1)", marginBottom: "8px" }}>
                    3. Programme Officer(s) Conducting the Camp
                </h5>
                <div className="grid-cols-3 gap-3 mb-2">
                    <div className="form-group">
                        <label className="form-label">Programme Officer Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.poDetails?.[0]?.name || ""}
                            onChange={(e) => updateField("poDetails.0.name", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">PO Mobile No.</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.poDetails?.[0]?.mobile || ""}
                            onChange={(e) => updateField("poDetails.0.mobile", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">PO Email ID</label>
                        <input
                            type="email"
                            className="form-control"
                            value={details.poDetails?.[0]?.email || ""}
                            onChange={(e) => updateField("poDetails.0.email", e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid-cols-2 gap-3">
                    <div className="form-group">
                        <label className="form-label">PO Residential Address</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.poDetails?.[0]?.address || ""}
                            onChange={(e) => updateField("poDetails.0.address", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">PO Residence Telephone (R)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.poDetails?.[0]?.phoneRes || ""}
                            onChange={(e) => updateField("poDetails.0.phoneRes", e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 4. Teachers Deputed */}
            <div className="mb-4">
                <h5 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--txt-1)", marginBottom: "8px" }}>
                    4. Teachers Deputed to Help Programme Officer (Staff Assistance)
                </h5>
                <div className="grid-cols-2 gap-3 mb-2">
                    <div className="form-group">
                        <label className="form-label">Teacher 1 Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.teachersDeputed?.[0]?.name || ""}
                            onChange={(e) => updateField("teachersDeputed.0.name", e.target.value)}
                            placeholder="Name of Assistant Teacher 1"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Teacher 1 Department / Designation</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.teachersDeputed?.[0]?.department || ""}
                            onChange={(e) => updateField("teachersDeputed.0.department", e.target.value)}
                            placeholder="e.g. Asst. Prof in Tamil"
                        />
                    </div>
                </div>
                <div className="grid-cols-2 gap-3">
                    <div className="form-group">
                        <label className="form-label">Teacher 2 Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.teachersDeputed?.[1]?.name || ""}
                            onChange={(e) => updateField("teachersDeputed.1.name", e.target.value)}
                            placeholder="Name of Assistant Teacher 2"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Teacher 2 Department / Designation</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.teachersDeputed?.[1]?.department || ""}
                            onChange={(e) => updateField("teachersDeputed.1.department", e.target.value)}
                            placeholder="e.g. Asst. Prof in Commerce"
                        />
                    </div>
                </div>
            </div>

            {/* 5. Adopted Village & Travel Details */}
            <div className="mb-4">
                <h5 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--txt-1)", marginBottom: "8px" }}>
                    5. Adopted Village & Travel Details
                </h5>
                <div className="grid-cols-3 gap-3 mb-2">
                    <div className="form-group">
                        <label className="form-label">Camp Venue / Adopted Village Name *</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.adoptedVillage?.name || ""}
                            onChange={(e) => updateField("adoptedVillage.name", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Name of Panchayat Union</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.adoptedVillage?.panchayatUnion || ""}
                            onChange={(e) => updateField("adoptedVillage.panchayatUnion", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Distance from College (km)</label>
                        <input
                            type="number"
                            className="form-control"
                            value={details.adoptedVillage?.distance || 15}
                            onChange={(e) => updateField("adoptedVillage.distance", Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="grid-cols-2 gap-3 mb-2">
                    <div className="form-group">
                        <label className="form-label">Full Address of Camp Venue</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.adoptedVillage?.address || ""}
                            onChange={(e) => updateField("adoptedVillage.address", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mobile / Tel No. in Camp Venue</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.adoptedVillage?.venuePhone || ""}
                            onChange={(e) => updateField("adoptedVillage.venuePhone", e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid-cols-3 gap-3">
                    <div className="form-group">
                        <label className="form-label">Contact Person in Adopted Village & Mobile</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.adoptedVillage?.contactPerson || ""}
                            onChange={(e) => updateField("adoptedVillage.contactPerson", e.target.value)}
                            placeholder="e.g. Village Head - 9876543210"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mode of Conveyance</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.adoptedVillage?.conveyanceMode || "College Bus / Government Transport"}
                            onChange={(e) => updateField("adoptedVillage.conveyanceMode", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bus / Train Fare to Camp Venue</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.adoptedVillage?.fare || "As per actuals (Nominal fare)"}
                            onChange={(e) => updateField("adoptedVillage.fare", e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 6. Camp Strength & Community Breakup */}
            <div className="mb-4">
                <h5 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--txt-1)", marginBottom: "8px" }}>
                    6. Camp Strength Planned (50 Campers / Unit) & Community Breakup
                </h5>
                <div className="grid-cols-4 gap-3 mb-3">
                    <div className="form-group">
                        <label className="form-label">No. of Camp Organizers</label>
                        <input
                            type="number"
                            className="form-control"
                            value={details.campStrength?.organizers ?? 2}
                            onChange={(e) => handleStrengthTotalChange("organizers", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">No. of NSS Volunteers</label>
                        <input
                            type="number"
                            className="form-control"
                            value={details.campStrength?.volunteers ?? 43}
                            onChange={(e) => handleStrengthTotalChange("volunteers", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">No. of Non-Student Volunteers</label>
                        <input
                            type="number"
                            className="form-control"
                            value={details.campStrength?.nonStudents ?? 5}
                            onChange={(e) => handleStrengthTotalChange("nonStudents", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>Total Campers</label>
                        <input
                            type="number"
                            className="form-control"
                            style={{ fontWeight: 800, background: "var(--bg-secondary)" }}
                            value={details.campStrength?.total ?? 50}
                            readOnly
                        />
                    </div>
                </div>

                {/* Community Breakup Table */}
                <div style={{ overflowX: "auto" }}>
                    <table className="table table-bordered text-center" style={{ fontSize: "0.85rem", margin: 0 }}>
                        <thead style={{ background: "var(--bg-secondary)" }}>
                            <tr>
                                <th colSpan={2}>OC</th>
                                <th colSpan={2}>SC</th>
                                <th colSpan={2}>ST</th>
                                <th colSpan={2} style={{ background: "#e2e8f0" }}>TOTAL</th>
                            </tr>
                            <tr>
                                <th style={{ width: "12%" }}>Male</th>
                                <th style={{ width: "12%" }}>Female</th>
                                <th style={{ width: "12%" }}>Male</th>
                                <th style={{ width: "12%" }}>Female</th>
                                <th style={{ width: "12%" }}>Male</th>
                                <th style={{ width: "12%" }}>Female</th>
                                <th style={{ width: "14%", background: "#e2e8f0" }}>Male</th>
                                <th style={{ width: "14%", background: "#e2e8f0" }}>Female</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm text-center"
                                        value={details.campStrength?.breakup?.ocMale ?? 15}
                                        onChange={(e) => handleBreakupChange("ocMale", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm text-center"
                                        value={details.campStrength?.breakup?.ocFemale ?? 12}
                                        onChange={(e) => handleBreakupChange("ocFemale", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm text-center"
                                        value={details.campStrength?.breakup?.scMale ?? 8}
                                        onChange={(e) => handleBreakupChange("scMale", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm text-center"
                                        value={details.campStrength?.breakup?.scFemale ?? 6}
                                        onChange={(e) => handleBreakupChange("scFemale", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm text-center"
                                        value={details.campStrength?.breakup?.stMale ?? 1}
                                        onChange={(e) => handleBreakupChange("stMale", e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm text-center"
                                        value={details.campStrength?.breakup?.stFemale ?? 1}
                                        onChange={(e) => handleBreakupChange("stFemale", e.target.value)}
                                    />
                                </td>
                                <td style={{ fontWeight: 700, background: "#f8fafc" }}>
                                    {details.campStrength?.breakup?.totalMale ?? 24}
                                </td>
                                <td style={{ fontWeight: 700, background: "#f8fafc" }}>
                                    {details.campStrength?.breakup?.totalFemale ?? 19}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 7. Detailed 7-Day Day-wise Activity Programme */}
            <div className="mb-4">
                <h5 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--txt-1)", marginBottom: "8px" }}>
                    7. Activities to be Completed During Camp (7-Day Detailed Programme)
                </h5>
                <div style={{ overflowX: "auto" }}>
                    <table className="table table-bordered" style={{ fontSize: "0.82rem", margin: 0 }}>
                        <thead style={{ background: "var(--bg-secondary)" }}>
                            <tr>
                                <th style={{ width: "9%", textAlign: "center" }}>Day</th>
                                <th style={{ width: "45%" }}>Name of Activity / Programme Planned</th>
                                <th style={{ width: "20%" }}>Adopted Village</th>
                                <th style={{ width: "13%", textAlign: "center" }}>Beneficiaries</th>
                                <th style={{ width: "13%", textAlign: "center" }}>Campers (NSS)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(details.activities || []).slice(0, 7).map((act, idx) => (
                                <tr key={idx}>
                                    <td style={{ textAlign: "center", fontWeight: "bold" }}>Day {idx + 1}</td>
                                    <td>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={act.activityName || ""}
                                            onChange={(e) => handleActivityChange(idx, "activityName", e.target.value)}
                                            placeholder="Enter planned activity..."
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={act.villageName || ""}
                                            onChange={(e) => handleActivityChange(idx, "villageName", e.target.value)}
                                            placeholder="Village venue..."
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm text-center"
                                            value={act.beneficiaries !== undefined ? act.beneficiaries : ""}
                                            onChange={(e) => handleActivityChange(idx, "beneficiaries", e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="0"
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number"
                                            className="form-control form-control-sm text-center"
                                            value={act.volunteersInvolved !== undefined ? act.volunteersInvolved : ""}
                                            onChange={(e) => handleActivityChange(idx, "volunteersInvolved", e.target.value === "" ? "" : Number(e.target.value))}
                                            placeholder="0"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 8. Lectures, Departments & Compliance */}
            <div>
                <h5 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--txt-1)", marginBottom: "8px" }}>
                    8. Evening Lectures, Cooperating Departments & Compliance
                </h5>
                <div className="form-group mb-2">
                    <label className="form-label">Details of Evening Guest Lecture</label>
                    <input
                        type="text"
                        className="form-control"
                        value={details.eveningLecture || ""}
                        onChange={(e) => updateField("eveningLecture", e.target.value)}
                    />
                </div>
                <div className="grid-cols-2 gap-3 mb-2">
                    <div className="form-group">
                        <label className="form-label">Government Departments whose co-operation is sought</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.govtDepartments || ""}
                            onChange={(e) => updateField("govtDepartments", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Voluntary agencies who will help</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.voluntaryAgencies || ""}
                            onChange={(e) => updateField("voluntaryAgencies", e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid-cols-2 gap-3">
                    <div className="form-group">
                        <label className="form-label">Date and venue of the previous camp held</label>
                        <input
                            type="text"
                            className="form-control"
                            value={details.previousCampDateVenue || ""}
                            onChange={(e) => updateField("previousCampDateVenue", e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Audited statement of accounts certified by CA sent?</label>
                        <select
                            className="form-control"
                            value={details.auditedStatementSent || "Yes"}
                            onChange={(e) => updateField("auditedStatementSent", e.target.value)}
                        >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpecialCampFormSection;

