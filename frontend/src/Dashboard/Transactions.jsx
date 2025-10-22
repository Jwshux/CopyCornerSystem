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
      queueNumber: "001",
      transactionId: "T-001",
      customerName: "J. Dela Cruz",
      serviceType: "Photocopying",
      pricePerUnit: "20",
      quantity: "1",
      totalAmount: "20.00",
      status: "Pending",
      date: "2025-10-20",
    },
    {
      queueNumber: "002",
      transactionId: "T-002",
      customerName: "M. Santos",
      serviceType: "Printing",
      pricePerUnit: "10",
      quantity: "10",
      totalAmount: "100.00",
      status: "Pending",
      date: "2025-10-21",
    },
    {
      queueNumber: "003",
      transactionId: "T-003",
      customerName: "P. Ramirez",
      serviceType: "Thesis Hardbound",
      pricePerUnit: "400",
      quantity: "1",
      totalAmount: "400.00",
      status: "Completed",
      date: "2025-10-18",
    },
    {
      queueNumber: "004",
      transactionId: "T-004",
      customerName: "A. Fuentes",
      serviceType: "Photocopying",
      pricePerUnit: "1",
      quantity: "50",
      totalAmount: "50.00",
      status: "Completed",
      date: "2025-10-19",
    },
    {
      queueNumber: "005",
      transactionId: "T-005",
      customerName: "C. Garcia",
      serviceType: "Photocopying",
      pricePerUnit: "1",
      quantity: "5",
      totalAmount: "5.00",
      status: "Cancelled",
      date: "2025-10-17",
    },
    {
      queueNumber: "006",
      transactionId: "T-006",
      customerName: "S. Reyes",
      serviceType: "Tshirt Printing",
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
    queueNumber: "",
    transactionId: "",
    customerName: "",
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

  const getNextQueueNumber = () => {
    if (transactions.length === 0) return "001";
    
    const lastQueueNumber = Math.max(
      ...transactions.map(t => parseInt(t.queueNumber))
    );
    return String(lastQueueNumber + 1).padStart(3, "0");
  };

  const handleAdd = () => {
    const nextQueue = getNextQueueNumber();
    setFormData({
      queueNumber: nextQueue,
      transactionId: `T-${nextQueue}`,
      customerName: "",
      serviceType: "",
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
      t.queueNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h2>Transaction Records</h2>
        <div className="transactions-controls">
          <input
            type="text"
            placeholder="Search by Queue, Name, or ID"
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
            <th>Queue #</th>
            <th>Transaction ID</th>
            <th>Customer</th>
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
                <td className="queue-number">{t.queueNumber}</td>
                <td>{t.transactionId}</td>
                <td>{t.customerName}</td>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Queue Number:</label>
                  <input
                    type="text"
                    value={formData.queueNumber}
                    readOnly
                    className="readonly-field"
                  />
                </div>
                <div className="form-group">
                  <label>Transaction ID:</label>
                  <input
                    type="text"
                    value={formData.transactionId}
                    readOnly
                    className="readonly-field"
                  />
                </div>
              </div>
              
              <input
                type="text"
                name="customerName"
                placeholder="Customer Name (e.g., J. Dela Cruz)"
                value={formData.customerName}
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

              <div className="form-row">
                <div className="form-group">
                  <label>Price per Unit:</label>
                  <input
                    type="number"
                    name="pricePerUnit"
                    placeholder="0.00"
                    value={formData.pricePerUnit}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Total Amount:</label>
                <input
                  type="text"
                  value={formatPeso(formData.totalAmount)}
                  readOnly
                  className="readonly-field total-amount"
                />
              </div>

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
              <strong>Queue #{transactionToDelete.queueNumber}</strong> for{" "}
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