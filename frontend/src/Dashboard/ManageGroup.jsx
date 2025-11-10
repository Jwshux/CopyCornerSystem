import React, { useState, useEffect } from "react";
import "./ManageGroup.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE = "https://copycornersystem-backend.onrender.com";

function ManageGroup({ showAddModal, onAddModalClose }) {
  const [groups, setGroups] = useState([]);
  const [archivedGroups, setArchivedGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentGroup, setCurrentGroup] = useState({
    _id: null,
    group_name: "",
    group_level: "",
    status: "",
  });
  const [groupToArchive, setGroupToArchive] = useState(null);
  const [groupToRestore, setGroupToRestore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [groupNameError, setGroupNameError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Archive view and search
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Store all data for client-side filtering
  const [allGroups, setAllGroups] = useState([]);
  const [allArchivedGroups, setAllArchivedGroups] = useState([]);

  // Role levels with descriptions
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

  // Check if role is protected (core system role)
  const isProtectedRole = (groupName) => {
    const protectedRoles = ['Administrator', 'Staff Member'];
    return protectedRoles.includes(groupName);
  };

  // Handle modal from parent
  useEffect(() => {
    if (showAddModal) {
      handleAddNewGroup();
    }
  }, [showAddModal]);

  // Enhanced group name validation - SAME AS SERVICE TYPES AND CATEGORIES
  const checkGroupName = (groupName) => {
    if (!groupName) {
      setGroupNameError("");
      return;
    }

    // Length validation
    if (groupName.length < 2) {
      setGroupNameError("Role name must be at least 2 characters long");
      return;
    }

    if (groupName.length > 100) {
      setGroupNameError("Role name must be less than 100 characters");
      return;
    }

    // Check if contains only numbers
    if (/^\d+$/.test(groupName)) {
      setGroupNameError("Role name cannot contain only numbers");
      return;
    }

    // Check if contains only special characters (no letters or numbers)
    if (/^[^a-zA-Z0-9]+$/.test(groupName)) {
      setGroupNameError("Please enter a valid role name");
      return;
    }

    // Check if contains at least one letter
    if (!/[a-zA-Z]/.test(groupName)) {
      setGroupNameError("Role name must contain at least one letter");
      return;
    }

    // Check for duplicate group names
    const existingGroup = allGroups.find(group => 
      group.group_name.toLowerCase() === groupName.toLowerCase() &&
      (!currentGroup._id || group._id !== currentGroup._id)
    );

    if (existingGroup) {
      setGroupNameError("Role name already exists");
    } else {
      setGroupNameError("");
    }
  };

  // Filter groups based on search term
const filterGroups = (groups, term) => {
  if (!term.trim()) return groups;
  
  return groups.filter(group =>
    group.group_name.toLowerCase().includes(term.toLowerCase()) ||
    getLevelDescription(group.group_level).toLowerCase().includes(term.toLowerCase()) ||
    `level ${group.group_level}`.includes(term.toLowerCase()) || // Search by "level 0", "level 1"
    getLevelLabel(group.group_level).toLowerCase().includes(term.toLowerCase()) || // Search by "Administrator", "Staff"
    group.group_level.toString().includes(term) // Search by "0", "1"
  );
};

  // Fetch active groups from backend
  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/groups`);
      if (response.ok) {
        const data = await response.json();
        
        let groupsData = [];
        if (Array.isArray(data)) {
          groupsData = data;
        } else if (data.groups && Array.isArray(data.groups)) {
          groupsData = data.groups;
        } else {
          groupsData = [];
        }
        
        setAllGroups(groupsData);
        
        // Apply search filter if there's a search term
        const filteredData = filterGroups(groupsData, searchTerm);
        setGroups(filteredData);
        
      } else {
        console.error('Failed to fetch groups');
        setAllGroups([]);
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setAllGroups([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived groups
  const fetchArchivedGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/groups/archived`);
      if (response.ok) {
        const data = await response.json();
        
        let archivedData = [];
        if (Array.isArray(data)) {
          archivedData = data;
        } else if (data.groups && Array.isArray(data.groups)) {
          archivedData = data.groups;
        } else {
          archivedData = [];
        }
        
        setAllArchivedGroups(archivedData);
        
        // Apply search filter if there's a search term
        const filteredData = filterGroups(archivedData, searchTerm);
        setArchivedGroups(filteredData);
        
      } else {
        console.error('Failed to fetch archived groups');
        setAllArchivedGroups([]);
        setArchivedGroups([]);
      }
    } catch (error) {
      console.error('Error fetching archived groups:', error);
      setAllArchivedGroups([]);
      setArchivedGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Update displayed data when search term changes
  useEffect(() => {
    if (showArchivedView) {
      const filteredData = filterGroups(allArchivedGroups, searchTerm);
      setArchivedGroups(filteredData);
      setArchivedCurrentPage(1); // Reset to first page when searching
    } else {
      const filteredData = filterGroups(allGroups, searchTerm);
      setGroups(filteredData);
      setCurrentPage(1); // Reset to first page when searching
    }
  }, [searchTerm, showArchivedView]);

  // Reset save success state when form closes
  useEffect(() => {
    if (!showForm) {
      setSaveSuccess(false);
      if (onAddModalClose) {
        onAddModalClose();
      }
    }
  }, [showForm]);

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

  // Pagination calculations
  const getPaginatedData = (data, page) => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data) => {
    return Math.ceil(data.length / ITEMS_PER_PAGE);
  };

  const getDisplayRange = (data, page) => {
    const start = (page - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(page * ITEMS_PER_PAGE, data.length);
    return { start, end, total: data.length };
  };

  // Current displayed data with pagination applied
  const displayedGroups = getPaginatedData(groups, currentPage);
  const displayedArchivedGroups = getPaginatedData(archivedGroups, archivedCurrentPage);

  const groupsDisplayRange = getDisplayRange(groups, currentPage);
  const archivedGroupsDisplayRange = getDisplayRange(archivedGroups, archivedCurrentPage);

  const groupsTotalPages = getTotalPages(groups);
  const archivedGroupsTotalPages = getTotalPages(archivedGroups);

  // Pagination handlers
  const handleNextPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage < archivedGroupsTotalPages) {
        setArchivedCurrentPage(archivedCurrentPage + 1);
      }
    } else {
      if (currentPage < groupsTotalPages) {
        setCurrentPage(currentPage + 1);
      }
    }
  };

  const handlePrevPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage > 1) {
        setArchivedCurrentPage(archivedCurrentPage - 1);
      }
    } else {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
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
    
    // Final validation before submission
    checkGroupName(currentGroup.group_name);
    
    if (groupNameError) {
      showError("Please fix the role name error before saving.");
      return;
    }

    // Additional validation for empty required fields
    if (!currentGroup.group_name.trim()) {
      setGroupNameError("Role name is required");
      return;
    }

    setSaving(true);

    try {
      if (isEditing) {
        // Prevent editing protected roles
        if (isProtectedRole(currentGroup.group_name)) {
          showError("Cannot edit protected system roles.");
          setSaving(false);
          return;
        }

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
            await fetchGroups();
            handleCloseForm();
            setSaving(false);
          }, 1500);
        } else {
          const error = await response.json();
          showError(error.error || 'Failed to update role');
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
            await fetchGroups();
            handleCloseForm();
            setSaving(false);
          }, 1500);
        } else {
          const error = await response.json();
          showError(error.error || 'Failed to create role');
          setSaving(false);
        }
      }
    } catch (error) {
      console.error('Error saving role:', error);
      showError('Error saving role');
      setSaving(false);
    }
  };

  // Show error modal
  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  // Close error modal
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const handleEdit = (group) => {
    // Prevent editing protected roles
    if (isProtectedRole(group.group_name)) {
      showError("Cannot edit protected system roles.");
      return;
    }
    
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

  // Archive group functions
  const openArchiveModal = (group) => {
    // Prevent archiving protected roles
    if (isProtectedRole(group.group_name)) {
      showError("Cannot archive protected system roles.");
      return;
    }
    
    setGroupToArchive(group);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setGroupToArchive(null);
    setArchiving(false);
    setArchiveSuccess(false);
  };

  const handleArchiveGroup = async () => {
    if (!groupToArchive) return;

    // Double-check protection (shouldn't reach here for protected roles)
    if (isProtectedRole(groupToArchive.group_name)) {
      showError("Cannot archive protected system roles.");
      closeArchiveModal();
      return;
    }

    setArchiving(true);
    
    try {
      const response = await fetch(`${API_BASE}/groups/${groupToArchive._id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        setArchiveSuccess(true);
        setTimeout(async () => {
          await fetchGroups();
          closeArchiveModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        
        if (errorData.error && errorData.error.includes('user(s) are assigned to this role')) {
          let errorMessage = errorData.error;
          
          if (errorData.users && errorData.users.length > 0) {
            errorMessage += '\n\nUsers with this role:';
            errorData.users.forEach((user, index) => {
              errorMessage += `\n${index + 1}. ${user.name} (${user.username})`;
            });
            errorMessage += '\n\nPlease reassign these users to a different role first.';
          }
          
          setErrorMessage(errorMessage);
          setShowErrorModal(true);
        } else {
          setErrorMessage(errorData.error || 'Failed to archive role');
          setShowErrorModal(true);
        }
        setArchiving(false);
      }
    } catch (error) {
      console.error('Error archiving role:', error);
      setErrorMessage('Error archiving role');
      setShowErrorModal(true);
      setArchiving(false);
    }
  };

  // Restore group functions
  const openRestoreModal = (group) => {
    setGroupToRestore(group);
    setShowRestoreModal(true);
  };

  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setGroupToRestore(null);
    setRestoring(false);
    setRestoreSuccess(false);
  };

  const handleRestoreGroup = async () => {
    if (!groupToRestore) return;

    setRestoring(true);
    
    try {
      const response = await fetch(`${API_BASE}/groups/${groupToRestore._id}/restore`, {
        method: 'PUT',
      });

      if (response.ok) {
        setRestoreSuccess(true);
        setTimeout(async () => {
          await fetchArchivedGroups();
          await fetchGroups();
          closeRestoreModal();
        }, 1500);
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to restore role');
        setRestoring(false);
      }
    } catch (error) {
      console.error('Error restoring role:', error);
      showError('Error restoring role');
      setRestoring(false);
    }
  };

  const handleAddNewGroup = () => {
    setIsEditing(false);
    setCurrentGroup({
      _id: null,
      group_name: "",
      group_level: "",
      status: ""
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
      status: ""
    });
    setGroupNameError("");
    if (onAddModalClose) {
      onAddModalClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Check if form has any validation errors
  const hasFormErrors = groupNameError;

  return (
    <div className="manage-group-page">
      {/* Table Header with Archive Button and Search */}
      <div className="table-header">
        {showArchivedView ? (
          <button className="back-to-main-btn" onClick={() => {
            setShowArchivedView(false);
            setSearchTerm("");
            setCurrentPage(1);
          }}>
            ← Back to Main View
          </button>
        ) : (
          <button className="view-archive-btn" onClick={() => {
            setShowArchivedView(true);
            setSearchTerm("");
            setArchivedCurrentPage(1);
            fetchArchivedGroups();
          }}>
            📦 View Archived Roles
          </button>
        )}
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* MAIN GROUPS VIEW */}
      {!showArchivedView && (
        <>
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
              {displayedGroups.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
                    {loading ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                      </div>
                    ) : searchTerm ? (
                      "No roles found matching your search."
                    ) : (
                      "No roles found."
                    )}
                  </td>
                </tr>
              ) : (
                displayedGroups.map((group, index) => {
                  const isProtected = isProtectedRole(group.group_name);
                  return (
                    <tr key={group._id}>
                      <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td>{group.group_name}</td>
                      <td>Level {group.group_level}</td>
                      <td>{getLevelDescription(group.group_level)}</td>
                      <td>
                        <span className={`status ${group.status.toLowerCase()}`}>
                          {group.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={`edit-btn ${isProtected ? 'disabled-btn' : ''}`} 
                          onClick={() => !isProtected && handleEdit(group)}
                          disabled={isProtected}
                          title={isProtected ? "Protected system role - cannot be edited" : "Edit role"}
                        >
                          Edit
                        </button>
                        <button 
                          className={`archive-btn ${isProtected ? 'disabled-btn' : ''}`} 
                          onClick={() => !isProtected && openArchiveModal(group)}
                          disabled={isProtected}
                          title={isProtected ? "Protected system role - cannot be archived" : "Archive role"}
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              
              {/* Add empty rows to maintain consistent height */}
              {displayedGroups.length > 0 && displayedGroups.length < 5 &&
                Array.from({ length: 5 - displayedGroups.length }).map((_, index) => (
                  <tr key={`empty-${index}`} style={{ visibility: 'hidden' }}>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))
              }
            </tbody>
          </table>

          {/* PAGINATION CONTROLS */}
          {displayedGroups.length > 0 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                <span className="pagination-text">
                  Showing {groupsDisplayRange.start}-{groupsDisplayRange.end} of {groupsDisplayRange.total} items
                </span>
              </div>
              
              <div className="pagination-buttons">
                <button 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1 || loading}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {groupsTotalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage === groupsTotalPages || loading}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ARCHIVED GROUPS VIEW */}
      {showArchivedView && (
        <>
          <table className="group-table">
            <thead>
              <tr>
                <th>Role Name</th>
                <th>Role Level</th>
                <th>Access Level</th>
                <th>Status</th>
                <th>Archived Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedArchivedGroups.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
                    {loading ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                      </div>
                    ) : searchTerm ? (
                      "No archived roles found matching your search."
                    ) : (
                      "No archived roles found."
                    )}
                  </td>
                </tr>
              ) : (
                displayedArchivedGroups.map((group, index) => (
                  <tr key={group._id}>
                    <td>{group.group_name}</td>
                    <td>Level {group.group_level}</td>
                    <td>{getLevelDescription(group.group_level)}</td>
                    <td>
                      <span className={`status ${group.status.toLowerCase()}`}>
                        {group.status}
                      </span>
                    </td>
                    <td>{formatDate(group.archived_at)}</td>
                    <td>
                      <button className="restore-btn" onClick={() => openRestoreModal(group)}>
                        ↩️ Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
              
              {/* Add empty rows to maintain consistent height */}
              {displayedArchivedGroups.length > 0 && displayedArchivedGroups.length < 5 &&
                Array.from({ length: 5 - displayedArchivedGroups.length }).map((_, index) => (
                  <tr key={`empty-archived-${index}`} style={{ visibility: 'hidden' }}>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))
              }
            </tbody>
          </table>

          {/* PAGINATION FOR ARCHIVED GROUPS */}
          {displayedArchivedGroups.length > 0 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                <span className="pagination-text">
                  Showing {archivedGroupsDisplayRange.start}-{archivedGroupsDisplayRange.end} of {archivedGroupsDisplayRange.total} items
                </span>
              </div>
              
              <div className="pagination-buttons">
                <button 
                  onClick={handlePrevPage} 
                  disabled={archivedCurrentPage === 1 || loading}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {archivedCurrentPage} of {archivedGroupsTotalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={archivedCurrentPage === archivedGroupsTotalPages || loading}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

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
                <div className="input-with-error">
                  <label>Role Name</label>
                  <input 
                    type="text" 
                    name="group_name"
                    value={currentGroup.group_name}
                    onChange={handleInputChange}
                    className={groupNameError ? "error-input" : ""}
                    placeholder="e.g., Administrator, Staff Member"
                    required
                    maxLength="100"
                    pattern=".*[a-zA-Z].*"
                    title="Role name must contain letters and cannot be only numbers or special characters"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter a valid role name with at least one letter')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {groupNameError && <div className="error-message">{groupNameError}</div>}
                  <small className="character-count">
                    {currentGroup.group_name.length}/100 characters
                  </small>
                </div>
                
                <label>Role Level</label>
                <select 
                  name="group_level"
                  value={currentGroup.group_level}
                  onChange={handleInputChange}
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Please select a role level')}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="" disabled>Select Role Level</option>
                  {roleLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                <div className="level-description">
                  {currentGroup.group_level ? getLevelDescription(currentGroup.group_level) : "Please select a role level to see description"}
                </div>
                
                <label>Status</label>
                <select 
                  name="status"
                  value={currentGroup.status}
                  onChange={handleInputChange}
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Please select a status')}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="" disabled>Select Status</option>
                  <option value="Active">ACTIVE</option>
                  <option value="Inactive">INACTIVE</option>
                </select>
                
                <div className="form-buttons">
                  <button 
                    type="submit" 
                    className="save-btn" 
                    disabled={saving || hasFormErrors}
                    title={hasFormErrors ? "Please fix validation errors before saving" : ""}
                  >
                    {saving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update" : "Save")}
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

      {/* ARCHIVE CONFIRMATION MODAL */}
      {showArchiveModal && groupToArchive && (
        <div className="overlay">
          <div className="form-container archive-confirmation centered-modal">
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
                  {!archiveSuccess ? "Archiving role..." : "Role archived successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="archive-icon">📦</div>
                <h3 className="centered-text">Archive Role</h3>
                <p className="centered-text">Are you sure you want to archive role <strong>"{groupToArchive.group_name}"</strong>?</p>
                <p className="archive-warning centered-text">This role will be moved to archives and hidden from the main list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-archive-btn" onClick={handleArchiveGroup}>
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
      {showRestoreModal && groupToRestore && (
        <div className="overlay">
          <div className="form-container restore-confirmation centered-modal">
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
                  {!restoreSuccess ? "Restoring role..." : "Role restored successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="restore-icon">↶</div>
                <h3 className="centered-text">Restore Role</h3>
                <p className="centered-text">Are you sure you want to restore role <strong>"{groupToRestore.group_name}"</strong>?</p>
                <p className="restore-warning centered-text">This role will be moved back to the main roles list.</p>
                
                <div className="form-buttons centered-buttons">
                  <button className="confirm-restore-btn" onClick={handleRestoreGroup}>
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
        <div className="overlay">
          <div className="modal-content error-modal">
            <div className="error-icon">⚠️</div>
            <h3>Operation Failed</h3>
            <p className="error-message-text">{errorMessage}</p>
            <div className="form-buttons">
              <button className="cancel-btn" onClick={closeErrorModal}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageGroup;