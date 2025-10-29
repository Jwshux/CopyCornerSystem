import React, { useState, useEffect } from "react";
import "./Transactions.css";

const API_BASE = "http://localhost:5000/api";

const Transactions = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]); // NEW: Dynamic service types
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // === Modal states ===
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // === Form Data ===
  const [formData, setFormData] = useState({
    queue_number: "",
    transaction_id: "",
    customer_name: "",
    service_type: "",
    paper_type: "",
    size_type: "",
    supply_type: "",
    total_pages: "",
    price_per_unit: "",
    quantity: "",
    total_amount: "",
    status: "Pending",
    date: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ==========================
  // Validation Functions
  // ==========================

  // Validate customer name (letters, spaces, periods, commas, hyphens only - no numbers)
  const validateCustomerName = (name) => {
    if (!name || !name.trim()) return false;
    // Allow letters, spaces, periods, commas, hyphens, apostrophes
    const nameRegex = /^[A-Za-z\s.,'-]+$/;
    return nameRegex.test(name);
  };

  // ==========================
  // Fetch Data
  // ==========================
  
  const fetchTransactions = async (page = 1, status = "All") => {
    setLoading(true);
    try {
      let url = `${API_BASE}/transactions?page=${page}&per_page=10`;
      if (status !== "All") {
        url = `${API_BASE}/transactions/status/${status}?page=${page}&per_page=10`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
      } else {
        console.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all products for category-based filtering
  const fetchAllProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products?page=1&per_page=100`);
      if (response.ok) {
        const data = await response.json();
        setAllProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // NEW: Fetch service types from backend
  const fetchServiceTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/service_types`);
      if (response.ok) {
        const data = await response.json();
        // Filter only active service types
        const activeServices = data.filter(service => service.status === "Active");
        setServiceTypes(activeServices);
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
    }
  };

  useEffect(() => {
    fetchTransactions(1, activeTab);
    fetchAllProducts();
    fetchServiceTypes(); // NEW: Fetch service types on component mount
  }, []);

  useEffect(() => {
    fetchTransactions(1, activeTab);
  }, [activeTab]);

  // ==========================
  // Service Type Logic - UPDATED TO USE DYNAMIC SERVICE TYPES
  // ==========================

  // Get service type options for dropdown (only active ones)
  const serviceTypeOptions = serviceTypes.map(service => service.service_name);

  // Service Type to Category Mapping - UPDATED TO USE DYNAMIC CATEGORIES
  const getCategoryForService = (serviceType) => {
    if (!serviceType) return null;
    
    // Find the service type in our dynamic list and get its category
    const service = serviceTypes.find(s => s.service_name === serviceType);
    return service ? service.category : null;
  };

  const isPaperService = (serviceType) => {
    const category = getCategoryForService(serviceType);
    return category === "Paper";
  };

  const isTshirtService = (serviceType) => {
    const category = getCategoryForService(serviceType);
    return category === "T-shirt";
  };

  const isSuppliesService = (serviceType) => {
    const category = getCategoryForService(serviceType);
    return category === "Supplies";
  };

  // Get products by category for dropdowns
  const getProductsByCategory = (categoryName) => {
    if (!categoryName || !allProducts || allProducts.length === 0) return [];
    
    return allProducts.filter(product => 
      product && product.category && product.category === categoryName
    );
  };

  // Get dropdown options based on service type
  const getServiceOptions = (serviceType) => {
    if (!serviceType) return [];
    
    const category = getCategoryForService(serviceType);
    if (!category) return [];
    
    const products = getProductsByCategory(category);
    return products.map(product => product.product_name);
  };

  // ==========================
  // Handlers
  // ==========================
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    // Auto-calculate total amount when price or quantity changes
    if (name === "price_per_unit" || name === "quantity") {
      const price = parseFloat(updated.price_per_unit) || 0;
      const qty = parseFloat(updated.quantity) || 0;
      updated.total_amount = (price * qty).toFixed(2);
    }

    // Reset service-specific fields when service type changes
    if (name === "service_type") {
      updated.paper_type = "";
      updated.size_type = "";
      updated.supply_type = "";
      updated.total_pages = "";
    }

    setFormData(updated);
  };

  const handleAdd = () => {
    setFormData({
      queue_number: "",
      transaction_id: "",
      customer_name: "",
      service_type: "",
      paper_type: "",
      size_type: "",
      supply_type: "",
      total_pages: "",
      price_per_unit: "",
      quantity: "",
      total_amount: "",
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
    });
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEdit = (transaction) => {
    setFormData({
      queue_number: transaction.queue_number || "",
      transaction_id: transaction.transaction_id || "",
      customer_name: transaction.customer_name || "",
      service_type: transaction.service_type || "",
      paper_type: transaction.paper_type || "",
      size_type: transaction.size_type || "",
      supply_type: transaction.supply_type || "",
      total_pages: transaction.total_pages || "",
      price_per_unit: transaction.price_per_unit || "",
      quantity: transaction.quantity || "",
      total_amount: transaction.total_amount || "",
      status: transaction.status || "Pending",
      date: transaction.date || new Date().toISOString().split("T")[0],
    });
    setEditIndex(transaction._id);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate customer name
    if (!validateCustomerName(formData.customer_name)) {
      alert("Please enter a valid customer name (letters, spaces, periods, commas, hyphens only - no numbers or special characters)");
      return;
    }

    // Validate service-specific fields
    if (isPaperService(formData.service_type) && !formData.paper_type) {
      alert("Please select a paper type for this service");
      return;
    }

    if (isPaperService(formData.service_type) && (!formData.total_pages || formData.total_pages < 1)) {
      alert("Please enter total pages (minimum 1)");
      return;
    }

    if (isTshirtService(formData.service_type) && !formData.size_type) {
      alert("Please select a size for T-shirt printing");
      return;
    }

    if (isSuppliesService(formData.service_type) && !formData.supply_type) {
      alert("Please select a school supply item");
      return;
    }

    try {
      const backendData = {
        customer_name: formData.customer_name,
        service_type: formData.service_type,
        paper_type: formData.paper_type || "",
        size_type: formData.size_type || "",
        supply_type: formData.supply_type || "",
        total_pages: parseInt(formData.total_pages) || 0,
        price_per_unit: parseFloat(formData.price_per_unit) || 0,
        quantity: parseInt(formData.quantity) || 1,
        total_amount: parseFloat(formData.total_amount) || 0,
        status: formData.status,
        date: formData.date
      };

      const url = isEditing 
        ? `${API_BASE}/transactions/${editIndex}`
        : `${API_BASE}/transactions`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData),
      });

      if (response.ok) {
        await fetchTransactions(currentPage, activeTab);
        setShowFormModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${isEditing ? 'update' : 'create'} transaction`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} transaction:`, error);
      alert(`Error ${isEditing ? 'updating' : 'creating'} transaction`);
    }
  };

  const handleDelete = async (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      const response = await fetch(`${API_BASE}/transactions/${transactionToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTransactions(currentPage, activeTab);
        setShowDeleteModal(false);
        setTransactionToDelete(null);
      } else {
        console.error('Failed to delete transaction');
        alert('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction');
    }
  };

  const handleComplete = async (transaction) => {
    try {
      const response = await fetch(`${API_BASE}/transactions/${transaction._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: transaction.customer_name,
          service_type: transaction.service_type,
          paper_type: transaction.paper_type,
          size_type: transaction.size_type,
          supply_type: transaction.supply_type,
          total_pages: transaction.total_pages,
          price_per_unit: transaction.price_per_unit,
          quantity: transaction.quantity,
          total_amount: transaction.total_amount,
          date: transaction.date,
          status: "Completed"
        }),
      });

      if (response.ok) {
        await fetchTransactions(currentPage, activeTab);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to complete transaction');
      }
    } catch (error) {
      console.error('Error completing transaction:', error);
      alert('Error completing transaction');
    }
  };

  const handleCancel = async (transaction) => {
    try {
      const response = await fetch(`${API_BASE}/transactions/${transaction._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: transaction.customer_name,
          service_type: transaction.service_type,
          paper_type: transaction.paper_type,
          size_type: transaction.size_type,
          supply_type: transaction.supply_type,
          total_pages: transaction.total_pages,
          price_per_unit: transaction.price_per_unit,
          quantity: transaction.quantity,
          total_amount: transaction.total_amount,
          date: transaction.date,
          status: "Cancelled"
        }),
      });

      if (response.ok) {
        await fetchTransactions(currentPage, activeTab);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to cancel transaction');
      }
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      alert('Error cancelling transaction');
    }
  };

  const resetForm = () => {
    setFormData({
      queue_number: "",
      transaction_id: "",
      customer_name: "",
      service_type: "",
      paper_type: "",
      size_type: "",
      supply_type: "",
      total_pages: "",
      price_per_unit: "",
      quantity: "",
      total_amount: "",
      status: "Pending",
      date: "",
    });
    setEditIndex(null);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchTransactions(currentPage + 1, activeTab);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchTransactions(currentPage - 1, activeTab);
    }
  };

  const formatPeso = (amount) =>
    `₱${parseFloat(amount).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
    })}`;

  const getServiceSpecificInfo = (transaction) => {
    if (isPaperService(transaction.service_type)) {
      return {
        type: transaction.paper_type || "—",
        details: transaction.total_pages ? `${transaction.total_pages} pages` : "—"
      };
    } else if (isTshirtService(transaction.service_type)) {
      return {
        type: transaction.size_type || "—",
        details: transaction.quantity ? `${transaction.quantity} shirts` : "—"
      };
    } else if (isSuppliesService(transaction.service_type)) {
      return {
        type: transaction.supply_type || "—",
        details: transaction.quantity ? `${transaction.quantity} items` : "—"
      };
    } else {
      return { type: "—", details: "—" };
    }
  };

  const filteredTransactions = transactions.filter(
    (t) =>
      (t.customer_name && t.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.queue_number && t.queue_number.includes(searchTerm)) ||
      (t.transaction_id && t.transaction_id.includes(searchTerm))
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
            <th>Type/Size</th>
            <th>Details</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="12" style={{ textAlign: "center", padding: "20px" }}>
                Loading transactions...
              </td>
            </tr>
          ) : filteredTransactions.length > 0 ? (
            filteredTransactions.map((t, index) => {
              const serviceInfo = getServiceSpecificInfo(t);
              return (
                <tr key={t._id}>
                  <td className="queue-number">{t.queue_number}</td>
                  <td>{t.transaction_id}</td>
                  <td>{t.customer_name}</td>
                  <td>{t.service_type}</td>
                  <td>{serviceInfo.type}</td>
                  <td>{serviceInfo.details}</td>
                  <td>{formatPeso(t.price_per_unit)}</td>
                  <td>{t.quantity}</td>
                  <td>{formatPeso(t.total_amount)}</td>
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
                        <button className="edit-btn" onClick={() => handleEdit(t)}>✏️</button>
                        <button className="complete-btn" onClick={() => handleComplete(t)}>✅</button>
                        <button className="cancel-btn-table" onClick={() => handleCancel(t)}>❌</button>
                      </>
                    )}

                    {/* All tab actions */}
                    {activeTab === "All" && (
                      <>
                        <button className="edit-btn" onClick={() => handleEdit(t)}>Update</button>
                        <button className="cancel-btn-table" onClick={() => handleCancel(t)}>Cancel</button>
                      </>
                    )}

                    {/* Completed or Cancelled tab actions */}
                    {(activeTab === "Completed" || activeTab === "Cancelled") && (
                      <>
                        <button className="edit-btn" onClick={() => handleEdit(t)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDelete(t)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="12" style={{ textAlign: "center", padding: "20px" }}>
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* PAGINATION CONTROLS */}
      <div className="simple-pagination">
        <button 
          className="pagination-btn" 
          onClick={handlePrevPage}
          disabled={currentPage === 1 || loading}
        >
          Previous
        </button>
        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button 
          className="pagination-btn" 
          onClick={handleNextPage}
          disabled={currentPage === totalPages || loading}
        >
          Next
        </button>
      </div>

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
                    value={formData.queue_number || "Auto-generated"}
                    readOnly
                    className="readonly-field"
                  />
                </div>
                <div className="form-group">
                  <label>Transaction ID:</label>
                  <input
                    type="text"
                    value={formData.transaction_id || "Auto-generated"}
                    readOnly
                    className="readonly-field"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Customer Name:</label>
                <input
                  type="text"
                  name="customer_name"
                  placeholder="Customer Name (e.g., Juan Dela Cruz)"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {/* Service Type Dropdown - NOW DYNAMIC */}
              <div className="form-group">
                <label>Service Type:</label>
                <select
                  name="service_type"
                  value={formData.service_type}
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
              </div>

              {/* PAPER-BASED SERVICES: Dynamic Paper Type from Category */}
              {isPaperService(formData.service_type) && (
                <>
                  <div className="form-group">
                    <label>Paper Type:</label>
                    <select
                      name="paper_type"
                      value={formData.paper_type}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Paper Type</option>
                      {getServiceOptions(formData.service_type).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Total Pages:</label>
                    <input
                      type="number"
                      name="total_pages"
                      placeholder="Number of pages"
                      value={formData.total_pages}
                      onChange={handleChange}
                      required
                      min="1"
                    />
                  </div>
                </>
              )}

              {/* T-SHIRT PRINTING: Dynamic Sizes from Category */}
              {isTshirtService(formData.service_type) && (
                <div className="form-group">
                  <label>Shirt Size/Type:</label>
                  <select
                    name="size_type"
                    value={formData.size_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Size/Type</option>
                    {getServiceOptions(formData.service_type).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* SCHOOL SUPPLIES: Dynamic Supplies from Category */}
              {isSuppliesService(formData.service_type) && (
                <div className="form-group">
                  <label>School Supply Item:</label>
                  <select
                    name="supply_type"
                    value={formData.supply_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Supply Item</option>
                    {getServiceOptions(formData.service_type).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Price per Unit:</label>
                  <input
                    type="number"
                    name="price_per_unit"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.price_per_unit}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder={
                      isTshirtService(formData.service_type) ? "Number of shirts" :
                      isSuppliesService(formData.service_type) ? "Number of items" :
                      "Number of copies"
                    }
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Total Amount:</label>
                <input
                  type="text"
                  value={formatPeso(formData.total_amount || 0)}
                  readOnly
                  className="readonly-field total-amount"
                />
              </div>

              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Allow status editing only in All tab */}
              {activeTab === "All" && (
                <div className="form-group">
                  <label>Status:</label>
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
                </div>
              )}

              <div className="form-buttons">
                <button type="submit" className="save-btn">
                  {isEditing ? "Update" : "Save"}
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
              <strong>Queue #{transactionToDelete.queue_number}</strong> for{" "}
              <strong>{transactionToDelete.customer_name}</strong>?
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