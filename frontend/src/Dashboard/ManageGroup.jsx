import React, { useState, useEffect } from "react";
import "./ManageGroup.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import deleteAnimation from "../animations/delete.json";

const API_BASE = "http://localhost:5000/api";

function ManageGroup({ showAddModal, onAddModalClose }) {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({
    _id: null,
    group_name: "",
    group_level: "1", // Default to level 1 (Staff)
    status: "Active",
  });
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [groupNameError, setGroupNameError] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Role levels with descriptions - ONLY 2 LEVELS
  const roleLevels = [
    { 
      value: "0", 
      label: "Level 0 - Administrator", 
      description: "Full system access - Can manage everything including users and roles" 
    },
    { 
      value: "1", 
      label: "Level 1 - Staff", 
      description: "Limited access - Cannot access User Management, Manage Roles, and All Staff" 
    }
  ];

  // Handle modal from parent
  useEffect(() => {
    if (showAddModal) {
      handleAddNewGroup();
    }
  }, [showAddModal]);

  // Fetch groups from backend
  const fetchGroups = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/groups?page=${page}&per_page=10`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
      } else {
        console.error('Failed to fetch groups');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Reset save success state when form closes
  useEffect(() => {
    if (!showForm) {
      setSaveSuccess(false);
      if (onAddModalClose) {
        onAddModalClose();
      }
    }
  }, [showForm]);

  // Reset delete success state when delete modal closes
  useEffect(() => {
    if (!showDeleteModal) {
      setDeleteSuccess(false);
    }
  }, [showDeleteModal]);

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchGroups(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchGroups(currentPage - 1);
    }
  };

  // Check if group name exists
  const checkGroupName = (groupName) => {
    if (!groupName) {
      setGroupNameError("");
      return;
    }

    const existingGroup = groups.find(group => 
      group.group_name.toLowerCase() === groupName.toLowerCase() &&
      (!currentGroup._id || group._id !== currentGroup._id)
    );

    if (existingGroup) {
      setGroupNameError("Role name already exists");
    } else {
      setGroupNameError("");
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentGroup({ ...currentGroup, [name]: value });

    // Check group name availability in real-time
    if (name === "group_name") {
      checkGroupName(value);
    }
  };

  // Get level description
  const getLevelDescription = (level) => {
    const levelObj = roleLevels.find(l => l.value === level.toString());
    return levelObj ? levelObj.description : "Unknown level";
  };

  // Get level label
  const getLevelLabel = (level) => {
    const levelObj = roleLevels.find(l => l.value === level.toString());
    return levelObj ? levelObj.label.split(" - ")[1] : `Level ${level}`;
  };

  // Handle Add or Edit (Save/Update)
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (groupNameError) {
      alert("Please fix the role name error before saving.");
      return;
    }

    setSaving(true);

    try {
      if (isEditing) {
        // Update existing group
        const response = await fetch(`${API_BASE}/groups/${currentGroup._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            group_name: currentGroup.group_name,
            group_level: parseInt(currentGroup.group_level),
            status: currentGroup.status
          }),
        });

        if (response.ok) {
          setSaveSuccess(true);
          setTimeout(async () => {
            await fetchGroups(currentPage);
            handleCloseForm();
            setSaving(false);
          }, 1500);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to update role');
          setSaving(false);
        }
      } else {
        // Create new group
        const response = await fetch(`${API_BASE}/groups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            group_name: currentGroup.group_name,
            group_level: parseInt(currentGroup.group_level),
            status: currentGroup.status
          }),
        });

        if (response.ok) {
          setSaveSuccess(true);
          setTimeout(async () => {
            await fetchGroups(currentPage);
            handleCloseForm();
            setSaving(false);
          }, 1500);
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to create role');
          setSaving(false);
        }
      }
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error saving role');
      setSaving(false);
    }
  };

  const handleEdit = (group) => {
    setCurrentGroup({
      _id: group._id,
      group_name: group.group_name,
      group_level: group.group_level.toString(),
      status: group.status
    });
    setGroupNameError("");
    setIsEditing(true);
    setShowForm(true);
  };

  // Open delete confirmation modal
  const openDeleteModal = (group) => {
    setGroupToDelete(group);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setGroupToDelete(null);
    setDeleting(false);
    setDeleteSuccess(false);
  };

  // Delete group
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    setDeleting(true);

    try {
      const response = await fetch(`${API_BASE}/groups/${groupToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        setTimeout(async () => {
          const isLastItemOnPage = groups.length === 1;
          
          if (isLastItemOnPage && currentPage > 1) {
            await fetchGroups(currentPage - 1);
          } else {
            await fetchGroups(currentPage);
          }
          closeDeleteModal();
          setDeleting(false);
        }, 1500);
      } else {
        console.error('Failed to delete role');
        alert('Failed to delete role');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Error deleting role');
      setDeleting(false);
    }
  };

  const handleAddNewGroup = () => {
    setIsEditing(false);
    setCurrentGroup({
      _id: null,
      group_name: "",
      group_level: "1", // Default to Staff level
      status: "Active"
    });
    setGroupNameError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentGroup({
      _id: null,
      group_name: "",
      group_level: "1",
      status: "Active"
    });
    setGroupNameError("");
    if (onAddModalClose) {
      onAddModalClose();
    }
  };

  return (
    <div className="manage-group-page">
      {/* REMOVED THE HEADER - Now handled by Dashboard.jsx */}

      <table className="group-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Role Name</th>
            <th>Role Level</th>
            <th>Access Level</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
                {loading ? (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                    <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                  </div>
                ) : (
                  "No roles found."
                )}
              </td>
            </tr>
          ) : (
            groups.map((group, index) => (
              <tr key={group._id}>
                <td>{(currentPage - 1) * 10 + index + 1}</td>
                <td>{group.group_name}</td>
                <td>Level {group.group_level}</td>
                <td>{getLevelDescription(group.group_level)}</td>
                <td>
                  <span className={`status ${group.status.toLowerCase()}`}>
                    {group.status}
                  </span>
                </td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(group)}>
                    ✏️
                  </button>
                  <button className="delete-btn" onClick={() => openDeleteModal(group)}>
                    ❌
                  </button>
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

      {/* Overlay Form */}
      {showForm && (
        <div className="overlay">
          <div className="form-container">
            <h3>{isEditing ? "Edit Role" : "Add New Role"}</h3>
            
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
              <form onSubmit={handleSave}>
                <label>Role Name</label>
                <input 
                  type="text" 
                  name="group_name"
                  value={currentGroup.group_name}
                  onChange={handleInputChange}
                  className={groupNameError ? "error-input" : ""}
                  placeholder="e.g., Administrator, Staff Member"
                  required 
                />
                {groupNameError && <div className="error-message">{groupNameError}</div>}
                
                <label>Role Level</label>
                <select 
                  name="group_level"
                  value={currentGroup.group_level}
                  onChange={handleInputChange}
                  required
                >
                  {roleLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <div className="level-description">
                  {getLevelDescription(currentGroup.group_level)}
                </div>
                
                <label>Status</label>
                <select 
                  name="status"
                  value={currentGroup.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                
                <div className="form-buttons">
                  <button type="submit" className="save-btn" disabled={groupNameError}>
                    {isEditing ? "Update" : "Save"}
                  </button>
                  <button type="button" className="cancel-btn" onClick={handleCloseForm}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && groupToDelete && (
        <div className="overlay">
          <div className="form-container delete-confirmation">
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
                  {!deleteSuccess ? "Deleting role..." : "Role deleted successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="delete-icon">🗑️</div>
                <h3>Delete Role</h3>
                <p>Are you sure you want to delete role <strong>"{groupToDelete.group_name}"</strong>?</p>
                <p className="delete-warning">This action cannot be undone.</p>
                
                <div className="form-buttons">
                  <button className="confirm-delete-btn" onClick={handleDeleteGroup}>
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

export default ManageGroup;