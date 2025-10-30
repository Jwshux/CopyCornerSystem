import React, { useState, useEffect } from "react";
import "./AllStaff.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import deleteAnimation from "../animations/delete.json";

const API_BASE = "http://localhost:5000/api";

function AllStaff() {
  const [staffs, setStaffs] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    studentNumber: "",
    course: "",
    section: "",
    status: "Active",
    password: "" // For password updates
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all staffs from the new staffs API
  const fetchStaffs = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/staffs?page=${page}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        console.log('Staffs data from API:', data);
        setStaffs(data.staffs);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
      } else {
        console.error('Failed to fetch staffs');
      }
    } catch (error) {
      console.error('Error fetching staffs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
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

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchStaffs(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchStaffs(currentPage - 1);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      studentNumber: "",
      course: "",
      section: "",
      status: "Active",
      password: ""
    });
    setSelectedStaff(null);
  };

  // Edit staff - fills form for editing
  const handleEditStaff = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name || "",
      username: staff.username || "",
      studentNumber: staff.studentNumber || "",
      course: staff.course || "",
      section: staff.section || "",
      status: staff.status || "Active",
      password: "" // Don't fill password for security
    });
    setShowEditModal(true);
  };

  // Update staff
  const handleUpdateStaff = async (e) => {
    if (e) e.preventDefault();

    setUpdating(true);
    try {
      const staffData = {
        name: formData.name,
        username: formData.username,
        studentNumber: formData.studentNumber,
        course: formData.course,
        section: formData.section,
        status: formData.status
      };

      // Only include password if provided
      if (formData.password) {
        staffData.password = formData.password;
      }

      const response = await fetch(`${API_BASE}/staffs/user/${selectedStaff.user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
      });

      if (response.ok) {
        setUpdateSuccess(true);
        // Wait for animation to complete before closing
        setTimeout(async () => {
          await fetchStaffs(currentPage);
          setShowEditModal(false);
          resetForm();
          setUpdating(false);
        }, 1500);
      } else {
        const errorData = await response.json();
        
        // Handle the case where staff has active schedules
        if (errorData.error && errorData.error.includes('schedule(s) are using this staff member')) {
          // Create a detailed error message
          let errorMessage = errorData.error;
          
          if (errorData.schedules && errorData.schedules.length > 0) {
            errorMessage += '\n\nActive Schedules:';
            errorData.schedules.forEach((schedule, index) => {
              errorMessage += `\n${index + 1}. ${schedule.day}: ${schedule.start_time} - ${schedule.end_time}`;
            });
            errorMessage += '\n\nPlease remove or reassign these schedules first.';
          }
          
          setErrorMessage(errorMessage);
          setShowErrorModal(true);
        } else {
          setErrorMessage(errorData.error || 'Failed to update staff');
          setShowErrorModal(true);
        }
        setUpdating(false);
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      setErrorMessage('Error updating staff');
      setShowErrorModal(true);
      setUpdating(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (staff) => {
    setStaffToDelete(staff);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setStaffToDelete(null);
    setDeleting(false);
    setDeleteSuccess(false);
  };

  // Delete staff - UPDATED WITH VALIDATION
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;

    setDeleting(true);
    try {
      // Use the staffs API endpoint for deletion (which has validation)
      const response = await fetch(`${API_BASE}/staffs/user/${staffToDelete.user_id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        
        // Wait for animation to complete before closing and refreshing
        setTimeout(async () => {
          // Check if this was the last item on the current page
          const isLastItemOnPage = staffs.length === 1;
          
          if (isLastItemOnPage && currentPage > 1) {
            // If it was the last item and we're not on page 1, go to previous page
            await fetchStaffs(currentPage - 1);
          } else {
            // Otherwise refresh current page
            await fetchStaffs(currentPage);
          }
          closeDeleteModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        
        // Handle the case where staff has active schedules
        if (errorData.error && errorData.error.includes('schedule(s) are assigned to this staff member')) {
          // Create a detailed error message
          let errorMessage = errorData.error;
          
          if (errorData.schedules && errorData.schedules.length > 0) {
            errorMessage += '\n\nActive Schedules:';
            errorData.schedules.forEach((schedule, index) => {
              errorMessage += `\n${index + 1}. ${schedule.day}: ${schedule.start_time} - ${schedule.end_time}`;
            });
            errorMessage += '\n\nPlease remove or reassign these schedules first.';
          }
          
          setErrorMessage(errorMessage);
          setShowErrorModal(true);
        } else {
          setErrorMessage(errorData.error || 'Failed to delete staff');
          setShowErrorModal(true);
        }
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      setErrorMessage('Error deleting staff');
      setShowErrorModal(true);
      setDeleting(false);
    }
  };

  // Close modals
  const closeModals = () => {
    setShowEditModal(false);
    resetForm();
  };

  // Close error modal
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  return (
    <div className="all-staff">
      <div className="staff-table">
        <div className="table-header">
          <h3>ALL STAFFS</h3>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Username</th>
              <th>Student Number</th>
              <th>Course</th>
              <th>Section</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", color: "#888" }}>
                    {loading ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                      </div>
                    ) : (
                      "No staffs found."
                    )}
                  </td>
                </tr>
              ) : (
              staffs.map((staff, index) => (
                <tr key={staff._id}>
                  <td>{(currentPage - 1) * 10 + index + 1}</td>
                  <td>{staff.name}</td>
                  <td>{staff.username || "—"}</td>
                  <td>{staff.studentNumber || "—"}</td>
                  <td>{staff.course || "—"}</td>
                  <td>{staff.section || "—"}</td>
                  <td>
                    <span className={staff.status === "Active" ? "active-status" : "inactive-status"}>
                      {staff.status}
                    </span>
                  </td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEditStaff(staff)}>✏️</button>
                    <button className="delete-btn" onClick={() => openDeleteModal(staff)}>❌</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* SIMPLE PAGINATION CONTROLS */}
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

      {/* EDIT STAFF MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Edit Staff Member</b></h3>
            
            {/* Show only loading animation when updating, then checkmark */}
            {updating ? (
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
              <form onSubmit={handleUpdateStaff}>
                <label>Full Name</label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  required 
                />
                
                <label>Username</label>
                <input 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                  placeholder="Username" 
                  required
                />
                
                <label>Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  placeholder="New Password (optional)" 
                />
                
                <label>Student Number</label>
                <input 
                  name="studentNumber" 
                  value={formData.studentNumber} 
                  onChange={handleInputChange} 
                  placeholder="e.g., 2023-00123" 
                  required
                />
                
                <label>Course</label>
                <input 
                  name="course" 
                  value={formData.course} 
                  onChange={handleInputChange} 
                  placeholder="e.g., BSIT, BSCS, BSIS" 
                  required
                />
                
                <label>Section</label>
                <input 
                  name="section" 
                  value={formData.section} 
                  onChange={handleInputChange} 
                  placeholder="e.g., 3A, 2B" 
                  required
                />
                
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>

                <div className="modal-buttons">
                  <button type="submit" className="save-btn">
                    Update
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeModals}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && staffToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirmation">
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
                <p className="delete-animation-text">
                  {!deleteSuccess ? "Deleting staff member..." : "Staff member deleted successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="delete-icon">🗑️</div>
                <h3>Delete Staff Member</h3>
                <p>Are you sure you want to delete staff member <strong>"{staffToDelete.name}"</strong>?</p>
                <p className="delete-warning">This action cannot be undone.</p>
                
                <div className="modal-buttons">
                  <button className="confirm-delete-btn" onClick={handleDeleteStaff}>
                    Yes, Delete
                  </button>
                  <button className="cancel-btn" onClick={closeDeleteModal}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ERROR MODAL - Same as Categories */}
      {showErrorModal && (
        <div className="error-modal-overlay">
          <div className="error-modal-content">
            <div className="error-modal-header">Operation Failed</div>
            <div className="error-modal-title">
              {errorMessage.includes('delete') ? 'Cannot delete staff member' : 'Cannot set staff to inactive'}
            </div>
            <div className="error-modal-message">
              {errorMessage.split('\n\n')[0]}
              {errorMessage.includes('Active Schedules:') && (
                <div className="error-modal-schedules">
                  {errorMessage.split('Active Schedules:')[1]?.split('\n\n')[0]?.split('\n').map((schedule, index) => (
                    <div key={index} className="error-schedule-item">
                      {schedule.trim()}
                    </div>
                  ))}
                </div>
              )}
              {errorMessage.split('\n\n')[1] && (
                <div style={{ marginTop: '15px', color: '#d9534f', fontWeight: 'bold' }}>
                  {errorMessage.split('\n\n')[1]}
                </div>
              )}
            </div>
            <button 
              className="error-modal-ok-btn" 
              onClick={closeErrorModal}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllStaff;