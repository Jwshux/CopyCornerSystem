import React, { useState, useEffect } from "react";
import "./SalesReport.css";

const API_BASE =
  process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:5000"
    : "https://copycornersystem-backend.onrender.com";
    
function SalesReport() {
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    transactionCount: 0,
    serviceTypeBreakdown: [],
    dailySales: [],
    dateRange: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5; // Fixed to 5 only

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/reports/sales?start_date=${dateRange.startDate}&end_date=${dateRange.endDate}`
      );
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        setCurrentPage(1); // Reset to first page when new data loads
      } else {
        console.error('Failed to fetch sales report');
      }
    } catch (error) {
      console.error('Error fetching sales report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, []);

  // Pagination calculations
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = reportData.serviceTypeBreakdown.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reportData.serviceTypeBreakdown.length / ITEMS_PER_PAGE);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateReport = () => {
    fetchSalesReport();
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toFixed(2)}`;
  };

  const exportToPDF = () => {
    // Clone content container
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = document.getElementById("sales-report-content").innerHTML;

    // Replace paginated tbody
    const currentTable = tempDiv.querySelector(".breakdown-table tbody");
    if (currentTable) {
      currentTable.innerHTML = "";

      reportData.serviceTypeBreakdown.forEach((service, index) => {
        currentTable.innerHTML += `
          <tr key="${index}">
            <td class="service-name">${service.service_name}</td>
            <td class="transaction-count">${service.transaction_count}</td>
            <td class="revenue-amount">${formatCurrency(service.revenue)}</td>
            <td class="percentage">
              ${reportData.totalRevenue > 0
                ? `${((service.revenue / reportData.totalRevenue) * 100).toFixed(1)}%`
                : "0%"
              }
            </td>
          </tr>
        `;
      });
    }

    // Remove pagination
    const pagination = tempDiv.querySelector(".pagination-controls");
    if (pagination) pagination.remove();

    // html2pdf config
    const opt = {
      margin: 10,
      filename: `sales-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // Generate PDF
    import("html2pdf.js").then(html2pdf => {
      html2pdf.default().from(tempDiv).set(opt).save();
    });
  };

  const exportToCSV = () => {
    const headers = ['Service Type', 'Transactions', 'Revenue'];
    const csvData = [
      headers,
      ...reportData.serviceTypeBreakdown.map(item => [
        item.service_name,
        item.transaction_count,
        item.revenue
      ]),
      ['TOTAL', reportData.transactionCount, reportData.totalRevenue]
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="sales-report-container">
      <div className="report-controls-section">
        <div className="date-controls">
          <div className="date-input-group">
            <label>Start Date:</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>End Date:</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="date-input"
            />
          </div>
          <button className="generate-report-btn" onClick={handleGenerateReport}>
            Generate Report
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
          <p>Generating sales report...</p>
        </div>
      ) : (
        <div id="sales-report-content" className="sales-report-content">
          {/* Summary Statistics */}
          <div className="summary-stats-grid">
            <div className="stat-card">
              <div className="stat-icon revenue">💰</div>
              <div className="stat-info">
                <h3>Total Revenue</h3>
                <p className="stat-value">{formatCurrency(reportData.totalRevenue)}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon transactions">🧾</div>
              <div className="stat-info">
                <h3>Total Transactions</h3>
                <p className="stat-value">{reportData.transactionCount}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon average">📊</div>
              <div className="stat-info">
                <h3>Average per Transaction</h3>
                <p className="stat-value">
                  {reportData.transactionCount > 0 
                    ? formatCurrency(reportData.totalRevenue / reportData.transactionCount)
                    : formatCurrency(0)
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Service Type Breakdown */}
          <div className="report-section">
            <h3 className="section-title">Sales by Service Type</h3>
            <div className="service-breakdown-table">
              {reportData.serviceTypeBreakdown.length > 0 ? (
                <table className="breakdown-table">
                  <thead>
                    <tr>
                      <th>Service Type</th>
                      <th>Transactions</th>
                      <th>Revenue</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((service, index) => (
                      <tr key={index}>
                        <td className="service-name">{service.service_name}</td>
                        <td className="transaction-count">{service.transaction_count}</td>
                        <td className="revenue-amount">{formatCurrency(service.revenue)}</td>
                        <td className="percentage">
                          {reportData.totalRevenue > 0 
                            ? `${((service.revenue / reportData.totalRevenue) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data-message">
                  <p>No service type data available for the selected period</p>
                </div>
              )}
            </div>
            
            {/* Pagination Controls - MOVED OUTSIDE the table container */}
            {reportData.serviceTypeBreakdown.length > 0 && (
              <div className="pagination-controls">
                <div className="pagination-info">
                  <span className="pagination-text">
                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, reportData.serviceTypeBreakdown.length)} of {reportData.serviceTypeBreakdown.length} items
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
            )}
          </div>

          {/* Report Footer */}
          <div className="report-footer">
            <p>Report Period: {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}</p>
            <p>Generated on: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesReport;