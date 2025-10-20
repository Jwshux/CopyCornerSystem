import React, { useState } from "react";
import "./Dashboard.css";
import AllProducts from "./AllProducts";
import Categories from "./Categories";
import ManageGroup from "./ManageGroup";
import ManageUsers from "./ManageUsers";
import Sales from "./Sales";
import AllStaff from "./AllStaff"; // Import the AllStaff component

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
      case "All Staffs":
        return "All Staffs";
      case "Staffs Schedule":
        return "Staffs Schedule";
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

      case "All Staffs":
        return <AllStaff />; // Use the AllStaff component

      case "Staffs Schedule":
        return (
          <div>
            <h2>Staffs Schedule</h2>
            <p>Schedule overview and time slots here.</p>
          </div>
        );

      case "Sales":
        return <Sales />;

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
        <h2 className="logo">
          Copy Corner Hub
        </h2>

        {/* Sidebar Menu */}
        <nav className="menu">
          {[
            "Dashboard",
            "Products",
            "Staffs",
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
                  (page === "Staffs" &&
                    ["All Staffs", "Staffs Schedule"].includes(activePage)) ||
                  (page === "User Management" &&
                    ["Manage Groups", "Manage Users"].includes(activePage))
                    ? "active"
                    : ""
                }
                onClick={() => {
                  if (page === "Products") {
                    // Toggle Products submenu
                    if (["All Products", "Categories"].includes(activePage)) {
                      setActivePage("");
                    } else {
                      setActivePage("All Products");
                    }
                  } else if (page === "Staffs") {
                    // Toggle Staffs submenu - set "All Staffs" as default
                    if (["All Staffs", "Staffs Schedule"].includes(activePage)) {
                      setActivePage("");
                    } else {
                      setActivePage("All Staffs");
                    }
                  } else if (page === "User Management") {
                    // Toggle User Management submenu
                    if (["Manage Groups", "Manage Users"].includes(activePage)) {
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

              {/* Staffs submenu */}
              {page === "Staffs" &&
                ["All Staffs", "Staffs Schedule"].includes(activePage) && (
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