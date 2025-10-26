import React, { useState, useEffect } from "react";
import "./ManageUsers.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import deleteAnimation from "../animations/delete.json"; // Add this import

const API_BASE = "http://localhost:5000/api";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false); // New state for delete animation
  const [deleteSuccess, setDeleteSuccess] = useState(false); // New state for delete success
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "",
    status: "Active",
    studentNumber: null,
    course: null,
    section: null
  });
  const [usernameError, setUsernameError] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch users and roles from backend
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

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE}/users/roles`);
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
        if (data.length > 0 && !formData.role) {
          setFormData(prev => ({ ...prev, role: data[0] }));
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Reset save success state when modals close
  useEffect(() => {
    if (!showAddModal && !showEditModal) {
      setSaveSuccess(false);
    }
  }, [showAddModal, showEditModal]);

  // Reset delete success state when delete modal closes
  useEffect(() => {
    if (!showDeleteModal) {
      setDeleteSuccess(false);
    }
  }, [showDeleteModal]);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchUsers(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchUsers(currentPage - 1);
    }
  };

  const checkUsername = (username) => {
    if (!username) {
      setUsernameError("");
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
  };

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      role: roles.length > 0 ? roles[0] : "",
      status: "Active",
      studentNumber: null,
      course: null,
      section: null
    });
    setSelectedUser(null);
    setUsernameError("");
    setSaveSuccess(false);
  };

  const isStaffRole = () => {
    return formData.role.toLowerCase().includes("staff");
  };

  const handleAddUser = async (e) => {
    if (e) e.preventDefault();
    
    if (usernameError) {
      alert("Please fix the username error before saving.");
      return;
    }

    if (isStaffRole()) {
      if (!formData.studentNumber) {
        alert("Please enter student number for staff member.");
        return;
      }
      if (!formData.course) {
        alert("Please enter course for staff member.");
        return;
      }
      if (!formData.section) {
        alert("Please enter section for staff member.");
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
        // Wait for animation to complete before closing
        setTimeout(async () => {
          await fetchUsers(currentPage);
          setShowAddModal(false);
          resetForm();
          setSaving(false);
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create user');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
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
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    if (e) e.preventDefault();
    
    if (usernameError) {
      alert("Please fix the username error before updating.");
      return;
    }

    if (isStaffRole()) {
      if (!formData.studentNumber) {
        alert("Please enter student number for staff member.");
        return;
      }
      if (!formData.course) {
        alert("Please enter course for staff member.");
        return;
      }
      if (!formData.section) {
        alert("Please enter section for staff member.");
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
        // Wait for animation to complete before closing
        setTimeout(async () => {
          await fetchUsers(currentPage);
          setShowEditModal(false);
          resetForm();
          setSaving(false);
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
      setSaving(false);
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
    setDeleting(false);
    setDeleteSuccess(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(`${API_BASE}/users/${userToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        // Wait for animation to complete before closing and refreshing
        setTimeout(async () => {
          const isLastItemOnPage = users.length === 1;
          
          if (isLastItemOnPage && currentPage > 1) {
            await fetchUsers(currentPage - 1);
          } else {
            await fetchUsers(currentPage);
          }
          closeDeleteModal();
          setDeleting(false);
        }, 1500);
      } else {
        console.error('Failed to delete user');
        alert('Failed to delete user');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
      setDeleting(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
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

  return (
    <div className="manage-users">
      <div className="user-table">
        <div className="table-header">
          <h3>USERS</h3>
          <button className="add-btn" onClick={openAddModal}>
            ADD NEW USER
          </button>
        </div>

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
            {users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "#888" }}>
                    {loading ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                      </div>
                    ) : (
                      "No users found."
                    )}
                  </td>
                </tr>
              ) : (
              users.map((user, index) => (
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
                    <button className="edit-btn" onClick={() => handleEditUser(user)}>✏️</button>
                    <button className="delete-btn" onClick={() => openDeleteModal(user)}>❌</button>
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

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Add New User</b></h3>
            
            {/* Show only loading animation when saving, then checkmark */}
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
                  required 
                />
                
                <label>Username</label>
                <input 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                  placeholder="Username" 
                  className={usernameError ? "error-input" : ""}
                  required 
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
                />
                
                <label>User Role</label>
                <select name="role" value={formData.role} onChange={handleInputChange} required>
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
                    />
                    
                    <label>Course</label>
                    <input 
                      name="course" 
                      value={getInputValue('course')} 
                      onChange={handleInputChange} 
                      placeholder="e.g., BSIT, BSCS, BSIS" 
                      required={isStaffRole()}
                    />
                    
                    <label>Section</label>
                    <input 
                      name="section" 
                      value={getInputValue('section')} 
                      onChange={handleInputChange} 
                      placeholder="e.g., 3A, 2B" 
                      required={isStaffRole()}
                    />
                  </>
                )}
                
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>

                <div className="modal-buttons">
                  <button type="submit" className="save-btn" disabled={usernameError}>
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
            
            {/* Show only loading animation when saving, then checkmark */}
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
                  required 
                />
                
                <label>Username</label>
                <input 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                  className={usernameError ? "error-input" : ""}
                  required 
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
                <select name="role" value={formData.role} onChange={handleInputChange} required>
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
                    />
                    
                    <label>Course</label>
                    <input 
                      name="course" 
                      value={getInputValue('course')} 
                      onChange={handleInputChange} 
                      placeholder="e.g., BSIT, BSCS, BSIS" 
                      required={isStaffRole()}
                    />
                    
                    <label>Section</label>
                    <input 
                      name="section" 
                      value={getInputValue('section')} 
                      onChange={handleInputChange} 
                      placeholder="e.g., 3A, 2B" 
                      required={isStaffRole()}
                    />
                  </>
                )}
                
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>

                <div className="modal-buttons">
                  <button type="submit" className="save-btn" disabled={usernameError}>
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

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirmation">
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
                  {!deleteSuccess ? "Deleting user..." : "User deleted successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="delete-icon">🗑️</div>
                <h3>Delete User</h3>
                <p>Are you sure you want to delete user <strong>"{userToDelete.name}"</strong>?</p>
                <p className="delete-warning">This action cannot be undone.</p>
                
                <div className="modal-buttons">
                  <button className="confirm-delete-btn" onClick={handleDeleteUser}>
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

export default ManageUsers;