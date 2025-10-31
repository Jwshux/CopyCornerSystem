import React, { useState, useEffect } from "react";
import "./Categories.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE = "http://localhost:5000/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [archivedCategories, setArchivedCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [categoryToArchive, setCategoryToArchive] = useState(null);
  const [categoryToRestore, setCategoryToRestore] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Separate loading states for different actions
  const [addingLoading, setAddingLoading] = useState(false);
  const [updatingLoading, setUpdatingLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  
  // Category name errors
  const [categoryNameError, setCategoryNameError] = useState("");
  const [editCategoryNameError, setEditCategoryNameError] = useState("");
  
  // Error modal state
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Archive view and search
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Fetch categories from backend
  const fetchCategories = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/categories?page=${page}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
        setCurrentPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.total_pages || 1);
      } else {
        console.error('Failed to fetch categories');
        showError('Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived categories
  const fetchArchivedCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/categories/archived`);
      if (response.ok) {
        const data = await response.json();
        setArchivedCategories(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch archived categories');
        showError('Failed to load archived categories');
      }
    } catch (error) {
      console.error('Error fetching archived categories:', error);
      showError('Error loading archived categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset states when modals close
  useEffect(() => {
    if (!showEditModal) {
      setUpdateSuccess(false);
    }
  }, [showEditModal]);

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

  // Pagination handlers
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

  // Archive category functions
  const openArchiveModal = (category) => {
    setCategoryToArchive(category);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setCategoryToArchive(null);
    setArchiving(false);
    setArchiveSuccess(false);
  };

  const handleArchiveCategory = async () => {
    if (!categoryToArchive) return;

    setArchiving(true);
    try {
      const response = await fetch(`${API_BASE}/categories/${categoryToArchive._id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        setArchiveSuccess(true);
        setTimeout(async () => {
          const isLastItemOnPage = categories.length === 1;
          
          if (isLastItemOnPage && currentPage > 1) {
            await fetchCategories(currentPage - 1);
          } else {
            await fetchCategories(currentPage);
          }
          closeArchiveModal();
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to archive category');
        setArchiving(false);
      }
    } catch (error) {
      console.error('Error archiving category:', error);
      showError('Error archiving category');
      setArchiving(false);
    }
  };

  // Restore category functions
  const openRestoreModal = (category) => {
    setCategoryToRestore(category);
    setShowRestoreModal(true);
  };

  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setCategoryToRestore(null);
    setRestoring(false);
    setRestoreSuccess(false);
  };

  const handleRestoreCategory = async () => {
    if (!categoryToRestore) return;

    setRestoring(true);
    try {
      const response = await fetch(`${API_BASE}/categories/${categoryToRestore._id}/restore`, {
        method: 'PUT',
      });

      if (response.ok) {
        setRestoreSuccess(true);
        setTimeout(async () => {
          await fetchArchivedCategories();
          await fetchCategories(currentPage);
          closeRestoreModal();
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to restore category');
        setRestoring(false);
      }
    } catch (error) {
      console.error('Error restoring category:', error);
      showError('Error restoring category');
      setRestoring(false);
    }
  };

  // Close modals
  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedCategory(null);
    setEditCategoryNameError("");
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredArchivedCategories = archivedCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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
        {/* Table Header with Archive Button and Search */}
        <div className="table-header">
          {showArchivedView ? (
            <button className="back-to-main-btn" onClick={() => setShowArchivedView(false)}>
              ← Back to Main View
            </button>
          ) : (
            <button className="view-archive-btn" onClick={() => {
              setShowArchivedView(true);
              fetchArchivedCategories();
            }}>
              📦 View Archived Categories
            </button>
          )}
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* MAIN CATEGORIES VIEW */}
        {!showArchivedView && (
          <>
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
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "#888" }}>
                      {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                          <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                        </div>
                      ) : searchTerm ? (
                        "No categories found matching your search."
                      ) : (
                        "No categories found."
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category, index) => (
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
                          Edit
                        </button>
                        <button
                          className="archive-btn"
                          onClick={() => openArchiveModal(category)}
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* PAGINATION CONTROLS */}
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
          </>
        )}

        {/* ARCHIVED CATEGORIES VIEW */}
        {showArchivedView && (
          <>
            <table className="category-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Archived Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArchivedCategories.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "#888" }}>
                      {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                          <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                        </div>
                      ) : searchTerm ? (
                        "No archived categories found matching your search."
                      ) : (
                        "No archived categories found."
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredArchivedCategories.map((category) => (
                    <tr key={category._id}>
                      <td>{category.name}</td>
                      <td>
                        <div className="description-cell">{category.description || "—"}</div>
                      </td>
                      <td>{formatDate(category.archived_at)}</td>
                      <td>
                        <button 
                          className="restore-btn"
                          onClick={() => openRestoreModal(category)}
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* EDIT CATEGORY MODAL */}
      {showEditModal && selectedCategory && (
        <div className="overlay">
          <div className="modal-content">
            <h3>Edit Category</h3>
            
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

      {/* ARCHIVE CONFIRMATION MODAL */}
      {showArchiveModal && categoryToArchive && (
        <div className="overlay">
          <div className="modal-content archive-confirmation centered-modal">
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
                  {!archiveSuccess ? "Archiving category..." : "Category archived successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="archive-icon">📦</div>
                <h3 className="centered-text">Archive Category</h3>
                <p className="centered-text">Are you sure you want to archive category <strong>"{categoryToArchive.name}"</strong>?</p>
                <p className="archive-warning centered-text">This category will be moved to archives and hidden from the main list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-archive-btn" onClick={handleArchiveCategory}>
                    Yes, Archive
                  </button>
                  <button className="cancel-btn" onClick={closeArchiveModal}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {showRestoreModal && categoryToRestore && (
        <div className="overlay">
          <div className="modal-content restore-confirmation centered-modal">
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
                  {!restoreSuccess ? "Restoring category..." : "Category restored successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="restore-icon">↶</div>
                <h3 className="centered-text">Restore Category</h3>
                <p className="centered-text">Are you sure you want to restore category <strong>"{categoryToRestore.name}"</strong>?</p>
                <p className="restore-warning centered-text">This category will be moved back to the main categories list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-restore-btn" onClick={handleRestoreCategory}>
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