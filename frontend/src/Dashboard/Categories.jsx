import React, { useState, useEffect } from "react";
import "./Categories.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";

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
  const [deletingLoading, setDeletingLoading] = useState(false);
  
  // Category name errors
  const [categoryNameError, setCategoryNameError] = useState("");
  const [editCategoryNameError, setEditCategoryNameError] = useState("");

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
        alert(error.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Error creating category');
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
        await fetchCategories(currentPage);
        setShowEditModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Error updating category');
    } finally {
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
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeletingLoading(true);
    try {
      const response = await fetch(`${API_BASE}/categories/${categoryToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
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
      } else {
        console.error('Failed to delete category');
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    } finally {
      setDeletingLoading(false);
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
            />
            {categoryNameError && <div className="error-message">{categoryNameError}</div>}
          </div>
          <div className="input-with-error">
            <textarea
              placeholder="Description"
              value={newDescription}
              onChange={handleAddDescriptionChange}
              required
            />
          </div>
          <button 
            type="submit" 
            className="add-btn" 
            disabled={addingLoading}
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
                      "No users found."
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
            <form onSubmit={handleUpdateCategory}>
              <div className="input-with-error">
                <input
                  type="text"
                  name="name"
                  placeholder="Category Name"
                  value={selectedCategory.name || ""}
                  onChange={handleEditInputChange}
                  className={editCategoryNameError ? "error-input" : ""}
                  required
                />
                {editCategoryNameError && <div className="error-message">{editCategoryNameError}</div>}
              </div>
              <div className="input-with-error">
                <textarea
                  name="description"
                  placeholder="Description"
                  value={selectedCategory.description || ""}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-buttons">
                <button 
                  type="submit" 
                  className="save-btn" 
                  disabled={updatingLoading}
                >
                  {updatingLoading ? "Updating..." : "Update"}
                </button>
                <button type="button" className="cancel-btn" onClick={closeEditModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && categoryToDelete && (
        <div className="overlay">
          <div className="modal-content delete-confirmation">
            <div className="delete-icon">🗑️</div>
            <h3>Delete Category</h3>
            <p>Are you sure you want to delete category <strong>"{categoryToDelete.name}"</strong>?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            
            <div className="form-buttons">
              <button className="confirm-delete-btn" onClick={handleDeleteCategory} disabled={deletingLoading}>
                {deletingLoading ? "Deleting..." : "Yes, Delete"}
              </button>
              <button className="cancel-btn" onClick={closeDeleteModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;