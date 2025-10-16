import React, { useState, useEffect } from "react";
import "./Categories.css";

// Shared category state
let sharedCategories = [
  { name: "Ink", description: "Printer ink cartridges and refills" },
  { name: "Paper", description: "Various types of printing paper" },
];
let setSharedCategories = null;

export const getCategories = () => sharedCategories.map((c) => c.name);

export const updateCategories = (newCategories) => {
  sharedCategories = newCategories;
  if (setSharedCategories) {
    setSharedCategories([...newCategories]);
  }
};

export const registerCategorySetter = (setter) => {
  setSharedCategories = setter;
};

const Categories = () => {
  const [categories, setCategories] = useState(sharedCategories);
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [showEdit, setShowEdit] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    registerCategorySetter(setCategories);
  }, []);

  const handleAdd = () => {
    const trimmedName = newCategory.trim();
    const trimmedDesc = newDescription.trim();

    if (trimmedName === "" && trimmedDesc === "") {
      setAlertMessage("Please enter a category name and description.");
      setShowAlert(true);
      return;
    }

    if (trimmedName === "") {
      setAlertMessage("Please enter a category name.");
      setShowAlert(true);
      return;
    }

    if (trimmedDesc === "") {
      setAlertMessage("Please enter a description.");
      setShowAlert(true);
      return;
    }

    if (categories.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setAlertMessage("Category already exists.");
      setShowAlert(true);
      return;
    }

    const updated = [
      ...categories,
      { name: trimmedName, description: trimmedDesc },
    ];
    setCategories(updated);
    updateCategories(updated);
    setNewCategory("");
    setNewDescription("");
  };


  // Delete Category
  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    const updated = categories.filter((_, i) => i !== deleteIndex);
    setCategories(updated);
    updateCategories(updated);
    setShowConfirm(false);
    setDeleteIndex(null);
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setDeleteIndex(null);
  };

  // Edit Category
  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditValue(categories[index].name);
    setEditDescription(categories[index].description);
    setShowEdit(true);
  };

  const confirmEdit = () => {
    if (editValue.trim() === "") {
      setAlertMessage("Please enter a valid category name.");
      setShowAlert(true);
      return;
    }

    const updated = [...categories];
    updated[editIndex] = {
      name: editValue.trim(),
      description: editDescription.trim(),
    };
    setCategories(updated);
    updateCategories(updated);
    setShowEdit(false);
    setEditValue("");
    setEditDescription("");
  };

  const cancelEdit = () => {
    setShowEdit(false);
    setEditValue("");
    setEditDescription("");
  };

  return (
    <div className="categories-container">
      {/* Add category */}
      <div className="add-category">
        <h3>➕ Add New Category</h3>
        <input
          type="text"
          placeholder="Category Name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <button className="add-btn" onClick={handleAdd}>
          Add Category
        </button>
      </div>

      {/* All categories */}
      <div className="all-categories">
        <h3>📋 All Categories</h3>
        <table className="category-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#888" }}>
                  No categories yet.
                </td>
              </tr>
            ) : (
              categories.map((category, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{category.name}</td>
                  <td>
                    <div className="description-cell">{category.description || "—"}</div>
                  </td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEditClick(index)}
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteClick(index)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation */}
      {showConfirm && (
        <div className="overlay">
          <div className="confirm-modal">
            <h3>Are you sure you want to delete this category?</h3>
            <div className="confirm-buttons">
              <button className="yes-btn" onClick={confirmDelete}>
                Yes
              </button>
              <button className="no-btn" onClick={cancelDelete}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="overlay">
          <div className="confirm-modal">
            <h3>Edit Category</h3>
            <input
              type="text"
              className="edit-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <textarea
              className="edit-input"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
            />
            <div className="confirm-buttons">
              <button className="yes-btn" onClick={confirmEdit}>
                OK
              </button>
              <button className="no-btn" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {showAlert && (
        <div className="overlay">
          <div className="alert-modal">
            <h3>{alertMessage}</h3>
            <div className="alert-buttons">
              <button className="ok-btn" onClick={() => setShowAlert(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
