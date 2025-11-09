import React, { useState, useEffect } from "react";
import "./ServiceTypes.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE = "http://localhost:5000/api";

function ServiceTypes({ showAddModal, onAddModalClose }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [archivedServiceTypes, setArchivedServiceTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [serviceTypeToArchive, setServiceTypeToArchive] = useState(null);
  const [serviceTypeToRestore, setServiceTypeToRestore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serviceNameError, setServiceNameError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [formData, setFormData] = useState({
    service_name: "",
    category_id: "",
    status: ""
  });

  // Archive view and search
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state - SEPARATE for main and archived views
  const [currentPage, setCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [archivedTotalPages, setArchivedTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [archivedTotalCount, setArchivedTotalCount] = useState(0);

  // Add error modal functions
  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  // Handle modal from parent
  useEffect(() => {
    if (showAddModal) {
      openAddModal();
    }
  }, [showAddModal]);

  // Enhanced service name validation
  const checkServiceName = (serviceName) => {
    if (!serviceName) {
      setServiceNameError("");
      return;
    }

    // Length validation
    if (serviceName.length < 2) {
      setServiceNameError("Service name must be at least 2 characters long");
      return;
    }

    if (serviceName.length > 100) {
      setServiceNameError("Service name must be less than 100 characters");
      return;
    }

    // Check if contains only numbers
    if (/^\d+$/.test(serviceName)) {
      setServiceNameError("Service name cannot contain only numbers");
      return;
    }

    // Check if contains only special characters (no letters or numbers)
    if (/^[^a-zA-Z0-9]+$/.test(serviceName)) {
      setServiceNameError("Please enter a valid service name");
      return;
    }

    // Check if contains at least one letter
    if (!/[a-zA-Z]/.test(serviceName)) {
      setServiceNameError("Service name must contain at least one letter");
      return;
    }

    // Check for duplicate service names
    const existingService = serviceTypes.find(service => 
      service.service_name.toLowerCase() === serviceName.toLowerCase() &&
      (!selectedServiceType || service._id !== selectedServiceType._id)
    );

    if (existingService) {
      setServiceNameError("Service name already exists");
    } else {
      setServiceNameError("");
    }
  };

  // Fetch active service types
  const fetchServiceTypes = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/service_types?page=${page}&per_page=${ITEMS_PER_PAGE}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Service Types API Response:', data);
        
        if (Array.isArray(data)) {
          setServiceTypes(data);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalCount(data.length);
        } else if (data.service_types) {
          setServiceTypes(data.service_types || []);
          setCurrentPage(data.pagination?.page || 1);
          setTotalPages(data.pagination?.total_pages || 1);
          setTotalCount(data.pagination?.total_service_types || data.service_types.length);
        } else {
          setServiceTypes([]);
          setTotalCount(0);
        }
      } else {
        console.error('Failed to fetch service types');
        setServiceTypes([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
      setServiceTypes([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived service types - UPDATED WITH PAGINATION
  const fetchArchivedServiceTypes = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/service_types/archived?page=${page}&per_page=${ITEMS_PER_PAGE}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Archived Service Types API Response:', data);
        
        if (Array.isArray(data)) {
          setArchivedServiceTypes(data);
          setArchivedCurrentPage(1);
          setArchivedTotalPages(1);
          setArchivedTotalCount(data.length);
        } else if (data.service_types) {
          setArchivedServiceTypes(data.service_types || []);
          setArchivedCurrentPage(data.pagination?.page || 1);
          setArchivedTotalPages(data.pagination?.total_pages || 1);
          setArchivedTotalCount(data.pagination?.total_service_types || data.service_types.length);
        } else {
          setArchivedServiceTypes([]);
          setArchivedTotalCount(0);
        }
      } else {
        console.error('Failed to fetch archived service types');
        setArchivedServiceTypes([]);
        setArchivedTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching archived service types:', error);
      setArchivedServiceTypes([]);
      setArchivedTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
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
    fetchServiceTypes();
    fetchCategories();
  }, []);

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

  useEffect(() => {
    if (!showErrorModal) {
      setErrorMessage("");
    }
  }, [showErrorModal]);

  // Pagination handlers - UPDATED with separate logic
  const handleNextPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage < archivedTotalPages) {
        fetchArchivedServiceTypes(archivedCurrentPage + 1);
      }
    } else {
      if (currentPage < totalPages) {
        fetchServiceTypes(currentPage + 1);
      }
    }
  };

  const handlePrevPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage > 1) {
        fetchArchivedServiceTypes(archivedCurrentPage - 1);
      }
    } else {
      if (currentPage > 1) {
        fetchServiceTypes(currentPage - 1);
      }
    }
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "service_name") {
      checkServiceName(value);
    }
  };

  const resetForm = () => {
    setFormData({
      service_name: "",
      category_id: "",
      status: ""
    });
    setSelectedServiceType(null);
    setServiceNameError("");
  };

  const handleAddServiceType = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    checkServiceName(formData.service_name);
    
    if (serviceNameError) {
      showError("Please fix the service name error before saving.");
      return;
    }

    // Additional validation for empty required fields
    if (!formData.service_name.trim()) {
      setServiceNameError("Service name is required");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/service_types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setAddSuccess(true);
        setTimeout(async () => {
          await fetchServiceTypes(currentPage);
          setShowAddForm(false);
          resetForm();
          setLoading(false);
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to create service type');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating service type:', error);
      showError('Error creating service type');
      setLoading(false);
    }
  };

  const handleEditServiceType = (serviceType) => {
    setSelectedServiceType(serviceType);
    setFormData({
      service_name: serviceType.service_name,
      category_id: serviceType.category_id || (serviceType.category ? serviceType.category._id : ""),
      status: serviceType.status
    });
    setServiceNameError("");
    setShowEditModal(true);
  };

  const handleUpdateServiceType = async (e) => {
    e.preventDefault();
    
    // Final validation before submission
    checkServiceName(formData.service_name);
    
    if (serviceNameError) {
      showError("Please fix the service name error before updating.");
      return;
    }

    // Additional validation for empty required fields
    if (!formData.service_name.trim()) {
      setServiceNameError("Service name is required");
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/service_types/${selectedServiceType._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setUpdateSuccess(true);
        setTimeout(async () => {
          await fetchServiceTypes(currentPage);
          setShowEditModal(false);
          resetForm();
          setLoading(false);
        }, 1500);
      } else {
        const errorData = await response.json();
        
        // Handle the case where service type has active transactions when trying to set to inactive
        if (errorData.error && errorData.error.includes('transaction(s) are using this service type')) {
          let errorMessage = errorData.error;
          
          // Fix grammar and format the message in one line
          errorMessage = errorMessage.replace('transaction(s) are using', 'transaction(s) are using');
          errorMessage += '\nPlease update or archive these transactions first.';
          
          showError(errorMessage);
        } else {
          showError(errorData.error || 'Failed to update service type');
        }
        setLoading(false);
      }
    } catch (error) {
      console.error('Error updating service type:', error);
      showError('Error updating service type');
      setLoading(false);
    }
  };

  // Archive service type functions
  const openArchiveModal = (serviceType) => {
    setServiceTypeToArchive(serviceType);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setServiceTypeToArchive(null);
    setArchiving(false);
    setArchiveSuccess(false);
  };

  const handleArchiveServiceType = async () => {
    if (!serviceTypeToArchive) return;

    setArchiving(true);
    
    try {
      const response = await fetch(`${API_BASE}/service_types/${serviceTypeToArchive._id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        setArchiveSuccess(true);
        setTimeout(async () => {
          await fetchServiceTypes(currentPage);
          closeArchiveModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        
        // Handle the case where service type has active transactions
        if (errorData.error && errorData.error.includes('transaction(s) are using this service type')) {
          let errorMessage = errorData.error;
          
          // Fix grammar and format the message in one line
          errorMessage = errorMessage.replace('transaction(s) are using', 'transaction(s) are using');
          errorMessage += '\nPlease update or archive these transactions first.';
          
          showError(errorMessage);
        } else {
          showError(errorData.error || 'Failed to archive service type');
        }
        setArchiving(false);
      }
    } catch (error) {
      console.error('Error archiving service type:', error);
      showError('Error archiving service type');
      setArchiving(false);
    }
  };

  // Restore service type functions
  const openRestoreModal = (serviceType) => {
    setServiceTypeToRestore(serviceType);
    setShowRestoreModal(true);
  };

  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setServiceTypeToRestore(null);
    setRestoring(false);
    setRestoreSuccess(false);
  };

  const handleRestoreServiceType = async () => {
    if (!serviceTypeToRestore) return;

    setRestoring(true);
    
    try {
      const response = await fetch(`${API_BASE}/service_types/${serviceTypeToRestore._id}/restore`, {
        method: 'PUT',
      });

      if (response.ok) {
        setRestoreSuccess(true);
        setTimeout(async () => {
          await fetchArchivedServiceTypes(archivedCurrentPage);
          await fetchServiceTypes(1);
          closeRestoreModal();
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to restore service type');
        setRestoring(false);
      }
    } catch (error) {
      console.error('Error restoring service type:', error);
      showError('Error restoring service type');
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

  // Helper function to get category name for display
  const getCategoryName = (serviceType) => {
    if (serviceType.category_name) return serviceType.category_name;
    if (serviceType.category && typeof serviceType.category === 'object') {
      return serviceType.category.name || 'Unknown';
    }
    if (serviceType.category) return serviceType.category;
    
    if (serviceType.category_id && categories.length > 0) {
      const category = categories.find(cat => cat._id === serviceType.category_id);
      return category ? category.name : 'Unknown';
    }
    
    return 'Uncategorized';
  };

  // Filter service types based on search term
  const filteredServiceTypes = serviceTypes.filter(serviceType =>
    serviceType.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    serviceType.service_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(serviceType).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArchivedServiceTypes = archivedServiceTypes.filter(serviceType =>
    serviceType.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    serviceType.service_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(serviceType).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Check if form has any validation errors
  const hasFormErrors = serviceNameError;

  return (
      <div className="service-types-page">
        <div className="table-container">
          {/* Table Header with Archive Button and Search */}
          <div className="table-header">
            {showArchivedView ? (
              <button className="back-to-main-btn" onClick={() => setShowArchivedView(false)}>
                ← Back to Main View
              </button>
            ) : (
              <button className="view-archive-btn" onClick={() => {
                setShowArchivedView(true);
                fetchArchivedServiceTypes(1);
              }}>
                📦 View Archived Service Types
              </button>
            )}
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search service types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* MAIN SERVICE TYPES VIEW */}
          {!showArchivedView && (
            <>
              <table className="service-types-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Service ID</th>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceTypes.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
                        {loading ? (
                          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                            <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                          </div>
                        ) : searchTerm ? (
                          "No service types found matching your search."
                        ) : (
                          "No service types found."
                        )}
                      </td>
                    </tr>
                  ) : (
                    serviceTypes.map((serviceType, index) => (
                      <tr key={serviceType._id}>
                        <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                        <td>{serviceType.service_id}</td>
                        <td>{serviceType.service_name}</td>
                        <td>{getCategoryName(serviceType)}</td>
                        <td>
                          <span
                            className={`status-tag ${
                              serviceType.status === "Active"
                                ? "in-stock"
                                : "out-stock"
                            }`}
                          >
                            {serviceType.status}
                          </span>
                        </td>
                        <td>
                          <button className="edit-btn" onClick={() => handleEditServiceType(serviceType)}>Edit</button>
                          <button className="archive-btn" onClick={() => openArchiveModal(serviceType)}>Archive</button>
                        </td>
                      </tr>
                    ))
                  )}
                  
                  {/* Add empty rows to maintain consistent height */}
                  {serviceTypes.length > 0 && serviceTypes.length < 10 &&
                    Array.from({ length: 10 - serviceTypes.length }).map((_, index) => (
                      <tr key={`empty-${index}`} style={{ visibility: 'hidden' }}>
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

              {/* PAGINATION CONTROLS - UPDATED */}
              {serviceTypes.length > 0 && (
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

          {/* ARCHIVED SERVICE TYPES VIEW */}
          {showArchivedView && (
            <>
              <table className="service-types-table">
                <thead>
                  <tr>
                    <th>Service ID</th>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Archived Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedServiceTypes.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
                        {loading ? (
                          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                            <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                          </div>
                        ) : searchTerm ? (
                          "No archived service types found matching your search."
                        ) : (
                          "No archived service types found."
                        )}
                      </td>
                    </tr>
                  ) : (
                    archivedServiceTypes.map((serviceType, index) => (
                      <tr key={serviceType._id}>
                        <td>{serviceType.service_id}</td>
                        <td>{serviceType.service_name}</td>
                        <td>{getCategoryName(serviceType)}</td>
                        <td>
                          <span
                            className={`status-tag ${
                              serviceType.status === "Active"
                                ? "in-stock"
                                : "out-stock"
                            }`}
                          >
                            {serviceType.status}
                          </span>
                        </td>
                        <td>{formatDate(serviceType.archived_at)}</td>
                        <td>
                          <button className="restore-btn" onClick={() => openRestoreModal(serviceType)}>
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  
                  {/* Add empty rows to maintain consistent height */}
                  {archivedServiceTypes.length > 0 && archivedServiceTypes.length < 10 &&
                    Array.from({ length: 10 - archivedServiceTypes.length }).map((_, index) => (
                      <tr key={`empty-archived-${index}`} style={{ visibility: 'hidden' }}>
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

              {/* PAGINATION FOR ARCHIVED SERVICE TYPES - ADDED */}
              {archivedServiceTypes.length > 0 && (
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
      {/* ADD SERVICE TYPE MODAL */}
      {showAddForm && (
        <div className="overlay">
          <div className="add-form">
            <h3>Add New Service Type</h3>
            
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
              <form onSubmit={handleAddServiceType}>
                <div className="form-field">
                  <label>Service ID</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    value="Auto-generated"
                    readOnly
                    className="readonly-field"
                  />
                </div>
                
                <div className="form-field">
                  <label>Service Name</label>
                  <input
                    type="text"
                    name="service_name"
                    placeholder="Service Name"
                    value={formData.service_name}
                    onChange={handleInputChange}
                    className={serviceNameError ? "error-input" : ""}
                    required
                    maxLength="100"
                    pattern=".*[a-zA-Z].*"
                    title="Service name must contain letters and cannot be only numbers or special characters"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter a valid service name with at least one letter')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {serviceNameError && <div className="error-message">{serviceNameError}</div>}
                  <small className="character-count">
                    {formData.service_name.length}/100 characters
                  </small>
                </div>

                <div className="form-field">
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
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-field">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    onInvalid={(e) => e.target.setCustomValidity('Please select a status')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  >
                    <option value="" disabled>Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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

      {/* EDIT SERVICE TYPE MODAL */}
      {showEditModal && (
        <div className="overlay">
          <div className="add-form">
            <h3>Edit Service Type</h3>
            
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
              <form onSubmit={handleUpdateServiceType}>
                <div className="form-field">
                  <label>Service ID</label>
                  <input
                    type="text"
                    placeholder="Service ID"
                    value={selectedServiceType?.service_id || ""}
                    readOnly
                    className="readonly-field"
                  />
                </div>
                
                <div className="form-field">
                  <label>Service Name</label>
                  <input
                    type="text"
                    name="service_name"
                    placeholder="Service Name"
                    value={formData.service_name}
                    onChange={handleInputChange}
                    className={serviceNameError ? "error-input" : ""}
                    required
                    maxLength="100"
                    pattern=".*[a-zA-Z].*"
                    title="Service name must contain letters and cannot be only numbers or special characters"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter a valid service name with at least one letter')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {serviceNameError && <div className="error-message">{serviceNameError}</div>}
                  <small className="character-count">
                    {formData.service_name.length}/100 characters
                  </small>
                </div>

                <div className="form-field">
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
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-field">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    onInvalid={(e) => e.target.setCustomValidity('Please select a status')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  >
                    <option value="" disabled>Select Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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

      {/* ARCHIVE CONFIRMATION MODAL */}
      {showArchiveModal && serviceTypeToArchive && (
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
                  {!archiveSuccess ? "Archiving service type..." : "Service type archived successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="archive-icon">📦</div>
                <h3 className="centered-text">Archive Service Type</h3>
                <p className="centered-text">Are you sure you want to archive service type <strong>"{serviceTypeToArchive.service_name}"</strong>?</p>
                <p className="archive-warning centered-text">This service type will be moved to archives and hidden from the main list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-archive-btn" onClick={handleArchiveServiceType}>
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
      {showRestoreModal && serviceTypeToRestore && (
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
                  {!restoreSuccess ? "Restoring service type..." : "Service type restored successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="restore-icon">↶</div>
                <h3 className="centered-text">Restore Service Type</h3>
                <p className="centered-text">Are you sure you want to restore service type <strong>"{serviceTypeToRestore.service_name}"</strong>?</p>
                <p className="restore-warning centered-text">This service type will be moved back to the main service types list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-restore-btn" onClick={handleRestoreServiceType}>
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
}

export default ServiceTypes;