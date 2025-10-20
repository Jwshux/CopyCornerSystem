import React, { useState, useEffect } from "react";
import "./StaffSchedule.css";

const API_BASE = "http://localhost:5000/api";

function StaffSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState({ id: null });
  const [tempTime, setTempTime] = useState({ start: "", end: "" });
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    day: "Monday",
    staff_id: "",
    start_time: "",
    end_time: "",
  });

  // Fetch schedules from backend
  const fetchSchedules = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  // Fetch available staff from backend
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
    fetchSchedules();
    fetchStaff();
  }, []);

  // Group schedules by day
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
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (scheduleId) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSchedules();
      } else {
        console.error('Failed to delete schedule');
        alert('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Error deleting schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newEntry.staff_id || !newEntry.start_time || !newEntry.end_time) {
      alert("Please fill out all fields!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });

      if (response.ok) {
        await fetchSchedules();
        setShowModal(false);
        setNewEntry({ day: "Monday", staff_id: "", start_time: "", end_time: "" });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Error creating schedule');
    } finally {
      setLoading(false);
    }
  };

// Convert military time to 12-hour format with AM/PM
const formatTimeForDisplay = (time) => {
  if (!time) return '';
  
  // Remove seconds if present
  const timeWithoutSeconds = time.slice(0, 5);
  
  // Convert to 12-hour format
  const [hours, minutes] = timeWithoutSeconds.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${minutes} ${ampm}`;
};

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h2>📅 Staff Weekly Schedule</h2>
        <button className="add-btn main-add" onClick={() => setShowModal(true)}>
          ➕ Add Schedule
        </button>
      </div>

      {loading && <div className="loading">Loading...</div>}

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
          {Object.entries(scheduleByDay).map(([day, daySchedules]) => (
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
                    {/* Only render Day cell once using rowSpan */}
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
                              onChange={(e) => setTempTime({ ...tempTime, start: e.target.value })}
                              className="time-input"
                            />
                            <span> to </span>
                            <input
                              type="time"
                              value={tempTime.end}
                              onChange={(e) => setTempTime({ ...tempTime, end: e.target.value })}
                              className="time-input"
                            />
                          </div>
                        ) : (
                          <span className="time-text">
                            {formatTimeForDisplay(schedule.start_time)} - {formatTimeForDisplay(schedule.end_time)}
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
                        disabled={loading}
                      >
                        {editing.id === schedule._id ? (
                          <>💾 <span>Save</span></>
                        ) : (
                          <>✏️ <span>Edit</span></>
                        )}
                      </button>
                      <button
                        className="remove-btn"
                        onClick={() => handleRemoveStaff(schedule._id)}
                        disabled={loading}
                      >
                        🗑️ <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* === Modal === */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <h3>Add New Schedule</h3>

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
              <button className="save-btn" onClick={handleAddStaff} disabled={loading}>
                {loading ? "Adding..." : "💾 Save"}
              </button>
              <button className="remove-btn" onClick={() => setShowModal(false)} disabled={loading}>
                ✖ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffSchedule;