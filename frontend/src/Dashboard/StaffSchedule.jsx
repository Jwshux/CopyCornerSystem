import React, { useState } from "react";
import "./StaffSchedule.css";

const initialSchedule = {
  Monday: [{ name: "Trixie", time: "7:30 AM - 4:30 PM" }],
  Tuesday: [],
  Wednesday: [{ name: "Alex", time: "8:00 AM - 5:00 PM" }],
  Thursday: [],
  Friday: [],
  Saturday: [],
  Sunday: [],
};

const staffList = ["Trixie", "Alex", "John", "Mara", "Daisy"];

function StaffSchedule() {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [editing, setEditing] = useState({ day: null, index: null });
  const [tempTime, setTempTime] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    day: "Monday",
    staff: "",
    start: "",
    end: "",
  });

  const handleEdit = (day, index, currentTime) => {
    setEditing({ day, index });
    setTempTime(currentTime);
  };

  const handleSave = (day, index) => {
    const updated = { ...schedule };
    updated[day][index].time = tempTime;
    setSchedule(updated);
    setEditing({ day: null, index: null });
  };

  const handleRemoveStaff = (day, index) => {
    const updated = { ...schedule };
    updated[day].splice(index, 1);
    setSchedule(updated);
  };

  const handleAddStaff = () => {
    if (!newEntry.staff || !newEntry.start || !newEntry.end) {
      alert("Please fill out all fields!");
      return;
    }
    const updated = { ...schedule };
    updated[newEntry.day].push({
      name: newEntry.staff,
      time: `${newEntry.start} - ${newEntry.end}`,
    });
    setSchedule(updated);
    setShowModal(false);
    setNewEntry({ day: "Monday", staff: "", start: "", end: "" });
  };

  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h2>📅 Staff Weekly Schedule</h2>
        <button className="add-btn main-add" onClick={() => setShowModal(true)}>
          ➕ Add Schedule
        </button>
      </div>

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
            {Object.entries(schedule).map(([day, staffArray]) => (
                <React.Fragment key={day}>
                {staffArray.length === 0 ? (
                    <tr>
                    <td className="day-cell">{day}</td>
                    <td className="no-staff" colSpan={2}>
                        No staff assigned
                    </td>
                    </tr>
                ) : (
                    staffArray.map((staff, index) => (
                    <tr key={`${day}-${index}`}>
                        {/* Only render Day cell once using rowSpan */}
                        {index === 0 && (
                        <td className="day-cell" rowSpan={staffArray.length}>
                            {day}
                        </td>
                        )}

                        <td>
                        <div className="staff-row">
                            <strong>{staff.name}</strong>
                            {editing.day === day && editing.index === index ? (
                            <input
                                type="text"
                                value={tempTime}
                                onChange={(e) => setTempTime(e.target.value)}
                                className="time-input"
                                autoFocus
                            />
                            ) : (
                            <span className="time-text">{staff.time}</span>
                            )}
                        </div>
                        </td>

                        {/* REMOVE rowSpan - each staff gets their own action buttons */}
                        <td className="action-buttons">
                        <button
                            className="edit-btn" /* Always use edit-btn class */
                            onClick={() => {
                            if (editing.day === day && editing.index === index) {
                                handleSave(day, index);
                            } else {
                                handleEdit(day, index, staff.time);
                            }
                            }}
                        >
                            {editing.day === day && editing.index === index ? (
                            <>💾 <span>Save</span></>
                            ) : (
                            <>✏️ <span>Edit</span></>
                            )}
                        </button>
                        <button
                            className="remove-btn"
                            onClick={() => handleRemoveStaff(day, index)}
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
              {Object.keys(schedule).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>

            <label>Staff:</label>
            <select
              value={newEntry.staff}
              onChange={(e) => setNewEntry({ ...newEntry, staff: e.target.value })}
            >
              <option value="">Select Staff</option>
              {staffList.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <label>Start Time:</label>
            <input
              type="time"
              value={newEntry.start}
              onChange={(e) => setNewEntry({ ...newEntry, start: e.target.value })}
            />

            <label>End Time:</label>
            <input
              type="time"
              value={newEntry.end}
              onChange={(e) => setNewEntry({ ...newEntry, end: e.target.value })}
            />

            <div className="modal-actions">
              <button className="save-btn" onClick={handleAddStaff}>
                💾 <span>Save</span>
              </button>
              <button className="remove-btn" onClick={() => setShowModal(false)}>
                ✖ <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffSchedule;
