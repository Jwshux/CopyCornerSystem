import React, { useState, useEffect } from "react";
import "./AllProducts.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5000"
    : "https://copycornersystem-backend.onrender.com";

function AllProducts({ showAddModal, onAddModalClose }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [archivedProducts, setArchivedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToArchive, setProductToArchive] = useState(null);
  const [productToRestore, setProductToRestore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productNameError, setProductNameError] = useState("");
  const [stockQuantityError, setStockQuantityError] = useState("");
  const [minimumStockError, setMinimumStockError] = useState("");
  const [unitPriceError, setUnitPriceError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [formData, setFormData] = useState({
    product_name: "",
    category_id: "",
    stock_quantity: "",
    minimum_stock: "",
    unit_price: ""
  });

  // Pagination state - SEPARATE for main and archived views
  const [currentPage, setCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [archivedTotalPages, setArchivedTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [archivedTotalCount, setArchivedTotalCount] = useState(0);

  // Handle modal from parent
  useEffect(() => {
    if (showAddModal) {
      setShowAddForm(true);
    }
  }, [showAddModal]);

  // Enhanced product name validation
  const checkProductName = (productName) => {
    if (!productName) {
      setProductNameError("");
      return;
    }

    // Length validation
    if (productName.length < 2) {
      setProductNameError("Product name must be at least 2 characters long");
      return;
    }

    if (productName.length > 100) {
      setProductNameError("Product name must be less than 100 characters");
      return;
    }

    // Check if contains only numbers
    if (/^\d+$/.test(productName)) {
      setProductNameError("Product name cannot contain only numbers");
      return;
    }

    // Check if contains only special characters (no letters or numbers)
    if (/^[^a-zA-Z0-9]+$/.test(productName)) {
      setProductNameError("Please enter a valid product name");
      return;
    }

    // Check if contains at least one letter
    if (!/[a-zA-Z]/.test(productName)) {
      setProductNameError("Product name must contain at least one letter");
      return;
    }

    // Check if product name already exists
    const existingProduct = products.find(product => 
      product.product_name.toLowerCase() === productName.toLowerCase() &&
      (!selectedProduct || product._id !== selectedProduct._id)
    );

    if (existingProduct) {
      setProductNameError("Product name already exists");
    } else {
      setProductNameError("");
    }
  };

  // Stock quantity validation
  const checkStockQuantity = (quantity) => {
    if (!quantity) {
      setStockQuantityError("");
      return;
    }

    const quantityValue = parseInt(quantity);
    if (isNaN(quantityValue) || quantityValue < 0) {
      setStockQuantityError("Stock quantity cannot be negative");
      return;
    }

    setStockQuantityError("");
  };

  // Minimum stock validation
  const checkMinimumStock = (minimumStock) => {
    if (!minimumStock) {
      setMinimumStockError("");
      return;
    }

    const minimumStockValue = parseInt(minimumStock);
    if (isNaN(minimumStockValue) || minimumStockValue <= 0) {
      setMinimumStockError("Minimum stock must be greater than 0");
      return;
    }

    setMinimumStockError("");
  };

  // Unit price validation
  const checkUnitPrice = (price) => {
    if (!price) {
      setUnitPriceError("");
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      setUnitPriceError("Unit price must be greater than 0");
      return;
    }

    if (priceValue < 0.01) {
      setUnitPriceError("Unit price must be at least 0.01");
      return;
    }

    setUnitPriceError("");
  };

  // UPDATED: Fetch products with search functionality
  const fetchProducts = async (page = 1, search = "") => {
    setLoading(true);
    try {
      // Build URL with search parameter
      let url = `${API_BASE}/products?page=${page}&per_page=${ITEMS_PER_PAGE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Products API Response:', data);
        
        if (Array.isArray(data)) {
          setProducts(data);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalCount(data.length);
        } else if (data.products) {
          setProducts(data.products || []);
          setCurrentPage(data.pagination?.page || 1);
          setTotalPages(data.pagination?.total_pages || 1);
          setTotalCount(data.pagination?.total_products || data.products.length);
        } else {
          setProducts([]);
          setTotalCount(0);
        }
      } else {
        console.error('Failed to fetch products');
        showError('Failed to load products');
        setProducts([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showError('Error loading products');
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Fetch archived products with search functionality
  const fetchArchivedProducts = async (page = 1, search = "") => {
    setLoading(true);
    try {
      // Build URL with search parameter
      let url = `${API_BASE}/products/archived?page=${page}&per_page=${ITEMS_PER_PAGE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Handle both response formats:
        if (Array.isArray(data)) {
          // Simple array format - no pagination info
          setArchivedProducts(data);
          setArchivedCurrentPage(1);
          setArchivedTotalPages(1);
          setArchivedTotalCount(data.length);
        } else if (data.products && Array.isArray(data.products)) {
          // Paginated format
          setArchivedProducts(data.products);
          setArchivedCurrentPage(data.pagination?.page || 1);
          setArchivedTotalPages(data.pagination?.total_pages || 1);
          setArchivedTotalCount(data.pagination?.total_products || data.products.length);
        } else {
          // Fallback
          setArchivedProducts([]);
          setArchivedCurrentPage(1);
          setArchivedTotalPages(1);
          setArchivedTotalCount(0);
        }
      } else {
        console.error('Failed to fetch archived products');
        showError('Failed to load archived products');
        setArchivedProducts([]);
        setArchivedTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching archived products:', error);
      showError('Error loading archived products');
      setArchivedProducts([]);
      setArchivedTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      if (response.ok) {
        const data = await response.json();
        console.log('Categories API Response:', data);
        
        let categoriesData = [];
        if (Array.isArray(data)) {
          categoriesData = data;
        } else if (data.categories && Array.isArray(data.categories)) {
          categoriesData = data.categories;
        } else if (Array.isArray(data)) {
          categoriesData = data;
        }
        
        setCategories(categoriesData);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // NEW: Add search effect with debounce
  useEffect(() => {
    if (showArchivedView) {
      fetchArchivedProducts(1, searchTerm);
    } else {
      fetchProducts(1, searchTerm);
    }
  }, [searchTerm, showArchivedView]);

  useEffect(() => {
    if (!showAddForm) {
      setAddSuccess(false);
      if (onAddModalClose) {
        onAddModalClose();
      }
    }
    if (!showEditModal) {
      setUpdateSuccess(false);
    }
  }, [showAddForm, showEditModal]);

  useEffect(() => {
    if (!showArchiveModal) {
      setArchiveSuccess(false);
    }
  }, [showArchiveModal]);

  useEffect(() => {
    if (!showRestoreModal) {
      setRestoreSuccess(false);
    }
  }, [showRestoreModal]);

  // UPDATED: Pagination handlers with search term
  const handleNextPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage < archivedTotalPages) {
        fetchArchivedProducts(archivedCurrentPage + 1, searchTerm);
      }
    } else {
      if (currentPage < totalPages) {
        fetchProducts(currentPage + 1, searchTerm);
      }
    }
  };

  const handlePrevPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage > 1) {
        fetchArchivedProducts(archivedCurrentPage - 1, searchTerm);
      }
    } else {
      if (currentPage > 1) {
        fetchProducts(currentPage - 1, searchTerm);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Real-time validation
    if (name === "product_name") {
      checkProductName(value);
    } else if (name === "stock_quantity") {
      checkStockQuantity(value);
    } else if (name === "minimum_stock") {
      checkMinimumStock(value);
    } else if (name === "unit_price") {
      checkUnitPrice(value);
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      category_id: "",
      stock_quantity: "",
      minimum_stock: "",
      unit_price: ""
    });
    setSelectedProduct(null);
    setProductNameError("");
    setStockQuantityError("");
    setMinimumStockError("");
    setUnitPriceError("");
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    checkProductName(formData.product_name);
    checkStockQuantity(formData.stock_quantity);
    checkMinimumStock(formData.minimum_stock);
    checkUnitPrice(formData.unit_price);
    
    if (productNameError || stockQuantityError || minimumStockError || unitPriceError) {
      showError("Please fix the validation errors before saving.");
      return;
    }

    // Additional validation for empty required fields
    if (!formData.product_name.trim()) {
      setProductNameError("Product name is required");
      return;
    }

    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      setStockQuantityError("Stock quantity cannot be negative");
      return;
    }

    if (!formData.minimum_stock || parseInt(formData.minimum_stock) <= 0) {
      setMinimumStockError("Minimum stock must be greater than 0");
      return;
    }

    if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
      setUnitPriceError("Unit price must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setAddSuccess(true);
        setTimeout(async () => {
          await fetchProducts(currentPage, searchTerm);
          setShowAddForm(false);
          resetForm();
          setLoading(false);
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to create product');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      showError('Error creating product');
      setLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      category_id: product.category_id || (product.category ? product.category._id : ""),
      stock_quantity: product.stock_quantity,
      minimum_stock: product.minimum_stock || 5,
      unit_price: product.unit_price
    });
    setProductNameError("");
    setStockQuantityError("");
    setMinimumStockError("");
    setUnitPriceError("");
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    checkProductName(formData.product_name);
    checkStockQuantity(formData.stock_quantity);
    checkMinimumStock(formData.minimum_stock);
    checkUnitPrice(formData.unit_price);
    
    if (productNameError || stockQuantityError || minimumStockError || unitPriceError) {
      showError("Please fix the validation errors before updating.");
      return;
    }

    // Additional validation for empty required fields
    if (!formData.product_name.trim()) {
      setProductNameError("Product name is required");
      return;
    }

    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      setStockQuantityError("Stock quantity cannot be negative");
      return;
    }

    if (!formData.minimum_stock || parseInt(formData.minimum_stock) <= 0) {
      setMinimumStockError("Minimum stock must be greater than 0");
      return;
    }

    if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
      setUnitPriceError("Unit price must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/${selectedProduct._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setUpdateSuccess(true);
        setTimeout(async () => {
          await fetchProducts(currentPage, searchTerm);
          setShowEditModal(false);
          resetForm();
          setLoading(false);
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to update product');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      showError('Error updating product');
      setLoading(false);
    }
  };

  const openArchiveModal = (product) => {
    setProductToArchive(product);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setProductToArchive(null);
    setArchiving(false);
    setArchiveSuccess(false);
  };

  const handleArchiveProduct = async () => {
    if (!productToArchive) return;

    setArchiving(true);
    try {
      const response = await fetch(`${API_BASE}/products/${productToArchive._id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        setArchiveSuccess(true);
        setTimeout(async () => {
          const isLastItemOnPage = products.length === 1;
          
          if (isLastItemOnPage && currentPage > 1) {
            await fetchProducts(currentPage - 1, searchTerm);
          } else {
            await fetchProducts(currentPage, searchTerm);
          }
          closeArchiveModal();
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to archive product');
        setArchiving(false);
      }
    } catch (error) {
      console.error('Error archiving product:', error);
      showError('Error archiving product');
      setArchiving(false);
    }
  };

  const openRestoreModal = (product) => {
    setProductToRestore(product);
    setShowRestoreModal(true);
  };

  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setProductToRestore(null);
    setRestoring(false);
    setRestoreSuccess(false);
  };

  const handleRestoreProduct = async () => {
    if (!productToRestore) return;

    setRestoring(true);
    try {
      const response = await fetch(`${API_BASE}/products/${productToRestore._id}/restore`, {
        method: 'PUT',
      });

      if (response.ok) {
        setRestoreSuccess(true);
        setTimeout(async () => {
          await fetchArchivedProducts(archivedCurrentPage, searchTerm);
          await fetchProducts(1, searchTerm);
          closeRestoreModal();
        }, 700);
      } else {
        const errorData = await response.json();
        showError(errorData.error || 'Failed to restore product');
        setRestoring(false);
      }
    } catch (error) {
      console.error('Error restoring product:', error);
      showError('Error restoring product');
      setRestoring(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddForm(true);
  };

  const closeModals = () => {
    setShowAddForm(false);
    setShowEditModal(false);
    resetForm();
    if (onAddModalClose) {
      onAddModalClose();
    }
  };

  const formatPrice = (price) => {
    return `₱${parseFloat(price).toFixed(2)}`;
  };

  const getCategoryName = (product) => {
    if (product.category_name) return product.category_name;
    if (product.category && typeof product.category === 'object') {
      return product.category.name || 'Unknown';
    }
    if (product.category) return product.category;
    
    if (product.category_id && categories.length > 0) {
      const category = categories.find(cat => cat._id === product.category_id);
      return category ? category.name : 'Unknown';
    }
    
    return 'Uncategorized';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // REMOVED: Client-side filtering (no longer needed)
  // const filteredProducts = products.filter(...)
  // const filteredArchivedProducts = archivedProducts.filter(...)

  // Calculate display ranges CORRECTLY
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
  const hasFormErrors = productNameError || stockQuantityError || minimumStockError || unitPriceError;

  return (
    <div className="product-page">
      <div className="table-container">
        {/* Table Header with Archive Button and Search */}
        <div className="table-header">
          {showArchivedView ? (
            <button className="back-to-main-btn" onClick={() => {
              setShowArchivedView(false);
              setSearchTerm(""); // Clear search when switching views
              fetchProducts(1);
            }}>
              ← Back to Main View
            </button>
          ) : (
            <button className="view-archive-btn" onClick={() => {
              setShowArchivedView(true);
              setSearchTerm(""); // Clear search when switching views
              fetchArchivedProducts(1);
            }}>
              📦 View Archived Products
            </button>
          )}
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* MAIN PRODUCTS VIEW */}
        {!showArchivedView && (
          <>
            <table className="product-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Stock Quantity</th>
                  <th>Min Stock</th>
                  <th>Unit Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center", color: "#888" }}>
                      {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                          <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                        </div>
                      ) : searchTerm ? (
                        "No products found matching your search."
                      ) : (
                        "No products found."
                      )}
                    </td>
                  </tr>
                ) : (
                  // CHANGED: Use products instead of filteredProducts
                  products.map((product, index) => (
                    <tr key={product._id}>
                      <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td>{product.product_id}</td>
                      <td>{product.product_name}</td>
                      <td>{getCategoryName(product)}</td>
                      <td>{product.stock_quantity}</td>
                      <td>{product.minimum_stock || 5}</td>
                      <td>{formatPrice(product.unit_price)}</td>
                      <td>
                        <span
                          className={`status-tag ${
                            product.status === "In Stock"
                              ? "in-stock"
                              : product.status === "Low Stock"
                              ? "low-stock"
                              : "out-stock"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td>
                        <button className="edit-btn" onClick={() => handleEditProduct(product)}>Edit</button>
                        <button className="archive-btn" onClick={() => openArchiveModal(product)}>Archive</button>
                      </td>
                    </tr>
                  ))
                )}
                
                {/* Add empty rows to maintain consistent height */}
                {products.length > 0 && products.length < 10 &&
                  Array.from({ length: 10 - products.length }).map((_, index) => (
                    <tr key={`empty-${index}`} style={{ visibility: 'hidden' }}>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            {/* PAGINATION CONTROLS - FIXED */}
            {products.length > 0 && (
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

        {/* ARCHIVED PRODUCTS VIEW */}
        {showArchivedView && (
          <>
            <table className="product-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Stock Quantity</th>
                  <th>Unit Price</th>
                  <th>Archived Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", color: "#888" }}>
                      {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                          <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                        </div>
                      ) : searchTerm ? (
                        "No archived products found matching your search."
                      ) : (
                        "No archived products found."
                      )}
                    </td>
                  </tr>
                ) : (
                  // CHANGED: Use archivedProducts instead of filteredArchivedProducts
                  archivedProducts.map((product, index) => (
                    <tr key={product._id}>
                      <td>{(archivedCurrentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td>{product.product_id}</td>
                      <td>{product.product_name}</td>
                      <td>{getCategoryName(product)}</td>
                      <td>{product.stock_quantity}</td>
                      <td>{formatPrice(product.unit_price)}</td>
                      <td>{formatDate(product.archived_at)}</td>
                      <td>
                        <button className="restore-btn" onClick={() => openRestoreModal(product)}>
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                
                {/* Add empty rows to maintain consistent height */}
                {archivedProducts.length > 0 && archivedProducts.length < 10 &&
                  Array.from({ length: 10 - archivedProducts.length }).map((_, index) => (
                    <tr key={`empty-archived-${index}`} style={{ visibility: 'hidden' }}>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            {/* PAGINATION FOR ARCHIVED PRODUCTS - FIXED */}
            {archivedProducts.length > 0 && (
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
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddForm && (
        <div className="overlay">
          <div className="add-form">
            <h3>Add New Product</h3>
            
            {loading ? (
              <div className="form-animation-center">
                {!addSuccess ? (
                  <Lottie 
                    animationData={loadingAnimation} 
                    loop={true}
                    style={{ width: 350, height: 350 }}
                  />
                ) : (
                  <Lottie 
                    animationData={checkmarkAnimation} 
                    loop={false}
                    style={{ width: 350, height: 350 }}
                  />
                )}
              </div>
            ) : (
              <form onSubmit={handleAddProduct}>
                <div className="form-group">
                  <label>Product ID</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value="Auto-generated"
                    readOnly
                    className="readonly-field"
                  />
                </div>
                
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="product_name"
                    placeholder="Product Name"
                    value={formData.product_name}
                    onChange={handleInputChange}
                    className={productNameError ? "error-input" : ""}
                    required
                    maxLength="100"
                    pattern=".*[a-zA-Z].*"
                    title="Product name must contain letters and cannot be only numbers or special characters"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter a valid product name with at least one letter')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {productNameError && <div className="error-message">{productNameError}</div>}
                  <small className="character-count">
                    {formData.product_name.length}/100 characters
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    onInvalid={(e) => e.target.setCustomValidity('Please select a category')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    placeholder="Current stock quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className={stockQuantityError ? "error-input" : ""}
                    onInvalid={(e) => e.target.setCustomValidity('Stock quantity cannot be negative')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {stockQuantityError && <div className="error-message">{stockQuantityError}</div>}
                </div>
                
                <div className="form-group">
                  <label>Minimum Stock Level</label>
                  <input
                    type="number"
                    name="minimum_stock"
                    placeholder="Low stock alert level"
                    value={formData.minimum_stock}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className={minimumStockError ? "error-input" : ""}
                    onInvalid={(e) => e.target.setCustomValidity('Minimum stock must be greater than 0')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {minimumStockError && <div className="error-message">{minimumStockError}</div>}
                  <small style={{color: '#666', fontSize: '12px', marginTop: '5px'}}>
                    Product will show "Low Stock" when quantity reaches this level
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Unit Price</label>
                  <input
                    type="number"
                    name="unit_price"
                    placeholder="Unit Price"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    className={unitPriceError ? "error-input" : ""}
                    onInvalid={(e) => e.target.setCustomValidity('Unit price must be greater than 0')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {unitPriceError && <div className="error-message">{unitPriceError}</div>}
                </div>

                <div className="form-buttons">
                  <button 
                    type="submit" 
                    className="save-btn" 
                    disabled={loading || hasFormErrors}
                    title={hasFormErrors ? "Please fix validation errors before saving" : ""}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeModals}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && (
        <div className="overlay">
          <div className="add-form">
            <h3>Edit Product</h3>
            
            {loading ? (
              <div className="form-animation-center">
                {!updateSuccess ? (
                  <Lottie 
                    animationData={loadingAnimation} 
                    loop={true}
                    style={{ width: 350, height: 350 }}
                  />
                ) : (
                  <Lottie 
                    animationData={checkmarkAnimation} 
                    loop={false}
                    style={{ width: 350, height: 350 }}
                  />
                )}
              </div>
            ) : (
              <form onSubmit={handleUpdateProduct}>
                <div className="form-group">
                  <label>Product ID</label>
                  <input
                    type="text"
                    placeholder="Product ID"
                    value={selectedProduct?.product_id || ""}
                    readOnly
                    className="readonly-field"
                  />
                </div>
                
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="product_name"
                    placeholder="Product Name"
                    value={formData.product_name}
                    onChange={handleInputChange}
                    className={productNameError ? "error-input" : ""}
                    required
                    maxLength="100"
                    pattern=".*[a-zA-Z].*"
                    title="Product name must contain letters and cannot be only numbers or special characters"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter a valid product name with at least one letter')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {productNameError && <div className="error-message">{productNameError}</div>}
                  <small className="character-count">
                    {formData.product_name.length}/100 characters
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                    onInvalid={(e) => e.target.setCustomValidity('Please select a category')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    placeholder="Current stock quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className={stockQuantityError ? "error-input" : ""}
                    onInvalid={(e) => e.target.setCustomValidity('Stock quantity cannot be negative')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {stockQuantityError && <div className="error-message">{stockQuantityError}</div>}
                </div>
                
                <div className="form-group">
                  <label>Minimum Stock Level</label>
                  <input
                    type="number"
                    name="minimum_stock"
                    placeholder="Low stock alert level"
                    value={formData.minimum_stock}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className={minimumStockError ? "error-input" : ""}
                    onInvalid={(e) => e.target.setCustomValidity('Minimum stock must be greater than 0')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {minimumStockError && <div className="error-message">{minimumStockError}</div>}
                  <small style={{color: '#666', fontSize: '12px', marginTop: '5px'}}>
                    Product will show "Low Stock" when quantity reaches this level
                  </small>
                </div>
                
                <div className="form-group">
                  <label>Unit Price</label>
                  <input
                    type="number"
                    name="unit_price"
                    placeholder="Unit Price"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    className={unitPriceError ? "error-input" : ""}
                    onInvalid={(e) => e.target.setCustomValidity('Unit price must be greater than 0')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {unitPriceError && <div className="error-message">{unitPriceError}</div>}
                </div>

                <div className="form-buttons">
                  <button 
                    type="submit" 
                    className="save-btn" 
                    disabled={loading || hasFormErrors}
                    title={hasFormErrors ? "Please fix validation errors before updating" : ""}
                  >
                    {loading ? "Updating..." : "Update"}
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeModals}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION MODAL - CENTERED */}
      {showArchiveModal && productToArchive && (
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
                  {!archiveSuccess ? "Archiving product..." : "Product archived successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="archive-icon">📦</div>
                <h3 className="centered-text">Archive Product</h3>
                <p className="centered-text">Are you sure you want to archive product <strong>"{productToArchive.product_name}"</strong>?</p>
                <p className="archive-warning centered-text">This product will be moved to archives and hidden from the main list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-archive-btn" onClick={handleArchiveProduct}>
                    Yes, Archive
                  </button>
                  <button className="cancel-btn" onClick={closeArchiveModal}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL - CENTERED WITH CHECKMARK */}
      {showRestoreModal && productToRestore && (
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
                  {!restoreSuccess ? "Restoring product..." : "Product restored successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="restore-icon">↶</div>
                <h3 className="centered-text">Restore Product</h3>
                <p className="centered-text">Are you sure you want to restore product <strong>"{productToRestore.product_name}"</strong>?</p>
                <p className="restore-warning centered-text">This product will be moved back to the main products list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-restore-btn" onClick={handleRestoreProduct}>
                    Yes, Restore
                  </button>
                  <button className="cancel-btn" onClick={closeRestoreModal}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ERROR MODAL */}
      {showErrorModal && (
        <div className="overlay">
          <div className="add-form error-modal centered-modal">
            <div className="error-icon">⚠️</div>
            <h3 className="centered-text">Operation Failed</h3>
            <p className="error-message-text centered-text">{errorMessage}</p>
            <div className="form-buttons centered-buttons">
              <button className="cancel-btn" onClick={closeErrorModal}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllProducts;