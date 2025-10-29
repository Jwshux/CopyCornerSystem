import React, { useState, useEffect } from "react";
import "./ServiceTypes.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import deleteAnimation from "../animations/delete.json";

function ServiceTypes() {
  // Demo sample data
  const demoServiceTypes = [
    { _id: "1", service_id: "ST-001", service_name: "Printing", status: "Active" },
    { _id: "2", service_id: "ST-002", service_name: "Photocopying", status: "Active" },
    { _id: "3", service_id: "ST-003", service_name: "Tshirt Printing", status: "Active" },
    { _id: "4", service_id: "ST-004", service_name: "Thesis Hardbound", status: "Active" },
    { _id: "5", service_id: "ST-005", service_name: "Softbind", status: "Active" },
    { _id: "6", service_id: "ST-006", service_name: "Lamination", status: "Inactive" },
    { _id: "7", service_id: "ST-007", service_name: "Scanning", status: "Active" },
    { _id: "8", service_id: "ST-008", service_name: "Document Binding", status: "Active" }
  ];

  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [serviceTypes, setServiceTypes] = useState([]);
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
    status: "Active"
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Initialize with demo data
  useEffect(() => {
    setServiceTypes(demoServiceTypes);
    setTotalPages(Math.ceil(demoServiceTypes.length / itemsPerPage));
  }, []);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return serviceTypes.slice(startIndex, endIndex);
  };

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
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Check if service name exists
  const checkServiceName = (serviceName) => {
    if (!serviceName) {
      setServiceNameError("");
      return;
    }

    const existingService = serviceTypes.find(service => 
      service.service_name.toLowerCase() === serviceName.toLowerCase() &&
      (!selectedServiceType || service._id !== selectedServiceType._id)
    );

    if (existingService) {
      setServiceNameError("Service type name already exists");
    } else {
      setServiceNameError("");
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
      status: "Active"
    });
    setSelectedServiceType(null);
    setServiceNameError("");
  };

  // Generate new service ID
  const generateServiceId = () => {
    const highestId = serviceTypes.reduce((max, service) => {
      const idNum = parseInt(service.service_id.split('-')[1]);
      return idNum > max ? idNum : max;
    }, 0);
    return `ST-${String(highestId + 1).padStart(3, '0')}`;
  };

  // Add service type
  const handleAddServiceType = async (e) => {
    e.preventDefault();
    
    if (serviceNameError) {
      alert("Please fix the service name error before saving.");
      return;
    }

    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const newServiceType = {
        _id: Date.now().toString(),
        service_id: generateServiceId(),
        service_name: formData.service_name,
        status: formData.status
      };

      setAddSuccess(true);
      
      // Wait for animation to complete before refreshing and closing
      setTimeout(() => {
        setServiceTypes(prev => [newServiceType, ...prev]);
        setTotalPages(Math.ceil((serviceTypes.length + 1) / itemsPerPage));
        setShowAddForm(false);
        resetForm();
        setLoading(false);
      }, 1500);
    }, 1000);
  };

  // Edit service type - fills form for editing
  const handleEditServiceType = (serviceType) => {
    setSelectedServiceType(serviceType);
    setFormData({
      service_name: serviceType.service_name,
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
    
    // Simulate API call delay
    setTimeout(() => {
      setUpdateSuccess(true);
      
      // Wait for animation to complete before refreshing and closing
      setTimeout(() => {
        setServiceTypes(prev => 
          prev.map(service => 
            service._id === selectedServiceType._id 
              ? { ...service, service_name: formData.service_name, status: formData.status }
              : service
          )
        );
        setShowEditModal(false);
        resetForm();
        setLoading(false);
      }, 1500);
    }, 1000);
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
    
    // Simulate API call delay
    setTimeout(() => {
      setDeleteSuccess(true);
      
      // Wait for animation to complete before closing and refreshing
      setTimeout(() => {
        const newServiceTypes = serviceTypes.filter(service => service._id !== serviceTypeToDelete._id);
        setServiceTypes(newServiceTypes);
        setTotalPages(Math.ceil(newServiceTypes.length / itemsPerPage));
        
        // Adjust current page if needed
        if (getCurrentPageItems().length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        
        closeDeleteModal();
      }, 1500);
    }, 1000);
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

  const currentItems = getCurrentPageItems();

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
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", color: "#888" }}>
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
              currentItems.map((serviceType, index) => (
                <tr key={serviceType._id}>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{serviceType.service_id}</td>
                  <td>{serviceType.service_name}</td>
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