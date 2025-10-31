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
  const [userRoleLevel, setUserRoleLevel] = useState(0);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showAddServiceTypeModal, setShowAddServiceTypeModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const getUserRoleLevel = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role_level !== undefined) {
            setUserRoleLevel(userData.role_level);
            return;
          }
        }
        
        if (user?.id) {
          const response = await fetch(`http://localhost:5000/api/users/${user.id}/role-level`);
          if (response.ok) {
            const data = await response.json();
            setUserRoleLevel(data.role_level);
            
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    
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

  const canAccessMenu = (menuItem) => {
    if (userRoleLevel === 0) return true;
    
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

  const renderContent = () => {
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
        return <ManageGroup 
          showAddModal={showAddRoleModal}
          onAddModalClose={() => setShowAddRoleModal(false)}
        />;
      case "Manage Users":
        return <ManageUsers 
          showAddModal={showAddUserModal}
          onAddModalClose={() => setShowAddUserModal(false)}
        />;
      case "All Staffs":
        return <AllStaff />;
      case "Staffs Schedule":
        return <StaffSchedule 
          showAddModal={showAddScheduleModal}
          onAddModalClose={() => setShowAddScheduleModal(false)}
        />;
      case "Sales":
        return <Sales />;
      case "Transactions":
        return <Transactions 
          showAddModal={showAddTransactionModal}
          onAddModalClose={() => setShowAddTransactionModal(false)}
        />;
      case "Service Types":
        return <ServiceTypes 
          showAddModal={showAddServiceTypeModal}
          onAddModalClose={() => setShowAddServiceTypeModal(false)}
        />;
      default:
        return <DashboardUI />;
    }
  };

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
      <aside className="sidebar">
        <h2 className="logo">Copy Corner Hub</h2>

        <nav className="menu">
          {menuItems.map((item) => {
            if (!canAccessMenu(item.name) && !item.subItems?.some(sub => canAccessMenu(sub))) {
              return null;
            }

            return (
              <div key={item.name}>
                <button
                  className={
                    activePage === item.name ||
                    (item.hasSubmenu && item.subItems.includes(activePage))
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    if (!item.hasSubmenu) {
                      setActivePage(item.name);
                      return;
                    }
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

                {item.hasSubmenu && openSubmenus[item.name] && (
                  <div className="submenu">
                    {item.subItems.map((sub) => {
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

      <header className="header">
        <div className="welcome-section">
          <h1>Welcome, {user?.name || "User"}</h1>
          <p className="welcome-subtitle">{getWelcomeMessage()}</p>
        </div>
        
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

      <main className="main">
        <div className="page-header">
          <h2 className="page-title">{getPageTitle()}</h2>
          {activePage === "All Products" && (
            <button className="add-product-btn" onClick={() => setShowAddProductModal(true)}>
              Add Product
            </button>
          )}
          {activePage === "Staffs Schedule" && (
            <button className="add-schedule-btn" onClick={() => setShowAddScheduleModal(true)}>
              Add Schedule
            </button>
          )}
          {activePage === "Transactions" && (
            <button className="add-transaction-btn" onClick={() => setShowAddTransactionModal(true)}>
              Add Transaction
            </button>
          )}
          {activePage === "Service Types" && (
            <button className="add-service-type-btn" onClick={() => setShowAddServiceTypeModal(true)}>
              Add Service Type
            </button>
          )}
          {activePage === "Manage Roles" && (
            <button className="add-role-btn" onClick={() => setShowAddRoleModal(true)}>
              Add New Role
            </button>
          )}
          {activePage === "Manage Users" && (
            <button className="add-user-btn" onClick={() => setShowAddUserModal(true)}>
              Add New User
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