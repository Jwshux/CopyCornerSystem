import React, { useState, useEffect } from "react";
import "./Categories.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import deleteAnimation from "../animations/delete.json";

const API_BASE = "http://localhost:5000/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Pagination state - Same as Products
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Separate loading states for different actions
  const [addingLoading, setAddingLoading] = useState(false);
  const [updatingLoading, setUpdatingLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // Category name errors
  const [categoryNameError, setCategoryNameError] = useState("");
  const [editCategoryNameError, setEditCategoryNameError] = useState("");
  
  // NEW: Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch categories from backend - UPDATED FOR PAGINATION
  const fetchCategories = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/categories?page=${page}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
      } else {
        console.error('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset update success state when modal closes
  useEffect(() => {
    if (!showEditModal) {
      setUpdateSuccess(false);
    }
  }, [showEditModal]);

  // Reset delete success state when modal closes
  useEffect(() => {
    if (!showDeleteModal) {
      setDeleteSuccess(false);
    }
  }, [showDeleteModal]);

  // Pagination handlers - Same as Products
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchCategories(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchCategories(currentPage - 1);
    }
  };

  // Check if category name exists for ADD form
  const checkCategoryName = (categoryName) => {
    if (!categoryName) {
      setCategoryNameError("");
      return;
    }

    // Check if category name contains only numbers
    if (/^\d+$/.test(categoryName)) {
      setCategoryNameError("Category name cannot contain only numbers");
      return;
    }

    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (existingCategory) {
      setCategoryNameError("Category name already exists");
    } else {
      setCategoryNameError("");
    }
  };

  // Check if category name exists for EDIT form
  const checkEditCategoryName = (categoryName) => {
    if (!categoryName) {
      setEditCategoryNameError("");
      return;
    }

    // Check if category name contains only numbers
    if (/^\d+$/.test(categoryName)) {
      setEditCategoryNameError("Category name cannot contain only numbers");
      return;
    }

    const existingCategory = categories.find(cat => 
      cat._id !== selectedCategory?._id && 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (existingCategory) {
      setEditCategoryNameError("Category name already exists");
    } else {
      setEditCategoryNameError("");
    }
  };

  // Handle input changes for ADD form
  const handleAddNameChange = (e) => {
    const value = e.target.value;
    setNewCategory(value);
    checkCategoryName(value);
  };

  const handleAddDescriptionChange = (e) => {
    const value = e.target.value;
    setNewDescription(value);
  };

  // Reset form state
  const resetForm = () => {
    setNewCategory("");
    setNewDescription("");
    setCategoryNameError("");
    setSelectedCategory(null);
  };

  // Show error modal
  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  // Close error modal
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  // Add category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (categoryNameError) {
      return;
    }

    setAddingLoading(true);
    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategory.trim(),
          description: newDescription.trim()
        }),
      });

      if (response.ok) {
        await fetchCategories(currentPage);
        resetForm();
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showError('Error creating category');
    } finally {
      setAddingLoading(false);
    }
  };

  // Edit category - fills form for editing
  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setEditCategoryNameError("");
    setShowEditModal(true);
  };

  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedCategory({
      ...selectedCategory,
      [name]: value
    });
    
    if (name === "name") {
      checkEditCategoryName(value);
    }
  };

  // Update category
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!selectedCategory) return;

    if (editCategoryNameError) {
      return;
    }

    setUpdatingLoading(true);
    try {
      const response = await fetch(`${API_BASE}/categories/${selectedCategory._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedCategory.name.trim(),
          description: selectedCategory.description?.trim() || ""
        }),
      });

      if (response.ok) {
        setUpdateSuccess(true);
        // Wait for animation to complete before closing
        setTimeout(async () => {
          await fetchCategories(currentPage);
          setShowEditModal(false);
          resetForm();
          setUpdatingLoading(false);
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to update category');
        setUpdatingLoading(false);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      showError('Error updating category');
      setUpdatingLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
    setDeleting(false);
    setDeleteSuccess(false);
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/categories/${categoryToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        // Wait for animation to complete before closing and refreshing
        setTimeout(async () => {
          // Check if this was the last item on the current page
          const isLastItemOnPage = categories.length === 1;
          
          if (isLastItemOnPage && currentPage > 1) {
            // If it was the last item and we're not on page 1, go to previous page
            await fetchCategories(currentPage - 1);
          } else {
            // Otherwise refresh current page
            await fetchCategories(currentPage);
          }
          closeDeleteModal();
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to delete category');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('Error deleting category');
      setDeleting(false);
    }
  };

  // Close modals
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedCategory(null);
    setEditCategoryNameError("");
  };

  return (
    <div className="categories-container">
      {/* Add category */}
      <div className="add-category">
        <h3>➕ Add New Category</h3>
        <form onSubmit={handleAddCategory}>
          <div className="input-with-error">
            <input
              type="text"
              placeholder="Category Name"
              value={newCategory}
              onChange={handleAddNameChange}
              className={categoryNameError ? "error-input" : ""}
              required
              pattern=".*[a-zA-Z].*"
              title="Category name must contain letters and cannot be only numbers"
              onInvalid={(e) => e.target.setCustomValidity('Please fill up the category name')}
              onInput={(e) => e.target.setCustomValidity('')}
            />
            {categoryNameError && <div className="error-message">{categoryNameError}</div>}
          </div>
          <div className="input-with-error">
            <textarea
              placeholder="Description"
              value={newDescription}
              onChange={handleAddDescriptionChange}
              required
              onInvalid={(e) => e.target.setCustomValidity('Please fill up the description')}
              onInput={(e) => e.target.setCustomValidity('')}
            />
          </div>
          <button 
            type="submit" 
            className="add-btn" 
            disabled={addingLoading || categoryNameError}
          >
            {addingLoading ? "Adding..." : "Add Category"}
          </button>
        </form>
      </div>

      {/* All categories */}
      <div className="all-categories">
        <h3>📋 All Categories</h3>
        <table className="category-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
            <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#888" }}>
                    {loading ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                      </div>
                    ) : (
                      "No categories found."
                    )}
                  </td>
                </tr>
              ) : (
              categories.map((category, index) => (
                <tr key={category._id}>
                  <td>{(currentPage - 1) * 10 + index + 1}</td>
                  <td>{category.name}</td>
                  <td>
                    <div className="description-cell">{category.description || "—"}</div>
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEditCategory(category)}
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => openDeleteModal(category)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* SIMPLE PAGINATION CONTROLS - Same as Products */}
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

      {/* EDIT CATEGORY MODAL */}
      {showEditModal && selectedCategory && (
        <div className="overlay">
          <div className="modal-content">
            <h3>Edit Category</h3>
            
            {/* Show only loading animation when updating, then checkmark */}
            {updatingLoading ? (
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
              <form onSubmit={handleUpdateCategory}>
                <div className="input-with-error">
                  <label>Category Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Category Name"
                    value={selectedCategory.name || ""}
                    onChange={handleEditInputChange}
                    className={editCategoryNameError ? "error-input" : ""}
                    required
                    pattern=".*[a-zA-Z].*"
                    title="Category name must contain letters and cannot be only numbers"
                    onInvalid={(e) => e.target.setCustomValidity('Please fill up the category name')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {editCategoryNameError && <div className="error-message">{editCategoryNameError}</div>}
                </div>
                <div className="input-with-error">
                  <label>Description</label>
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={selectedCategory.description || ""}
                    onChange={handleEditInputChange}
                    required
                    onInvalid={(e) => e.target.setCustomValidity('Please fill up the description')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                </div>
                <div className="form-buttons">
                  <button 
                    type="submit" 
                    className="save-btn" 
                    disabled={updatingLoading || editCategoryNameError}
                  >
                    {updatingLoading ? "Updating..." : "Update"}
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeEditModal}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && categoryToDelete && (
        <div className="overlay">
          <div className="modal-content delete-confirmation">
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
                  {!deleteSuccess ? "Deleting category..." : "Category deleted successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="delete-icon">🗑️</div>
                <h3>Delete Category</h3>
                <p>Are you sure you want to delete category <strong>"{categoryToDelete.name}"</strong>?</p>
                <p className="delete-warning">This action cannot be undone.</p>
                
                <div className="form-buttons">
                  <button className="confirm-delete-btn" onClick={handleDeleteCategory}>
                    Yes, Delete
                  </button>
                  <button className="cancel-btn" onClick={closeDeleteModal}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ERROR MODAL */}
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

export default Categories;