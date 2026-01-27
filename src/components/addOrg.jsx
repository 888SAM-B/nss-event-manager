import axios from "axios";
import React from "react";
const addOrg = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            insName: formData.get("insName"),
            code: formData.get("code"),
            username: formData.get("username"),
            password: formData.get("password"),
        };
        console.log(data);
        const res = axios.post(`${import.meta.env.VITE_API_URL}/add-organization`, data)
            .then((response) => {
                alert("Organization Added Successfully");
                e.target.reset();
            })
            .catch((error) => {
                console.error("There was an error adding the organization!", error);
            });
    }
    return (
        <>
            <h1>Add Organization</h1>
            <form action="" onSubmit={(e) => handleSubmit(e)}>
                <div>
                    <label>Institution Name:</label>
                    <input type="text" name="insName" required />
                </div>
                <div>
                    <label>Code:</label>
                    <input type="text" name="code" required />
                </div>
                <div>
                    <label>Email:</label>
                    <input type="email" name="username" required />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" name="password" required />
                </div>
                <button type="submit">Add Organization</button>
            </form>
        </>
    )

};
export default addOrg;