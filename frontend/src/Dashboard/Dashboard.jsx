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
import ServiceTypes from "./ServiceTypes";

function AdminDashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [openSubmenus, setOpenSubmenus] = useState({
    Products: false,
    Staffs: false,
    "User Management": false,
    Transactions: false
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userRoleLevel, setUserRoleLevel] = useState(0); // Default to admin level
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const profileRef = useRef(null);

  // Get user role level immediately from user data or localStorage
  useEffect(() => {
    const getUserRoleLevel = async () => {
      try {
        // First try to get from localStorage (set during login)
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role_level !== undefined) {
            setUserRoleLevel(userData.role_level);
            return;
          }
        }
        
        // If not in localStorage, fetch from API
        if (user?.id) {
          const response = await fetch(`http://localhost:5000/api/users/${user.id}/role-level`);
          if (response.ok) {
            const data = await response.json();
            setUserRoleLevel(data.role_level);
            
            // Update localStorage with role level for future use
            const updatedUser = { ...user, role_level: data.role_level };
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        }
      } catch (error) {
        console.error('Error fetching user role level:', error);
      }
    };

    getUserRoleLevel();
  }, [user]);

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

  // Add logout function
  const handleLogout = () => {
    // Clear any stored user data
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    
    // Call the parent's logout function to go back to login
    if (onLogout) {
      onLogout();
    }
  };

  const toggleSubmenu = (menu) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Check if user can access a menu item based on role level
  const canAccessMenu = (menuItem) => {
    // Level 0 (Admin) can access everything
    if (userRoleLevel === 0) return true;
    
    // Level 1 (Staff) restrictions
    if (userRoleLevel === 1) {
      const restrictedMenus = [
        "User Management", 
        "Manage Roles", 
        "Manage Users", 
        "All Staffs"
      ];
      return !restrictedMenus.includes(menuItem);
    }
    
    return false;
  };

  // Get contextual welcome message based on current page
  const getWelcomeMessage = () => {
    const messages = {
      "Dashboard": "Here's your business overview",
      "All Products": "Manage your product inventory",
      "Categories": "Organize product categories",
      "Manage Roles": "Manage user Roles and permissions",
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
      "Manage Roles": "User Roles Management",
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
    // Check if user has access to the current page
    if (!canAccessMenu(activePage)) {
      return (
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      );
    }

    switch (activePage) {
      case "Dashboard":
        return <DashboardUI />;
      case "All Products":
        return <AllProducts 
          showAddModal={showAddProductModal}
          onAddModalClose={() => setShowAddProductModal(false)}
        />;
      case "Categories":
        return <Categories />;
      case "Manage Roles":
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
      case "Service Types":
        return <ServiceTypes />;
      default:
        return <DashboardUI />;
    }
  };

  // Menu items configuration
  const menuItems = [
    { 
      name: "Dashboard", 
      icon: "📊", 
      hasSubmenu: false 
    },
    { 
      name: "Products", 
      icon: "📦", 
      hasSubmenu: true,
      subItems: ["All Products", "Categories"]
    },
    { 
      name: "Staffs", 
      icon: "👥", 
      hasSubmenu: true,
      subItems: ["All Staffs", "Staffs Schedule"]
    },
    { 
      name: "Sales", 
      icon: "💰", 
      hasSubmenu: false 
    },
    { 
      name: "Transactions", 
      icon: "🧾", 
      hasSubmenu: true,
      subItems: ["Transactions", "Service Types"]
    },
    { 
      name: "User Management", 
      icon: "⚙️", 
      hasSubmenu: true,
      subItems: ["Manage Roles", "Manage Users"]
    },
  ];

  return (
    <div className="container">
      {/* Sidebar Menu */}
      <aside className="sidebar">
        <h2 className="logo">Copy Corner Hub</h2>

        <nav className="menu">
          {menuItems.map((item) => {
            // Skip rendering if user doesn't have access
            if (!canAccessMenu(item.name) && !item.subItems?.some(sub => canAccessMenu(sub))) {
              return null;
            }

            return (
              <div key={item.name}>
                {/* Main menu button */}
                <button
                  className={
                    activePage === item.name ||
                    (item.hasSubmenu && item.subItems.includes(activePage))
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    // For main pages without submenus
                    if (!item.hasSubmenu) {
                      setActivePage(item.name);
                      return;
                    }
                    
                    // For pages with submenus - just toggle the submenu
                    toggleSubmenu(item.name);
                  }}
                  disabled={!canAccessMenu(item.name) && item.hasSubmenu}
                >
                  <span className="menu-icon">{item.icon}</span>
                  {item.name}
                  {item.hasSubmenu && (
                    <span className={`dropdown-arrow ${openSubmenus[item.name] ? 'open' : ''}`}>
                      ▼
                    </span>
                  )}
                </button>

                {/* Submenus */}
                {item.hasSubmenu && openSubmenus[item.name] && (
                  <div className="submenu">
                    {item.subItems.map((sub) => {
                      // Skip rendering submenu items user doesn't have access to
                      if (!canAccessMenu(sub)) return null;
                      
                      return (
                        <button
                          key={sub}
                          className={activePage === sub ? "active-sub" : ""}
                          onClick={() => setActivePage(sub)}
                        >
                          <span className="submenu-icon">
                            {sub === "All Products" ? "📋" : 
                             sub === "Categories" ? "🏷️" :
                             sub === "All Staffs" ? "👨‍💼" :
                             sub === "Staffs Schedule" ? "📅" :
                             sub === "Transactions" ? "📝" :
                             sub === "Service Types" ? "🔧" :
                             sub === "Manage Roles" ? "👥" : "👤"}
                          </span>
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Header Section */}
      <header className="header">
        <div className="welcome-section">
          <h1>Welcome, {user?.name || "User"}</h1>
          <p className="welcome-subtitle">{getWelcomeMessage()}</p>
        </div>
        
        {/* Profile Section */}
        <div className="profile-section" ref={profileRef}>
          <button
            className="profile-trigger"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <img src={userLogo} alt="User" className="profile-avatar" />
            <div className="profile-info">
              <span className="profile-name">{user?.name || "User"}</span>
              <span className="profile-role">
                {userRoleLevel === 0 ? "Administrator" : "Staff Member"}
              </span>
            </div>
            <span className={`dropdown-arrow ${isProfileOpen ? 'open' : ''}`}>▼</span>
          </button>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <img src={userLogo} alt="User Avatar" className="dropdown-avatar" />
                <div className="dropdown-user-info">
                  <h4>{user?.name || "User"}</h4>
                  <p>{userRoleLevel === 0 ? "Administrator" : "Staff Member"}</p>
                </div>
              </div>
              
              <div className="dropdown-menu">
                <button className="dropdown-item">
                  My Activity
                </button>
                <button className="dropdown-item">
                  System Logs
                </button>
                <button className="dropdown-item">
                  About
                </button>
                <button className="dropdown-item logout" onClick={handleLogout}>
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
          {activePage === "All Products" && (
            <button className="add-product-btn" onClick={() => setShowAddProductModal(true)}>
              Add Product
            </button>
          )}
        </div>
        <div className="content-container">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;