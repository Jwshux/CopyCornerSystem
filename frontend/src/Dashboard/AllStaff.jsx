import React, { useState, useEffect } from "react";
import "./AllStaff.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5000"
    : "https://copycornersystem-backend.onrender.com";

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

  // Pagination state - SEPARATE for main and archived views
  const [currentPage, setCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [archivedTotalPages, setArchivedTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [archivedTotalCount, setArchivedTotalCount] = useState(0);

  // Fetch all active staffs with search
  const fetchStaffs = async (page = 1, search = "") => {
    setLoading(true);
    try {
      let url = `${API_BASE}/staffs?page=${page}&per_page=${ITEMS_PER_PAGE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Staffs data from API:', data);
        
        if (Array.isArray(data)) {
          setStaffs(data);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalCount(data.length);
        } else if (data.staffs) {
          setStaffs(data.staffs || []);
          setCurrentPage(data.pagination?.page || 1);
          setTotalPages(data.pagination?.total_pages || 1);
          setTotalCount(data.pagination?.total_staffs || data.staffs.length);
        } else {
          setStaffs([]);
          setTotalCount(0);
        }
      } else {
        console.error('Failed to fetch staffs');
        showError('Failed to load staffs');
        setStaffs([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching staffs:', error);
      showError('Error loading staffs');
      setStaffs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch archived staffs with search
  const fetchArchivedStaffs = async (page = 1, search = "") => {
    setLoading(true);
    try {
      let url = `${API_BASE}/staffs/archived?page=${page}&per_page=${ITEMS_PER_PAGE}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        // Handle both response formats:
        if (Array.isArray(data)) {
          // Simple array format - no pagination info
          setArchivedStaffs(data);
          setArchivedCurrentPage(1);
          setArchivedTotalPages(1);
          setArchivedTotalCount(data.length);
        } else if (data.staffs && Array.isArray(data.staffs)) {
          // Paginated format
          setArchivedStaffs(data.staffs);
          setArchivedCurrentPage(data.pagination?.page || 1);
          setArchivedTotalPages(data.pagination?.total_pages || 1);
          setArchivedTotalCount(data.pagination?.total_staffs || data.staffs.length);
        } else {
          // Fallback
          setArchivedStaffs([]);
          setArchivedCurrentPage(1);
          setArchivedTotalPages(1);
          setArchivedTotalCount(0);
        }
      } else {
        console.error('Failed to fetch archived staffs');
        showError('Failed to load archived staffs');
        setArchivedStaffs([]);
        setArchivedTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching archived staffs:', error);
      showError('Error loading archived staffs');
      setArchivedStaffs([]);
      setArchivedTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  // INSTANT SEARCH - No debounce
  useEffect(() => {
    if (showArchivedView) {
      fetchArchivedStaffs(1, searchTerm);
    } else {
      fetchStaffs(1, searchTerm);
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

  // Pagination handlers with search term
  const handleNextPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage < archivedTotalPages) {
        fetchArchivedStaffs(archivedCurrentPage + 1, searchTerm);
      }
    } else {
      if (currentPage < totalPages) {
        fetchStaffs(currentPage + 1, searchTerm);
      }
    }
  };

  const handlePrevPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage > 1) {
        fetchArchivedStaffs(archivedCurrentPage - 1, searchTerm);
      }
    } else {
      if (currentPage > 1) {
        fetchStaffs(currentPage - 1, searchTerm);
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
          await fetchStaffs(currentPage, searchTerm);
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
            await fetchStaffs(currentPage - 1, searchTerm);
          } else {
            await fetchStaffs(currentPage, searchTerm);
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
          await fetchArchivedStaffs(archivedCurrentPage, searchTerm);
          await fetchStaffs(1, searchTerm);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const displayRange = getDisplayRange();

  return (
    <div className="all-staff">
      <div className="table-container">
        {/* Table Header with Archive Button and Search */}
        <div className="table-header">
          {showArchivedView ? (
            <button className="back-to-main-btn" onClick={() => {
              setShowArchivedView(false);
              setSearchTerm("");
              fetchStaffs(1, "");
            }}>
              ← Back to Main View
            </button>
          ) : (
            <button className="view-archive-btn" onClick={() => {
              setShowArchivedView(true);
              setSearchTerm("");
              fetchArchivedStaffs(1, "");
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
            <table className="staff-table main-view">
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
                        <span className={`status-tag ${staff.status === "Active" ? "active-status" : "inactive-status"}`}>
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

            {/* PAGINATION CONTROLS - FIXED */}
            {staffs.length > 0 && (
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

        {/* ARCHIVED STAFF VIEW */}
        {showArchivedView && (
          <>
            <table className="staff-table archived-view">
              <thead>
                <tr>
                  <th>#</th>
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
                    <td colSpan="8" style={{ textAlign: "center", color: "#888" }}>
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
                      <td>{(archivedCurrentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
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
                      <td>&nbsp;</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            {/* PAGINATION FOR ARCHIVED STAFF - FIXED */}
            {archivedStaffs.length > 0 && (
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
                <div className="input-with-error">
                  <label>Full Name</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                  />
                </div>
                
                <div className="input-with-error">
                  <label>Username</label>
                  <input 
                    name="username" 
                    value={formData.username} 
                    onChange={handleInputChange} 
                    placeholder="Username" 
                    required
                  />
                </div>
                
                <div className="input-with-error">
                  <label>Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="New Password (optional)" 
                  />
                </div>
                
                <div className="input-with-error">
                  <label>Student Number</label>
                  <input 
                    name="studentNumber" 
                    value={formData.studentNumber} 
                    onChange={handleInputChange} 
                    placeholder="e.g., 2023-00123" 
                    required
                  />
                </div>
                
                <div className="input-with-error">
                  <label>Course</label>
                  <input 
                    name="course" 
                    value={formData.course} 
                    onChange={handleInputChange} 
                    placeholder="e.g., BSIT, BSCS, BSIS" 
                    required
                  />
                </div>
                
                <div className="input-with-error">
                  <label>Section</label>
                  <input 
                    name="section" 
                    value={formData.section} 
                    onChange={handleInputChange} 
                    placeholder="e.g., 3A, 2B" 
                    required
                  />
                </div>
                
                <div className="input-with-error">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>

                <div className="form-buttons">
                  <button type="submit" className="save-btn" disabled={updating}>
                    {updating ? "Updating..." : "Update"}
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