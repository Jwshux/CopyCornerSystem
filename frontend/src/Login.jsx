import React, { useState } from "react";
import "./Login.css";
import loginIcon from "./login-icon.png";

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Logging in:", username);

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) {
        alert(data.message);
        onLoginSuccess(data.user);
      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Could not connect to backend");
    }
  };

  return (
    <div className="page-container">
      <div className="wave wave-top"></div>
      <div className="wave wave-bottom1"></div>
      <div className="wave wave-bottom2"></div>
      <div className="wave wave-left"></div>
      <div className="wave wave-right"></div>

      <div className="login-page">
        {/* Left Section */}
        <div className="login-left">
          <div className="left-content">
            <h1 className="site-title">
              <span className="highlight">COPY</span> CORNER
            </h1>
            <p className="tagline">
              Manage inventory, track job orders, and monitor sales — all in one system.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="login-right">
          <div className="login-box">
            <div className="login-icon">
              <img src={loginIcon} alt="Login Icon" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-btn">
                Log In
              </button>
            </form>
          </div>
        </div>
      </div>

      <footer className="footer">
        © 2025 Copy Corner. All rights reserved.
      </footer>
    </div>
  );
}

export default Login;
