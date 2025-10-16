import React from "react";
import ReactDOM from "react-dom/client";
import Login from "./Login";
import Dashboard from "./Dashboard/Dashboard.jsx";
import "./Login.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Login />
  </React.StrictMode>
);



root.render(
  <React.StrictMode>
    <Dashboard /> 
  </React.StrictMode>
);