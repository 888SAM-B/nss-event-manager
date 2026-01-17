import React from 'react'
import { useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const { setUsername } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem("nsstoken")) {
            navigate("/college-dashboard");
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        try {
            const res = await fetch("http://localhost:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            console.log(data);
            if (data.success) {
                localStorage.setItem("nsstoken", data.token);
                setUsername(username);
                localStorage.setItem("nss_username", username);
                navigate("/college-dashboard");
            }
        }
        catch (error) {
            console.log(error)
        }

    };
    return (
        <>
            <h1>Login</h1>
            <form action="" onSubmit={(e) => handleLogin(e)}>
                <input type="text" placeholder="Username" name="username" />
                <input type="password" placeholder="Password" name="password" />
                <button type="submit">Login</button>
            </form>
        </>
    );
};

export default Login;