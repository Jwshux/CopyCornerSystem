import React, { useState } from "react";
import "./ManageUsers.css";

const initialUsers = [
  { id: 1, name: "Christopher", username: "User", role: "User", status: "Active", lastLogin: "August 22, 2021, 7:05:06 am" },
  { id: 2, name: "Harry Denn", username: "Admin", role: "Admin", status: "Active", lastLogin: "August 22, 2021, 7:06:27 am" },
  { id: 3, name: "John Walker", username: "Special", role: "Special", status: "Active", lastLogin: "April 5, 2021, 10:28:59 am" },
  { id: 4, name: "Kevin", username: "Kevin", role: "User", status: "Active", lastLogin: "April 5, 2021, 10:31:29 am" },
  { id: 5, name: "Natie Williams", username: "Natie", role: "User", status: "Active", lastLogin: "" }
];

function ManageUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "User",
    status: "Active",
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Reset form state helper
  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "User",
      status: "Active",
    });
    setSelectedUser(null);
  };

  // ✅ Add user - always resets form after
  const handleAddUser = () => {
    if (!formData.name || !formData.username || !formData.password)
      return alert("Please fill out all fields.");

    const newUser = {
      id: users.length ? users[users.length - 1].id + 1 : 1,
      ...formData,
      lastLogin: "",
    };

    setUsers([...users, newUser]);
    setShowAddModal(false);
    resetForm();
  };

  // ✅ Edit user - fills form for editing
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role,
      status: user.status,
    });
    setShowEditModal(true);
  };

  // ✅ Update user
  const handleUpdateUser = () => {
    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
    setShowEditModal(false);
    resetForm();
  };

  // ✅ Delete user
  const handleDeleteUser = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((user) => user.id !== id));
    }
  };

  // ✅ Open "Add New User" modal - ensure no edit data lingers
  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // ✅ Close modals - ensures clean state
  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
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
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>
                  <span className={user.status === "Active" ? "active-status" : "inactive-status"}>
                    {user.status}
                  </span>
                </td>
                <td>{user.lastLogin}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEditUser(user)}>✏️</button>
                  <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>❌</button>
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
              <option>User</option>
              <option>Admin</option>
              <option>Special</option>
            </select>
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange}>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div className="modal-buttons">
              <button className="save-btn" onClick={handleAddUser}>Save</button>
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
              <option>User</option>
              <option>Admin</option>
              <option>Special</option>
            </select>
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange}>
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div className="modal-buttons">
              <button className="save-btn" onClick={handleUpdateUser}>Update</button>
              <button className="cancel-btn" onClick={closeModals}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
