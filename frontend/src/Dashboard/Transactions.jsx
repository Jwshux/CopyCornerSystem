import React, { useState, useEffect } from "react";
import "./Transactions.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE = "https://copycornersystem-backend.onrender.com";

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
  const [stockError, setStockError] = useState("");
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

  useEffect(() => {
    if (showAddModal) {
      handleAdd();
    }
  }, [showAddModal]);

  const checkCustomerName = (customerName) => {
    if (!customerName) {
      setCustomerNameError("");
      return;
    }

    if (customerName.length < 2) {
      setCustomerNameError("Customer name must be at least 2 characters long");
      return;
    }

    if (customerName.length > 100) {
      setCustomerNameError("Customer name must be less than 100 characters");
      return;
    }

    if (/^\d+$/.test(customerName)) {
      setCustomerNameError("Customer name cannot contain only numbers");
      return;
    }

    if (/^[^a-zA-Z0-9]+$/.test(customerName)) {
      setCustomerNameError("Please enter a valid customer name");
      return;
    }

    if (!/[a-zA-Z]/.test(customerName)) {
      setCustomerNameError("Customer name must contain at least one letter");
      return;
    }

    setCustomerNameError("");
  };

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

  const checkStockAvailability = (productId, quantity, totalPages = 1) => {
    if (!productId) {
      setStockError("");
      return;
    }

    const selectedProduct = allProducts.find(p => p._id === productId);
    if (!selectedProduct) {
      setStockError("");
      return;
    }

    const serviceCategory = getServiceCategory(formData.service_type);
    const availableStock = parseInt(selectedProduct.stock_quantity || 0);
    
    let itemsNeeded = parseInt(quantity) || 1;
    
    if (serviceCategory === "Paper") {
      itemsNeeded = (parseInt(totalPages) || 1) * (parseInt(quantity) || 1);
    }

    if (availableStock < itemsNeeded) {
      setStockError(`Insufficient stock! Only ${availableStock} items available, but you need ${itemsNeeded}.`);
    } else {
      setStockError("");
    }
  };

  const fetchTransactions = async (page = 1, status = "Completed", search = "") => {
    setLoading(true);
    try {
      let url = `${API_BASE}/transactions/status/${status}?page=${page}&per_page=${ITEMS_PER_PAGE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
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

  const fetchArchivedTransactions = async (page = 1, search = "") => {
    setLoading(true);
    try {
      let url = `${API_BASE}/transactions/archived?page=${page}&per_page=${ITEMS_PER_PAGE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        if (data.transactions) {
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

  const fetchAllProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products?page=1&per_page=100`);
      if (response.ok) {
        const data = await response.json();
        
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

  const fetchServiceTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/service_types`);
      if (response.ok) {
        const data = await response.json();
        
        let servicesData = [];
        if (Array.isArray(data)) {
          servicesData = data;
        } else if (data.service_types && Array.isArray(data.service_types)) {
          servicesData = data.service_types;
        } else if (data && Array.isArray(data)) {
          servicesData = data;
        }
        
        const activeServices = servicesData.filter(service => 
          service && service.status === "Active" && service.is_archived !== true
        );
        setServiceTypes(activeServices);
      } else {
        console.error('Failed to fetch service types:', response.status);
        setServiceTypes([]);
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
      setServiceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1, "Completed");
    fetchAllProducts();
    fetchServiceTypes();
  }, []);

  useEffect(() => {
    if (showArchivedView) {
      fetchArchivedTransactions(1, searchTerm);
      setArchivedCurrentPage(1);
    } else {
      fetchTransactions(1, activeTab, searchTerm);
      setCurrentPage(1);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (!showArchivedView) {
      fetchTransactions(1, activeTab, searchTerm);
      setCurrentPage(1);
    }
  }, [activeTab, showArchivedView]);

  useEffect(() => {
    if (showArchivedView) {
      fetchArchivedTransactions(1, searchTerm);
      setArchivedCurrentPage(1);
    }
  }, [showArchivedView]);

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

  const hasProductsForService = (serviceType) => {
    const category = getServiceCategory(serviceType);
    if (!category) return false;
    
    const products = getProductsByCategory(category);
    return products && products.length > 0;
  };

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

    if (name === "customer_name") {
      checkCustomerName(value);
    } else if (name === "price_per_unit") {
      checkPrice(value);
    } else if (name === "quantity") {
      checkQuantity(value);
      if (formData.product_id) {
        checkStockAvailability(formData.product_id, value, formData.total_pages);
      }
    } else if (name === "total_pages") {
      checkPages(value);
      if (formData.product_id && getServiceCategory(formData.service_type) === "Paper") {
        checkStockAvailability(formData.product_id, formData.quantity, value);
      }
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
      setStockError("");
    }

    setFormData(updated);
  };

  const handleAdd = () => {
    // FIXED: Remove timezone adjustment - use simple date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
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
      date: dateString,  // This will match server date
    });
    setCustomerNameError("");
    setPriceError("");
    setQuantityError("");
    setPagesError("");
    setStockError("");
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
      date: transaction.date || new Date().toISOString().split("T")[0], // FIXED: No timezone adjustment
    });
    setCustomerNameError("");
    setPriceError("");
    setQuantityError("");
    setPagesError("");
    setStockError("");
    setEditIndex(transaction._id);
    setIsEditing(true);
    setShowFormModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    checkCustomerName(formData.customer_name);
    checkPrice(formData.price_per_unit);
    checkQuantity(formData.quantity);
    
    if (getServiceCategory(formData.service_type) === "Paper") {
      checkPages(formData.total_pages);
    }
    
    if (formData.product_id) {
      checkStockAvailability(formData.product_id, formData.quantity, formData.total_pages);
    }
    
    if (customerNameError || priceError || quantityError || pagesError || stockError) {
      alert("Please fix the validation errors before saving.");
      return;
    }

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

    if (getServiceCategory(formData.service_type) === "Paper" && (!formData.total_pages || parseInt(formData.total_pages) <= 0)) {
      setPagesError("Pages must be greater than 0");
      return;
    }

    if (formData.product_id) {
      const selectedProduct = allProducts.find(p => p._id === formData.product_id);
      if (selectedProduct) {
        const serviceCategory = getServiceCategory(formData.service_type);
        const quantity = parseInt(formData.quantity) || 1;
        const totalPages = parseInt(formData.total_pages) || 1;
        
        let itemsNeeded = quantity;
        if (serviceCategory === "Paper") {
          itemsNeeded = totalPages * quantity;
        }
        
        if (selectedProduct.stock_quantity < itemsNeeded && !isEditing) {
          alert(`Insufficient stock! Only ${selectedProduct.stock_quantity} items available, but you need ${itemsNeeded}.`);
          return;
        }
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
          await fetchTransactions(1, "Pending", searchTerm);
        } else {
          await fetchTransactions(currentPage, formData.status, searchTerm);
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
          await fetchTransactions(currentPage, activeTab, searchTerm);
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
          await fetchArchivedTransactions(archivedCurrentPage, searchTerm);
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

  const handleRestoreFromCancelled = async (transaction) => {
    try {
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
          product_id: productId,
          total_pages: transaction.total_pages,
          price_per_unit: transaction.price_per_unit,
          quantity: transaction.quantity,
          total_amount: transaction.total_amount,
          date: transaction.date,
          status: "Pending"
        }),
      });

      if (response.ok) {
        await fetchTransactions(currentPage, activeTab, searchTerm);
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
        await fetchTransactions(currentPage, activeTab, searchTerm);
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
    // FIXED: Remove timezone adjustment - use current date
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    console.log('🔄 Completing transaction with date:', dateString);

    const serviceCategory = getServiceCategory(transaction.service_type);
    const hasProducts = hasProductsForService(transaction.service_type);
    
    if (hasProducts && !transaction.product_id && !transaction.product_name) {
      alert(`Cannot complete transaction. Please select a product for ${transaction.service_type} service.`);
      return;
    }

    let productId = transaction.product_id;
    
    if (!productId && transaction.product_name) {
      const allProducts = await fetch(`${API_BASE}/products?page=1&per_page=100`).then(res => res.json());
      const productsArray = allProducts.products || allProducts;
      const product = productsArray.find(p => p.product_name === transaction.product_name);
      productId = product ? product._id : null;
    }

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
        product_id: productId,
        total_pages: transaction.total_pages,
        price_per_unit: transaction.price_per_unit,
        quantity: transaction.quantity,
        total_amount: transaction.total_amount,
        date: dateString,  // Use current date without timezone adjustment
        status: "Completed"
      }),
    });

    if (response.ok) {
      console.log('✅ Transaction completed successfully');
      // Refresh both transactions AND sales data
      await fetchTransactions(currentPage, activeTab, searchTerm);
      // If you're on the Sales page, refresh sales data too
      if (window.location.pathname.includes('/sales')) {
        window.dispatchEvent(new Event('refreshSales'));
      }
    } else {
      const error = await response.json();
      console.error('❌ Failed to complete transaction:', error);
      alert(error.error || 'Failed to complete transaction');
    }
  } catch (error) {
    console.error('❌ Error completing transaction:', error);
    alert('Error completing transaction');
  }
};

  const handleCancel = async (transaction) => {
    try {
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
          product_id: productId,
          total_pages: transaction.total_pages,
          price_per_unit: transaction.price_per_unit,
          quantity: transaction.quantity,
          total_amount: transaction.total_amount,
          date: transaction.date,
          status: "Cancelled"
        }),
      });

      if (response.ok) {
        await fetchTransactions(currentPage, activeTab, searchTerm);
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
    setStockError("");
    setEditIndex(null);
  };

  const handleNextPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage < archivedTotalPages) {
        fetchArchivedTransactions(archivedCurrentPage + 1, searchTerm);
      }
    } else {
      if (currentPage < totalPages) {
        fetchTransactions(currentPage + 1, activeTab, searchTerm);
      }
    }
  };

  const handlePrevPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage > 1) {
        fetchArchivedTransactions(archivedCurrentPage - 1, searchTerm);
      }
    } else {
      if (currentPage > 1) {
        fetchTransactions(currentPage - 1, activeTab, searchTerm);
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

  const getServiceSpecificInfo = (transaction) => {
    const serviceCategory = getServiceCategory(transaction.service_type);
    
    let productType = "—";
    let details = "—";
    
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

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const selectedProduct = getServiceOptions(formData.service_type).find(p => p.id === productId);
    
    setFormData(prev => ({
      ...prev, 
      product_id: productId,
      product_type: selectedProduct ? selectedProduct.name : ""
    }));

    if (productId) {
      checkStockAvailability(productId, formData.quantity, formData.total_pages);
    } else {
      setStockError("");
    }
  };

  const serviceTypeOptions = serviceTypes.map(service => service.service_name);

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

  const hasFormErrors = customerNameError || priceError || quantityError || pagesError || stockError;

  return (
    <div className="transactions-container">
      <div className="table-header">
        {showArchivedView ? (
          <button className="back-to-main-btn" onClick={() => setShowArchivedView(false)}>
            ← Back to Main View
          </button>
        ) : (
          <button className="view-archive-btn" onClick={() => {
            setShowArchivedView(true);
            fetchArchivedTransactions(1, searchTerm);
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

      {!showArchivedView && (
        <>
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
              ) : transactions.length > 0 ? (
                transactions.map((t, index) => {
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
                            <button className="edit-btn" onClick={() => handleEdit(t)}>Edit</button>
                            <button className="complete-btn" onClick={() => handleComplete(t)}>Complete</button>
                            <button className="cancel-btn-table" onClick={() => handleCancel(t)}>Cancel</button>
                          </>
                        )}

                        {t.status === "Completed" && (
                          <>
                            <button className="edit-btn" onClick={() => handleEdit(t)}>Edit</button>
                            <button className="archive-btn" onClick={() => openArchiveModal(t)}>Archive</button>
                          </>
                        )}

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
                    {searchTerm ? "No transactions found matching your search." : `No ${activeTab.toLowerCase()} transactions found.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {transactions.length > 0 && (
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
              ) : archivedTransactions.length > 0 ? (
                archivedTransactions.map((t, index) => {
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
                    {searchTerm ? "No archived transactions found matching your search." : "No archived transactions found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {archivedTransactions.length > 0 && (
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

              {hasProductsForService(formData.service_type) && (
                <div className="form-group">
                  <label>Select Product:</label>
                  <select
                    name="product_id"
                    value={formData.product_id || ""}
                    onChange={handleProductChange}
                    required
                    onInvalid={(e) => e.target.setCustomValidity('Please select a product')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  >
                    <option value="" disabled>Select Product</option>
                    {getServiceOptions(formData.service_type).map((product) => (
                      <option 
                        key={product.id} 
                        value={product.id}
                        disabled={!isEditing && product.isDisabled}
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
                  {stockError && <div className="error-message">{stockError}</div>}
                </div>
              )}

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