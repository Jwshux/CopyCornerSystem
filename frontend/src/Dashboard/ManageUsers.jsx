import React, { useState, useEffect } from "react";
import "./ManageUsers.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE = "http://localhost:5000/api";

function ManageUsers({ showAddModal, onAddModalClose }) {
  const [users, setUsers] = useState([]);
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToArchive, setUserToArchive] = useState(null);
  const [userToRestore, setUserToRestore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "",
    status: "",
    studentNumber: null,
    course: null,
    section: null
  });
  const [usernameError, setUsernameError] = useState("");
  const [nameError, setNameError] = useState("");
  
  // Archive view and search
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch active users from backend
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users?page=${page}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        console.log('Users data from API:', data);
        setUsers(data.users);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived users
  const fetchArchivedUsers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users/archived?page=${page}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        setArchivedUsers(data.users);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
      } else {
        console.error('Failed to fetch archived users');
      }
    } catch (error) {
      console.error('Error fetching archived users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE}/users/roles`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (showArchivedView) {
      fetchArchivedUsers(1);
    }
  }, [showArchivedView]);

  // Handle modal from parent
  useEffect(() => {
    if (showAddModal) {
      resetForm();
    }
  }, [showAddModal]);

  // Reset save success state when modals close
  useEffect(() => {
    if (!showAddModal && !showEditModal) {
      setSaveSuccess(false);
      if (onAddModalClose) {
        onAddModalClose();
      }
    }
  }, [showAddModal, showEditModal]);

  // Reset archive success state when archive modal closes
  useEffect(() => {
    if (!showArchiveModal) {
      setArchiveSuccess(false);
    }
  }, [showArchiveModal]);

  // Reset restore success state when restore modal closes
  useEffect(() => {
    if (!showRestoreModal) {
      setRestoreSuccess(false);
    }
  }, [showRestoreModal]);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      if (showArchivedView) {
        fetchArchivedUsers(currentPage + 1);
      } else {
        fetchUsers(currentPage + 1);
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      if (showArchivedView) {
        fetchArchivedUsers(currentPage - 1);
      } else {
        fetchUsers(currentPage - 1);
      }
    }
  };

  const checkUsername = (username) => {
    if (!username) {
      setUsernameError("");
      return;
    }

    if (/^\d+$/.test(username)) {
      setUsernameError("Username cannot contain only numbers");
      return;
    }

    const existingUser = users.find(user => 
      user.username.toLowerCase() === username.toLowerCase() &&
      (!selectedUser || user._id !== selectedUser._id)
    );

    if (existingUser) {
      setUsernameError("Username already exists");
    } else {
      setUsernameError("");
    }
  };

  const checkName = (name) => {
    if (!name) {
      setNameError("");
      return;
    }

    if (/^\d+$/.test(name)) {
      setNameError("Full name cannot contain only numbers");
      return;
    }

    setNameError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (['studentNumber', 'course', 'section'].includes(name)) {
      setFormData({ ...formData, [name]: value.trim() || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (name === "username") {
      checkUsername(value);
    }
    
    if (name === "name") {
      checkName(value);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "",
      status: "",
      studentNumber: null,
      course: null,
      section: null
    });
    setSelectedUser(null);
    setUsernameError("");
    setNameError("");
    setSaveSuccess(false);
  };

  const isStaffRole = () => {
    return formData.role.toLowerCase().includes("staff");
  };

  const handleAddUser = async (e) => {
    if (e) e.preventDefault();
    
    if (usernameError || nameError) {
      setErrorMessage("Please fix the form errors before saving.");
      setShowErrorModal(true);
      return;
    }

    if (isStaffRole()) {
      if (!formData.studentNumber) {
        setErrorMessage("Please enter student number for staff member.");
        setShowErrorModal(true);
        return;
      }
      if (!formData.course) {
        setErrorMessage("Please enter course for staff member.");
        setShowErrorModal(true);
        return;
      }
      if (!formData.section) {
        setErrorMessage("Please enter section for staff member.");
        setShowErrorModal(true);
        return;
      }
    }

    setSaving(true);
    try {
      const userData = {
        name: formData.name,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        status: formData.status,
        studentNumber: isStaffRole() ? formData.studentNumber : null,
        course: isStaffRole() ? formData.course : null,
        section: isStaffRole() ? formData.section : null
      };

      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(async () => {
          await fetchUsers(currentPage);
          resetForm();
          setSaving(false);
          if (onAddModalClose) {
            onAddModalClose();
          }
        }, 1500);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to create user');
        setShowErrorModal(true);
        setSaving(false);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorMessage('Error creating user');
      setShowErrorModal(true);
      setSaving(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      username: user.username,
      password: "",
      role: user.role,
      status: user.status,
      studentNumber: user.studentNumber || null,
      course: user.course || null,
      section: user.section || null
    });
    setUsernameError("");
    setNameError("");
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    if (e) e.preventDefault();
    
    if (usernameError || nameError) {
      setErrorMessage("Please fix the form errors before updating.");
      setShowErrorModal(true);
      return;
    }

    if (isStaffRole()) {
      if (!formData.studentNumber) {
        setErrorMessage("Please enter student number for staff member.");
        setShowErrorModal(true);
        return;
      }
      if (!formData.course) {
        setErrorMessage("Please enter course for staff member.");
        setShowErrorModal(true);
        return;
      }
      if (!formData.section) {
        setErrorMessage("Please enter section for staff member.");
        setShowErrorModal(true);
        return;
      }
    }

    setSaving(true);
    try {
      const userData = {
        name: formData.name,
        username: formData.username,
        role: formData.role,
        status: formData.status,
        studentNumber: isStaffRole() ? formData.studentNumber : null,
        course: isStaffRole() ? formData.course : null,
        section: isStaffRole() ? formData.section : null
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      const response = await fetch(`${API_BASE}/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setSaveSuccess(true);
        setTimeout(async () => {
          await fetchUsers(currentPage);
          setShowEditModal(false);
          resetForm();
          setSaving(false);
        }, 1500);
      } else {
        const errorData = await response.json();
        
        if (errorData.error && errorData.error.includes('schedule(s) are using this staff member')) {
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
          setErrorMessage(errorData.error || 'Failed to update user');
          setShowErrorModal(true);
        }
        setSaving(false);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setErrorMessage('Error updating user');
      setShowErrorModal(true);
      setSaving(false);
    }
  };

  // Archive user functions
  const openArchiveModal = (user) => {
    setUserToArchive(user);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setUserToArchive(null);
    setArchiving(false);
    setArchiveSuccess(false);
  };

  const handleArchiveUser = async () => {
    if (!userToArchive) return;

    setArchiving(true);
    try {
      const response = await fetch(`${API_BASE}/users/${userToArchive._id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        setArchiveSuccess(true);
        setTimeout(async () => {
          // Refresh from server instead of local filtering
          await fetchUsers(currentPage);
          closeArchiveModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        
        if (errorData.error && errorData.error.includes('schedule(s) are assigned to this staff member')) {
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
          setErrorMessage(errorData.error || 'Failed to archive user');
          setShowErrorModal(true);
        }
        setArchiving(false);
      }
    } catch (error) {
      console.error('Error archiving user:', error);
      setErrorMessage('Error archiving user');
      setShowErrorModal(true);
      setArchiving(false);
    }
  };

  // Restore user functions
  const openRestoreModal = (user) => {
    setUserToRestore(user);
    setShowRestoreModal(true);
  };

  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setUserToRestore(null);
    setRestoring(false);
    setRestoreSuccess(false);
  };

  const handleRestoreUser = async () => {
    if (!userToRestore) return;

    setRestoring(true);
    try {
      const response = await fetch(`${API_BASE}/users/${userToRestore._id}/restore`, {
        method: 'PUT',
      });

      if (response.ok) {
        setRestoreSuccess(true);
        setTimeout(async () => {
          // Refresh from server instead of local filtering
          await fetchArchivedUsers(currentPage);
          await fetchUsers(1); // Also refresh main users list
          closeRestoreModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to restore user');
        setShowErrorModal(true);
        setRestoring(false);
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      setErrorMessage('Error restoring user');
      setShowErrorModal(true);
      setRestoring(false);
    }
  };

  const closeModals = () => {
    setShowEditModal(false);
    resetForm();
    if (onAddModalClose) {
      onAddModalClose();
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never logged in";
    
    try {
      let date;
      if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else if (dateString && dateString.$date) {
        date = new Date(dateString.$date);
      } else {
        return "Never logged in";
      }
      
      if (isNaN(date.getTime())) {
        return "Never logged in";
      }
      
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return "Date error";
    }
  };

  const getInputValue = (field) => {
    return formData[field] || '';
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArchivedUsers = archivedUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="manage-users">
      <div className="user-table">
        {/* Table Header with Archive Button and Search */}
        <div className="table-header">
          {showArchivedView ? (
            <button className="back-to-main-btn" onClick={() => setShowArchivedView(false)}>
              ← Back to Main View
            </button>
          ) : (
            <button className="view-archive-btn" onClick={() => {
              setShowArchivedView(true);
              fetchArchivedUsers(1);
            }}>
              📦 View Archived Users
            </button>
          )}
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* MAIN USERS VIEW */}
        {!showArchivedView && (
          <>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>User Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", color: "#888" }}>
                      {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                          <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                        </div>
                      ) : searchTerm ? (
                        "No users found matching your search."
                      ) : (
                        "No users found."
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user._id}>
                      <td>{(currentPage - 1) * 10 + index + 1}</td>
                      <td>{user.name}</td>
                      <td>{user.username}</td>
                      <td>{user.role}</td>
                      <td>
                        <span className={user.status === "Active" ? "active-status" : "inactive-status"}>
                          {user.status}
                        </span>
                      </td>
                      <td>{formatDate(user.last_login)}</td>
                      <td>
                        <button className="edit-btn" onClick={() => handleEditUser(user)}>✏️ Edit</button>
                        <button className="archive-btn" onClick={() => openArchiveModal(user)}>📦 Archive</button>
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

        {/* ARCHIVED USERS VIEW */}
        {showArchivedView && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>User Role</th>
                  <th>Status</th>
                  <th>Archived Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArchivedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
                      {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                          <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                        </div>
                      ) : searchTerm ? (
                        "No archived users found matching your search."
                      ) : (
                        "No archived users found."
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredArchivedUsers.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.username}</td>
                      <td>{user.role}</td>
                      <td>
                        <span className={user.status === "Active" ? "active-status" : "inactive-status"}>
                          {user.status}
                        </span>
                      </td>
                      <td>{formatDate(user.archived_at)}</td>
                      <td>
                        <button className="restore-btn" onClick={() => openRestoreModal(user)}>
                          ↩️ Restore
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

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Add New User</b></h3>
            
            {saving ? (
              <div className="form-animation-center">
                {!saveSuccess ? (
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
              <form onSubmit={handleAddUser}>
                <label>Full Name</label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  placeholder="Full Name" 
                  className={nameError ? "error-input" : ""}
                  required 
                  pattern=".*[a-zA-Z].*"
                  title="Full name must contain letters and cannot be only numbers"
                  onInvalid={(e) => e.target.setCustomValidity('Please enter a valid full name')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
                {nameError && <div className="error-message">{nameError}</div>}
                
                <label>Username</label>
                <input 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                  placeholder="Username" 
                  className={usernameError ? "error-input" : ""}
                  required
                  pattern=".*[a-zA-Z].*"
                  title="Username must contain letters and cannot be only numbers"
                  onInvalid={(e) => e.target.setCustomValidity('Please enter a valid username')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
                {usernameError && <div className="error-message">{usernameError}</div>}
                
                <label>Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  placeholder="Password" 
                  required 
                  onInvalid={(e) => e.target.setCustomValidity('Please enter password')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
                
                <label>User Role</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleInputChange} 
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Please select a user role')}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="" disabled>Select Role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                
                {isStaffRole() && (
                  <>
                    <label>Student Number</label>
                    <input 
                      name="studentNumber" 
                      value={getInputValue('studentNumber')} 
                      onChange={handleInputChange} 
                      placeholder="e.g., 2023-00123" 
                      required={isStaffRole()}
                      onInvalid={(e) => e.target.setCustomValidity('Please enter student number')}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                    
                    <label>Course</label>
                    <input 
                      name="course" 
                      value={getInputValue('course')} 
                      onChange={handleInputChange} 
                      placeholder="e.g., BSIT, BSCS, BSIS" 
                      required={isStaffRole()}
                      onInvalid={(e) => e.target.setCustomValidity('Please enter course')}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                    
                    <label>Section</label>
                    <input 
                      name="section" 
                      value={getInputValue('section')} 
                      onChange={handleInputChange} 
                      placeholder="e.g., 3A, 2B" 
                      required={isStaffRole()}
                      onInvalid={(e) => e.target.setCustomValidity('Please enter section')}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                  </>
                )}
                
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

                <div className="modal-buttons">
                  <button type="submit" className="save-btn" disabled={usernameError || nameError}>
                    Save
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

      {/* EDIT USER MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Edit User</b></h3>
            
            {saving ? (
              <div className="form-animation-center">
                {!saveSuccess ? (
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
              <form onSubmit={handleUpdateUser}>
                <label>Full Name</label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className={nameError ? "error-input" : ""}
                  required 
                  pattern=".*[a-zA-Z].*"
                  title="Full name must contain letters and cannot be only numbers"
                  onInvalid={(e) => e.target.setCustomValidity('Please enter a valid full name')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
                {nameError && <div className="error-message">{nameError}</div>}
                
                <label>Username</label>
                <input 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                  className={usernameError ? "error-input" : ""}
                  required
                  pattern=".*[a-zA-Z].*"
                  title="Username must contain letters and cannot be only numbers"
                  onInvalid={(e) => e.target.setCustomValidity('Please enter a valid username')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
                {usernameError && <div className="error-message">{usernameError}</div>}
                
                <label>Password</label>
                <input 
                  type="password" 
                  name="password" 
                  value={formData.password} 
                  onChange={handleInputChange} 
                  placeholder="New Password (optional)" 
                />
                
                <label>User Role</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleInputChange} 
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Please select a user role')}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="" disabled>Select Role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                
                {isStaffRole() && (
                  <>
                    <label>Student Number</label>
                    <input 
                      name="studentNumber" 
                      value={getInputValue('studentNumber')} 
                      onChange={handleInputChange} 
                      placeholder="e.g., 2023-00123" 
                      required={isStaffRole()}
                      onInvalid={(e) => e.target.setCustomValidity('Please enter student number')}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                    
                    <label>Course</label>
                    <input 
                      name="course" 
                      value={getInputValue('course')} 
                      onChange={handleInputChange} 
                      placeholder="e.g., BSIT, BSCS, BSIS" 
                      required={isStaffRole()}
                      onInvalid={(e) => e.target.setCustomValidity('Please enter course')}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                    
                    <label>Section</label>
                    <input 
                      name="section" 
                      value={getInputValue('section')} 
                      onChange={handleInputChange} 
                      placeholder="e.g., 3A, 2B" 
                      required={isStaffRole()}
                      onInvalid={(e) => e.target.setCustomValidity('Please enter section')}
                      onInput={(e) => e.target.setCustomValidity('')}
                    />
                  </>
                )}
                
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

                <div className="modal-buttons">
                  <button type="submit" className="save-btn" disabled={usernameError || nameError}>
                    Update
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
      {showArchiveModal && userToArchive && (
        <div className="modal-overlay">
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
                  {!archiveSuccess ? "Archiving user..." : "User archived successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="archive-icon">📦</div>
                <h3 className="centered-text">Archive User</h3>
                <p className="centered-text">Are you sure you want to archive user <strong>"{userToArchive.name}"</strong>?</p>
                <p className="archive-warning centered-text">This user will be moved to archives and hidden from the main list.</p>
                
                <div className="modal-buttons centered-buttons">
                  <button className="confirm-archive-btn" onClick={handleArchiveUser}>
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
      {showRestoreModal && userToRestore && (
        <div className="modal-overlay">
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
                  {!restoreSuccess ? "Restoring user..." : "User restored successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="restore-icon">↶</div>
                <h3 className="centered-text">Restore User</h3>
                <p className="centered-text">Are you sure you want to restore user <strong>"{userToRestore.name}"</strong>?</p>
                <p className="restore-warning centered-text">This user will be moved back to the main users list.</p>
                
                <div className="modal-buttons centered-buttons">
                  <button className="confirm-restore-btn" onClick={handleRestoreUser}>
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
        <div className="error-modal-overlay">
          <div className="error-modal-content">
            <div className="error-modal-header">Operation Failed</div>
            <div className="error-modal-title">
              {errorMessage.includes('archive') ? 'Cannot archive user' : 
               errorMessage.includes('create') ? 'Cannot create user' : 
               errorMessage.includes('update') ? 'Cannot update user' : 'Operation failed'}
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

export default ManageUsers;