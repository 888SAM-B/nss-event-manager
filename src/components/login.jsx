import React from 'react'
import { useEffect } from 'react';
const Login = () => {
    useEffect(() => {
        if (localStorage.getItem("nsstoken")) {
            window.location.href = "/dashboard";
        }
    }, []);
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
            if (data.success

            ) {
                localStorage.setItem("nsstoken", data.token);

                window.location.href = "/dashboard";
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