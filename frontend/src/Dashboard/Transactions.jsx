// import React, { useState } from "react";
// import "./Transactions.css";

// const Transactions = () => {
//   const [transactions, setTransactions] = useState([
//     {
//       transactionId: "T-001",
//       customerName: "Juan Dela Cruz",
//       section: "BSIT 3A",
//       serviceType: "Black & White Printing",
//       pricePerUnit: "3",
//       quantity: "20",
//       totalAmount: "60.00",
//       status: "Completed",
//       date: "2025-10-20",
//     },
//     {
//       transactionId: "T-002",
//       customerName: "Maria Santos",
//       section: "BSED 2B",
//       serviceType: "Full Colored Printing",
//       pricePerUnit: "10",
//       quantity: "10",
//       totalAmount: "100.00",
//       status: "Pending",
//       date: "2025-10-21",
//     },
//     {
//       transactionId: "T-003",
//       customerName: "Pedro Ramirez",
//       section: "BSBA 1C",
//       serviceType: "Thesis Hardbound",
//       pricePerUnit: "400",
//       quantity: "1",
//       totalAmount: "400.00",
//       status: "Completed",
//       date: "2025-10-19",
//     },
//   ]);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [editIndex, setEditIndex] = useState(null);
//   const [formData, setFormData] = useState({
//     transactionId: "",
//     customerName: "",
//     section: "",
//     serviceType: "",
//     pricePerUnit: "",
//     quantity: "",
//     totalAmount: "",
//     status: "Pending",
//     date: "",
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     let updated = { ...formData, [name]: value };

//     if (name === "pricePerUnit" || name === "quantity") {
//       const price = parseFloat(updated.pricePerUnit) || 0;
//       const qty = parseFloat(updated.quantity) || 0;
//       updated.totalAmount = (price * qty).toFixed(2);
//     }

//     setFormData(updated);
//   };

//   const handleAdd = () => {
//     setFormData({
//       transactionId: `T-${String(transactions.length + 1).padStart(3, "0")}`,
//       customerName: "",
//       section: "",
//       serviceType: "",
//       pricePerUnit: "",
//       quantity: "",
//       totalAmount: "",
//       status: "Pending",
//       date: new Date().toISOString().split("T")[0],
//     });
//     setEditIndex(null);
//     setShowModal(true);
//   };

//   const handleSave = () => {
//     if (editIndex !== null) {
//       const updated = [...transactions];
//       updated[editIndex] = formData;
//       setTransactions(updated);
//     } else {
//       setTransactions([...transactions, formData]);
//     }
//     setShowModal(false);
//   };

//   const handleEdit = (index) => {
//     setFormData(transactions[index]);
//     setEditIndex(index);
//     setShowModal(true);
//   };

//   const handleDelete = (index) => {
//     const updated = [...transactions];
//     updated.splice(index, 1);
//     setTransactions(updated);
//   };

//   const filteredTransactions = transactions.filter(
//     (t) =>
//       t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       t.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const formatPeso = (amount) =>
//     `₱${parseFloat(amount).toLocaleString("en-PH", {
//       minimumFractionDigits: 2,
//     })}`;

//   return (
//     <div className="transactions-container">
//       <div className="transactions-header">
//         <h2>Transaction Records</h2>
//         <div className="transactions-controls">
//           <input
//             type="text"
//             placeholder="Search by name"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//           <button className="add-btn" onClick={handleAdd}>
//             + Add Transaction
//           </button>
//         </div>
//       </div>

//       <table className="transactions-table">
//         <thead>
//           <tr>
//             <th>Transaction ID</th>
//             <th>Customer Name</th>
//             <th>Section</th>
//             <th>Service Type</th>
//             <th>Price/Unit</th>
//             <th>Qty</th>
//             <th>Total</th>
//             <th>Status</th>
//             <th>Date</th>
//             <th>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filteredTransactions.length > 0 ? (
//             filteredTransactions.map((t, index) => (
//               <tr key={t.transactionId}>
//                 <td>{t.transactionId}</td>
//                <td>{t.customerName}</td>
//                 <td>{t.section}</td>
//                 <td>{t.serviceType}</td>
//                 <td>{formatPeso(t.pricePerUnit)}</td>
//                 <td>{t.quantity}</td>
//                 <td>{formatPeso(t.totalAmount)}</td>
//                 <td>
//                   <span
//                     className={`status-tag ${
//                       t.status === "Completed"
//                         ? "completed"
//                         : t.status === "Cancelled"
//                         ? "cancelled"
//                         : "pending"
//                     }`}
//                   >
//                     {t.status}
//                   </span>
//                 </td>
//                 <td>{t.date}</td>
//                 <td>
//                   <button className="edit-btn" onClick={() => handleEdit(index)}>
//                     Edit
//                   </button>
//                   <button className="delete-btn" onClick={() => handleDelete(index)}>
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
//                 No transactions found.
//               </td>
//             </tr>
//           )}
//         </tbody>
//       </table>

//       {showModal && (
//         <div className="modal-overlay">
//           <div className="modal">
//             <h3>{editIndex !== null ? "Edit Transaction" : "Add Transaction"}</h3>
//             <div className="form-grid">
//               <div className="form-group">
//                 <label>Customer Name:</label>
//                 <input
//                   name="customerName"
//                   value={formData.customerName}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Section:</label>
//                 <input
//                   name="section"
//                   value={formData.section}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Service Type:</label>
//                 <input
//                   name="serviceType"
//                   value={formData.serviceType}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Price per Unit:</label>
//                 <input
//                   type="number"
//                   name="pricePerUnit"
//                   value={formData.pricePerUnit}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Quantity:</label>
//                 <input
//                   type="number"
//                   name="quantity"
//                   value={formData.quantity}
//                   onChange={handleChange}
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Total Amount (₱):</label>
//                 <div className="readonly-field">
//                   {formatPeso(formData.totalAmount || 0)}
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label>Status:</label>
//                 <select
//                   name="status"
//                   value={formData.status}
//                   onChange={handleChange}
//                 >
//                   <option>Pending</option>
//                   <option>Completed</option>
//                   <option>Cancelled</option>
//                 </select>
//               </div>
//               <div className="form-group">
//                 <label>Date:</label>
//                 <input
//                   type="date"
//                   name="date"
//                   value={formData.date}
//                   onChange={handleChange}
//                 />
//               </div>
//             </div>

//             <div className="form-actions">
//               <button className="save-btn" onClick={handleSave}>
//                 Save
//               </button>
//               <button className="cancel-btn" onClick={() => setShowModal(false)}>
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Transactions;
import React, { useState } from "react";
import "./Transactions.css";

const Transactions = () => {
  // Service type options for dropdown
  const serviceTypeOptions = [
    "Printing",
    "Photocopying", 
    "Tshirt Printing",
    "Thesis Hardbound",
    "Softbind"
  ];

  const [transactions, setTransactions] = useState([
    {
      transactionId: "T-001",
      customerName: "Juan Dela Cruz",
      section: "BSIT31A",
      serviceType: "Photocopying", // Updated to match dropdown options
      pricePerUnit: "20",
      quantity: "1",
      totalAmount: "20.00",
      status: "Pending",
      date: "2025-10-20",
    },
    {
      transactionId: "T-002",
      customerName: "Maria Santos",
      section: "BSED21B",
      serviceType: "Printing", // Updated to match dropdown options
      pricePerUnit: "10",
      quantity: "10",
      totalAmount: "100.00",
      status: "Pending",
      date: "2025-10-21",
    },
    {
      transactionId: "T-003",
      customerName: "Pedro Ramirez",
      section: "BSBA12C",
      serviceType: "Thesis Hardbound",
      pricePerUnit: "400",
      quantity: "1",
      totalAmount: "400.00",
      status: "Completed",
      date: "2025-10-18",
    },
    {
      transactionId: "T-004",
      customerName: "Ana Fuentes",
      section: "BSIT21B",
      serviceType: "Photocopying", // Updated to match dropdown options
      pricePerUnit: "1",
      quantity: "50",
      totalAmount: "50.00",
      status: "Completed",
      date: "2025-10-19",
    },
    {
      transactionId: "T-005",
      customerName: "Carlos Garcia",
      section: "BSOA22A",
      serviceType: "Photocopying", // Updated to match dropdown options
      pricePerUnit: "1",
      quantity: "5",
      totalAmount: "5.00",
      status: "Cancelled",
      date: "2025-10-17",
    },
    {
      transactionId: "T-006",
      customerName: "Sofia Reyes",
      section: "BSHM21C",
      serviceType: "Tshirt Printing", // Updated to match dropdown options
      pricePerUnit: "200",
      quantity: "5",
      totalAmount: "1000.00",
      status: "Cancelled",
      date: "2025-10-16",
    },
  ]);

  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // === Modal states ===
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // === Form Data ===
  const [formData, setFormData] = useState({
    transactionId: "",
    customerName: "",
    section: "",
    serviceType: "",
    pricePerUnit: "",
    quantity: "",
    totalAmount: "",
    status: "Pending",
    date: "",
  });

  // ==========================
  // Handlers
  // ==========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    if (name === "pricePerUnit" || name === "quantity") {
      const price = parseFloat(updated.pricePerUnit) || 0;
      const qty = parseFloat(updated.quantity) || 0;
      updated.totalAmount = (price * qty).toFixed(2);
    }

    setFormData(updated);
  };

  const handleAdd = () => {
    setFormData({
      transactionId: `T-${String(transactions.length + 1).padStart(3, "0")}`,
      customerName: "",
      section: "",
      serviceType: "", // Empty by default
      pricePerUnit: "",
      quantity: "",
      totalAmount: "",
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
    });
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEdit = (index) => {
    setFormData(transactions[index]);
    setEditIndex(index);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (isEditing && editIndex !== null) {
      const updated = [...transactions];
      updated[editIndex] = formData;
      setTransactions(updated);
    } else {
      setTransactions([...transactions, formData]);
    }
    setShowFormModal(false);
  };

  const handleDelete = (index) => {
    setTransactionToDelete(transactions[index]);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setTransactions((prev) =>
      prev.filter((t) => t.transactionId !== transactionToDelete.transactionId)
    );
    setShowDeleteModal(false);
    setTransactionToDelete(null);
  };

  const handleComplete = (index) => {
    const updated = [...transactions];
    updated[index].status = "Completed";
    setTransactions(updated);
  };

  const handleCancel = (index) => {
    const updated = [...transactions];
    updated[index].status = "Cancelled";
    setTransactions(updated);
  };

  const formatPeso = (amount) =>
    `₱${parseFloat(amount).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
    })}`;

  // Filter logic
  const filteredByTab = transactions.filter((t) => {
    if (activeTab === "All") return true;
    if (activeTab === "Pending") return t.status === "Pending";
    return t.status === activeTab;
  });

  const filteredTransactions = filteredByTab.filter(
    (t) =>
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h2>Transaction Records</h2>
        <div className="transactions-controls">
          <input
            type="text"
            placeholder="Search by Name or ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {activeTab === "All" && (
            <button className="add-btn" onClick={handleAdd}>
              + Add Transaction
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="transaction-tabs">
        {["All", "Pending", "Completed", "Cancelled"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <table className="transactions-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Customer</th>
            <th>Section</th>
            <th>Service Type</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((t, index) => (
              <tr key={t.transactionId}>
                <td>{t.transactionId}</td>
                <td>{t.customerName}</td>
                <td>{t.section}</td>
                <td>{t.serviceType}</td>
                <td>{formatPeso(t.pricePerUnit)}</td>
                <td>{t.quantity}</td>
                <td>{formatPeso(t.totalAmount)}</td>
                <td>{t.date}</td>
                <td>
                  <span
                    className={`status-tag ${
                      t.status === "Completed"
                        ? "completed"
                        : t.status === "Cancelled"
                        ? "cancelled"
                        : "pending"
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td>
                  {/* Pending tab actions */}
                  {activeTab === "Pending" && (
                    <>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(transactions.indexOf(t))}
                      >
                        ✏️
                      </button>
                      <button
                        className="complete-btn"
                        onClick={() => handleComplete(transactions.indexOf(t))}
                      >
                        ✅
                      </button>
                      <button
                        className="cancel-btn-table"
                        onClick={() => handleCancel(transactions.indexOf(t))}
                      >
                        ❌
                      </button>
                    </>
                  )}

                  {/* All tab actions */}
                  {activeTab === "All" && (
                    <>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(transactions.indexOf(t))}
                      >
                        Update
                      </button>
                      <button
                        className="cancel-btn-table"
                        onClick={() => handleCancel(transactions.indexOf(t))}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Completed or Cancelled tab actions */}
                  {(activeTab === "Completed" || activeTab === "Cancelled") && (
                    <>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(transactions.indexOf(t))}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(transactions.indexOf(t))}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ADD / EDIT / UPDATE MODAL */}
      {showFormModal && (
        <div className="overlay">
          <div className="add-form">
            <h3>
              {isEditing
                ? activeTab === "All"
                  ? "Update Transaction"
                  : "Edit Transaction"
                : "Add Transaction"}
            </h3>
            <form onSubmit={handleSave}>
              <input
                type="text"
                value={formData.transactionId}
                readOnly
                placeholder="Transaction ID"
              />
              <input
                type="text"
                name="customerName"
                placeholder="Customer Name"
                value={formData.customerName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="section"
                placeholder="Section"
                value={formData.section}
                onChange={handleChange}
                required
              />
              
              {/* Service Type Dropdown */}
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                required
              >
                <option value="">Select Service Type</option>
                {serviceTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <input
                type="number"
                name="pricePerUnit"
                placeholder="Price per Unit"
                value={formData.pricePerUnit}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                value={`₱${formData.totalAmount}`}
                readOnly
                placeholder="Total Amount"
              />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />

              {/* Allow status editing only in All tab */}
              {activeTab === "All" && (
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              )}

              <div className="form-buttons">
                <button type="submit" className="save-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowFormModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && transactionToDelete && (
        <div className="overlay">
          <div className="add-form delete-confirmation">
            <div className="delete-icon">🗑️</div>
            <h3>Delete Transaction</h3>
            <p>
              Are you sure you want to delete transaction{" "}
              <strong>"{transactionToDelete.transactionId}"</strong> for{" "}
              <strong>{transactionToDelete.customerName}</strong>?
            </p>
            <p className="delete-warning">This action cannot be undone.</p>

            <div className="form-buttons">
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                Yes, Delete
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;