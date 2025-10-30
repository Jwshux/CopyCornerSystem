import React, { useState, useEffect } from "react";
import "./Transactions.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";

const API_BASE = "http://localhost:5000/api";

const Transactions = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("Pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const validateCustomerName = (name) => {
    if (!name || !name.trim()) return false;
    const nameRegex = /^[A-Za-z\s.,'-]+$/;
    return nameRegex.test(name);
  };

  // FIXED: Better transactions fetch with error handling
  const fetchTransactions = async (page = 1, status = "Pending") => {
    setLoading(true);
    try {
      const url = `${API_BASE}/transactions/status/${status}?page=${page}&per_page=10`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Transactions API Response:', data);
        
        if (data.transactions) {
          setTransactions(data.transactions);
          setCurrentPage(data.pagination?.page || 1);
          setTotalPages(data.pagination?.total_pages || 1);
        } else {
          setTransactions([]);
        }
      } else {
        console.error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Better products fetch
  const fetchAllProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products?page=1&per_page=100`);
      if (response.ok) {
        const data = await response.json();
        console.log('Products API Response:', data);
        
        if (data.products && Array.isArray(data.products)) {
          setAllProducts(data.products);
        } else if (Array.isArray(data)) {
          setAllProducts(data);
        } else {
          setAllProducts([]);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // FIXED: Better service types fetch
  const fetchServiceTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/service_types`);
      if (response.ok) {
        const data = await response.json();
        console.log('Service Types API Response:', data);
        
        let servicesData = [];
        if (Array.isArray(data)) {
          servicesData = data;
        } else if (data.service_types && Array.isArray(data.service_types)) {
          servicesData = data.service_types;
        }
        
        const activeServices = servicesData.filter(service => service.status === "Active");
        setServiceTypes(activeServices);
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
    }
  };

  useEffect(() => {
    fetchTransactions(1, activeTab);
    fetchAllProducts();
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    fetchTransactions(1, activeTab);
  }, [activeTab]);

  // FIXED: Better category detection
  const getCategoryForService = (serviceType) => {
    if (!serviceType) return null;
    const service = serviceTypes.find(s => s.service_name === serviceType);
    if (!service) return null;
    
    // Handle different data structures
    if (service.category_name) return service.category_name;
    if (service.category && typeof service.category === 'object') {
      return service.category.name;
    }
    if (service.category) return service.category;
    
    return null;
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

  // FIXED: Better product filtering
  const getProductsByCategory = (categoryName) => {
    if (!categoryName || !allProducts || allProducts.length === 0) return [];
    return allProducts.filter(product => {
      if (!product) return false;
      
      // Support both category_name (new) and category (old)
      let productCategory = '';
      if (product.category_name) {
        productCategory = product.category_name;
      } else if (product.category && typeof product.category === 'object') {
        productCategory = product.category.name || '';
      } else if (product.category) {
        productCategory = product.category;
      }
      
      return productCategory === categoryName;
    });
  };

  const getServiceOptions = (serviceType) => {
    if (!serviceType) return [];
    const category = getCategoryForService(serviceType);
    if (!category) return [];
    const products = getProductsByCategory(category);
    return products.map(product => product.product_name);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    if (name === "price_per_unit" || name === "quantity") {
      const price = parseFloat(updated.price_per_unit) || 0;
      const qty = parseFloat(updated.quantity) || 0;
      updated.total_amount = (price * qty).toFixed(2);
    }

    if (name === "service_type") {
      updated.paper_type = "";
      updated.size_type = "";
      updated.supply_type = "";
      updated.total_pages = "";
    }

    setFormData(updated);
  };

  const handleAdd = () => {
    const today = new Date();
    const phDate = new Date(today.getTime() + (8 * 60 * 60 * 1000));
    const dateString = phDate.toISOString().split('T')[0];
    
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
      date: dateString,
    });
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEdit = (transaction) => {
    if (transaction.status !== "Pending") {
      alert("Only pending transactions can be edited.");
      return;
    }

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
    
    if (!validateCustomerName(formData.customer_name)) {
      alert("Please enter a valid customer name (letters, spaces, periods, commas, hyphens only - no numbers or special characters)");
      return;
    }

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
        if (!isEditing) {
          setActiveTab("Pending");
          await fetchTransactions(1, "Pending");
        } else {
          await fetchTransactions(currentPage, activeTab);
        }
        
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
    if (transaction.status === "Pending") {
      alert("Pending transactions cannot be deleted. Please cancel them first.");
      return;
    }
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

  const serviceTypeOptions = serviceTypes.map(service => service.service_name);

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
          <button className="add-btn" onClick={handleAdd}>
            + Add Transaction
          </button>
        </div>
      </div>

      <div className="transaction-tabs">
        {["Pending", "Completed", "Cancelled"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

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
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                  <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                </div>
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
                    {t.status === "Pending" && (
                      <>
                        <button className="edit-btn" onClick={() => handleEdit(t)}>✏️ Edit</button>
                        <button className="complete-btn" onClick={() => handleComplete(t)}>✅ Complete</button>
                        <button className="cancel-btn-table" onClick={() => handleCancel(t)}>❌ Cancel</button>
                      </>
                    )}

                    {t.status === "Completed" && (
                      <button className="delete-btn" onClick={() => handleDelete(t)}>🗑️ Delete</button>
                    )}

                    {t.status === "Cancelled" && (
                      <button className="delete-btn" onClick={() => handleDelete(t)}>🗑️ Delete</button>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="12" style={{ textAlign: "center", padding: "20px" }}>
                No {activeTab.toLowerCase()} transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

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

      {/* ADD / EDIT MODAL */}
      {showFormModal && (
        <div className="overlay">
          <div className="add-form">
            <h3>
              {isEditing ? "Edit Transaction" : "Add Transaction"}
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