import React, { useState, useEffect, useRef } from "react";
import "./Dashboard.css";
import AllProducts from "./AllProducts";
import Categories from "./Categories";
import ManageGroup from "./ManageGroup";
import ManageUsers from "./ManageUsers";
import Sales from "./Sales";
import AllStaff from "./AllStaff";
import StaffSchedule from "./StaffSchedule";
import Transactions from "./Transactions";
import DashboardUI from "./DashboardUI";
import userLogo from "../UserLogo.png";

function AdminDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [openSubmenus, setOpenSubmenus] = useState({
    Products: false,
    Staffs: false,
    "User Management": false
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // When user clicks outside profile, close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSubmenu = (menu) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Display the correct component
  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return <DashboardUI />;
      case "All Products":
        return <AllProducts />;
      case "Categories":
        return <Categories />;
      case "Manage Groups":
        return <ManageGroup />;
      case "Manage Users":
        return <ManageUsers />;
      case "All Staffs":
        return <AllStaff />;
      case "Staffs Schedule":
        return <StaffSchedule />;
      case "Sales":
        return <Sales />;
      case "Transactions":
        return <Transactions />;
      default:
        return <h2>Welcome Admin</h2>;
    }
  };

  return (
      <div className="container">
        {/* Header Section */}
        <header className="header">
          <div className="welcome-section">
            <h1>Welcome, </h1>
          </div>
          <div className="profile-section" ref={profileRef}>
            <button
              className="profile-name"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              {!isProfileOpen && <span>Joshua Riana</span>}
              <img src={userLogo} alt="User Logo" />
            </button>
            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <img
                    src={userLogo}
                    alt="User Avatar"
                    className="profile-avatar"
                  />
                  <div>
                    <h3>Joshua Riana</h3>
                    <p>admin</p>
                  </div>
                </div>
                <button className="logout-btn">Log Out</button>
              </div>
            )}
          </div>
        </header>

        {/* Sidebar Menu */}
        <aside className="sidebar">
          <h2 className="logo">Copy Corner Hub</h2>

          <nav className="menu">
            {[
              "Dashboard",
              "Products",
              "Staffs",
              "Sales",
              "Transactions",
              "User Management",
            ].map((page) => (
              <div key={page}>
                {/* Main menu button */}
                <button
                  className={
                    activePage === page ||
                    (page === "Products" && 
                    ["All Products", "Categories"].includes(activePage)) ||
                    (page === "Staffs" && 
                    ["All Staffs", "Staffs Schedule"].includes(activePage)) ||
                    (page === "User Management" && 
                    ["Manage Groups", "Manage Users"].includes(activePage))
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    // For main pages without submenus
                    if (["Dashboard", "Sales", "Transactions"].includes(page)) {
                      setActivePage(page);
                      return;
                    }
                    
                    // For pages with submenus - just toggle the submenu
                    if (["Products", "Staffs", "User Management"].includes(page)) {
                      toggleSubmenu(page);
                    }
                  }}
                >
                  {page}
                </button>

                {/* Products submenu - show based on openSubmenus state */}
                {page === "Products" && openSubmenus.Products && (
                  <div className="submenu">
                    {["All Products", "Categories"].map((sub) => (
                      <button
                        key={sub}
                        className={activePage === sub ? "active-sub" : ""}
                        onClick={() => setActivePage(sub)}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}

                {/* Staffs submenu - show based on openSubmenus state */}
                {page === "Staffs" && openSubmenus.Staffs && (
                  <div className="submenu">
                    {["All Staffs", "Staffs Schedule"].map((sub) => (
                      <button
                        key={sub}
                        className={activePage === sub ? "active-sub" : ""}
                        onClick={() => setActivePage(sub)}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}

                {/* User Management submenu - show based on openSubmenus state */}
                {page === "User Management" && openSubmenus["User Management"] && (
                  <div className="submenu">
                    {["Manage Groups", "Manage Users"].map((sub) => (
                      <button
                        key={sub}
                        className={activePage === sub ? "active-sub" : ""}
                        onClick={() => setActivePage(sub)}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Page Content */}
        <main className="main">{renderContent()}</main>

        <footer className="footer">
          <p></p>
        </footer>
      </div>
    );
  }
export default AdminDashboard;