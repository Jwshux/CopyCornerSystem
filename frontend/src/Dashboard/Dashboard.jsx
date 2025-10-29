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
import ServiceTypes from "./ServiceTypes"; // Add this import

function AdminDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [openSubmenus, setOpenSubmenus] = useState({
    Products: false,
    Staffs: false,
    "User Management": false,
    Transactions: false // Add Transactions to submenus
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

  // Get contextual welcome message based on current page
  const getWelcomeMessage = () => {
    const messages = {
      "Dashboard": "Here's your business overview",
      "All Products": "Manage your product inventory",
      "Categories": "Organize product categories",
      "Manage Groups": "Manage user groups and permissions",
      "Manage Users": "Handle user accounts and access",
      "All Staffs": "View and manage staff members",
      "Staffs Schedule": "Organize staff schedules",
      "Sales": "Track sales and revenue",
      "Transactions": "Monitor all transactions",
      "Service Types": "Manage your service types",
    };
    return messages[activePage] || "Manage your business efficiently";
  };

  // Get page title based on current page
  const getPageTitle = () => {
    const titles = {
      "Dashboard": "Dashboard",
      "All Products": "Products",
      "Categories": "Categories", 
      "Manage Groups": "User Management",
      "Manage Users": "User Management",
      "All Staffs": "Staff Management",
      "Staffs Schedule": "Staff Scheduling",
      "Sales": "Sales Analytics",
      "Transactions": "Transaction History",
      "Service Types": "Service Types",
    };
    return titles[activePage] || "Dashboard";
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
      case "Service Types": // Add this case
        return <ServiceTypes />;
      default:
        return <DashboardUI />;
    }
  };

  return (
    <div className="container">
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
                  ["Manage Groups", "Manage Users"].includes(activePage)) ||
                  (page === "Transactions" && 
                  ["Transactions", "Service Types"].includes(activePage)) // Add this condition
                    ? "active"
                    : ""
                }
                onClick={() => {
                  // For main pages without submenus
                  if (["Dashboard", "Sales"].includes(page)) {
                    setActivePage(page);
                    return;
                  }
                  
                  // For pages with submenus - just toggle the submenu
                  if (["Products", "Staffs", "User Management", "Transactions"].includes(page)) {
                    toggleSubmenu(page);
                  }
                }}
              >
                <span className="menu-icon">
                  {page === "Dashboard" && "📊"}
                  {page === "Products" && "📦"}
                  {page === "Staffs" && "👥"}
                  {page === "Sales" && "💰"}
                  {page === "Transactions" && "🧾"}
                  {page === "User Management" && "⚙️"}
                </span>
                {page}
                {(page === "Products" || page === "Staffs" || page === "User Management" || page === "Transactions") && (
                  <span className={`dropdown-arrow ${openSubmenus[page] ? 'open' : ''}`}>▼</span>
                )}
              </button>

              {/* Products submenu */}
              {page === "Products" && openSubmenus.Products && (
                <div className="submenu">
                  {["All Products", "Categories"].map((sub) => (
                    <button
                      key={sub}
                      className={activePage === sub ? "active-sub" : ""}
                      onClick={() => setActivePage(sub)}
                    >
                      <span className="submenu-icon">
                        {sub === "All Products" ? "📋" : "🏷️"}
                      </span>
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {/* Staffs submenu */}
              {page === "Staffs" && openSubmenus.Staffs && (
                <div className="submenu">
                  {["All Staffs", "Staffs Schedule"].map((sub) => (
                    <button
                      key={sub}
                      className={activePage === sub ? "active-sub" : ""}
                      onClick={() => setActivePage(sub)}
                    >
                      <span className="submenu-icon">
                        {sub === "All Staffs" ? "👨‍💼" : "📅"}
                      </span>
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {/* Transactions submenu */}
              {page === "Transactions" && openSubmenus.Transactions && (
                <div className="submenu">
                  {["Transactions", "Service Types"].map((sub) => (
                    <button
                      key={sub}
                      className={activePage === sub ? "active-sub" : ""}
                      onClick={() => setActivePage(sub)}
                    >
                      <span className="submenu-icon">
                        {sub === "Transactions" ? "📝" : "🔧"}
                      </span>
                      {sub}
                    </button>
                  ))}
                </div>
              )}

              {/* User Management submenu */}
              {page === "User Management" && openSubmenus["User Management"] && (
                <div className="submenu">
                  {["Manage Groups", "Manage Users"].map((sub) => (
                    <button
                      key={sub}
                      className={activePage === sub ? "active-sub" : ""}
                      onClick={() => setActivePage(sub)}
                    >
                      <span className="submenu-icon">
                        {sub === "Manage Groups" ? "👥" : "👤"}
                      </span>
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Header Section */}
      <header className="header">
        <div className="welcome-section">
          <h1>Welcome, Joshua</h1>
          <p className="welcome-subtitle">{getWelcomeMessage()}</p>
        </div>
        
        {/* Profile Section - Icon Only */}
          <div className="profile-section" ref={profileRef}>
            <button
              className="profile-trigger"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <img src={userLogo} alt="User" className="profile-avatar" />
              <div className="profile-info">
                <span className="profile-name">Joshua Riana</span>
                <span className="profile-role">Administrator</span>
              </div>
              <span className={`dropdown-arrow ${isProfileOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <img src={userLogo} alt="User Avatar" className="dropdown-avatar" />
                  <div className="dropdown-user-info">
                    <h4>Joshua Riana</h4>
                    <p>Administrator</p>
                  </div>
                </div>
                
                <div className="dropdown-menu">
                  <button className="dropdown-item">
                    My Profile
                  </button>
                  <button className="dropdown-item">
                    Settings
                  </button>
                  <button className="dropdown-item">
                    Help & Support
                  </button>
                  <button className="dropdown-item logout">
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
      </header>

      {/* Main Page Content */}
      <main className="main">
        <div className="page-header">
          <h2 className="page-title">{getPageTitle()}</h2>
        </div>
        <div className="content-container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;