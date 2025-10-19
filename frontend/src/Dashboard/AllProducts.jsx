import React, { useState, useEffect } from "react";
import "./AllProducts.css";

const API_BASE = "http://localhost:5000/api";

function AllProducts() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productNameError, setProductNameError] = useState("");
  const [formData, setFormData] = useState({
    product_name: "",
    category: "",
    stock_quantity: "",
    unit_price: ""
  });

  // Fetch products from backend
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
        await fetchProducts();
        setShowAddForm(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product');
    } finally {
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
        await fetchProducts();
        setShowEditModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product');
    } finally {
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
  };

  // Delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products/${productToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProducts();
        closeDeleteModal();
      } else {
        console.error('Failed to delete product');
        alert('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product');
    } finally {
      setLoading(false);
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
          {loading && <div className="loading-indicator">Loading...</div>}
          <button className="add-product-btn" onClick={openAddModal}>
            Add Product
          </button>
        </div>
      </div>

      <table className="product-table">
        <thead>
          <tr>
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
          {products.map((product) => (
            <tr key={product._id}>
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
          ))}
        </tbody>
      </table>

      {/* ADD PRODUCT MODAL */}
      {showAddForm && (
        <div className="overlay">
          <div className="add-form">
            <h3>Add New Product</h3>
            <form onSubmit={handleAddProduct}>
              <input
                type="text"
                placeholder="Product ID"
                value="Auto-generated"
                readOnly
              />
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
              
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled hidden>Select Category</option>
                <option value="Paper">Paper</option>
                <option value="Ink">Ink</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Other">Other</option>
              </select>
              
              <input
                type="number"
                name="stock_quantity"
                placeholder="Stock Quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                required
              />
              
              <input
                type="number"
                name="unit_price"
                placeholder="Unit Price"
                step="0.01"
                value={formData.unit_price}
                onChange={handleInputChange}
                required
              />

              <div className="form-buttons">
                <button type="submit" className="save-btn" disabled={loading || productNameError}>
                  {loading ? "Saving..." : "Save"}
                </button>
                <button type="button" className="cancel-btn" onClick={closeModals}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {showEditModal && (
        <div className="overlay">
          <div className="add-form">
            <h3>Edit Product</h3>
            <form onSubmit={handleUpdateProduct}>
              <input
                type="text"
                placeholder="Product ID"
                value={selectedProduct?.product_id || ""}
                readOnly
              />
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
              
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled hidden>Select Category</option>
                <option value="Paper">Paper</option>
                <option value="Ink">Ink</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Other">Other</option>
              </select>
              
              <input
                type="number"
                name="stock_quantity"
                placeholder="Stock Quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                required
              />
              
              <input
                type="number"
                name="unit_price"
                placeholder="Unit Price"
                step="0.01"
                value={formData.unit_price}
                onChange={handleInputChange}
                required
              />

              <div className="form-buttons">
                <button type="submit" className="save-btn" disabled={loading || productNameError}>
                  {loading ? "Updating..." : "Update"}
                </button>
                <button type="button" className="cancel-btn" onClick={closeModals}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && productToDelete && (
        <div className="overlay">
          <div className="add-form delete-confirmation">
            <div className="delete-icon">🗑️</div>
            <h3>Delete Product</h3>
            <p>Are you sure you want to delete product <strong>"{productToDelete.product_name}"</strong>?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            
            <div className="form-buttons">
              <button className="confirm-delete-btn" onClick={handleDeleteProduct} disabled={loading}>
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
              <button className="cancel-btn" onClick={closeDeleteModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllProducts;