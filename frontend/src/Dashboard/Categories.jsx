import React, { useState, useEffect } from "react";
import "./Categories.css";

const API_BASE = "http://localhost:5000/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Separate loading states for different actions
  const [loading, setLoading] = useState(false); // For fetching data
  const [addingLoading, setAddingLoading] = useState(false); // For add action only
  const [updatingLoading, setUpdatingLoading] = useState(false); // For update action only
  const [deletingLoading, setDeletingLoading] = useState(false); // For delete action only
  
  // Only track category name errors (for instant duplicate validation)
  const [categoryNameError, setCategoryNameError] = useState("");
  const [editCategoryNameError, setEditCategoryNameError] = useState("");

  // Fetch categories from backend
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
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

  // Check if category name exists for ADD form (INSTANT VALIDATION)
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

  // Check if category name exists for EDIT form (INSTANT VALIDATION)
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
    checkCategoryName(value); // INSTANT VALIDATION
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
// Add category
const handleAddCategory = async (e) => {
  e.preventDefault();
  
  // Just return if there's a duplicate name error, no alert
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
      await fetchCategories();
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
// Update category
const handleUpdateCategory = async (e) => {
  e.preventDefault();
  
  if (!selectedCategory) return;

  // Just return if there's a duplicate name error, no alert
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
      await fetchCategories();
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
        await fetchCategories();
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
        {/* {loading && <div className="loading">Loading...</div>} */}
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
                  No categories yet.
                </td>
              </tr>
            ) : (
              categories.map((category, index) => (
                <tr key={category._id}>
                  <td>{index + 1}</td>
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