import React, { useState } from "react";
import "./Dashboard.css";
import AllProducts from "./AllProducts";
import Categories from "./Categories";
import ManageGroup from "./ManageGroup";
import ManageUsers from "./ManageUsers";

function AdminDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");

  const getHeaderTitle = () => {
    switch (activePage) {
      case "Dashboard":
        return "Welcome Admin";
      case "All Products":
        return "All Products";
      case "Categories":
        return "Categories";
      case "Staff":
        return "Staff Management";
      case "Staff Sched":
        return "Staff Schedule";
      case "Sales":
        return "Sales Overview";
      case "Manage Groups":
        return "Group Management";
      case "Manage Users":
        return "User Management";
      default:
        return "Admin Dashboard";
    }
  };

  const renderContent = () => {
    switch (activePage) {
      case "Dashboard":
        return (
          <div>
            <h2>Dashboard Overview</h2>
            <div className="card-grid">
              <div className="card">Total Users: 120</div>
              <div className="card">Sales: $5,200</div>
              <div className="card">Pending Orders: 8</div>
            </div>
          </div>
        );

      case "All Products":
        return <AllProducts />;

      case "Categories":
        return <Categories />;

      case "Manage Groups":
        return <ManageGroup />;

      case "Manage Users":
        return <ManageUsers />;

      case "Staff":
        return (
          <div>
            <h2>Staff</h2>
            <p>List of staff members and their details here.</p>
          </div>
        );

      case "Staff Sched":
        return (
          <div>
            <h2>Staff Schedule</h2>
            <p>Schedule overview and time slots here.</p>
          </div>
        );

      case "Sales":
        return (
          <div>
            <h2>Sales Report</h2>
            <p>Charts or sales data will be displayed here.</p>
          </div>
        );

      case "Manage Groups":
        return (
          <div>
            <h2>Manage Groups</h2>
            <p>Group list and permission settings will go here.</p>
          </div>
        );

      case "Manage Users":
        return (
          <div>
            <h2>Manage Users</h2>
            <p>List of users and management options will go here.</p>
          </div>
        );

      default:
        return <h2>Welcome Admin</h2>;
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1>{getHeaderTitle()}</h1>
      </header>

      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">PDM INVENTORY</h2>

        {/* Sidebar Menu */}
        <nav className="menu">
          {[
            "Dashboard",
            "Products",
            "Staff",
            "Staff Sched",
            "Sales",
            "User Management",
          ].map((page) => (
            <div key={page}>
              {/* Main menu button */}
              <button
                className={
                  activePage === page ||
                  (page === "Products" &&
                    ["All Products", "Categories"].includes(activePage)) ||
                  (page === "User Management" &&
                    ["Manage Groups", "Manage Users"].includes(activePage))
                    ? "active"
                    : ""
                }
                onClick={() => {
                  if (page === "Products") {
                    // Toggle Products submenu
                    if (activePage === "Products") {
                      setActivePage("");
                    } else {
                      setActivePage("All Products");
                    }
                  } else if (page === "User Management") {
                    // Toggle User Management submenu
                    if (activePage === "User Management") {
                      setActivePage("");
                    } else {
                      setActivePage("Manage Groups");
                    }
                  } else {
                    setActivePage(page);
                  }
                }}
              >
                {page}
              </button>

              {/* Products submenu */}
              {page === "Products" &&
                ["All Products", "Categories"].includes(activePage) && (
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

              {/* User Management submenu */}
              {page === "User Management" &&
                ["Manage Groups", "Manage Users"].includes(activePage) && (
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

      {/* Main */}
      <main className="main">{renderContent()}</main>

      {/* Footer */}
      <footer className="footer">
        <p></p>
      </footer>
    </div>
  );
}

export default AdminDashboard;
