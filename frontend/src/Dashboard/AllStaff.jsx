import React, { useState, useEffect } from "react";
import "./AllStaff.css";

const API_BASE = "http://localhost:5000/api";

function AllStaff() {
  const [staffs, setStaffs] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "", // Add username field
    studentNumber: "",
    course: "",
    section: "",
    status: "Active"
  });

  // Fetch all users and filter only staff members
  const fetchStaffs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (response.ok) {
        const data = await response.json();
        // Filter users who have "staff" in their role (case insensitive)
        const staffMembers = data.filter(user => 
          user.role && user.role.toLowerCase().includes("staff")
        );
        setStaffs(staffMembers);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffs();
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
      studentNumber: "",
      course: "",
      section: "",
      status: "Active"
    });
    setSelectedStaff(null);
  };

  // Edit staff - fills form for editing
  const handleEditStaff = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name || "",
      username: staff.username || "", // Include username
      studentNumber: staff.studentNumber || "",
      course: staff.course || "",
      section: staff.section || "",
      status: staff.status || "Active"
    });
    setShowEditModal(true);
  };

  // Update staff
  const handleUpdateStaff = async (e) => {
    if (e) e.preventDefault();

    setLoading(true);
    try {
      // Get the current staff's role to preserve it
      const currentStaff = staffs.find(staff => staff._id === selectedStaff._id);
      const staffRole = currentStaff?.role || "Staff"; // Default to "Staff" if not found

      const staffData = {
        name: formData.name,
        username: formData.username, // Include username
        role: staffRole, // Preserve the role
        studentNumber: formData.studentNumber,
        course: formData.course,
        section: formData.section,
        status: formData.status
      };

      console.log('Updating staff with data:', staffData);

      const response = await fetch(`${API_BASE}/users/${selectedStaff._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(staffData),
      });

      if (response.ok) {
        await fetchStaffs(); // Refresh the staff list
        setShowEditModal(false);
        resetForm();
        // alert('Staff updated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update staff');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      alert('Error updating staff');
    } finally {
      setLoading(false);
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
  };

  // Delete staff
  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users/${staffToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchStaffs();
        closeDeleteModal();
        // alert('Staff deleted successfully!');
      } else {
        console.error('Failed to delete staff');
        alert('Failed to delete staff');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Error deleting staff');
    } finally {
      setLoading(false);
    }
  };

  // Close modals
  const closeModals = () => {
    setShowEditModal(false);
    resetForm();
  };

  return (
    <div className="all-staff">
      <div className="staff-table">
        <div className="table-header">
          <h3>ALL STAFFS</h3>
        </div>

        {/* {loading && <div className="loading">Loading...</div>} */}

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
                  No staff members yet.
                </td>
              </tr>
            ) : (
              staffs.map((staff, index) => (
                <tr key={staff._id}>
                  <td>{index + 1}</td>
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
      </div>

      {/* EDIT STAFF MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Edit Staff Member</b></h3>
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
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? "Updating..." : "Update"}
                </button>
                <button type="button" className="cancel-btn" onClick={closeModals}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && staffToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirmation">
            <div className="delete-icon">🗑️</div>
            <h3>Delete Staff Member</h3>
            <p>Are you sure you want to delete staff member <strong>"{staffToDelete.name}"</strong>?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            
            <div className="modal-buttons">
              <button className="confirm-delete-btn" onClick={handleDeleteStaff} disabled={loading}>
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

export default AllStaff;