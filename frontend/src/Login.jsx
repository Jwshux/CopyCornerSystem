import React, { useState } from "react";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        alert(data.message);
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
              Streamline printing, inventory, and job order management — all in one system.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="login-right">
          <div className="login-box">
            <h2>Staff Login</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

      {/* Footer */}
      <footer className="footer">
        © 2025 Copy Corner. All rights reserved.
      </footer>
    </div>
  );
}

export default Login;
