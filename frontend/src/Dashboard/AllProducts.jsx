import React, { useState, useEffect } from "react";
import "./AllProducts.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import deleteAnimation from "../animations/delete.json"; // Add this import

const API_BASE = "http://localhost:5000/api";

function AllProducts() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productNameError, setProductNameError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false); // New state for delete animation
  const [deleteSuccess, setDeleteSuccess] = useState(false); // New state for delete success
  const [formData, setFormData] = useState({
    product_name: "",
    category: "",
    stock_quantity: "",
    unit_price: ""
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch products from backend
  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products?page=${page}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories?page=1&per_page=100`); // Get all categories
      if (response.ok) {
        const data = await response.json();
        // Extract categories from the paginated response
        setCategories(data.categories || data); // Handle both old and new response formats
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

  // Reset success states when modals close
  useEffect(() => {
    if (!showAddForm) {
      setAddSuccess(false);
    }
    if (!showEditModal) {
      setUpdateSuccess(false);
    }
  }, [showAddForm, showEditModal]);

  // Reset delete success state when delete modal closes
  useEffect(() => {
    if (!showDeleteModal) {
      setDeleteSuccess(false);
    }
  }, [showDeleteModal]);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchProducts(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchProducts(currentPage - 1);
    }
  };

  // Check if product name exists
  const checkProductName = (productName) => {
    if (!productName) {
      setProductNameError("");
      return;
    }

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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Check product name availability in real-time
    if (name === "product_name") {
      checkProductName(value);
    }
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      product_name: "",
      category: "",
      stock_quantity: "",
      unit_price: ""
    });
    setSelectedProduct(null);
    setProductNameError("");
  };

  // Add product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    if (productNameError) {
      alert("Please fix the product name error before saving.");
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
        // Wait for animation to complete before refreshing and closing
        setTimeout(async () => {
          await fetchProducts(currentPage);
          setShowAddForm(false);
          resetForm();
          setLoading(false);
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create product');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product');
      setLoading(false);
    }
  };

  // Edit product - fills form for editing
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      category: product.category,
      stock_quantity: product.stock_quantity,
      unit_price: product.unit_price
    });
    setProductNameError("");
    setShowEditModal(true);
  };

  // Update product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    if (productNameError) {
      alert("Please fix the product name error before updating.");
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
        // Wait for animation to complete before refreshing and closing
        setTimeout(async () => {
          await fetchProducts(currentPage);
          setShowEditModal(false);
          resetForm();
          setLoading(false);
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update product');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
    setDeleting(false);
    setDeleteSuccess(false);
  };

  // Delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/products/${productToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        // Wait for animation to complete before closing and refreshing
        setTimeout(async () => {
          // Check if this was the last item on the current page
          const isLastItemOnPage = products.length === 1;
          
          if (isLastItemOnPage && currentPage > 1) {
            // If it was the last item and we're not on page 1, go to previous page
            await fetchProducts(currentPage - 1);
          } else {
            // Otherwise refresh current page
            await fetchProducts(currentPage);
          }
          closeDeleteModal();
        }, 1500);
      } else {
        console.error('Failed to delete product');
        alert('Failed to delete product');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
      setDeleting(false);
    }
  };

  // Open "Add New Product" modal
  const openAddModal = () => {
    resetForm();
    setShowAddForm(true);
  };

  // Close modals
  const closeModals = () => {
    setShowAddForm(false);
    setShowEditModal(false);
    resetForm();
  };

  // Format price for display
  const formatPrice = (price) => {
    return `₱${parseFloat(price).toFixed(2)}`;
  };

  return (
    <div className="product-page">
      <div className="product-header">
        <h2>List of Products</h2>
        <div className="header-right">
          <button className="add-product-btn" onClick={openAddModal}>
            Add Product
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Stock Quantity</th>
              <th>Unit Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", color: "#888" }}>
                  {loading ? (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                      <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                    </div>
                  ) : (
                    "No products found."
                  )}
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={product._id}>
                  <td>{(currentPage - 1) * 10 + index + 1}</td>
                  <td>{product.product_id}</td>
                  <td>{product.product_name}</td>
                  <td>{product.category}</td>
                  <td>{product.stock_quantity}</td>
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
                    <button className="delete-btn" onClick={() => openDeleteModal(product)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION CONTROLS - Now inside the container */}
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
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddForm && (
        <div className="overlay">
          <div className="add-form">
            <h3>Add New Product</h3>
            
            {/* Show only loading animation when adding, then checkmark */}
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
                <div className="form-field">
                  <label>Product ID</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value="Auto-generated"
                    readOnly
                  />
                </div>
                
                <div className="form-field">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="product_name"
                    placeholder="Product Name"
                    value={formData.product_name}
                    onChange={handleInputChange}
                    className={productNameError ? "error-input" : ""}
                    required
                  />
                  {productNameError && <div className="error-message">{productNameError}</div>}
                </div>
                
                <div className="form-field">
                  <label>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled hidden>Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-field">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    placeholder="Stock Quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label>Unit Price</label>
                  <input
                    type="number"
                    name="unit_price"
                    placeholder="Unit Price"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-buttons">
                  <button type="submit" className="save-btn" disabled={loading || productNameError}>
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
            
            {/* Show only loading animation when updating, then checkmark */}
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
                <div className="form-field">
                  <label>Product ID</label>
                  <input
                    type="text"
                    placeholder="Product ID"
                    value={selectedProduct?.product_id || ""}
                    readOnly
                  />
                </div>
                
                <div className="form-field">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="product_name"
                    placeholder="Product Name"
                    value={formData.product_name}
                    onChange={handleInputChange}
                    className={productNameError ? "error-input" : ""}
                    required
                  />
                  {productNameError && <div className="error-message">{productNameError}</div>}
                </div>
                
                <div className="form-field">
                  <label>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled hidden>Select Category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-field">
                  <label>Stock Quantity</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    placeholder="Stock Quantity"
                    value={formData.stock_quantity}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label>Unit Price</label>
                  <input
                    type="number"
                    name="unit_price"
                    placeholder="Unit Price"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-buttons">
                  <button type="submit" className="save-btn" disabled={loading || productNameError}>
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

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && productToDelete && (
        <div className="overlay">
          <div className="add-form delete-confirmation">
            {/* Show delete animation when deleting, otherwise show normal content */}
            {deleting ? (
              <div className="delete-animation-center">
                {!deleteSuccess ? (
                  <Lottie 
                    animationData={loadingAnimation} 
                    loop={true}
                    style={{ width: 200, height: 200 }}
                  />
                ) : (
                  <Lottie 
                    animationData={deleteAnimation} 
                    loop={false}
                    style={{ width: 200, height: 200 }}
                  />
                )}
                <p style={{ marginTop: '20px', color: '#666' }}>
                  {!deleteSuccess ? "Deleting product..." : "Product deleted successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="delete-icon">🗑️</div>
                <h3>Delete Product</h3>
                <p>Are you sure you want to delete product <strong>"{productToDelete.product_name}"</strong>?</p>
                <p className="delete-warning">This action cannot be undone.</p>
                
                <div className="form-buttons">
                  <button className="confirm-delete-btn" onClick={handleDeleteProduct}>
                    Yes, Delete
                  </button>
                  <button className="cancel-btn" onClick={closeDeleteModal}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AllProducts;