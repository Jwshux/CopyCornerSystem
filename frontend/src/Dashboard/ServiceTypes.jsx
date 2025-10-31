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
  
  const [formData, setFormData] = useState({
    service_name: "",
    category_id: "",
    status: ""
  });

  // Archive view and search
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Handle modal from parent
  useEffect(() => {
    if (showAddModal) {
      openAddModal();
    }
  }, [showAddModal]);

  // Fetch active service types
  const fetchServiceTypes = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/service_types?page=${page}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        console.log('Service Types API Response:', data);
        
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
      }
    } catch (error) {
      console.error('Error fetching service types:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived service types
  const fetchArchivedServiceTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/service_types/archived`);
      if (response.ok) {
        const data = await response.json();
        setArchivedServiceTypes(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch archived service types');
      }
    } catch (error) {
      console.error('Error fetching archived service types:', error);
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

  const checkServiceName = (serviceName) => {
    if (!serviceName) {
      setServiceNameError("");
      return;
    }

    if (/^\d+$/.test(serviceName)) {
      setServiceNameError("Service name cannot contain only numbers");
      return;
    }

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
        const error = await response.json();
        alert(error.error || 'Failed to archive service type');
        setArchiving(false);
      }
    } catch (error) {
      console.error('Error archiving service type:', error);
      alert('Error archiving service type');
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
          await fetchArchivedServiceTypes();
          await fetchServiceTypes(currentPage);
          closeRestoreModal();
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to restore service type');
        setRestoring(false);
      }
    } catch (error) {
      console.error('Error restoring service type:', error);
      alert('Error restoring service type');
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
              fetchArchivedServiceTypes();
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
                {filteredServiceTypes.length === 0 ? (
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
                  filteredServiceTypes.map((serviceType, index) => (
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
                        <button className="archive-btn" onClick={() => openArchiveModal(serviceType)}>Archive</button>
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
                {filteredArchivedServiceTypes.length === 0 ? (
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
                  filteredArchivedServiceTypes.map((serviceType) => (
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
              </tbody>
            </table>
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
                    pattern=".*[a-zA-Z].*"
                    title="Service name must contain letters and cannot be only numbers"
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
                    pattern=".*[a-zA-Z].*"
                    title="Service name must contain letters and cannot be only numbers"
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
    </div>
  );
}

export default ServiceTypes;