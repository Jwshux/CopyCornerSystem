import React, { useState, useEffect } from "react";
import "./AllStaff.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE = "http://localhost:5000/api";

function AllStaff() {
  const [staffs, setStaffs] = useState([]);
  const [archivedStaffs, setArchivedStaffs] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToArchive, setStaffToArchive] = useState(null);
  const [staffToRestore, setStaffToRestore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    studentNumber: "",
    course: "",
    section: "",
    status: "Active",
    password: ""
  });

  // Archive view and search
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state - FIXED ITEMS PER PAGE
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10; // Fixed constant like ManageUsers
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all active staffs
  const fetchStaffs = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/staffs?page=${page}&per_page=${ITEMS_PER_PAGE}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Staffs data from API:', data);
        setStaffs(data.staffs);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
      } else {
        console.error('Failed to fetch staffs');
        showError('Failed to load staffs');
      }
    } catch (error) {
      console.error('Error fetching staffs:', error);
      showError('Error loading staffs');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch archived staffs - UPDATED TO HANDLE BOTH RESPONSE FORMATS
  const fetchArchivedStaffs = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/staffs/archived?page=${page}&per_page=${ITEMS_PER_PAGE}`);
      if (response.ok) {
        const data = await response.json();
        
        // Handle both response formats:
        // Format 1: { staffs: [], pagination: {} } (with pagination)
        // Format 2: [] (simple array without pagination)
        if (Array.isArray(data)) {
          // Simple array format - no pagination info
          setArchivedStaffs(data);
          setCurrentPage(1);
          setTotalPages(1);
        } else if (data.staffs && Array.isArray(data.staffs)) {
          // Paginated format
          setArchivedStaffs(data.staffs);
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.total_pages);
        } else {
          // Fallback
          setArchivedStaffs([]);
          setCurrentPage(1);
          setTotalPages(1);
        }
      } else {
        console.error('Failed to fetch archived staffs');
        showError('Failed to load archived staffs');
        setArchivedStaffs([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching archived staffs:', error);
      showError('Error loading archived staffs');
      setArchivedStaffs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
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

  // Pagination handlers - same pattern as ManageUsers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      if (showArchivedView) {
        fetchArchivedStaffs(currentPage + 1);
      } else {
        fetchStaffs(currentPage + 1);
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      if (showArchivedView) {
        fetchArchivedStaffs(currentPage - 1);
      } else {
        fetchStaffs(currentPage - 1);
      }
    }
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
          let errorMessage = errorData.error;
          
          if (errorData.schedules && errorData.schedules.length > 0) {
            // Get unique days only
            const uniqueDays = [...new Set(errorData.schedules.map(schedule => schedule.day))];
            errorMessage += `\nActive Schedules: ${uniqueDays.join(', ')}`;
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

  // Archive staff functions
  const openArchiveModal = (staff) => {
    setStaffToArchive(staff);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setStaffToArchive(null);
    setArchiving(false);
    setArchiveSuccess(false);
  };

  const handleArchiveStaff = async () => {
    if (!staffToArchive) return;

    setArchiving(true);
    try {
      const response = await fetch(`${API_BASE}/staffs/user/${staffToArchive.user_id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        setArchiveSuccess(true);
        setTimeout(async () => {
          const isLastItemOnPage = staffs.length === 1;
          
          if (isLastItemOnPage && currentPage > 1) {
            await fetchStaffs(currentPage - 1);
          } else {
            await fetchStaffs(currentPage);
          }
          closeArchiveModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        
        // Handle the case where staff has active schedules
        if (errorData.error && errorData.error.includes('schedule(s) are assigned to this staff member')) {
          let errorMessage = errorData.error;
          
          if (errorData.schedules && errorData.schedules.length > 0) {
            // Get unique days only
            const uniqueDays = [...new Set(errorData.schedules.map(schedule => schedule.day))];
            errorMessage += `\nActive Schedules: ${uniqueDays.join(', ')}`;
            errorMessage += '\n\nPlease remove or reassign these schedules first.';
          }
          
          setErrorMessage(errorMessage);
          setShowErrorModal(true);
        } else {
          setErrorMessage(errorData.error || 'Failed to archive staff');
          setShowErrorModal(true);
        }
        setArchiving(false);
      }
    } catch (error) {
      console.error('Error archiving staff:', error);
      setErrorMessage('Error archiving staff');
      setShowErrorModal(true);
      setArchiving(false);
    }
  };

  // Restore staff functions
  const openRestoreModal = (staff) => {
    setStaffToRestore(staff);
    setShowRestoreModal(true);
  };

  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setStaffToRestore(null);
    setRestoring(false);
    setRestoreSuccess(false);
  };

  const handleRestoreStaff = async () => {
    if (!staffToRestore) return;

    setRestoring(true);
    try {
      const response = await fetch(`${API_BASE}/staffs/user/${staffToRestore.user_id}/restore`, {
        method: 'PUT',
      });

      if (response.ok) {
        setRestoreSuccess(true);
        setTimeout(async () => {
          await fetchArchivedStaffs(currentPage);
          await fetchStaffs(1);
          closeRestoreModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to restore staff');
        setShowErrorModal(true);
        setRestoring(false);
      }
    } catch (error) {
      console.error('Error restoring staff:', error);
      setErrorMessage('Error restoring staff');
      setShowErrorModal(true);
      setRestoring(false);
    }
  };

  // Close modals
  const closeEditModal = () => {
    setShowEditModal(false);
    resetForm();
  };

  // Filter staffs based on search term
  const filteredStaffs = staffs.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArchivedStaffs = archivedStaffs.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="all-staff">
      <div className="staff-table">
        {/* Table Header with Archive Button and Search */}
        <div className="table-header">
          {showArchivedView ? (
            <button className="back-to-main-btn" onClick={() => setShowArchivedView(false)}>
              ← Back to Main View
            </button>
          ) : (
            <button className="view-archive-btn" onClick={() => {
              setShowArchivedView(true);
              fetchArchivedStaffs(1);
            }}>
              📦 View Archived Staff
            </button>
          )}
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* MAIN STAFF VIEW */}
        {!showArchivedView && (
          <>
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
                      ) : searchTerm ? (
                        "No staff found matching your search."
                      ) : (
                        "No staff found."
                      )}
                    </td>
                  </tr>
                ) : (
                  staffs.map((staff, index) => (
                    <tr key={staff._id}>
                      <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
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
                        <button className="edit-btn" onClick={() => handleEditStaff(staff)}>Edit</button>
                        <button className="archive-btn" onClick={() => openArchiveModal(staff)}>Archive</button>
                      </td>
                    </tr>
                  ))
                )}
                
                {/* Add empty rows to maintain consistent height */}
                {staffs.length > 0 && staffs.length < 10 &&
                  Array.from({ length: 10 - staffs.length }).map((_, index) => (
                    <tr key={`empty-${index}`} style={{ visibility: 'hidden' }}>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
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

            {/* PAGINATION CONTROLS - ALWAYS SHOWN */}
            {staffs.length > 0 && (
              <div className="pagination-controls">
                <div className="pagination-info">
                  <span className="pagination-text">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, staffs.length)} of {staffs.length} items
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

        {/* ARCHIVED STAFF VIEW */}
        {showArchivedView && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Student Number</th>
                  <th>Course</th>
                  <th>Section</th>
                  <th>Archived Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {archivedStaffs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", color: "#888" }}>
                      {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                          <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                        </div>
                      ) : searchTerm ? (
                        "No archived staff found matching your search."
                      ) : (
                        "No archived staff found."
                      )}
                    </td>
                  </tr>
                ) : (
                  archivedStaffs.map((staff, index) => (
                    <tr key={staff._id}>
                      <td>{staff.name}</td>
                      <td>{staff.username || "—"}</td>
                      <td>{staff.studentNumber || "—"}</td>
                      <td>{staff.course || "—"}</td>
                      <td>{staff.section || "—"}</td>
                      <td>{formatDate(staff.archived_at)}</td>
                      <td>
                        <button className="restore-btn" onClick={() => openRestoreModal(staff)}>
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                
                {/* Add empty rows to maintain consistent height */}
                {archivedStaffs.length > 0 && archivedStaffs.length < 10 &&
                  Array.from({ length: 10 - archivedStaffs.length }).map((_, index) => (
                    <tr key={`empty-archived-${index}`} style={{ visibility: 'hidden' }}>
                      <td>&nbsp;</td>
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

            {/* PAGINATION FOR ARCHIVED STAFF - ALWAYS SHOWN */}
            {archivedStaffs.length > 0 && (
              <div className="pagination-controls">
                <div className="pagination-info">
                  <span className="pagination-text">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, archivedStaffs.length)} of {archivedStaffs.length} items
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
      </div>

      {/* EDIT STAFF MODAL */}
      {showEditModal && (
        <div className="overlay">
          <div className="modal-content">
            <h3><b>Edit Staff Member</b></h3>
            
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

                <div className="form-buttons">
                  <button type="submit" className="save-btn">
                    Update
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeEditModal}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {showArchiveModal && staffToArchive && (
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
                  {!archiveSuccess ? "Archiving staff member..." : "Staff member archived successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="archive-icon">📦</div>
                <h3 className="centered-text">Archive Staff Member</h3>
                <p className="centered-text">Are you sure you want to archive staff member <strong>"{staffToArchive.name}"</strong>?</p>
                <p className="archive-warning centered-text">This staff member will be moved to archives and hidden from the main list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-archive-btn" onClick={handleArchiveStaff}>
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
      {showRestoreModal && staffToRestore && (
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
                  {!restoreSuccess ? "Restoring staff member..." : "Staff member restored successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="restore-icon">↶</div>
                <h3 className="centered-text">Restore Staff Member</h3>
                <p className="centered-text">Are you sure you want to restore staff member <strong>"{staffToRestore.name}"</strong>?</p>
                <p className="restore-warning centered-text">This staff member will be moved back to the main staff list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-restore-btn" onClick={handleRestoreStaff}>
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

export default AllStaff;