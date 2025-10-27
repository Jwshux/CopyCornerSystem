// import React, { useState } from "react";
// import "./Dashboard.css";
// import AllProducts from "./AllProducts";
// import Categories from "./Categories";
// import ManageGroup from "./ManageGroup";
// import ManageUsers from "./ManageUsers";
// import Sales from "./Sales";
// import AllStaff from "./AllStaff";
// import StaffSchedule from "./StaffSchedule";
// import Transactions from "./Transactions"; // ✅ Added new Transactions page
// import DashboardUI from "./DashboardUI";

// function AdminDashboard() {
//   const [activePage, setActivePage] = useState("Dashboard");

//   const getHeaderTitle = () => {
//     switch (activePage) {
//       case "Dashboard":
//         return "Welcome Admin";
//       case "All Products":
//         return "All Products";
//       case "Categories":
//         return "Categories";
//       case "All Staffs":
//         return "All Staffs";
//       case "Staffs Schedule":
//         return "Staffs Schedule";
//       case "Sales":
//         return "Sales Overview";
//       case "Manage Groups":
//         return "Group Management";
//       case "Manage Users":
//         return "User Management";
//       case "Transactions":
//         return "Transactions Overview";
//       default:
//         return "Admin Dashboard";
//     }
//   };

//   const renderContent = () => {
//     switch (activePage) {
//       case "Dashboard":
//   return <DashboardUI />;
//       case "All Products":
//         return <AllProducts />;
//       case "Categories":
//         return <Categories />;
//       case "Manage Groups":
//         return <ManageGroup />;
//       case "Manage Users":
//         return <ManageUsers />;
//       case "All Staffs":
//         return <AllStaff />;
//       case "Staffs Schedule":
//         return <StaffSchedule />;
//       case "Sales":
//         return <Sales />;
//       case "Transactions":
//         return <Transactions />; // ✅ Added here
//       default:
//         return <h2>Welcome Admin</h2>;
//     }
//   };

//   return (
//     <div className="container">
//       {/* Header */}
//       <header className="header">
//         <h1>{getHeaderTitle()}</h1>
//       </header>

//       {/* Sidebar */}
//       <aside className="sidebar">
//         <h2 className="logo">Copy Corner Hub</h2>

//         {/* Sidebar Menu */}
//         <nav className="menu">
//           {[
//             "Dashboard",
//             "Products",
//             "Staffs",
//             "Sales",
//             "Transactions", // ✅ Added new menu item
//             "User Management",
//           ].map((page) => (
//             <div key={page}>
//               {/* Main menu button */}
//               <button
//                 className={
//                   activePage === page ||
//                   (page === "Products" &&
//                     ["All Products", "Categories"].includes(activePage)) ||
//                   (page === "Staffs" &&
//                     ["All Staffs", "Staffs Schedule"].includes(activePage)) ||
//                   (page === "User Management" &&
//                     ["Manage Groups", "Manage Users"].includes(activePage))
//                     ? "active"
//                     : ""
//                 }
//                 onClick={() => {
//                   if (page === "Products") {
//                     if (["All Products", "Categories"].includes(activePage)) {
//                       setActivePage("");
//                     } else {
//                       setActivePage("All Products");
//                     }
//                   } else if (page === "Staffs") {
//                     if (["All Staffs", "Staffs Schedule"].includes(activePage)) {
//                       setActivePage("");
//                     } else {
//                       setActivePage("All Staffs");
//                     }
//                   } else if (page === "User Management") {
//                     if (["Manage Groups", "Manage Users"].includes(activePage)) {
//                       setActivePage("");
//                     } else {
//                       setActivePage("Manage Groups");
//                     }
//                   } else {
//                     setActivePage(page);
//                   }
//                 }}
//               >
//                 {page}
//               </button>

//               {/* Products submenu */}
//               {page === "Products" &&
//                 ["All Products", "Categories"].includes(activePage) && (
//                   <div className="submenu">
//                     {["All Products", "Categories"].map((sub) => (
//                       <button
//                         key={sub}
//                         className={activePage === sub ? "active-sub" : ""}
//                         onClick={() => setActivePage(sub)}
//                       >
//                         {sub}
//                       </button>
//                     ))}
//                   </div>
//                 )}

//               {/* Staffs submenu */}
//               {page === "Staffs" &&
//                 ["All Staffs", "Staffs Schedule"].includes(activePage) && (
//                   <div className="submenu">
//                     {["All Staffs", "Staffs Schedule"].map((sub) => (
//                       <button
//                         key={sub}
//                         className={activePage === sub ? "active-sub" : ""}
//                         onClick={() => setActivePage(sub)}
//                       >
//                         {sub}
//                       </button>
//                     ))}
//                   </div>
//                 )}

//               {/* User Management submenu */}
//               {page === "User Management" &&
//                 ["Manage Groups", "Manage Users"].includes(activePage) && (
//                   <div className="submenu">
//                     {["Manage Groups", "Manage Users"].map((sub) => (
//                       <button
//                         key={sub}
//                         className={activePage === sub ? "active-sub" : ""}
//                         onClick={() => setActivePage(sub)}
//                       >
//                         {sub}
//                       </button>
//                     ))}
//                   </div>
//                 )}
//             </div>
//           ))}
//         </nav>
//       </aside>

//       {/* Main */}
//       <main className="main">{renderContent()}</main>

//       {/* Footer */}
//       <footer className="footer">
//         <p></p>
//       </footer>
//     </div>
//   );
// }

// export default AdminDashboard;
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
  // Track which page is active
  const [activePage, setActivePage] = useState("Dashboard");

  // For showing / hiding profile dropdown
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Used to detect click outside dropdown
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

  // Page title based on what user is viewing
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
      case "Transactions":
        return "Transactions Overview";
      default:
        return "Admin Dashboard";
    }
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
        {/* Left side - title */}
        <h1>{getHeaderTitle()}</h1>

        {/* Right side - Profile */}
        <div className="profile-section" ref={profileRef}>
          {/* Profile button */}
          <button
            className="profile-name"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            {/* Hide name if dropdown is open */}
            {!isProfileOpen && <span>Joshua Riana</span>}
            <img src={userLogo} alt="User Logo" />
          </button>

          {/* Dropdown when clicked */}
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
                    setActivePage(
                      ["All Products", "Categories"].includes(activePage)
                        ? ""
                        : "All Products"
                    );
                  } else if (page === "Staffs") {
                    setActivePage(
                      ["All Staffs", "Staffs Schedule"].includes(activePage)
                        ? ""
                        : "All Staffs"
                    );
                  } else if (page === "User Management") {
                    setActivePage(
                      ["Manage Groups", "Manage Users"].includes(activePage)
                        ? ""
                        : "Manage Groups"
                    );
                  } else {
                    setActivePage(page);
                  }
                }}
              >
                {page}
              </button>

              {/* Submenu buttons */}
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

      {/* Main Page Content */}
      <main className="main">{renderContent()}</main>

      {/* Footer (optional) */}
      <footer className="footer">
        <p></p>
      </footer>
    </div>
  );
}

export default AdminDashboard;