import React, { useState, useEffect } from "react";
import "./ManageUsers.css";

const API_BASE = "http://localhost:5000/api";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "",
    status: "Active",
  });

  // Fetch users and roles from backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (response.ok) {
        const data = await response.json();
        console.log('Users data from API:', data); // Debug log
        setUsers(data);
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
        // Set default role if roles exist
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
      password: "",
      role: roles.length > 0 ? roles[0] : "",
      status: "Active",
    });
    setSelectedUser(null);
  };

  // Add user
  const handleAddUser = async () => {
    if (!formData.name || !formData.username || !formData.password || !formData.role)
      return alert("Please fill out all fields.");

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUsers();
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

  // Edit user - fills form for editing
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || "",
      username: user.username,
      password: "", // Don't fill password for security
      role: user.role,
      status: user.status,
    });
    setShowEditModal(true);
  };

  // Update user
  const handleUpdateUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUsers();
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

  // Delete user
  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/users/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchUsers();
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
    }
  };

  // Open "Add New User" modal
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Close modals
  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  };

  // Format date for display - make it more robust
  const formatDate = (dateString) => {
    if (!dateString) return "Never logged in";
    
    try {
      // Handle different date formats
      let date;
      if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else if (dateString && dateString.$date) {
        // Handle MongoDB extended JSON format
        date = new Date(dateString.$date);
      } else {
        return "Never logged in";
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Never logged in";
      }
      
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return "Date error";
    }
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

        {loading && <div className="loading">Loading...</div>}

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
            {users.map((user, index) => (
              <tr key={user._id}>
                <td>{index + 1}</td>
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
                  <button className="delete-btn" onClick={() => handleDeleteUser(user._id)}>❌</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Add New User</b></h3>
            <label>Full Name</label>
            <input name="name" value={formData.name} onChange={handleInputChange} placeholder="Full Name" />
            
            <label>Username</label>
            <input name="username" value={formData.username} onChange={handleInputChange} placeholder="Username" />
            
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Password" />
            
            <label>User Role</label>
            <select name="role" value={formData.role} onChange={handleInputChange}>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange}>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div className="modal-buttons">
              <button className="save-btn" onClick={handleAddUser} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
              <button className="cancel-btn" onClick={closeModals}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Edit User</b></h3>
            <label>Full Name</label>
            <input name="name" value={formData.name} onChange={handleInputChange} />
            
            <label>Username</label>
            <input name="username" value={formData.username} onChange={handleInputChange} />
            
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="New Password (optional)" />
            
            <label>User Role</label>
            <select name="role" value={formData.role} onChange={handleInputChange}>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange}>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div className="modal-buttons">
              <button className="save-btn" onClick={handleUpdateUser} disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </button>
              <button className="cancel-btn" onClick={closeModals}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;