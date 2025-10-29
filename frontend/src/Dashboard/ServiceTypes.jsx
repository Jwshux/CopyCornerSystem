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
  const [categories, setCategories] = useState([]); // NEW: Dynamic categories from backend
  const [selectedServiceType, setSelectedServiceType] = useState(null);
  const [serviceTypeToDelete, setServiceTypeToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serviceNameError, setServiceNameError] = useState("");
  const [addSuccess, setAddSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    service_name: "",
    category: "", // Will be set dynamically from categories
    status: "Active"
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch service types from backend
  const fetchServiceTypes = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/service_types?page=${page}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        setServiceTypes(data.service_types);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
      } else {
        console.error('Failed to fetch service types');
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        // Set default category to first category if available
        if (data.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: data[0].name }));
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchServiceTypes();
    fetchCategories(); // Fetch categories on component mount
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
      fetchServiceTypes(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchServiceTypes(currentPage - 1);
    }
  };

  // Check if service name exists
  const checkServiceName = async (serviceName) => {
    if (!serviceName) {
      setServiceNameError("");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/service_types`);
      const allServices = await response.json();
      
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

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Check service name availability in real-time
    if (name === "service_name") {
      checkServiceName(value);
    }
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      service_name: "",
      category: categories.length > 0 ? categories[0].name : "", // Set to first category
      status: "Active"
    });
    setSelectedServiceType(null);
    setServiceNameError("");
  };

  // Add service type
  const handleAddServiceType = async (e) => {
    e.preventDefault();
    
    if (serviceNameError) {
      alert("Please fix the service name error before saving.");
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
        // Wait for animation to complete before refreshing and closing
        setTimeout(async () => {
          await fetchServiceTypes(currentPage);
          setShowAddForm(false);
          resetForm();
          setLoading(false);
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create service type');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating service type:', error);
      alert('Error creating service type');
      setLoading(false);
    }
  };

  // Edit service type - fills form for editing
  const handleEditServiceType = (serviceType) => {
    setSelectedServiceType(serviceType);
    setFormData({
      service_name: serviceType.service_name,
      category: serviceType.category,
      status: serviceType.status
    });
    setServiceNameError("");
    setShowEditModal(true);
  };

  // Update service type
  const handleUpdateServiceType = async (e) => {
    e.preventDefault();
    
    if (serviceNameError) {
      alert("Please fix the service name error before updating.");
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
        // Wait for animation to complete before refreshing and closing
        setTimeout(async () => {
          await fetchServiceTypes(currentPage);
          setShowEditModal(false);
          resetForm();
          setLoading(false);
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update service type');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error updating service type:', error);
      alert('Error updating service type');
      setLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (serviceType) => {
    setServiceTypeToDelete(serviceType);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setServiceTypeToDelete(null);
    setDeleting(false);
    setDeleteSuccess(false);
  };

  // Delete service type
  const handleDeleteServiceType = async () => {
    if (!serviceTypeToDelete) return;

    setDeleting(true);
    
    try {
      const response = await fetch(`${API_BASE}/service_types/${serviceTypeToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        // Wait for animation to complete before closing and refreshing
        setTimeout(async () => {
          await fetchServiceTypes(currentPage);
          closeDeleteModal();
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete service type');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting service type:', error);
      alert('Error deleting service type');
      setDeleting(false);
    }
  };

  // Open "Add New Service Type" modal
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

  return (
    <div className="service-types-page">
      <div className="service-types-header">
        <h2>List of Service Types</h2>
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
                  <td>{serviceType.category}</td>
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
      </div>

      {/* ADD SERVICE TYPE MODAL */}
      {showAddForm && (
        <div className="overlay">
          <div className="add-form">
            <h3>Add New Service Type</h3>
            
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
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category.name}>
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
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category.name}>
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
    </div>
  );
}

export default ServiceTypes;