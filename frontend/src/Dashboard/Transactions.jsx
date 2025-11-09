import React, { useState, useEffect } from "react";
import "./Transactions.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE = "http://localhost:5000/api";

const Transactions = ({ showAddModal, onAddModalClose }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [archivedTransactions, setArchivedTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("Completed");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [transactionToArchive, setTransactionToArchive] = useState(null);
  const [transactionToRestore, setTransactionToRestore] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [customerNameError, setCustomerNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [pagesError, setPagesError] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    queue_number: "",
    transaction_id: "",
    customer_name: "",
    service_type: "",
    paper_type: "",
    size_type: "",
    supply_type: "",
    product_type: "",
    product_id: "",
    total_pages: "",
    price_per_unit: "",
    quantity: "",
    total_amount: "",
    status: "Pending",
    date: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [archivedTotalPages, setArchivedTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [archivedTotalCount, setArchivedTotalCount] = useState(0);
  const [showArchivedView, setShowArchivedView] = useState(false);

  // Handle modal from parent
  useEffect(() => {
    if (showAddModal) {
      handleAdd();
    }
  }, [showAddModal]);

  // Enhanced customer name validation
  const checkCustomerName = (customerName) => {
    if (!customerName) {
      setCustomerNameError("");
      return;
    }

    // Length validation
    if (customerName.length < 2) {
      setCustomerNameError("Customer name must be at least 2 characters long");
      return;
    }

    if (customerName.length > 100) {
      setCustomerNameError("Customer name must be less than 100 characters");
      return;
    }

    // Check if contains only numbers
    if (/^\d+$/.test(customerName)) {
      setCustomerNameError("Customer name cannot contain only numbers");
      return;
    }

    // Check if contains only special characters (no letters or numbers)
    if (/^[^a-zA-Z0-9]+$/.test(customerName)) {
      setCustomerNameError("Please enter a valid customer name");
      return;
    }

    // Check if contains at least one letter
    if (!/[a-zA-Z]/.test(customerName)) {
      setCustomerNameError("Customer name must contain at least one letter");
      return;
    }

    setCustomerNameError("");
  };

  // Price validation
  const checkPrice = (price) => {
    if (!price) {
      setPriceError("");
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setPriceError("Price must be greater than 0");
      return;
    }

    if (priceValue < 0.01) {
      setPriceError("Price must be at least 0.01");
      return;
    }

    setPriceError("");
  };

  // Quantity validation
  const checkQuantity = (quantity) => {
    if (!quantity) {
      setQuantityError("");
      return;
    }

    const quantityValue = parseInt(quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) {
      setQuantityError("Quantity must be greater than 0");
      return;
    }

    if (quantityValue < 1) {
      setQuantityError("Quantity must be at least 1");
      return;
    }

    setQuantityError("");
  };

  // Pages validation
  const checkPages = (pages) => {
    if (!pages) {
      setPagesError("");
      return;
    }

    const pagesValue = parseInt(pages);
    if (isNaN(pagesValue) || pagesValue <= 0) {
      setPagesError("Pages must be greater than 0");
      return;
    }

    if (pagesValue < 1) {
      setPagesError("Pages must be at least 1");
      return;
    }

    setPagesError("");
  };

  // Fetch active transactions
  const fetchTransactions = async (page = 1, status = "Completed") => {
    setLoading(true);
    try {
      const url = `${API_BASE}/transactions/status/${status}?page=${page}&per_page=${ITEMS_PER_PAGE}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Transactions API Response:', data);
        
        if (data.transactions) {
          setTransactions(data.transactions);
          setCurrentPage(data.pagination?.page || 1);
          setTotalPages(data.pagination?.total_pages || 1);
          setTotalCount(data.pagination?.total_transactions || data.transactions.length);
        } else {
          setTransactions([]);
          setTotalCount(0);
        }
      } else {
        console.error('Failed to fetch transactions');
        setTransactions([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived transactions
  const fetchArchivedTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const url = `${API_BASE}/transactions/archived?page=${page}&per_page=${ITEMS_PER_PAGE}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Handle both response formats
        if (Array.isArray(data)) {
          setArchivedTransactions(data);
          setArchivedCurrentPage(1);
          setArchivedTotalPages(1);
          setArchivedTotalCount(data.length);
        } else if (data.transactions) {
          setArchivedTransactions(data.transactions);
          setArchivedCurrentPage(data.pagination?.page || 1);
          setArchivedTotalPages(data.pagination?.total_pages || 1);
          setArchivedTotalCount(data.pagination?.total_transactions || data.transactions.length);
        } else {
          setArchivedTransactions([]);
          setArchivedTotalCount(0);
        }
      } else {
        console.error('Failed to fetch archived transactions');
        setArchivedTransactions([]);
        setArchivedTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching archived transactions:', error);
      setArchivedTransactions([]);
      setArchivedTotalCount(0);
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
    fetchTransactions(1, "Completed");
    fetchAllProducts();
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    if (!showArchivedView) {
      fetchTransactions(1, activeTab);
    }
  }, [activeTab, showArchivedView]);

  useEffect(() => {
    if (showArchivedView) {
      fetchArchivedTransactions(1);
    }
  }, [showArchivedView]);

  // DYNAMIC: Get category for service type
  const getServiceCategory = (serviceType) => {
    if (!serviceType) return null;
    const service = serviceTypes.find(s => s.service_name === serviceType);
    if (!service) return null;
    
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

  // DYNAMIC: Get product options for service type WITH STOCK STATUS
  const getServiceOptions = (serviceType) => {
    if (!serviceType) return [];
    const category = getServiceCategory(serviceType);
    if (!category) return [];
    const products = getProductsByCategory(category);
    
    return products.map(product => {
      const stock = parseInt(product.stock_quantity || 0);
      const minStock = parseInt(product.minimum_stock || 5);
      
      let status = "In Stock";
      let isDisabled = false;
      let statusColor = "";
      
      if (stock <= 0) {
        status = "Out of Stock";
        isDisabled = true;
        statusColor = "red";
      } else if (stock <= minStock) {
        status = "Low Stock";
        statusColor = "orange";
      }
      
      return {
        id: product._id,
        name: product.product_name,
        status: status,
        isDisabled: isDisabled,
        statusColor: statusColor,
        stockQuantity: stock
      };
    });
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

    // Real-time validation
    if (name === "customer_name") {
      checkCustomerName(value);
    } else if (name === "price_per_unit") {
      checkPrice(value);
    } else if (name === "quantity") {
      checkQuantity(value);
    } else if (name === "total_pages") {
      checkPages(value);
    }

    if (name === "price_per_unit" || name === "quantity") {
      const price = parseFloat(updated.price_per_unit) || 0;
      const qty = parseFloat(updated.quantity) || 0;
      
      if (price >= 0 && qty >= 0) {
        updated.total_amount = (price * qty).toFixed(2);
      } else {
        updated.total_amount = "0.00";
      }
    }

    if (name === "service_type") {
      updated.paper_type = "";
      updated.size_type = "";
      updated.supply_type = "";
      updated.product_type = "";
      updated.product_id = "";
      updated.total_pages = "";
      setPagesError("");
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
      product_id: "",
      total_pages: "",
      price_per_unit: "",
      quantity: "",
      total_amount: "",
      status: "Pending",
      date: dateString,
    });
    setCustomerNameError("");
    setPriceError("");
    setQuantityError("");
    setPagesError("");
    setIsEditing(false);
    setShowFormModal(true);
  };

  const handleEdit = (transaction) => {
    const serviceCategory = getServiceCategory(transaction.service_type);
    let productType = "";
    let productId = "";
    
    if (serviceCategory === "Paper") {
      productType = transaction.paper_type || "";
    } else if (serviceCategory === "T-shirt") {
      productType = transaction.size_type || "";
    } else if (serviceCategory === "Supplies") {
      productType = transaction.supply_type || "";
    } else {
      productType = transaction.paper_type || transaction.size_type || transaction.supply_type || "";
    }
    
    // Get product_id from transaction data or find by name
    if (transaction.product_id) {
      productId = transaction.product_id;
    } else if (productType && allProducts.length > 0) {
      const product = allProducts.find(p => p.product_name === productType);
      productId = product ? product._id : "";
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
      product_id: productId,
      total_pages: transaction.total_pages || "",
      price_per_unit: transaction.price_per_unit || "",
      quantity: transaction.quantity || "",
      total_amount: transaction.total_amount || "",
      status: transaction.status || "Completed",
      date: transaction.date || new Date().toISOString().split("T")[0],
    });
    setCustomerNameError("");
    setPriceError("");
    setQuantityError("");
    setPagesError("");
    setEditIndex(transaction._id);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    checkCustomerName(formData.customer_name);
    checkPrice(formData.price_per_unit);
    checkQuantity(formData.quantity);
    
    if (getServiceCategory(formData.service_type) === "Paper") {
      checkPages(formData.total_pages);
    }
    
    if (customerNameError || priceError || quantityError || pagesError) {
      alert("Please fix the validation errors before saving.");
      return;
    }

    // Additional validation for empty required fields
    if (!formData.customer_name.trim()) {
      setCustomerNameError("Customer name is required");
      return;
    }

    if (!formData.price_per_unit || parseFloat(formData.price_per_unit) <= 0) {
      setPriceError("Price must be greater than 0");
      return;
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setQuantityError("Quantity must be greater than 0");
      return;
    }

    // Paper service validation
    if (getServiceCategory(formData.service_type) === "Paper" && (!formData.total_pages || parseInt(formData.total_pages) <= 0)) {
      setPagesError("Pages must be greater than 0");
      return;
    }

    // ✅ Check if selected product is out of stock
    if (formData.product_id) {
      const selectedProduct = getServiceOptions(formData.service_type).find(
        p => p.id === formData.product_id
      );

      if (selectedProduct && selectedProduct.isDisabled && !isEditing) {
        alert("Cannot select out-of-stock product. Please choose a different product.");
        return;
      }

      // 🆕 NEW: Check if quantity exceeds available stock
      const serviceCategory = getServiceCategory(formData.service_type);
      const quantity = parseInt(formData.quantity) || 1;
      const totalPages = parseInt(formData.total_pages) || 1;
      
      let itemsNeeded = quantity;
      if (serviceCategory === "Paper") {
        itemsNeeded = totalPages * quantity;
      }
      
      if (selectedProduct && selectedProduct.stockQuantity < itemsNeeded && !isEditing) {
        alert(`Insufficient stock! Only ${selectedProduct.stockQuantity} items available, but you need ${itemsNeeded}.`);
        return;
      }
    }

    if (hasProductsForService(formData.service_type) && !formData.product_type) {
      alert(`Please select a product for ${formData.service_type} service`);
      return;
    }

    const serviceCategory = getServiceCategory(formData.service_type);
    if (serviceCategory === "Paper" && (!formData.total_pages || formData.total_pages < 1)) {
      setPagesError("Please enter total pages (minimum 1)");
      return;
    }

    try {
      const serviceCategory = getServiceCategory(formData.service_type);
      let backendData = {
        customer_name: formData.customer_name,
        service_type: formData.service_type,
        paper_type: "",
        size_type: "",
        supply_type: "",
        product_type: formData.product_type,
        product_id: formData.product_id,
        total_pages: parseInt(formData.total_pages) || 0,
        price_per_unit: parseFloat(formData.price_per_unit) || 0,
        quantity: parseInt(formData.quantity) || 1,
        total_amount: parseFloat(formData.total_amount) || 0,
        status: formData.status,
        date: formData.date
      };

      if (serviceCategory === "Paper") {
        backendData.paper_type = formData.product_type;
      } else if (serviceCategory === "T-shirt") {
        backendData.size_type = formData.product_type;
      } else if (serviceCategory === "Supplies") {
        backendData.supply_type = formData.product_type;
      } else {
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
          await fetchTransactions(currentPage, formData.status);
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

  // [Rest of the functions remain the same - archive, restore, delete, etc.]
  // Archive transaction functions
  const openArchiveModal = (transaction) => {
    setTransactionToArchive(transaction);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setTransactionToArchive(null);
    setArchiving(false);
    setArchiveSuccess(false);
  };

  const handleArchiveTransaction = async () => {
    if (!transactionToArchive) return;

    setArchiving(true);
    
    try {
      const response = await fetch(`${API_BASE}/transactions/${transactionToArchive._id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        setArchiveSuccess(true);
        setTimeout(async () => {
          await fetchTransactions(currentPage, activeTab);
          closeArchiveModal();
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to archive transaction');
        setArchiving(false);
      }
    } catch (error) {
      console.error('Error archiving transaction:', error);
      alert('Error archiving transaction');
      setArchiving(false);
    }
  };

  // Restore transaction functions - FOR ARCHIVED VIEW
  const openRestoreModal = (transaction) => {
    setTransactionToRestore(transaction);
    setShowRestoreModal(true);
  };

  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setTransactionToRestore(null);
    setRestoring(false);
    setRestoreSuccess(false);
  };

  const handleRestoreTransaction = async () => {
    if (!transactionToRestore) return;

    setRestoring(true);
    
    try {
      const response = await fetch(`${API_BASE}/transactions/${transactionToRestore._id}/restore`, {
        method: 'PUT',
      });

      if (response.ok) {
        setRestoreSuccess(true);
        setTimeout(async () => {
          await fetchArchivedTransactions(archivedCurrentPage);
          closeRestoreModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Failed to restore transaction');
        setRestoring(false);
      }
    } catch (error) {
      console.error('Error restoring transaction:', error);
      showError('Error restoring transaction');
      setRestoring(false);
    }
  };

  // Restore from Cancelled to Pending
  const handleRestoreFromCancelled = async (transaction) => {
    try {
      // 🆕 Get product_id if available
      let productId = transaction.product_id;
      
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
          product_type: transaction.product_name || transaction.paper_type || transaction.size_type || transaction.supply_type,
          product_id: productId,  // 🆕 ADD THIS
          total_pages: transaction.total_pages,
          price_per_unit: transaction.price_per_unit,
          quantity: transaction.quantity,
          total_amount: transaction.total_amount,
          date: transaction.date,
          status: "Pending"
        }),
      });

      if (response.ok) {
        await fetchTransactions(currentPage, activeTab);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to restore transaction');
      }
    } catch (error) {
      console.error('Error restoring transaction:', error);
      alert('Error restoring transaction');
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
      // 🆕 FIX: Check if transaction has a product
      const serviceCategory = getServiceCategory(transaction.service_type);
      const hasProducts = hasProductsForService(transaction.service_type);
      
      if (hasProducts && !transaction.product_id && !transaction.product_name) {
        alert(`Cannot complete transaction. Please select a product for ${transaction.service_type} service.`);
        return;
      }

      // 🆕 Get the product_id from the transaction or find it by product name
      let productId = transaction.product_id;
      
      // If no product_id, try to find it by product name
      if (!productId && transaction.product_name) {
        const allProducts = await fetch(`${API_BASE}/products?page=1&per_page=100`).then(res => res.json());
        const productsArray = allProducts.products || allProducts;
        const product = productsArray.find(p => p.product_name === transaction.product_name);
        productId = product ? product._id : null;
      }

      // 🆕 Final check - if service requires products but none is selected
      if (hasProducts && !productId) {
        alert(`Cannot complete transaction. No product selected for ${transaction.service_type} service.`);
        return;
      }

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
          product_type: transaction.product_name || transaction.paper_type || transaction.size_type || transaction.supply_type,
          product_id: productId,  // 🆕 ADD THIS - CRITICAL!
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
      // 🆕 FIX: Get product_id if available
      let productId = transaction.product_id;
      
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
          product_type: transaction.product_name || transaction.paper_type || transaction.size_type || transaction.supply_type,
          product_id: productId,  // 🆕 ADD THIS
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
      product_id: "",
      total_pages: "",
      price_per_unit: "",
      quantity: "",
      total_amount: "",
      status: "Pending",
      date: "",
    });
    setCustomerNameError("");
    setPriceError("");
    setQuantityError("");
    setPagesError("");
    setEditIndex(null);
  };

  // Fixed pagination handlers
  const handleNextPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage < archivedTotalPages) {
        fetchArchivedTransactions(archivedCurrentPage + 1);
      }
    } else {
      if (currentPage < totalPages) {
        fetchTransactions(currentPage + 1, activeTab);
      }
    }
  };

  const handlePrevPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage > 1) {
        fetchArchivedTransactions(archivedCurrentPage - 1);
      }
    } else {
      if (currentPage > 1) {
        fetchTransactions(currentPage - 1, activeTab);
      }
    }
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const formatPeso = (amount) =>
    `₱${parseFloat(amount).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
    })}`;

  // FIXED: Get service-specific information for display
  const getServiceSpecificInfo = (transaction) => {
    const serviceCategory = getServiceCategory(transaction.service_type);
    
    // 🆕 FIX: Use product_name first, then fall back to other fields
    let productType = "—";
    let details = "—";
    
    // Check for product name in various possible fields
    if (transaction.product_name) {
      productType = transaction.product_name;
    } else if (transaction.product_type) {
      productType = transaction.product_type;
    } else if (transaction.paper_type) {
      productType = transaction.paper_type;
    } else if (transaction.size_type) {
      productType = transaction.size_type;
    } else if (transaction.supply_type) {
      productType = transaction.supply_type;
    }
    
    if (serviceCategory === "Paper") {
      details = transaction.total_pages ? `${transaction.total_pages} pages` : "—";
    } else if (serviceCategory === "T-shirt") {
      details = transaction.quantity ? `${transaction.quantity} shirts` : "—";
    } else if (serviceCategory === "Supplies") {
      details = transaction.quantity ? `${transaction.quantity} items` : "—";
    } else {
      details = transaction.quantity ? `${transaction.quantity} items` : "—";
    }
    
    return {
      type: productType,
      details: details
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Updated search filters to include Service Type and Product
  const filteredTransactions = transactions.filter(
    (t) =>
      (t.customer_name && t.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.queue_number && t.queue_number.includes(searchTerm)) ||
      (t.transaction_id && t.transaction_id.includes(searchTerm)) ||
      (t.service_type && t.service_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.paper_type && t.paper_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.size_type && t.size_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.supply_type && t.supply_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredArchivedTransactions = archivedTransactions.filter(
    (t) =>
      (t.customer_name && t.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.queue_number && t.queue_number.includes(searchTerm)) ||
      (t.transaction_id && t.transaction_id.includes(searchTerm)) ||
      (t.service_type && t.service_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.paper_type && t.paper_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.size_type && t.size_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.supply_type && t.supply_type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const serviceTypeOptions = serviceTypes.map(service => service.service_name);

  // Calculate display ranges correctly
  const getDisplayRange = () => {
    if (showArchivedView) {
      const start = (archivedCurrentPage - 1) * ITEMS_PER_PAGE + 1;
      const end = Math.min(archivedCurrentPage * ITEMS_PER_PAGE, archivedTotalCount);
      return { start, end, total: archivedTotalCount };
    } else {
      const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
      const end = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);
      return { start, end, total: totalCount };
    }
  };

  const displayRange = getDisplayRange();

  // Check if form has any validation errors
  const hasFormErrors = customerNameError || priceError || quantityError || pagesError;

  return (
    <div className="transactions-container">
      {/* Table Header with Archive Button and Search */}
      <div className="table-header">
        {showArchivedView ? (
          <button className="back-to-main-btn" onClick={() => setShowArchivedView(false)}>
            ← Back to Main View
          </button>
        ) : (
          <button className="view-archive-btn" onClick={() => {
            setShowArchivedView(true);
            fetchArchivedTransactions(1);
          }}>
            📦 View Archived Transactions
          </button>
        )}
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* MAIN TRANSACTIONS VIEW */}
      {!showArchivedView && (
        <>
          {/* Tabs - Order: Completed, Pending, Cancelled */}
          <div className="transaction-tabs">
            {["Completed", "Pending", "Cancelled"].map((tab) => (
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
                        {/* PENDING TRANSACTIONS - Full actions */}
                        {t.status === "Pending" && (
                          <>
                            <button className="edit-btn" onClick={() => handleEdit(t)}>Edit</button>
                            <button className="complete-btn" onClick={() => handleComplete(t)}>Complete</button>
                            <button className="cancel-btn-table" onClick={() => handleCancel(t)}>Cancel</button>
                          </>
                        )}

                        {/* COMPLETED TRANSACTIONS - Archive only */}
                        {t.status === "Completed" && (
                          <>
                            <button className="edit-btn" onClick={() => handleEdit(t)}>Edit</button>
                            <button className="archive-btn" onClick={() => openArchiveModal(t)}>Archive</button>
                          </>
                        )}

                        {/* CANCELLED TRANSACTIONS - Restore and Delete */}
                        {t.status === "Cancelled" && (
                          <>
                            <button className="restore-btn" onClick={() => handleRestoreFromCancelled(t)}>
                              Restore
                            </button>
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
                    No {activeTab.toLowerCase()} transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION CONTROLS - FIXED */}
          {filteredTransactions.length > 0 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                <span className="pagination-text">
                  Showing {displayRange.start}-{displayRange.end} of {displayRange.total} items
                </span>
              </div>
              
              <div className="pagination-buttons">
                <button 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1 || loading}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages || loading}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ARCHIVED TRANSACTIONS VIEW */}
      {showArchivedView && (
        <>
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
                <th>Archived Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="13" style={{ textAlign: "center", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                      <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                    </div>
                  </td>
                </tr>
              ) : filteredArchivedTransactions.length > 0 ? (
                filteredArchivedTransactions.map((t, index) => {
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
                      <td>{formatDate(t.archived_at)}</td>
                      <td>
                        <button className="restore-btn" onClick={() => openRestoreModal(t)}>
                          Restore
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="13" style={{ textAlign: "center", padding: "20px" }}>
                    No archived transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION FOR ARCHIVED TRANSACTIONS - FIXED */}
          {filteredArchivedTransactions.length > 0 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                <span className="pagination-text">
                  Showing {displayRange.start}-{displayRange.end} of {displayRange.total} items
                </span>
              </div>
              
              <div className="pagination-buttons">
                <button 
                  onClick={handlePrevPage} 
                  disabled={archivedCurrentPage === 1 || loading}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {archivedCurrentPage} of {archivedTotalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={archivedCurrentPage === archivedTotalPages || loading}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

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
                  className={customerNameError ? "error-input" : ""}
                  required
                  maxLength="100"
                  pattern=".*[a-zA-Z].*"
                  title="Customer name must contain letters and cannot be only numbers or special characters"
                  onInvalid={(e) => e.target.setCustomValidity('Please enter a valid customer name with at least one letter')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
                {customerNameError && <div className="error-message">{customerNameError}</div>}
                <small className="character-count">
                  {formData.customer_name.length}/100 characters
                </small>
              </div>
              
              <div className="form-group">
                <label>Service Type:</label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleChange}
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Please select a service type')}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="" disabled>Select Service Type</option>
                  {serviceTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* DYNAMIC PRODUCT SELECTION WITH STOCK INDICATORS */}
              {hasProductsForService(formData.service_type) && (
                <div className="form-group">
                  <label>Select Product:</label>
                  <select
                    name="product_id"
                    value={formData.product_id || ""}
                    onChange={(e) => {
                      const productId = e.target.value;
                      const selectedProduct = getServiceOptions(formData.service_type).find(p => p.id === productId);
                      setFormData(prev => ({
                        ...prev, 
                        product_id: productId,
                        product_type: selectedProduct ? selectedProduct.name : ""
                      }));
                    }}
                    required
                    onInvalid={(e) => e.target.setCustomValidity('Please select a product')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  >
                    <option value="" disabled>Select Product</option>
                    {getServiceOptions(formData.service_type).map((product) => (
                      <option 
                        key={product.id} 
                        value={product.id}
                        disabled={!isEditing && product.isDisabled} // 🆕 FIX: Only disable for new transactions, not editing
                        style={{ color: product.statusColor }}
                      >
                        {product.name} - {product.status} {product.stockQuantity > 0 ? `(${product.stockQuantity} left)` : ''}
                      </option>
                    ))}
                  </select>
                  {formData.product_id && (
                    <small style={{color: '#666', fontSize: '12px', marginTop: '5px'}}>
                      {getServiceOptions(formData.service_type).find(p => p.id === formData.product_id)?.status === "Out of Stock" 
                        ? "This product is out of stock and cannot be selected"
                        : ""}
                    </small>
                  )}
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
                    className={pagesError ? "error-input" : ""}
                    onInvalid={(e) => e.target.setCustomValidity('Pages cannot be below 1')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {pagesError && <div className="error-message">{pagesError}</div>}
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
                    min="0.01"
                    className={priceError ? "error-input" : ""}
                    onInvalid={(e) => e.target.setCustomValidity('Price must be greater than 0')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {priceError && <div className="error-message">{priceError}</div>}
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
                    className={quantityError ? "error-input" : ""}
                    onInvalid={(e) => e.target.setCustomValidity('Quantity must be greater than 0')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {quantityError && <div className="error-message">{quantityError}</div>}
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
                <button 
                  type="submit" 
                  className="save-btn" 
                  disabled={hasFormErrors}
                  title={hasFormErrors ? "Please fix validation errors before saving" : ""}
                >
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

      {/* ARCHIVE CONFIRMATION MODAL */}
      {showArchiveModal && transactionToArchive && (
        <div className="overlay">
          <div className="add-form archive-confirmation centered-modal">
            {archiving ? (
              <div className="archive-animation-center">
                {!archiveSuccess ? (
                  <Lottie 
                    animationData={loadingAnimation} 
                    loop={true}
                    style={{ width: 250, height: 250 }}
                  />
                ) : (
                  <Lottie 
                    animationData={archiveAnimation} 
                    loop={false}
                    style={{ width: 250, height: 250 }}
                  />
                )}
                <p style={{ marginTop: '20px', color: '#666' }}>
                  {!archiveSuccess ? "Archiving transaction..." : "Transaction archived successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="archive-icon">📦</div>
                <h3 className="centered-text">Archive Transaction</h3>
                <p className="centered-text">Are you sure you want to archive transaction <strong>Queue #{transactionToArchive.queue_number}</strong> for <strong>{transactionToArchive.customer_name}</strong>?</p>
                <p className="archive-warning centered-text">This transaction will be moved to archives and hidden from the main list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-archive-btn" onClick={handleArchiveTransaction}>
                    Yes, Archive
                  </button>
                  <button className="cancel-btn" onClick={closeArchiveModal}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL - FOR ARCHIVED VIEW */}
      {showRestoreModal && transactionToRestore && (
        <div className="overlay">
          <div className="add-form restore-confirmation centered-modal">
            {restoring ? (
              <div className="restore-animation-center">
                {!restoreSuccess ? (
                  <Lottie 
                    animationData={loadingAnimation} 
                    loop={true}
                    style={{ width: 250, height: 250 }}
                  />
                ) : (
                  <Lottie 
                    animationData={checkmarkAnimation} 
                    loop={false}
                    style={{ width: 250, height: 250 }}
                  />
                )}
                <p style={{ marginTop: '20px', color: '#666' }}>
                  {!restoreSuccess ? "Restoring transaction..." : "Transaction restored successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="restore-icon">↶</div>
                <h3 className="centered-text">Restore Transaction</h3>
                <p className="centered-text">Are you sure you want to restore transaction <strong>Queue #{transactionToRestore.queue_number}</strong> for <strong>{transactionToRestore.customer_name}</strong>?</p>
                <p className="restore-warning centered-text">This transaction will be moved back to the main transactions list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-restore-btn" onClick={handleRestoreTransaction}>
                    Yes, Restore
                  </button>
                  <button className="cancel-btn" onClick={closeRestoreModal}>Cancel</button>
                </div>
              </>
            )}
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

      {showErrorModal && (
        <div className="overlay">
          <div className="modal-content error-modal">
            <div className="error-icon">⚠️</div>
            <h3>Operation Failed</h3>
            <p className="error-message-text">{errorMessage}</p>
            <div className="form-buttons">
              <button className="cancel-btn" onClick={closeErrorModal}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;