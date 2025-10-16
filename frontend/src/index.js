import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import Login from "./Login";
import AdminDashboard from "./Dashboard/Dashboard.jsx";
import "./Login.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Optional: store user info after login
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  return (
    <>
      {isLoggedIn ? (
        <AdminDashboard user={user} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
