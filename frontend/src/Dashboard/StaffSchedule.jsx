import React, { useState, useEffect } from "react";
import "./StaffSchedule.css";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";
import checkmarkAnimation from "../animations/checkmark.json";
import deleteAnimation from "../animations/delete.json";

const API_BASE = "http://localhost:5000/api";

function StaffSchedule({ showAddModal, onAddModalClose }) {
  const [schedules, setSchedules] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableActionLoading, setTableActionLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editing, setEditing] = useState({ id: null });
  const [tempTime, setTempTime] = useState({ start: "", end: "" });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [newEntry, setNewEntry] = useState({
    day: "Monday",
    staff_id: "",
    start_time: "",
    end_time: "",
  });

  // Handle modal from parent
  useEffect(() => {
    if (showAddModal) {
      setShowModal(true);
    }
  }, [showAddModal]);

  const fetchSchedules = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setTableLoading(true);
    }
    try {
      const response = await fetch(`${API_BASE}/schedules`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      } else {
        console.error('Failed to fetch schedules');
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      if (isInitialLoad) {
        setTableLoading(false);
      }
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await fetch(`${API_BASE}/schedules/staff`);
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      } else {
        console.error('Failed to fetch staff');
        const error = await response.json();
        alert(error.error || 'Failed to fetch staff list');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      alert('Error fetching staff list');
    }
  };

  useEffect(() => {
    fetchSchedules(true);
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!showModal) {
      setAddSuccess(false);
      if (onAddModalClose) {
        onAddModalClose();
      }
    }
  }, [showModal]);

  useEffect(() => {
    if (!showDeleteModal) {
      setDeleteSuccess(false);
    }
  }, [showDeleteModal]);

  const scheduleByDay = {
    Monday: schedules.filter(s => s.day === "Monday"),
    Tuesday: schedules.filter(s => s.day === "Tuesday"),
    Wednesday: schedules.filter(s => s.day === "Wednesday"),
    Thursday: schedules.filter(s => s.day === "Thursday"),
    Friday: schedules.filter(s => s.day === "Friday"),
    Saturday: schedules.filter(s => s.day === "Saturday"),
    Sunday: schedules.filter(s => s.day === "Sunday"),
  };

  const handleEdit = (schedule) => {
    setEditing({ id: schedule._id });
    setTempTime({
      start: schedule.start_time,
      end: schedule.end_time
    });
  };

  const handleSave = async (scheduleId) => {
    setTableActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day: schedules.find(s => s._id === scheduleId).day,
          staff_id: schedules.find(s => s._id === scheduleId).staff_id,
          start_time: tempTime.start,
          end_time: tempTime.end
        }),
      });

      if (response.ok) {
        await fetchSchedules();
        setEditing({ id: null });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update schedule');
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Error updating schedule');
    } finally {
      setTableActionLoading(false);
    }
  };

  const openDeleteModal = (schedule) => {
    setScheduleToDelete(schedule);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setScheduleToDelete(null);
    setDeleting(false);
    setDeleteSuccess(false);
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/schedules/${scheduleToDelete._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteSuccess(true);
        setTimeout(async () => {
          await fetchSchedules();
          closeDeleteModal();
        }, 1500);
      } else {
        console.error('Failed to delete schedule');
        alert('Failed to delete schedule');
        setDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Error deleting schedule');
      setDeleting(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newEntry.staff_id || !newEntry.start_time || !newEntry.end_time) {
      alert("Please fill out all fields!");
      return;
    }

    setModalLoading(true);
    try {
      const response = await fetch(`${API_BASE}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });

      if (response.ok) {
        setAddSuccess(true);
        setTimeout(async () => {
          await fetchSchedules();
          setShowModal(false);
          setNewEntry({ day: "Monday", staff_id: "", start_time: "", end_time: "" });
          setAddSuccess(false);
          setModalLoading(false);
        }, 1500);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create schedule');
        setModalLoading(false);
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Error creating schedule');
      setModalLoading(false);
    }
  };

  const formatTimeForDisplay = (time) => {
    if (!time) return '';
    
    const timeWithoutSeconds = time.slice(0, 5);
    
    const [hours, minutes] = timeWithoutSeconds.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="schedule-container">
      {/* REMOVED THE HEADER - Now handled by Dashboard.jsx */}

      <table className="schedule-table">
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "58%" }} />
          <col style={{ width: "20%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>Day</th>
            <th>Staff & Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tableLoading ? (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Lottie animationData={loadingAnimation} loop={true} style={{ width: 250, height: 250 }} />
                </div>
              </td>
            </tr>
          ) : (
            Object.entries(scheduleByDay).map(([day, daySchedules]) => (
              <React.Fragment key={day}>
                {daySchedules.length === 0 ? (
                  <tr>
                    <td className="day-cell">{day}</td>
                    <td className="no-staff" colSpan={2}>
                      No staff assigned
                    </td>
                  </tr>
                ) : (
                  daySchedules.map((schedule, index) => (
                    <tr key={schedule._id}>
                      {index === 0 && (
                        <td className="day-cell" rowSpan={daySchedules.length}>
                          {day}
                        </td>
                      )}

                      <td>
                        <div className="staff-row">
                          <strong>{schedule.staff_name}</strong>
                          {editing.id === schedule._id ? (
                            <div className="time-edit-container">
                              <input
                                type="time"
                                value={tempTime.start}
                                onChange={(e) =>
                                  setTempTime({ ...tempTime, start: e.target.value })
                                }
                                className="time-input"
                              />
                              <span> to </span>
                              <input
                                type="time"
                                value={tempTime.end}
                                onChange={(e) =>
                                  setTempTime({ ...tempTime, end: e.target.value })
                                }
                                className="time-input"
                              />
                            </div>
                          ) : (
                            <span className="time-text">
                              {formatTimeForDisplay(schedule.start_time)} -{" "}
                              {formatTimeForDisplay(schedule.end_time)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => {
                            if (editing.id === schedule._id) {
                              handleSave(schedule._id);
                            } else {
                              handleEdit(schedule);
                            }
                          }}
                          disabled={tableActionLoading}
                        >
                          {editing.id === schedule._id ? (
                            tableActionLoading ? "⏳" : "💾 Save"
                          ) : (
                            "✏️ Edit"
                          )}
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => openDeleteModal(schedule)}
                          disabled={tableActionLoading}
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>

      {/* === Add Schedule Modal === */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Add New Schedule</h3>
            
            {modalLoading ? (
              <div className="form-animation-center">
                {!addSuccess ? (
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
              <>
                <label>Day:</label>
                <select
                  value={newEntry.day}
                  onChange={(e) => setNewEntry({ ...newEntry, day: e.target.value })}
                >
                  {Object.keys(scheduleByDay).map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>

                <label>Staff:</label>
                <select
                  value={newEntry.staff_id}
                  onChange={(e) => setNewEntry({ ...newEntry, staff_id: e.target.value })}
                >
                  <option value="">Select Staff</option>
                  {staffList.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name}
                    </option>
                  ))}
                </select>

                <label>Start Time:</label>
                <input
                  type="time"
                  value={newEntry.start_time}
                  onChange={(e) => setNewEntry({ ...newEntry, start_time: e.target.value })}
                />

                <label>End Time:</label>
                <input
                  type="time"
                  value={newEntry.end_time}
                  onChange={(e) => setNewEntry({ ...newEntry, end_time: e.target.value })}
                />

                <div className="modal-actions">
                  <button className="save-btn" onClick={handleAddStaff} disabled={modalLoading}>
                    {modalLoading ? "⏳ Adding..." : "💾 Save"}
                  </button>
                  <button className="cancel-btn" onClick={() => setShowModal(false)} disabled={modalLoading}>
                    ✖ Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* === Delete Confirmation Modal === */}
      {showDeleteModal && scheduleToDelete && (
        <div className="modal-backdrop">
          <div className="modal-box delete-confirmation">
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
                  {!deleteSuccess ? "Deleting schedule..." : "Schedule deleted successfully!"}
                </p>
              </div>
            ) : (
              <>
                <div className="delete-icon">🗑️</div>
                <h3>Delete Schedule</h3>
                <p>Are you sure you want to delete schedule for <strong>"{scheduleToDelete.staff_name}"</strong> on <strong>{scheduleToDelete.day}</strong>?</p>
                <p className="delete-warning">This action cannot be undone.</p>
                
                <div className="modal-actions">
                  <button className="confirm-delete-btn" onClick={handleDeleteSchedule}>
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

export default StaffSchedule;