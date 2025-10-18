import React, { useState } from "react";
import "./ManageGroup.css";

function ManageGroup() {
  const [groups, setGroups] = useState([
    { id: 1, name: "Admin", level: 1, status: "Active" },
    { id: 2, name: "Special", level: 2, status: "Active" },
    { id: 3, name: "User", level: 3, status: "Active" },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({
    id: null,
    name: "",
    level: "",
    status: "Active",
  });

  // Handle Add or Edit button (Save/Update)
  const handleSave = (e) => {
    e.preventDefault();
    if (isEditing) {
      setGroups(groups.map((g) => (g.id === currentGroup.id ? currentGroup : g)));
    } else {
      const newGroup = {
        ...currentGroup,
        id: groups.length ? groups[groups.length - 1].id + 1 : 1,
      };
      setGroups([...groups, newGroup]);
    }

    // Reset after saving
    handleCloseForm();
  };

  const handleEdit = (group) => {
    setCurrentGroup(group);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this group?")) {
      setGroups(groups.filter((g) => g.id !== id));
    }
  };

  // ✅ Properly reset form states when opening "Add New Group"
  const handleAddNewGroup = () => {
    setIsEditing(false);
    setCurrentGroup({ id: null, name: "", level: "", status: "Active" });
    setShowForm(true);
  };

  // ✅ Helper: reset everything when closing the form
  const handleCloseForm = () => {
    setShowForm(false);
    setIsEditing(false);
    setCurrentGroup({ id: null, name: "", level: "", status: "Active" });
  };

  return (
    <div className="manage-group-page">
      <div className="header-section">
        <h2>GROUPS</h2>
        <button className="add-btn" onClick={handleAddNewGroup}>
          ADD NEW GROUP
        </button>
      </div>

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
            <tr key={group.id}>
              <td>{index + 1}</td>
              <td>{group.name}</td>
              <td>{group.level}</td>
              <td>
                <span className={`status ${group.status.toLowerCase()}`}>
                  {group.status}
                </span>
              </td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(group)}>
                  ✏️
                </button>
                <button className="delete-btn" onClick={() => handleDelete(group.id)}>
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
                value={currentGroup.name}
                onChange={(e) =>
                  setCurrentGroup({ ...currentGroup, name: e.target.value })
                }
                required
              />

              <label>Group Level</label>
              <input
                type="number"
                value={currentGroup.level}
                onChange={(e) =>
                  setCurrentGroup({ ...currentGroup, level: e.target.value })
                }
                required
              />

              <label>Status</label>
              <select
                value={currentGroup.status}
                onChange={(e) =>
                  setCurrentGroup({ ...currentGroup, status: e.target.value })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <div className="form-buttons">
                <button type="submit" className="save-btn">
                  {isEditing ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseForm}
                >
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
