import React, { useState, useEffect } from "react";
import "./Categories.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5000"
    : "https://copycornersystem-backend.onrender.com";

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
  
  // Separate pagination state for each view
  const [currentPage, setCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [totalPages, setTotalPages] = useState(1);
  const [archivedTotalPages, setArchivedTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [archivedTotalCount, setArchivedTotalCount] = useState(0);
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

  // REMOVED: Client-side storage (no longer needed)
  // const [allCategories, setAllCategories] = useState([]);
  // const [allArchivedCategories, setAllArchivedCategories] = useState([]);

  // Enhanced category name validation - SAME AS SERVICE TYPES
  const checkCategoryName = (categoryName, isEdit = false) => {
    if (!categoryName) {
      if (isEdit) {
        setEditCategoryNameError("");
      } else {
        setCategoryNameError("");
      }
      return;
    }

    // Length validation
    if (categoryName.length < 2) {
      if (isEdit) {
        setEditCategoryNameError("Category name must be at least 2 characters long");
      } else {
        setCategoryNameError("Category name must be at least 2 characters long");
      }
      return;
    }

    if (categoryName.length > 100) {
      if (isEdit) {
        setEditCategoryNameError("Category name must be less than 100 characters");
      } else {
        setCategoryNameError("Category name must be less than 100 characters");
      }
      return;
    }

    // Check if contains only numbers
    if (/^\d+$/.test(categoryName)) {
      if (isEdit) {
        setEditCategoryNameError("Category name cannot contain only numbers");
      } else {
        setCategoryNameError("Category name cannot contain only numbers");
      }
      return;
    }

    // Check if contains only special characters (no letters or numbers)
    if (/^[^a-zA-Z0-9]+$/.test(categoryName)) {
      if (isEdit) {
        setEditCategoryNameError("Please enter a valid category name");
      } else {
        setCategoryNameError("Please enter a valid category name");
      }
      return;
    }

    // Check if contains at least one letter
    if (!/[a-zA-Z]/.test(categoryName)) {
      if (isEdit) {
        setEditCategoryNameError("Category name must contain at least one letter");
      } else {
        setCategoryNameError("Category name must contain at least one letter");
      }
      return;
    }

    // Check for duplicate category names
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === categoryName.toLowerCase() &&
      (!isEdit || cat._id !== selectedCategory?._id)
    );

    if (existingCategory) {
      if (isEdit) {
        setEditCategoryNameError("Category name already exists");
      } else {
        setCategoryNameError("Category name already exists");
      }
    } else {
      if (isEdit) {
        setEditCategoryNameError("");
      } else {
        setCategoryNameError("");
      }
    }
  };

  // UPDATED: Fetch categories from backend with search
  const fetchCategories = async (page = 1, search = "") => {
    setLoading(true);
    try {
      let url = `${API_BASE}/categories?page=${page}&per_page=${ITEMS_PER_PAGE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        if (data.categories) {
          setCategories(data.categories);
          setCurrentPage(data.pagination?.page || 1);
          setTotalPages(data.pagination?.total_pages || 1);
          setTotalCount(data.pagination?.total_count || data.categories.length);
        } else if (Array.isArray(data)) {
          // Handle non-paginated response
          setCategories(data);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalCount(data.length);
        } else {
          setCategories([]);
          setTotalCount(0);
        }
      } else {
        console.error('Failed to fetch categories');
        showError('Failed to load categories');
        setCategories([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Error loading categories');
      setCategories([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Fetch archived categories with search
  const fetchArchivedCategories = async (page = 1, search = "") => {
    setLoading(true);
    try {
      let url = `${API_BASE}/categories/archived?page=${page}&per_page=${ITEMS_PER_PAGE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        if (data.categories) {
          setArchivedCategories(data.categories);
          setArchivedCurrentPage(data.pagination?.page || 1);
          setArchivedTotalPages(data.pagination?.total_pages || 1);
          setArchivedTotalCount(data.pagination?.total_count || data.categories.length);
        } else if (Array.isArray(data)) {
          // Handle non-paginated response
          setArchivedCategories(data);
          setArchivedCurrentPage(1);
          setArchivedTotalPages(1);
          setArchivedTotalCount(data.length);
        } else {
          setArchivedCategories([]);
          setArchivedTotalCount(0);
        }
      } else {
        console.error('Failed to fetch archived categories');
        showError('Failed to load archived categories');
        setArchivedCategories([]);
        setArchivedTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching archived categories:', error);
      showError('Error loading archived categories');
      setArchivedCategories([]);
      setArchivedTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // UPDATED: INSTANT SEARCH - No debounce
  useEffect(() => {
    if (showArchivedView) {
      fetchArchivedCategories(1, searchTerm);
    } else {
      fetchCategories(1, searchTerm);
    }
  }, [searchTerm, showArchivedView]);

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

  // UPDATED: Pagination handlers with search term
  const handleNextPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage < archivedTotalPages) {
        fetchArchivedCategories(archivedCurrentPage + 1, searchTerm);
      }
    } else {
      if (currentPage < totalPages) {
        fetchCategories(currentPage + 1, searchTerm);
      }
    }
  };

  const handlePrevPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage > 1) {
        fetchArchivedCategories(archivedCurrentPage - 1, searchTerm);
      }
    } else {
      if (currentPage > 1) {
        fetchCategories(currentPage - 1, searchTerm);
      }
    }
  };

  // Handle input changes for ADD form
  const handleAddNameChange = (e) => {
    const value = e.target.value;
    setNewCategory(value);
    checkCategoryName(value, false);
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
// Add category
const handleAddCategory = async (e) => {
  e.preventDefault();
  
  // Final validation before submission
  checkCategoryName(newCategory, false);
  
  if (categoryNameError) {
    showError("Please fix the category name error before saving.");
    return;
  }

  // Additional validation for empty required fields
  if (!newCategory.trim()) {
    setCategoryNameError("Category name is required");
    return;
  }

  setAddingLoading(true);
  try {
    // FIXED: Added /api to the endpoint
    const response = await fetch(`${API_BASE}/api/categories`, {
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
      await fetchCategories(currentPage, searchTerm);
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
      checkCategoryName(value, true);
    }
  };

  // Update category
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!selectedCategory) return;

    // Final validation before submission
    checkCategoryName(selectedCategory.name, true);
    
    if (editCategoryNameError) {
      showError("Please fix the category name error before updating.");
      return;
    }

    // Additional validation for empty required fields
    if (!selectedCategory.name.trim()) {
      setEditCategoryNameError("Category name is required");
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
          await fetchCategories(currentPage, searchTerm);
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
          await fetchCategories(currentPage, searchTerm);
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
          await fetchArchivedCategories(archivedCurrentPage, searchTerm);
          await fetchCategories(1, searchTerm);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

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
  const hasAddFormErrors = categoryNameError;
  const hasEditFormErrors = editCategoryNameError;

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
              maxLength="100"
              pattern=".*[a-zA-Z].*"
              title="Category name must contain letters and cannot be only numbers or special characters"
              onInvalid={(e) => e.target.setCustomValidity('Please enter a valid category name with at least one letter')}
              onInput={(e) => e.target.setCustomValidity('')}
            />
            {categoryNameError && <div className="error-message">{categoryNameError}</div>}
            <small className="character-count">
              {newCategory.length}/100 characters
            </small>
          </div>
          <div className="input-with-error">
            <textarea
              placeholder="Description"
              value={newDescription}
              onChange={handleAddDescriptionChange}
              maxLength="500"
              required
              onInvalid={(e) => e.target.setCustomValidity('Please fill up the description')}
              onInput={(e) => e.target.setCustomValidity('')}
            />
            <small className="character-count">
              {newDescription.length}/500 characters
            </small>
          </div>
          <button 
            type="submit" 
            className="add-btn" 
            disabled={addingLoading || hasAddFormErrors}
            title={hasAddFormErrors ? "Please fix validation errors before saving" : ""}
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
            <button className="back-to-main-btn" onClick={() => {
              setShowArchivedView(false);
              setSearchTerm("");
              fetchCategories(1, "");
            }}>
              ← Back to Main View
            </button>
          ) : (
            <button className="view-archive-btn" onClick={() => {
              setShowArchivedView(true);
              setSearchTerm("");
              fetchArchivedCategories(1, "");
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
           <table className="category-table main-view">
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
                      ) : searchTerm ? (
                        "No categories found matching your search."
                      ) : (
                        "No categories found."
                      )}
                    </td>
                  </tr>
                ) : (
                  categories.map((category, index) => (
                    <tr key={category._id}>
                      <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
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
            {categories.length > 0 && (
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

        {/* ARCHIVED CATEGORIES VIEW */}
        {showArchivedView && (
          <>
             <table className="category-table archived-view">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Archived Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "#888" }}>
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
                  archivedCategories.map((category, index) => (
                    <tr key={category._id}>
                      <td>{(archivedCurrentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
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

            {/* PAGINATION FOR ARCHIVED CATEGORIES */}
            {archivedCategories.length > 0 && (
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
                    maxLength="100"
                    pattern=".*[a-zA-Z].*"
                    title="Category name must contain letters and cannot be only numbers or special characters"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter a valid category name with at least one letter')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {editCategoryNameError && <div className="error-message">{editCategoryNameError}</div>}
                  <small className="character-count">
                    {selectedCategory.name?.length || 0}/100 characters
                  </small>
                </div>
                <div className="input-with-error">
                  <label>Description</label>
                  <textarea
                    name="description"
                    placeholder="Description"
                    value={selectedCategory.description || ""}
                    onChange={handleEditInputChange}
                    maxLength="500"
                    required
                    onInvalid={(e) => e.target.setCustomValidity('Please fill up the description')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  <small className="character-count">
                    {selectedCategory.description?.length || 0}/500 characters
                  </small>
                </div>
                <div className="form-buttons">
                  <button 
                    type="submit" 
                    className="save-btn" 
                    disabled={updatingLoading || hasEditFormErrors}
                    title={hasEditFormErrors ? "Please fix validation errors before updating" : ""}
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