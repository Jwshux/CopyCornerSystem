import React, { useState } from "react";
import "./AllProducts.css";
import { getCategories, updateCategories } from "./Categories";

function AllProducts() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState([
    {
      id: "001",
      name: "A4 Bond Paper",
      category: "Paper",
      stock: 2500,
      price: "₱3.00/page",
      status: "In Stock",
    },
    {
      id: "002",
      name: "Ink Cartridge (Black)",
      category: "Ink",
      stock: 3,
      price: "₱500",
      status: "Low Stock",
    },
  ]);

  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    stock: "",
    price: "",
  });

  const categories = getCategories();

  const getStockStatus = (stock) => {
    const stockNum = Number(stock);
    if (isNaN(stockNum) || stockNum <= 0) return "Out of Stock";
    if (stockNum <= 5) return "Low Stock";
    return "In Stock";
  };

  const handleAddProduct = (e) => {
    e.preventDefault();

    if (!newProduct.name || !newProduct.stock || !newProduct.price) {
      alert("Please fill in all fields.");
      return;
    }

    const lastId =
      products.length > 0 ? Math.max(...products.map((p) => Number(p.id))) : 0;
    const newId = String(lastId + 1).padStart(3, "0");

    const status = getStockStatus(newProduct.stock);

    const productToAdd = {
      ...newProduct,
      id: newId,
      stock: Number(newProduct.stock),
      status,
    };

    setProducts([...products, productToAdd]);

    if (
      newProduct.category &&
      !categories.includes(newProduct.category.trim())
    ) {
      const updated = [...categories, newProduct.category.trim()];
      updateCategories(updated);
    }

    setNewProduct({
      name: "",
      category: "",
      stock: "",
      price: "",
    });

    setShowAddForm(false);
  };

  return (
    <div className="product-page">
      <div className="product-header">
        <h2>List of Products</h2>
        <button className="add-product-btn" onClick={() => setShowAddForm(true)}>
          Add Product
        </button>
      </div>

      <table className="product-table">
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Stock Quantity</th>
            <th>Unit Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, index) => (
            <tr key={index}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{p.stock}</td>
              <td>{p.price}</td>
              <td>
                <span
                  className={`status-tag ${p.status === "In Stock"
                    ? "in-stock"
                    : p.status === "Low Stock"
                      ? "low-stock"
                      : "out-stock"
                    }`}
                >
                  {p.status}
                </span>
              </td>
              <td>
                <button className="edit-btn">Edit</button>
                <button className="delete-btn">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showAddForm && (
        <div className="overlay">
          <div className="add-form">
            <h3>Add New Product</h3>
            <form onSubmit={handleAddProduct}>
              <input
                type="text"
                placeholder="Product ID"
                value={String(products.length + 1).padStart(3, "0")}
                readOnly
              />
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
              <select
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
              >
                <option value="" disabled hidden>
                  Select Category
                </option>
                <option value="Ink">Ink</option>
                <option value="Paper">Paper</option>
              </select>
              <input
                type="number"
                placeholder="Stock Quantity"
                value={newProduct.stock ?? ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, stock: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Unit Price"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
              />

              <div className="form-buttons">
                <button type="submit" className="save-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setNewProduct({
                      name: "",
                      category: "",
                      stock: "",
                      price: "",
                    });
                    setShowAddForm(false);
                  }}
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

export default AllProducts;
