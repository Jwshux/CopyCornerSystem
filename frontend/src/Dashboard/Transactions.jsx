import React, { useState, useEffect } from "react";
import "./Transactions.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";

const API_BASE = "http://localhost:5000/api";

const Transactions = ({ showAddModal, onAddModalClose }) => {
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
    product_type: "",
    total_pages: "",
    price_per_unit: "",
    quantity: "",
    total_amount: "",
    status: "Pending",
    date: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Handle modal from parent
  useEffect(() => {
    if (showAddModal) {
      handleAdd();
    }
  }, [showAddModal]);

  const validateCustomerName = (name) => {
    if (!name || !name.trim()) return false;
    const nameRegex = /^[A-Za-z\s.,'-]+$/;
    return nameRegex.test(name);
  };

  // Fetch transactions
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

  // Fetch products
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

  // Fetch service types
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

  // DYNAMIC: Get category for service type
  const getServiceCategory = (serviceType) => {
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

  // DYNAMIC: Get products by category
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

  // DYNAMIC: Get product options for service type
  const getServiceOptions = (serviceType) => {
    if (!serviceType) return [];
    const category = getServiceCategory(serviceType);
    if (!category) return [];
    const products = getProductsByCategory(category);
    return products.map(product => product.product_name);
  };

  // DYNAMIC: Check if service has products
  const hasProductsForService = (serviceType) => {
    const category = getServiceCategory(serviceType);
    if (!category) return false;
    
    const products = getProductsByCategory(category);
    return products && products.length > 0;
  };

  // DYNAMIC: Get quantity placeholder based on service category
  const getQuantityPlaceholder = (serviceType) => {
    const category = getServiceCategory(serviceType);
    switch(category) {
      case "T-shirt": return "Number of shirts";
      case "Supplies": return "Number of items";
      case "Paper": return "Number of copies";
      default: return "Quantity";
    }
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
      // Reset all product-related fields when service type changes
      updated.paper_type = "";
      updated.size_type = "";
      updated.supply_type = "";
      updated.product_type = "";
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
      product_type: "",
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

    // Determine which product field to use based on service category
    const serviceCategory = getServiceCategory(transaction.service_type);
    let productType = "";
    if (serviceCategory === "Paper") {
      productType = transaction.paper_type || "";
    } else if (serviceCategory === "T-shirt") {
      productType = transaction.size_type || "";
    } else if (serviceCategory === "Supplies") {
      productType = transaction.supply_type || "";
    } else {
      // For new categories, use any available product field
      productType = transaction.paper_type || transaction.size_type || transaction.supply_type || "";
    }

    setFormData({
      queue_number: transaction.queue_number || "",
      transaction_id: transaction.transaction_id || "",
      customer_name: transaction.customer_name || "",
      service_type: transaction.service_type || "",
      paper_type: transaction.paper_type || "",
      size_type: transaction.size_type || "",
      supply_type: transaction.supply_type || "",
      product_type: productType,
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

    // DYNAMIC: Validate product selection for services that have products
    if (hasProductsForService(formData.service_type) && !formData.product_type) {
      alert(`Please select a product for ${formData.service_type} service`);
      return;
    }

    // DYNAMIC: Paper-specific validation
    const serviceCategory = getServiceCategory(formData.service_type);
    if (serviceCategory === "Paper" && (!formData.total_pages || formData.total_pages < 1)) {
      alert("Please enter total pages (minimum 1)");
      return;
    }

    try {
      // DYNAMIC: Set the appropriate product field based on service category for backend compatibility
      const serviceCategory = getServiceCategory(formData.service_type);
      let backendData = {
        customer_name: formData.customer_name,
        service_type: formData.service_type,
        paper_type: "",
        size_type: "",
        supply_type: "",
        total_pages: parseInt(formData.total_pages) || 0,
        price_per_unit: parseFloat(formData.price_per_unit) || 0,
        quantity: parseInt(formData.quantity) || 1,
        total_amount: parseFloat(formData.total_amount) || 0,
        status: formData.status,
        date: formData.date
      };

      // Set the appropriate field based on service category
      if (serviceCategory === "Paper") {
        backendData.paper_type = formData.product_type;
      } else if (serviceCategory === "T-shirt") {
        backendData.size_type = formData.product_type;
      } else if (serviceCategory === "Supplies") {
        backendData.supply_type = formData.product_type;
      } else {
        // For new categories, use paper_type as default
        backendData.paper_type = formData.product_type;
      }

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
        if (onAddModalClose) {
          onAddModalClose();
        }
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
      product_type: "",
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

  // DYNAMIC: Get service-specific information for display
  const getServiceSpecificInfo = (transaction) => {
    const serviceCategory = getServiceCategory(transaction.service_type);
    
    if (serviceCategory === "Paper") {
      return {
        type: transaction.paper_type || "—",
        details: transaction.total_pages ? `${transaction.total_pages} pages` : "—"
      };
    } else if (serviceCategory === "T-shirt") {
      return {
        type: transaction.size_type || "—",
        details: transaction.quantity ? `${transaction.quantity} shirts` : "—"
      };
    } else if (serviceCategory === "Supplies") {
      return {
        type: transaction.supply_type || "—",
        details: transaction.quantity ? `${transaction.quantity} items` : "—"
      };
    } else {
      // For new categories like "Flower" - use any available product field
      const productType = transaction.paper_type || transaction.size_type || transaction.supply_type || "—";
      return {
        type: productType,
        details: transaction.quantity ? `${transaction.quantity} items` : "—"
      };
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
      {/* Search bar only */}
      <div className="transactions-controls">
        <input
          type="text"
          placeholder="Search by Queue, Name, or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabs */}
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

      {/* Table */}
      <table className="transactions-table">
        <thead>
          <tr>
            <th>Queue #</th>
            <th>Transaction ID</th>
            <th>Customer</th>
            <th>Service Type</th>
            <th>Product</th>
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

              {/* DYNAMIC PRODUCT SELECTION - WORKS FOR ALL CATEGORIES */}
              {hasProductsForService(formData.service_type) && (
                <div className="form-group">
                  <label>Select Product:</label>
                  <select
                    name="product_type"
                    value={formData.product_type || ""}
                    onChange={(e) => {
                      const productName = e.target.value;
                      setFormData(prev => ({
                        ...prev, 
                        product_type: productName
                      }));
                    }}
                    required
                  >
                    <option value="">Select Product</option>
                    {getServiceOptions(formData.service_type).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* PAPER-SPECIFIC FIELD (Total Pages) */}
              {getServiceCategory(formData.service_type) === "Paper" && (
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
                    placeholder={getQuantityPlaceholder(formData.service_type)}
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
                  onClick={() => {
                    setShowFormModal(false);
                    if (onAddModalClose) {
                      onAddModalClose();
                    }
                  }}
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