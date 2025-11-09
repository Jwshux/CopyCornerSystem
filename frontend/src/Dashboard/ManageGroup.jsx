import React, { useState, useEffect } from "react";
import "./ManageGroup.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE = "http://localhost:5000/api";

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

  // Pagination state - SEPARATE for main and archived views (FIXED)
  const [currentPage, setCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [totalPages, setTotalPages] = useState(1);
  const [archivedTotalPages, setArchivedTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [archivedTotalCount, setArchivedTotalCount] = useState(0);

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

  // Fetch active groups from backend - UPDATED
  const fetchGroups = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/groups?page=${page}&per_page=${ITEMS_PER_PAGE}`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups);
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.total_pages);
        setTotalCount(data.pagination.total_groups);
      } else {
        console.error('Failed to fetch groups');
        setGroups([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived groups - UPDATED
  const fetchArchivedGroups = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/groups/archived?page=${page}&per_page=${ITEMS_PER_PAGE}`);
      if (response.ok) {
        const data = await response.json();
        setArchivedGroups(data.groups);
        setArchivedCurrentPage(data.pagination.page);
        setArchivedTotalPages(data.pagination.total_pages);
        setArchivedTotalCount(data.pagination.total_groups);
      } else {
        console.error('Failed to fetch archived groups');
        setArchivedGroups([]);
        setArchivedTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching archived groups:', error);
      setArchivedGroups([]);
      setArchivedTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (showArchivedView) {
      fetchArchivedGroups(1);
    }
  }, [showArchivedView]);

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

  // Pagination handlers - UPDATED with separate logic
  const handleNextPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage < archivedTotalPages) {
        fetchArchivedGroups(archivedCurrentPage + 1);
      }
    } else {
      if (currentPage < totalPages) {
        fetchGroups(currentPage + 1);
      }
    }
  };

  const handlePrevPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage > 1) {
        fetchArchivedGroups(archivedCurrentPage - 1);
      }
    } else {
      if (currentPage > 1) {
        fetchGroups(currentPage - 1);
      }
    }
  };

  // Calculate display ranges CORRECTLY
  const getDisplayRange = () => {
    if (showArchivedView) {
      const start = (archivedCurrentPage - 1) * ITEMS_PER_PAGE + 1;
      const end = Math.min(archivedCurrentPage * ITEMS_PER_PAGE, archivedTotalCount);
      return { start, end, total: archivedTotalCount };
    } else {
      const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
      const end = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);
      return { start, end, total: totalCount };
    }
  };

  const displayRange = getDisplayRange();

  // Check if group name is valid
  const checkGroupName = (groupName) => {
    if (!groupName) {
      setGroupNameError("");
      return;
    }

    // Check if group name contains only numbers
    if (/^\d+$/.test(groupName)) {
      setGroupNameError("Role name cannot contain only numbers");
      return;
    }

    // Check if group name already exists
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

  // Archive group functions
  const openArchiveModal = (group) => {
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

    setArchiving(true);
    
    try {
      const response = await fetch(`${API_BASE}/groups/${groupToArchive._id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        setArchiveSuccess(true);
        setTimeout(async () => {
          // Refresh from server instead of local filtering
          await fetchGroups(currentPage);
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
          // Refresh BOTH views
          await fetchArchivedGroups(archivedCurrentPage); // Remove from archive view
          await fetchGroups(1); // Add to main view (go to page 1 to see it)
          closeRestoreModal();
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to restore role');
        setRestoring(false);
      }
    } catch (error) {
      console.error('Error restoring role:', error);
      alert('Error restoring role');
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

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Filter groups based on search term
  const filteredGroups = groups.filter(group =>
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getLevelDescription(group.group_level).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArchivedGroups = archivedGroups.filter(group =>
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getLevelDescription(group.group_level).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="manage-group-page">
      {/* Table Header with Archive Button and Search */}
      <div className="table-header">
        {showArchivedView ? (
          <button className="back-to-main-btn" onClick={() => setShowArchivedView(false)}>
            ← Back to Main View
          </button>
        ) : (
          <button className="view-archive-btn" onClick={() => {
            setShowArchivedView(true);
            fetchArchivedGroups(1);
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
              {groups.length === 0 ? (
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
                groups.map((group, index) => (
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
                      <button className="edit-btn" onClick={() => handleEdit(group)}>
                        Edit
                      </button>
                      <button className="archive-btn" onClick={() => openArchiveModal(group)}>
                        Archive
                      </button>
                    </td>
                  </tr>
                ))
              )}
              
              {/* Add empty rows to maintain consistent height */}
              {groups.length > 0 && groups.length < 5 &&
                Array.from({ length: 5 - groups.length }).map((_, index) => (
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

          {/* PAGINATION CONTROLS - UPDATED */}
          {groups.length > 0 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                <span className="pagination-text">
                  Showing {displayRange.start}-{displayRange.end} of {displayRange.total} items
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
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages || loading}
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
              {archivedGroups.length === 0 ? (
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
                archivedGroups.map((group, index) => (
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
              {archivedGroups.length > 0 && archivedGroups.length < 5 &&
                Array.from({ length: 5 - archivedGroups.length }).map((_, index) => (
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

          {/* PAGINATION FOR ARCHIVED GROUPS - UPDATED */}
          {archivedGroups.length > 0 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                <span className="pagination-text">
                  Showing {displayRange.start}-{displayRange.end} of {displayRange.total} items
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
                  Page {archivedCurrentPage} of {archivedTotalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={archivedCurrentPage === archivedTotalPages || loading}
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
                <label>Role Name</label>
                <input 
                  type="text" 
                  name="group_name"
                  value={currentGroup.group_name}
                  onChange={handleInputChange}
                  className={groupNameError ? "error-input" : ""}
                  placeholder="e.g., Administrator, Staff Member"
                  required
                  pattern=".*[a-zA-Z].*"
                  title="Role name must contain letters and cannot be only numbers"
                  onInvalid={(e) => e.target.setCustomValidity('Please enter a valid role name')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
                {groupNameError && <div className="error-message">{groupNameError}</div>}
                
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
        <div className="error-modal-overlay">
          <div className="error-modal-content">
            <div className="error-modal-header">Operation Failed</div>
            <div className="error-modal-title">
              {errorMessage.includes('archive') ? 'Cannot archive role' : 'Operation failed'}
            </div>
            <div className="error-modal-message">
              {errorMessage.split('\n\n')[0]}
              {errorMessage.includes('Users with this role:') && (
                <div className="error-modal-schedules">
                  {errorMessage.split('Users with this role:')[1]?.split('\n\n')[0]?.split('\n').map((user, index) => (
                    <div key={index} className="error-schedule-item">
                      {user.trim()}
                    </div>
                  ))}
                </div>
              )}
              {errorMessage.split('\n\n')[1] && (
                <div style={{ marginTop: '15px', color: '#d9534f', fontWeight: 'bold' }}>
                  {errorMessage.split('\n\n')[1]}
                </div>
              )}
            </div>
            <button 
              className="error-modal-ok-btn" 
              onClick={closeErrorModal}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageGroup;