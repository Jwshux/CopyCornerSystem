import React, { useState, useEffect } from "react";
import "./ManageUsers.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import archiveAnimation from "../animations/archive.json";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5000"
    : "https://copycornersystem-backend.onrender.com";

function ManageUsers({ showAddModal, onAddModalClose }) {
  const [users, setUsers] = useState([]);
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToArchive, setUserToArchive] = useState(null);
  const [userToRestore, setUserToRestore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "",
    status: "",
    studentNumber: null,
    course: null,
    section: null
  });
  const [usernameError, setUsernameError] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [studentNumberError, setStudentNumberError] = useState("");
  const [courseError, setCourseError] = useState("");
  const [sectionError, setSectionError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  
  // Archive view and search
  const [showArchivedView, setShowArchivedView] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state - SEPARATE for main and archived views (FIXED)
  const [currentPage, setCurrentPage] = useState(1);
  const [archivedCurrentPage, setArchivedCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [archivedTotalPages, setArchivedTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [archivedTotalCount, setArchivedTotalCount] = useState(0);

  // Store all data for client-side filtering
  const [allUsers, setAllUsers] = useState([]);
  const [allArchivedUsers, setAllArchivedUsers] = useState([]);

  // Enhanced validation functions - SAME AS OTHERS
  const checkName = (name) => {
    if (!name) {
      setNameError("");
      return;
    }

    // Length validation
    if (name.length < 2) {
      setNameError("Full name must be at least 2 characters long");
      return;
    }

    if (name.length > 100) {
      setNameError("Full name must be less than 100 characters");
      return;
    }

    // Check if contains only numbers
    if (/^\d+$/.test(name)) {
      setNameError("Full name cannot contain only numbers");
      return;
    }

    // Check if contains only special characters (no letters or numbers)
    if (/^[^a-zA-Z0-9]+$/.test(name)) {
      setNameError("Please enter a valid full name");
      return;
    }

    // Check if contains at least one letter
    if (!/[a-zA-Z]/.test(name)) {
      setNameError("Full name must contain at least one letter");
      return;
    }

    setNameError("");
  };

  const checkUsername = (username) => {
    if (!username) {
      setUsernameError("");
      return;
    }

    // Length validation
    if (username.length < 2) {
      setUsernameError("Username must be at least 2 characters long");
      return;
    }

    if (username.length > 50) {
      setUsernameError("Username must be less than 50 characters");
      return;
    }

    // Check if contains only numbers
    if (/^\d+$/.test(username)) {
      setUsernameError("Username cannot contain only numbers");
      return;
    }

    // Check if contains only special characters (no letters or numbers)
    if (/^[^a-zA-Z0-9]+$/.test(username)) {
      setUsernameError("Please enter a valid username");
      return;
    }

    // Check if contains at least one letter
    if (!/[a-zA-Z]/.test(username)) {
      setUsernameError("Username must contain at least one letter");
      return;
    }

    const existingUser = allUsers.find(user => 
      user.username.toLowerCase() === username.toLowerCase() &&
      (!selectedUser || user._id !== selectedUser._id)
    );

    if (existingUser) {
      setUsernameError("Username already exists");
    } else {
      setUsernameError("");
    }
  };

  const checkPassword = (password) => {
    if (!password) {
      setPasswordError("");
      setPasswordStrength("");
      return;
    }

    // Length validation
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      setPasswordStrength("Weak");
      return;
    }

    if (password.length > 100) {
      setPasswordError("Password must be less than 100 characters");
      setPasswordStrength("");
      return;
    }

    // Password strength calculation
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      setPasswordStrength("Weak");
    } else if (strength <= 4) {
      setPasswordStrength("Moderate");
    } else {
      setPasswordStrength("Strong");
    }

    setPasswordError("");
  };

  const checkStudentNumber = (studentNumber) => {
    if (!studentNumber) {
      setStudentNumberError("");
      return;
    }

    // PDM-0001-000001 format validation
    const studentNumberPattern = /^PDM-\d{4}-\d{6}$/;
    if (!studentNumberPattern.test(studentNumber)) {
      setStudentNumberError("Student number must be in format: PDM-0001-000001");
      return;
    }

    setStudentNumberError("");
  };

  const checkCourse = (course) => {
    if (!course) {
      setCourseError("");
      return;
    }

    // Valid course codes
    const validCourses = ['BSIT', 'BSCS', 'BSHM', 'BSTM', 'BSOAD', 'BECED', 'BTLED'];
    if (!validCourses.includes(course.toUpperCase())) {
      setCourseError("Course must be one of: BSIT, BSCS, BSHM, BSTM, BSOAD, BECED, BTLED");
      return;
    }

    setCourseError("");
  };

  const checkSection = (section) => {
    if (!section) {
      setSectionError("");
      return;
    }

    // Section format validation (e.g., 31A, 32B, 21B)
    const sectionPattern = /^[1-4][1-4][A-D]$/i;
    if (!sectionPattern.test(section)) {
      setSectionError("Section must be in format: 31A, 32B, 21B (2 digits + 1 letter)");
      return;
    }

    setSectionError("");
  };

  // Filter users based on search term
  const filterUsers = (users, term) => {
    if (!term.trim()) return users;
    
    return users.filter(user =>
      user.name.toLowerCase().includes(term.toLowerCase()) ||
      user.username.toLowerCase().includes(term.toLowerCase()) ||
      user.role.toLowerCase().includes(term.toLowerCase()) ||
      (user.studentNumber && user.studentNumber.toLowerCase().includes(term.toLowerCase())) ||
      (user.course && user.course.toLowerCase().includes(term.toLowerCase())) ||
      (user.section && user.section.toLowerCase().includes(term.toLowerCase()))
    );
  };

  // Fetch active users from backend - UPDATED
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users`);
      if (response.ok) {
        const data = await response.json();
        console.log('Users data from API:', data);
        
        let usersData = [];
        if (Array.isArray(data)) {
          usersData = data;
        } else if (data.users && Array.isArray(data.users)) {
          usersData = data.users;
        } else {
          usersData = [];
        }
        
        setAllUsers(usersData);
        
        // Apply search filter if there's a search term
        const filteredData = filterUsers(usersData, searchTerm);
        setUsers(filteredData);
        
      } else {
        console.error('Failed to fetch users');
        setAllUsers([]);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived users - UPDATED
  const fetchArchivedUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/users/archived`);
      if (response.ok) {
        const data = await response.json();
        
        let archivedData = [];
        if (Array.isArray(data)) {
          archivedData = data;
        } else if (data.users && Array.isArray(data.users)) {
          archivedData = data.users;
        } else {
          archivedData = [];
        }
        
        setAllArchivedUsers(archivedData);
        
        // Apply search filter if there's a search term
        const filteredData = filterUsers(archivedData, searchTerm);
        setArchivedUsers(filteredData);
        
      } else {
        console.error('Failed to fetch archived users');
        setAllArchivedUsers([]);
        setArchivedUsers([]);
      }
    } catch (error) {
      console.error('Error fetching archived users:', error);
      setAllArchivedUsers([]);
      setArchivedUsers([]);
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
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Update displayed data when search term changes
  useEffect(() => {
    if (showArchivedView) {
      const filteredData = filterUsers(allArchivedUsers, searchTerm);
      setArchivedUsers(filteredData);
      setArchivedCurrentPage(1); // Reset to first page when searching
    } else {
      const filteredData = filterUsers(allUsers, searchTerm);
      setUsers(filteredData);
      setCurrentPage(1); // Reset to first page when searching
    }
  }, [searchTerm, showArchivedView]);

  // Handle modal from parent
  useEffect(() => {
    if (showAddModal) {
      resetForm();
    }
  }, [showAddModal]);

  // Reset save success state when modals close
  useEffect(() => {
    if (!showAddModal && !showEditModal) {
      setSaveSuccess(false);
      if (onAddModalClose) {
        onAddModalClose();
      }
    }
  }, [showAddModal, showEditModal]);

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
  const displayedUsers = getPaginatedData(users, currentPage);
  const displayedArchivedUsers = getPaginatedData(archivedUsers, archivedCurrentPage);

  const usersDisplayRange = getDisplayRange(users, currentPage);
  const archivedUsersDisplayRange = getDisplayRange(archivedUsers, archivedCurrentPage);

  const usersTotalPages = getTotalPages(users);
  const archivedUsersTotalPages = getTotalPages(archivedUsers);

  // Pagination handlers
  const handleNextPage = () => {
    if (showArchivedView) {
      if (archivedCurrentPage < archivedUsersTotalPages) {
        setArchivedCurrentPage(archivedCurrentPage + 1);
      }
    } else {
      if (currentPage < usersTotalPages) {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (['studentNumber', 'course', 'section'].includes(name)) {
      setFormData({ ...formData, [name]: value.trim() || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Real-time validation
    if (name === "name") {
      checkName(value);
    } else if (name === "username") {
      checkUsername(value);
    } else if (name === "password") {
      checkPassword(value);
    } else if (name === "studentNumber") {
      checkStudentNumber(value);
    } else if (name === "course") {
      checkCourse(value);
    } else if (name === "section") {
      checkSection(value);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "",
      status: "",
      studentNumber: null,
      course: null,
      section: null
    });
    setSelectedUser(null);
    setUsernameError("");
    setNameError("");
    setPasswordError("");
    setStudentNumberError("");
    setCourseError("");
    setSectionError("");
    setPasswordStrength("");
    setSaveSuccess(false);
  };

  const isStaffRole = () => {
    return formData.role.toLowerCase().includes("staff");
  };

  // Check if form has any validation errors
  const hasFormErrors = usernameError || nameError || passwordError || 
                       (isStaffRole() && (studentNumberError || courseError || sectionError));

  const handleAddUser = async (e) => {
    if (e) e.preventDefault();
    
    if (hasFormErrors) {
      setErrorMessage("Please fix the form errors before saving.");
      setShowErrorModal(true);
      return;
    }

    if (isStaffRole()) {
      if (!formData.studentNumber) {
        setErrorMessage("Please enter student number for staff member.");
        setShowErrorModal(true);
        return;
      }
      if (!formData.course) {
        setErrorMessage("Please enter course for staff member.");
        setShowErrorModal(true);
        return;
      }
      if (!formData.section) {
        setErrorMessage("Please enter section for staff member.");
        setShowErrorModal(true);
        return;
      }
    }

    setSaving(true);
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
        setSaveSuccess(true);
        setTimeout(async () => {
          await fetchUsers();
          resetForm();
          setSaving(false);
          if (onAddModalClose) {
            onAddModalClose();
          }
        }, 1500);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to create user');
        setShowErrorModal(true);
        setSaving(false);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorMessage('Error creating user');
      setShowErrorModal(true);
      setSaving(false);
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
    setNameError("");
    setPasswordError("");
    setStudentNumberError("");
    setCourseError("");
    setSectionError("");
    setPasswordStrength("");
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    if (e) e.preventDefault();
    
    if (hasFormErrors) {
      setErrorMessage("Please fix the form errors before updating.");
      setShowErrorModal(true);
      return;
    }

    if (isStaffRole()) {
      if (!formData.studentNumber) {
        setErrorMessage("Please enter student number for staff member.");
        setShowErrorModal(true);
        return;
      }
      if (!formData.course) {
        setErrorMessage("Please enter course for staff member.");
        setShowErrorModal(true);
        return;
      }
      if (!formData.section) {
        setErrorMessage("Please enter section for staff member.");
        setShowErrorModal(true);
        return;
      }
    }

    setSaving(true);
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
        setSaveSuccess(true);
        setTimeout(async () => {
          await fetchUsers();
          setShowEditModal(false);
          resetForm();
          setSaving(false);
        }, 1500);
      } else {
        const errorData = await response.json();
        
        if (errorData.error && errorData.error.includes('schedule(s) are using this staff member')) {
          let errorMessage = errorData.error;
          
          if (errorData.schedules && errorData.schedules.length > 0) {
            errorMessage += '\n\nActive Schedules:';
            errorData.schedules.forEach((schedule, index) => {
              errorMessage += `\n${index + 1}. ${schedule.day}: ${schedule.start_time} - ${schedule.end_time}`;
            });
            errorMessage += '\n\nPlease remove or reassign these schedules first.';
          }
          
          setErrorMessage(errorMessage);
          setShowErrorModal(true);
        } else {
          setErrorMessage(errorData.error || 'Failed to update user');
          setShowErrorModal(true);
        }
        setSaving(false);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setErrorMessage('Error updating user');
      setShowErrorModal(true);
      setSaving(false);
    }
  };

  // Archive user functions
  const openArchiveModal = (user) => {
    setUserToArchive(user);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setShowArchiveModal(false);
    setUserToArchive(null);
    setArchiving(false);
    setArchiveSuccess(false);
  };

  const handleArchiveUser = async () => {
    if (!userToArchive) return;

    setArchiving(true);
    try {
      const response = await fetch(`${API_BASE}/users/${userToArchive._id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        setArchiveSuccess(true);
        setTimeout(async () => {
          await fetchUsers();
          closeArchiveModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        
        if (errorData.error && errorData.error.includes('schedule(s) are assigned to this staff member')) {
          let errorMessage = errorData.error;
          
          if (errorData.schedules && errorData.schedules.length > 0) {
            errorMessage += '\n\nActive Schedules:';
            errorData.schedules.forEach((schedule, index) => {
              errorMessage += `\n${index + 1}. ${schedule.day}: ${schedule.start_time} - ${schedule.end_time}`;
            });
            errorMessage += '\n\nPlease remove or reassign these schedules first.';
          }
          
          setErrorMessage(errorMessage);
          setShowErrorModal(true);
        } else {
          setErrorMessage(errorData.error || 'Failed to archive user');
          setShowErrorModal(true);
        }
        setArchiving(false);
      }
    } catch (error) {
      console.error('Error archiving user:', error);
      setErrorMessage('Error archiving user');
      setShowErrorModal(true);
      setArchiving(false);
    }
  };

  // Restore user functions
  const openRestoreModal = (user) => {
    setUserToRestore(user);
    setShowRestoreModal(true);
  };

  const closeRestoreModal = () => {
    setShowRestoreModal(false);
    setUserToRestore(null);
    setRestoring(false);
    setRestoreSuccess(false);
  };

  const handleRestoreUser = async () => {
    if (!userToRestore) return;

    setRestoring(true);
    try {
      const response = await fetch(`${API_BASE}/users/${userToRestore._id}/restore`, {
        method: 'PUT',
      });

      if (response.ok) {
        setRestoreSuccess(true);
        setTimeout(async () => {
          await fetchArchivedUsers();
          await fetchUsers();
          closeRestoreModal();
        }, 1500);
      } else {
        const errorData = await response.json();
        
        if (errorData.error && errorData.error.includes('role is currently archived')) {
          let errorMessage = errorData.error;
          
          if (errorData.role_name) {
            errorMessage += '\n\nPlease restore the role first in Manage Roles.';
          }
          
          setErrorMessage(errorMessage);
          setShowErrorModal(true);
        } else {
          setErrorMessage(errorData.error || 'Failed to restore user');
          setShowErrorModal(true);
        }
        setRestoring(false);
      }
    } catch (error) {
      console.error('Error restoring user:', error);
      setErrorMessage('Error restoring user');
      setShowErrorModal(true);
      setRestoring(false);
    }
  };

  const closeModals = () => {
    setShowEditModal(false);
    resetForm();
    if (onAddModalClose) {
      onAddModalClose();
    }
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
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

  // Get password strength color
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "Weak": return "#ff4444";
      case "Moderate": return "#ffa726";
      case "Strong": return "#4caf50";
      default: return "#666";
    }
  };

  return (
    <div className="manage-users">
      {/* MAIN USERS VIEW */}
      {!showArchivedView && (
        <div className="user-table">
          {/* Table Header with Archive Button and Search */}
          <div className="table-header">
            <button className="view-archive-btn" onClick={() => {
              setShowArchivedView(true);
              setSearchTerm("");
              setArchivedCurrentPage(1);
              fetchArchivedUsers();
            }}>
              📦 View Archived Users
            </button>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
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
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", color: "#888" }}>
                    {loading ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                      </div>
                    ) : searchTerm ? (
                      "No users found matching your search."
                    ) : (
                      "No users found."
                    )}
                  </td>
                </tr>
              ) : (
                displayedUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td>{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`status ${user.status === "Active" ? "active" : "inactive"}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{formatDate(user.last_login)}</td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEditUser(user)}>Edit</button>
                      <button className="archive-btn" onClick={() => openArchiveModal(user)}>Archive</button>
                    </td>
                  </tr>
                ))
              )}
              
              {/* Add empty rows to maintain consistent height */}
              {displayedUsers.length > 0 && displayedUsers.length < 10 &&
                Array.from({ length: 10 - displayedUsers.length }).map((_, index) => (
                  <tr key={`empty-${index}`} style={{ visibility: 'hidden' }}>
                    <td>&nbsp;</td>
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
          {displayedUsers.length > 0 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                <span className="pagination-text">
                  Showing {usersDisplayRange.start}-{usersDisplayRange.end} of {usersDisplayRange.total} items
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
                  Page {currentPage} of {usersTotalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage === usersTotalPages || loading}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ARCHIVED USERS VIEW */}
      {showArchivedView && (
        <div className="user-table">
          <div className="table-header">
            <button className="back-to-main-btn" onClick={() => {
              setShowArchivedView(false);
              setSearchTerm("");
              setCurrentPage(1);
            }}>
              ← Back to Main View
            </button>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search archived users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>User Role</th>
                <th>Status</th>
                <th>Archived Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedArchivedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "#888" }}>
                    {loading ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                      </div>
                    ) : searchTerm ? (
                      "No archived users found matching your search."
                    ) : (
                      "No archived users found."
                    )}
                  </td>
                </tr>
              ) : (
                displayedArchivedUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.role}</td>
                    <td>
                    <span className={`status ${user.status === "Active" ? "active" : "inactive"}`}>
                      {user.status}
                    </span>
                    </td>
                    <td>{formatDate(user.archived_at)}</td>
                    <td>
                      <button className="restore-btn" onClick={() => openRestoreModal(user)}>
                        Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
              
              {/* Add empty rows to maintain consistent height */}
              {displayedArchivedUsers.length > 0 && displayedArchivedUsers.length < 10 &&
                Array.from({ length: 10 - displayedArchivedUsers.length }).map((_, index) => (
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

          {/* PAGINATION FOR ARCHIVED USERS */}
          {displayedArchivedUsers.length > 0 && (
            <div className="pagination-controls">
              <div className="pagination-info">
                <span className="pagination-text">
                  Showing {archivedUsersDisplayRange.start}-{archivedUsersDisplayRange.end} of {archivedUsersDisplayRange.total} items
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
                  Page {archivedCurrentPage} of {archivedUsersTotalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={archivedCurrentPage === archivedUsersTotalPages || loading}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Add New User</b></h3>
            
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
              <form onSubmit={handleAddUser}>
                <div className="input-with-error">
                  <label>Full Name</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    placeholder="Full Name" 
                    className={nameError ? "error-input" : ""}
                    required 
                    maxLength="100"
                    pattern=".*[a-zA-Z].*"
                    title="Full name must contain letters and cannot be only numbers or special characters"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter a valid full name with at least one letter')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {nameError && <div className="error-message">{nameError}</div>}
                  <small className="character-count">
                    {formData.name.length}/100 characters
                  </small>
                </div>
                
                <div className="input-with-error">
                  <label>Username</label>
                  <input 
                    name="username" 
                    value={formData.username} 
                    onChange={handleInputChange} 
                    placeholder="Username" 
                    className={usernameError ? "error-input" : ""}
                    required
                    maxLength="50"
                    pattern=".*[a-zA-Z].*"
                    title="Username must contain letters and cannot be only numbers or special characters"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter a valid username with at least one letter')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {usernameError && <div className="error-message">{usernameError}</div>}
                  <small className="character-count">
                    {formData.username.length}/50 characters
                  </small>
                </div>
                
                <div className="input-with-error">
                  <label>Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="Password" 
                    className={passwordError ? "error-input" : ""}
                    required 
                    maxLength="100"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter password')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {passwordError && <div className="error-message">{passwordError}</div>}
                  {passwordStrength && !passwordError && (
                    <small className="password-strength" style={{ color: getPasswordStrengthColor() }}>
                      Password Strength: {passwordStrength}
                    </small>
                  )}
                  <small className="character-count">
                    {formData.password.length}/100 characters
                  </small>
                </div>
                
                <label>User Role</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleInputChange} 
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Please select a user role')}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="" disabled>Select Role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                
                {isStaffRole() && (
                  <>
                    <div className="input-with-error">
                      <label>Student Number</label>
                      <input 
                        name="studentNumber" 
                        value={getInputValue('studentNumber')} 
                        onChange={handleInputChange} 
                        placeholder="e.g., PDM-0001-000001" 
                        className={studentNumberError ? "error-input" : ""}
                        required={isStaffRole()}
                        maxLength="15"
                        onInvalid={(e) => e.target.setCustomValidity('Please enter student number in format: PDM-0001-000001')}
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                      {studentNumberError && <div className="error-message">{studentNumberError}</div>}
                    </div>
                    
                    <div className="input-with-error">
                      <label>Course</label>
                      <input 
                        name="course" 
                        value={getInputValue('course')} 
                        onChange={handleInputChange} 
                        placeholder="e.g., BSIT, BSCS, BSHM" 
                        className={courseError ? "error-input" : ""}
                        required={isStaffRole()}
                        maxLength="10"
                        onInvalid={(e) => e.target.setCustomValidity('Please enter course (BSIT, BSCS, BSHM, BSTM, BSOAD, BECED, BTLED)')}
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                      {courseError && <div className="error-message">{courseError}</div>}
                    </div>
                    
                    <div className="input-with-error">
                      <label>Section</label>
                      <input 
                        name="section" 
                        value={getInputValue('section')} 
                        onChange={handleInputChange} 
                        placeholder="e.g., 31A, 32B, 21B" 
                        className={sectionError ? "error-input" : ""}
                        required={isStaffRole()}
                        maxLength="3"
                        onInvalid={(e) => e.target.setCustomValidity('Please enter section in format: 31A, 32B, 21B')}
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                      {sectionError && <div className="error-message">{sectionError}</div>}
                    </div>
                  </>
                )}
                
                <label>Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange}
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Please select a status')}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="" disabled>Select Status</option>
                  <option value="Active">ACTIVE</option>
                  <option value="Inactive">INACTIVE</option>
                </select>

                <div className="modal-buttons">
                  <button 
                    type="submit" 
                    className="save-btn" 
                    disabled={saving || hasFormErrors}
                    title={hasFormErrors ? "Please fix validation errors before saving" : ""}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeModals}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3><b>Edit User</b></h3>
            
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
              <form onSubmit={handleUpdateUser}>
                <div className="input-with-error">
                  <label>Full Name</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className={nameError ? "error-input" : ""}
                    required 
                    maxLength="100"
                    pattern=".*[a-zA-Z].*"
                    title="Full name must contain letters and cannot be only numbers or special characters"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter a valid full name with at least one letter')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {nameError && <div className="error-message">{nameError}</div>}
                  <small className="character-count">
                    {formData.name.length}/100 characters
                  </small>
                </div>
                
                <div className="input-with-error">
                  <label>Username</label>
                  <input 
                    name="username" 
                    value={formData.username} 
                    onChange={handleInputChange} 
                    className={usernameError ? "error-input" : ""}
                    required
                    maxLength="50"
                    pattern=".*[a-zA-Z].*"
                    title="Username must contain letters and cannot be only numbers or special characters"
                    onInvalid={(e) => e.target.setCustomValidity('Please enter a valid username with at least one letter')}
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {usernameError && <div className="error-message">{usernameError}</div>}
                  <small className="character-count">
                    {formData.username.length}/50 characters
                  </small>
                </div>
                
                <div className="input-with-error">
                  <label>Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="New Password (optional)" 
                    className={passwordError ? "error-input" : ""}
                    maxLength="100"
                  />
                  {passwordError && <div className="error-message">{passwordError}</div>}
                  {passwordStrength && !passwordError && formData.password && (
                    <small className="password-strength" style={{ color: getPasswordStrengthColor() }}>
                      Password Strength: {passwordStrength}
                    </small>
                  )}
                  <small className="character-count">
                    {formData.password.length}/100 characters
                  </small>
                </div>
                
                <label>User Role</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleInputChange} 
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Please select a user role')}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="" disabled>Select Role</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                
                {isStaffRole() && (
                  <>
                    <div className="input-with-error">
                      <label>Student Number</label>
                      <input 
                        name="studentNumber" 
                        value={getInputValue('studentNumber')} 
                        onChange={handleInputChange} 
                        placeholder="e.g., PDM-0001-000001" 
                        className={studentNumberError ? "error-input" : ""}
                        required={isStaffRole()}
                        maxLength="15"
                        onInvalid={(e) => e.target.setCustomValidity('Please enter student number in format: PDM-0001-000001')}
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                      {studentNumberError && <div className="error-message">{studentNumberError}</div>}
                    </div>
                    
                    <div className="input-with-error">
                      <label>Course</label>
                      <input 
                        name="course" 
                        value={getInputValue('course')} 
                        onChange={handleInputChange} 
                        placeholder="e.g., BSIS, BSIT, BSCS" 
                        className={courseError ? "error-input" : ""}
                        required={isStaffRole()}
                        maxLength="10"
                        onInvalid={(e) => e.target.setCustomValidity('Please enter course (BSIS, BSIT, BSCS, BSEMC, BSCpE)')}
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                      {courseError && <div className="error-message">{courseError}</div>}
                    </div>
                    
                    <div className="input-with-error">
                      <label>Section</label>
                      <input 
                        name="section" 
                        value={getInputValue('section')} 
                        onChange={handleInputChange} 
                        placeholder="e.g., 31A, 32B, 21B" 
                        className={sectionError ? "error-input" : ""}
                        required={isStaffRole()}
                        maxLength="3"
                        onInvalid={(e) => e.target.setCustomValidity('Please enter section in format: 31A, 32B, 21B')}
                        onInput={(e) => e.target.setCustomValidity('')}
                      />
                      {sectionError && <div className="error-message">{sectionError}</div>}
                    </div>
                  </>
                )}
                
                <label>Status</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange}
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Please select a status')}
                  onInput={(e) => e.target.setCustomValidity('')}
                >
                  <option value="" disabled>Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <div className="modal-buttons">
                  <button 
                    type="submit" 
                    className="save-btn" 
                    disabled={saving || hasFormErrors}
                    title={hasFormErrors ? "Please fix validation errors before updating" : ""}
                  >
                    {saving ? "Updating..." : "Update"}
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeModals}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION MODAL */}
      {showArchiveModal && userToArchive && (
        <div className="modal-overlay">
          <div className="modal-content archive-confirmation centered-modal">
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
                  {!archiveSuccess ? "Archiving user..." : "User archived successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="archive-icon">📦</div>
                <h3 className="centered-text">Archive User</h3>
                <p className="centered-text">Are you sure you want to archive user <strong>"{userToArchive.name}"</strong>?</p>
                <p className="archive-warning centered-text">This user will be moved to archives and hidden from the main list.</p>
                
                <div className="modal-buttons centered-buttons">
                  <button className="confirm-archive-btn" onClick={handleArchiveUser}>
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
      {showRestoreModal && userToRestore && (
        <div className="modal-overlay">
          <div className="modal-content restore-confirmation centered-modal">
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
                  {!restoreSuccess ? "Restoring user..." : "User restored successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="restore-icon">↶</div>
                <h3 className="centered-text">Restore User</h3>
                <p className="centered-text">Are you sure you want to restore user <strong>"{userToRestore.name}"</strong>?</p>
                <p className="restore-warning centered-text">This user will be moved back to the main users list.</p>
                
                <div className="modal-buttons centered-buttons">
                  <button className="confirm-restore-btn" onClick={handleRestoreUser}>
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
              {errorMessage.includes('archive') ? 'Cannot archive user' : 
              errorMessage.includes('create') ? 'Cannot create user' : 
              errorMessage.includes('update') ? 'Cannot update user' : 
              errorMessage.includes('restore') ? 'Cannot restore user' : 'Operation failed'}
            </div>
            <div className="error-modal-message">
              {errorMessage.split('\n\n')[0]}
              {errorMessage.includes('Active Schedules:') && (
                <div className="error-modal-schedules">
                  {errorMessage.split('Active Schedules:')[1]?.split('\n\n')[0]?.split('\n').map((schedule, index) => (
                    <div key={index} className="error-schedule-item">
                      {schedule.trim()}
                    </div>
                  ))}
                </div>
              )}
              {/* ADDED: Role archived error handling */}
              {errorMessage.includes('role is currently archived') && (
                <div style={{ marginTop: '15px', color: '#d9534f', fontWeight: 'bold' }}>
                  {errorMessage.split('\n\n')[1]}
                </div>
              )}
              {errorMessage.split('\n\n')[1] && !errorMessage.includes('role is currently archived') && (
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

export default ManageUsers;