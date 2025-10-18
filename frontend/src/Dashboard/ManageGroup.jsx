import React, { useState, useEffect } from "react";
import "./ManageGroup.css";

const API_BASE = "http://localhost:5000/api";

function ManageGroup() {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({
    _id: null,
    group_name: "",
    group_level: "",
    status: "Active",
  });
  const [loading, setLoading] = useState(false);

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

  // Handle Add or Edit (Save/Update)
  const handleSave = async (e) => {
    e.preventDefault();
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
          console.error('Failed to update group');
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
          console.error('Failed to create group');
        }
      }
    } catch (error) {
      console.error('Error saving group:', error);
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
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/groups/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchGroups(); // Refresh the list
        } else {
          console.error('Failed to delete group');
        }
      } catch (error) {
        console.error('Error deleting group:', error);
      } finally {
        setLoading(false);
      }
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
          {groups.map((group, index) => (
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
                <button className="delete-btn" onClick={() => handleDelete(group._id)}>
                  ❌
                </button>
              </td>
            </tr>
          ))}
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
                value={currentGroup.group_name}
                onChange={(e) => setCurrentGroup({ 
                  ...currentGroup, 
                  group_name: e.target.value 
                })} 
                required 
              />
              
              <label>Group Level</label>
              <input 
                type="number" 
                value={currentGroup.group_level}
                onChange={(e) => setCurrentGroup({ 
                  ...currentGroup, 
                  group_level: e.target.value 
                })} 
                required 
              />
              
              <label>Status</label>
              <select 
                value={currentGroup.status}
                onChange={(e) => setCurrentGroup({ 
                  ...currentGroup, 
                  status: e.target.value 
                })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              
              <div className="form-buttons">
                <button type="submit" className="save-btn" disabled={loading}>
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
    </div>
  );
}

export default ManageGroup;