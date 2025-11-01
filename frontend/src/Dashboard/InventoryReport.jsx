import React, { useState, useEffect } from "react";
import "./InventoryReport.css";

const API_BASE = "http://localhost:5000/api";

function InventoryReport() {
  const [reportData, setReportData] = useState({
    currentStock: [],
    lowStockItems: [],
    outOfStockItems: [],
    totalValue: 0,
    stockStatus: {
      inStock: 0,
      lowStock: 0,
      outOfStock: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/reports/inventory`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        setCurrentPage(1); // Reset to first page when new data loads
      } else {
        console.error('Failed to fetch inventory report');
      }
    } catch (error) {
      console.error('Error fetching inventory report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryReport();
  }, []);

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2)}`;
  };

  const getStockStatus = (product) => {
    const stock = parseInt(product.stock_quantity);
    const minStock = parseInt(product.minimum_stock) || 5;
    
    if (stock <= 0) return "Out of Stock";
    if (stock <= minStock) return "Low Stock";
    return "In Stock";
  };

  const getFilteredProducts = () => {
    const allProducts = [...reportData.currentStock];
    
    switch (filter) {
      case "low":
        return allProducts.filter(product => {
          const stock = parseInt(product.stock_quantity);
          const minStock = parseInt(product.minimum_stock) || 5;
          return stock > 0 && stock <= minStock;
        });
      case "out":
        return allProducts.filter(product => parseInt(product.stock_quantity) <= 0);
      default:
        return allProducts;
    }
  };

  // Pagination calculations
  const filteredProducts = getFilteredProducts();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const refreshReport = () => {
    fetchInventoryReport();
  };

const exportToPDF = () => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = document.getElementById("inventory-report-content").innerHTML;

  const allProducts = getFilteredProducts();

  const tbody = tempDiv.querySelector(".inventory-details-table tbody");
  if (tbody) {
    tbody.innerHTML = "";
    allProducts.forEach(product => {
      tbody.innerHTML += `
        <tr>
          <td>${product.product_name}</td>
          <td>${product.category_name || "Uncategorized"}</td>
          <td>${product.stock_quantity}</td>
          <td>${product.minimum_stock || 5}</td>
          <td>${formatCurrency(product.unit_price)}</td>
          <td>${formatCurrency(product.stock_quantity * product.unit_price)}</td>
          <td>
            <span class="status-badge ${getStockStatus(product).toLowerCase().replace(" ", "-")}">
              ${getStockStatus(product)}
            </span>
          </td>
        </tr>
      `;
    });
  }

  // remove pagination + controls
  tempDiv.querySelectorAll(".pagination-controls, .report-controls-section").forEach(e => e.remove());

  // unwrap scroll/flex parents
  tempDiv.querySelectorAll(
    ".inventory-table-container, .inventory-report-content"
  ).forEach((node) => {
    const parent = node.parentNode;
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    parent.removeChild(node);
  });

  const opt = {
    margin: 5,
    filename: `inventory-report-${new Date().toISOString().split("T")[0]}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  import("html2pdf.js").then((html2pdf) => {
    html2pdf.default().from(tempDiv).set(opt).save();
  });
};



const exportToCSV = () => {
  const headers = ['Product Name', 'Category', 'Stock Quantity', 'Min Stock', 'Unit Price', 'Stock Value', 'Status'];
  const csvData = [
    headers,
    ...reportData.currentStock.map(product => [ // Use ALL data from currentStock
      product.product_name,
      product.category_name || 'Uncategorized',
      product.stock_quantity,
      product.minimum_stock || 5,
      product.unit_price,
      (product.stock_quantity * product.unit_price).toFixed(2),
      getStockStatus(product)
    ])
  ];

  const csvContent = csvData.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

  return (
    <div className="inventory-report-container">
      <div className="report-controls-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select 
              value={filter} 
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="status-filter"
            >
              <option value="all">All Items</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <button className="refresh-report-btn" onClick={refreshReport}>
            🔄 Refresh Report
          </button>
        </div>

        <div className="export-controls">
          <button className="export-btn export-pdf" onClick={exportToPDF}>
            Export PDF
          </button>
          <button className="export-btn export-csv" onClick={exportToCSV}>
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="report-loading">
          <div className="loading-spinner"></div>
          <p>Generating inventory report...</p>
        </div>
      ) : (
        <div id="inventory-report-content" className="inventory-report-content">
          {/* Inventory Overview Cards */}
          <div className="inventory-overview-grid">
            <div className="overview-card total">
              <div className="overview-icon">📦</div>
              <div className="overview-info">
                <h3>Total Products</h3>
                <p className="overview-value">{reportData.currentStock.length}</p>
              </div>
            </div>
            <div className="overview-card value">
              <div className="overview-icon">💰</div>
              <div className="overview-info">
                <h3>Total Inventory Value</h3>
                <p className="overview-value">{formatCurrency(reportData.totalValue)}</p>
              </div>
            </div>
            <div className="overview-card warning">
              <div className="overview-icon">⚠️</div>
              <div className="overview-info">
                <h3>Low Stock Items</h3>
                <p className="overview-value">{reportData.lowStockItems.length}</p>
              </div>
            </div>
            <div className="overview-card danger">
              <div className="overview-icon">❌</div>
              <div className="overview-info">
                <h3>Out of Stock</h3>
                <p className="overview-value">{reportData.outOfStockItems.length}</p>
              </div>
            </div>
          </div>

          {/* Inventory Details Table */}
          <div className="report-section">
            <h3 className="section-title">
              Inventory Details ({filteredProducts.length} items)
            </h3>
            <div className="inventory-table-container">
              {filteredProducts.length > 0 ? (
                <>
                  <table className="inventory-details-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Stock Qty</th>
                        <th>Min Stock</th>
                        <th>Unit Price</th>
                        <th>Stock Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((product, index) => (
                        <tr key={product._id || index}>
                          <td className="product-name">{product.product_name}</td>
                          <td className="category">{product.category_name || 'Uncategorized'}</td>
                          <td className="stock-quantity">{product.stock_quantity}</td>
                          <td className="min-stock">{product.minimum_stock || 5}</td>
                          <td className="unit-price">{formatCurrency(product.unit_price)}</td>
                          <td className="stock-value">
                            {formatCurrency(product.stock_quantity * product.unit_price)}
                          </td>
                          <td>
                            <span className={`status-badge ${getStockStatus(product).toLowerCase().replace(' ', '-')}`}>
                              {getStockStatus(product)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination Controls */}
                  <div className="pagination-controls">
                    <div className="pagination-info">
                      Items per page: 
                      <select 
                        value={itemsPerPage} 
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="items-per-page"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                      <span className="pagination-text">
                        {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length}
                      </span>
                    </div>
                    
                    <div className="pagination-buttons">
                      <button 
                        onClick={prevPage} 
                        disabled={currentPage === 1}
                        className="pagination-btn"
                      >
                        Previous
                      </button>
                      <span className="page-info">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button 
                        onClick={nextPage} 
                        disabled={currentPage === totalPages}
                        className="pagination-btn"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-data-message">
                  <p>No products found matching the current filter</p>
                </div>
              )}
            </div>
          </div>

          {/* Report Footer - SAME AS SALES REPORT */}
          <div className="report-footer">
            <p>Report generated on: {new Date().toLocaleDateString()}</p>
            <p>Total inventory value: <strong>{formatCurrency(reportData.totalValue)}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryReport;