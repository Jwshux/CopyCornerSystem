import React, { useState, useEffect } from "react";
import "./ManageGroup.css";

const API_BASE = "http://localhost:5000/api";

function ManageGroup() {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({
    _id: null,
    group_name: "",
    group_level: "",
    status: "Active",
  });
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [groupNameError, setGroupNameError] = useState("");

  // Fetch groups from backend
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/groups`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
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
      setGroupNameError("Group name already exists");
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

  // Handle Add or Edit (Save/Update)
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (groupNameError) {
      alert("Please fix the group name error before saving.");
      return;
    }

    setLoading(true);

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
            group_level: currentGroup.group_level,
            status: currentGroup.status
          }),
        });

        if (response.ok) {
          await fetchGroups(); // Refresh the list
          handleCloseForm();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to update group');
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
            group_level: currentGroup.group_level,
            status: currentGroup.status
          }),
        });

        if (response.ok) {
          await fetchGroups(); // Refresh the list
          handleCloseForm();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to create group');
        }
      }
    } catch (error) {
      console.error('Error saving group:', error);
      alert('Error saving group');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (group) => {
    setCurrentGroup({
      _id: group._id,
      group_name: group.group_name,
      group_level: group.group_level,
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
  };

  // Delete group
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/groups/${groupToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchGroups();
        closeDeleteModal();
      } else {
        console.error('Failed to delete group');
        alert('Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error deleting group');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewGroup = () => {
    setIsEditing(false);
    setCurrentGroup({
      _id: null,
      group_name: "",
      group_level: "",
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
      group_level: "",
      status: "Active"
    });
    setGroupNameError("");
  };

  return (
    <div className="manage-group-page">
      <div className="header-section">
        <h2>GROUPS</h2>
        <button className="add-btn" onClick={handleAddNewGroup}>
          ADD NEW GROUP
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}

      <table className="group-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Group Name</th>
            <th>Group Level</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", color: "#888" }}>
                No groups yet.
              </td>
            </tr>
          ) : (
            groups.map((group, index) => (
              <tr key={group._id}>
                <td>{index + 1}</td>
                <td>{group.group_name}</td>
                <td>{group.group_level}</td>
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

      {/* Overlay Form */}
      {showForm && (
        <div className="overlay">
          <div className="form-container">
            <h3>{isEditing ? "Edit Group" : "Add New User Group"}</h3>
            <form onSubmit={handleSave}>
              <label>Group Name</label>
              <input 
                type="text" 
                name="group_name"
                value={currentGroup.group_name}
                onChange={handleInputChange}
                className={groupNameError ? "error-input" : ""}
                required 
              />
              {groupNameError && <div className="error-message">{groupNameError}</div>}
              
              <label>Group Level</label>
              <input 
                type="number" 
                name="group_level"
                value={currentGroup.group_level}
                onChange={handleInputChange}
                required 
              />
              
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
                <button type="submit" className="save-btn" disabled={loading || groupNameError}>
                  {isEditing ? "Update" : "Save"}
                </button>
                <button type="button" className="cancel-btn" onClick={handleCloseForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && groupToDelete && (
        <div className="overlay">
          <div className="form-container delete-confirmation">
            <div className="delete-icon">🗑️</div>
            <h3>Delete Group</h3>
            <p>Are you sure you want to delete group <strong>"{groupToDelete.group_name}"</strong>?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            
            <div className="form-buttons">
              <button className="confirm-delete-btn" onClick={handleDeleteGroup} disabled={loading}>
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

export default ManageGroup;