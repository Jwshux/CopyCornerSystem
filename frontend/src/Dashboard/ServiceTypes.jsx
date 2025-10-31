import React, { useState, useEffect } from "react";
import "./ServiceTypes.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import deleteAnimation from "../animations/delete.json";

const API_BASE = "http://localhost:5000/api";

function ServiceTypes() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [serviceTypeToDelete, setServiceTypeToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serviceNameError, setServiceNameError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [formData, setFormData] = useState({
    service_name: "",
    category_id: "",
    status: "Active"
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // FIXED: Better API handling with error handling
  const fetchServiceTypes = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/service_types?page=${page}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        console.log('Service Types API Response:', data);
        
        // Handle both array and paginated response formats
        if (Array.isArray(data)) {
          setServiceTypes(data);
          setCurrentPage(1);
          setTotalPages(1);
        } else if (data.service_types) {
          setServiceTypes(data.service_types || []);
          setCurrentPage(data.pagination?.page || 1);
          setTotalPages(data.pagination?.total_pages || 1);
        } else {
          setServiceTypes([]);
        }
      } else {
        console.error('Failed to fetch service types');
        showError('Failed to load service types');
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
      showError('Error loading service types');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Better categories fetch
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      if (response.ok) {
        const data = await response.json();
        console.log('Categories API Response:', data);
        
        // Handle both array and object response formats
        let categoriesData = [];
        if (Array.isArray(data)) {
          categoriesData = data;
        } else if (data.categories && Array.isArray(data.categories)) {
          categoriesData = data.categories;
        } else if (Array.isArray(data)) {
          categoriesData = data;
        }
        
        setCategories(categoriesData);
        
        if (categoriesData.length > 0 && !formData.category_id) {
          setFormData(prev => ({ ...prev, category_id: categoriesData[0]._id }));
        }
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
    }
    if (!showEditModal) {
      setUpdateSuccess(false);
    }
  }, [showAddForm, showEditModal]);

  useEffect(() => {
    if (!showDeleteModal) {
      setDeleteSuccess(false);
    }
  }, [showDeleteModal]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchServiceTypes(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchServiceTypes(currentPage - 1);
    }
  };

  const checkServiceName = async (serviceName) => {
    if (!serviceName) {
      setServiceNameError("");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/service_types`);
      const allServicesData = await response.json();
      
      // Handle different response formats
      let allServices = [];
      if (Array.isArray(allServicesData)) {
        allServices = allServicesData;
      } else if (allServicesData.service_types && Array.isArray(allServicesData.service_types)) {
        allServices = allServicesData.service_types;
      }
      
      const existingService = allServices.find(service => 
        service.service_name.toLowerCase() === serviceName.toLowerCase() &&
        (!selectedServiceType || service._id !== selectedServiceType._id)
      );

      if (existingService) {
        setServiceNameError("Service type name already exists");
      } else {
        setServiceNameError("");
      }
    } catch (error) {
      console.error('Error checking service name:', error);
    }
  };

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
      category_id: categories.length > 0 ? categories[0]._id : "",
      status: "Active"
    });
    setSelectedServiceType(null);
    setServiceNameError("");
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const handleAddServiceType = async (e) => {
    e.preventDefault();
    
    if (serviceNameError) {
      showError("Please fix the service name error before saving.");
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
    
    if (serviceNameError) {
      showError("Please fix the service name error before updating.");
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
        const error = await response.json();
        showError(error.error || 'Failed to update service type');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error updating service type:', error);
      showError('Error updating service type');
      setLoading(false);
    }
  };

  const openDeleteModal = (serviceType) => {
    setServiceTypeToDelete(serviceType);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setServiceTypeToDelete(null);
    setDeleting(false);
    setDeleteSuccess(false);
  };

  const handleDeleteServiceType = async () => {
    if (!serviceTypeToDelete) return;

    setDeleting(true);
    
    try {
      const response = await fetch(`${API_BASE}/service_types/${serviceTypeToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        setTimeout(async () => {
          await fetchServiceTypes(currentPage);
          closeDeleteModal();
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to delete service type');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting service type:', error);
      showError('Error deleting service type');
      setDeleting(false);
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
  };

  // Helper function to get category name for display
  const getCategoryName = (serviceType) => {
    if (serviceType.category_name) return serviceType.category_name;
    if (serviceType.category && typeof serviceType.category === 'object') {
      return serviceType.category.name || 'Unknown';
    }
    if (serviceType.category) return serviceType.category;
    
    // Find category by ID if we have categories data
    if (serviceType.category_id && categories.length > 0) {
      const category = categories.find(cat => cat._id === serviceType.category_id);
      return category ? category.name : 'Unknown';
    }
    
    return 'Uncategorized';
  };

  return (
    <div className="service-types-page">
      <div className="service-types-header">
        <div className="header-right">
          <button className="add-service-type-btn" onClick={openAddModal}>
            Add Service Type
          </button>
        </div>
      </div>

      <div className="table-container">
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
                  ) : (
                    "No service types found."
                  )}
                </td>
              </tr>
            ) : (
              serviceTypes.map((serviceType, index) => (
                <tr key={serviceType._id}>
                  <td>{(currentPage - 1) * 10 + index + 1}</td>
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
                    <button className="delete-btn" onClick={() => openDeleteModal(serviceType)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

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
                  />
                  {serviceNameError && <div className="error-message">{serviceNameError}</div>}
                </div>

                <div className="form-field">
                  <label>Category</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
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
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-buttons">
                  <button type="submit" className="save-btn" disabled={loading || serviceNameError}>
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
                  />
                  {serviceNameError && <div className="error-message">{serviceNameError}</div>}
                </div>

                <div className="form-field">
                  <label>Category</label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
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
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-buttons">
                  <button type="submit" className="save-btn" disabled={loading || serviceNameError}>
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
      {showDeleteModal && serviceTypeToDelete && (
        <div className="overlay">
          <div className="add-form delete-confirmation">
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
                  {!deleteSuccess ? "Deleting service type..." : "Service type deleted successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="delete-icon">🗑️</div>
                <h3>Delete Service Type</h3>
                <p>Are you sure you want to delete service type <strong>"{serviceTypeToDelete.service_name}"</strong>?</p>
                <p className="delete-warning">This action cannot be undone.</p>
                
                <div className="form-buttons">
                  <button className="confirm-delete-btn" onClick={handleDeleteServiceType}>
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
          <div className="add-form error-modal">
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