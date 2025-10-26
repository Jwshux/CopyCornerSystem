import React, { useState, useEffect } from "react";
import "./ManageUsers.css";

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

  // All your existing functions remain exactly the same...
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

    setLoading(true);
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
        await fetchUsers(currentPage);
        setShowAddModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
    } finally {
      setLoading(false);
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

    setLoading(true);
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
        await fetchUsers(currentPage);
        setShowEditModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users/${userToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Check if this was the last item on the current page
        const isLastItemOnPage = users.length === 1;
        
        if (isLastItemOnPage && currentPage > 1) {
          // If it was the last item and we're not on page 1, go to previous page
          await fetchUsers(currentPage - 1);
        } else {
          // Otherwise refresh current page (backend will handle empty pages)
          await fetchUsers(currentPage);
        }
        closeDeleteModal();
      } else {
        console.error('Failed to delete user');
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    } finally {
      setLoading(false);
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
                  {loading ? "Loading..." : "No users found."}
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

      {/* ALL YOUR EXISTING MODALS - UNCHANGED */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Add New User</b></h3>
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
                <button type="submit" className="save-btn" disabled={loading || usernameError}>
                  {loading ? "Saving..." : "Save"}
                </button>
                <button type="button" className="cancel-btn" onClick={closeModals}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Edit User</b></h3>
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
                <button type="submit" className="save-btn" disabled={loading || usernameError}>
                  {loading ? "Updating..." : "Update"}
                </button>
                <button type="button" className="cancel-btn" onClick={closeModals}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirmation">
            <div className="delete-icon">🗑️</div>
            <h3>Delete User</h3>
            <p>Are you sure you want to delete user <strong>"{userToDelete.name}"</strong>?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            
            <div className="modal-buttons">
              <button className="confirm-delete-btn" onClick={handleDeleteUser} disabled={loading}>
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
              <button className="cancel-btn" onClick={closeDeleteModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;