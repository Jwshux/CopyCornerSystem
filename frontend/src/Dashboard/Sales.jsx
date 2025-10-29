import React, { useState, useEffect } from "react";
import "./Sales.css";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import Lottie from "lottie-react";
import loadingAnimation from "../animations/loading.json";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const API_BASE = "http://localhost:5000/api";

function Sales() {
  const [salesData, setSalesData] = useState(null);
  const [serviceTypeData, setServiceTypeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sales analytics data
  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [analyticsResponse, serviceTypeResponse] = await Promise.all([
        fetch(`${API_BASE}/sales/analytics`),
        fetch(`${API_BASE}/sales/by-service-type`)
      ]);

      if (!analyticsResponse.ok || !serviceTypeResponse.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const analyticsData = await analyticsResponse.json();
      const serviceTypeData = await serviceTypeResponse.json();

      setSalesData(analyticsData);
      setServiceTypeData(serviceTypeData);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  // Format currency
  const formatPeso = (amount) => {
    return `₱${parseFloat(amount || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Bar Chart Data
  const dailySalesChartData = {
    labels: salesData?.daily_sales?.labels || [],
    datasets: [
      {
        label: "₱ Sales",
        data: salesData?.daily_sales?.data || [],
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      },
    ],
  };

  // Pie Chart Data
  const serviceTypeChartData = {
    labels: serviceTypeData?.labels || [],
    datasets: [
      {
        data: serviceTypeData?.data || [],
        backgroundColor: ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"],
      },
    ],
  };

  if (loading) {
    return (
      <div className="sales-container">
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          height: "400px" 
        }}>
          <Lottie 
            animationData={loadingAnimation} 
            loop={true} 
            style={{ width: 200, height: 200 }} 
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-container">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchSalesData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-container">
      {/* Summary Cards */}
      <div className="sales-summary">
        <div className="summary-card">
          <h2>{formatPeso(salesData?.summary?.today_sales)}</h2>
          <p>Today's Sales</p>
        </div>
        <div className="summary-card">
          <h2>{formatPeso(salesData?.summary?.weekly_sales)}</h2>
          <p>Weekly Sales</p>
        </div>
        <div className="summary-card">
          <h2>{formatPeso(salesData?.summary?.daily_average)}</h2>
          <p>Daily Average</p>
        </div>
        <div className="summary-card">
          <h2>{salesData?.summary?.top_service || "No data"}</h2>
          <p>Top Service</p>
        </div>
      </div>

      {/* Charts */}
      <div className="sales-visuals">
        <div className="daily-sales">
          <h3>Daily Sales (Last 7 Days)</h3>
          {salesData?.daily_sales?.data?.some(amount => amount > 0) ? (
            <Bar
              data={dailySalesChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `Sales: ${formatPeso(context.parsed.y)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return `₱${value}`;
                      }
                    }
                  }
                }
              }}
            />
          ) : (
            <div className="no-data">
              <p>No sales data available for the last 7 days</p>
            </div>
          )}
        </div>

        <div className="sales-category">
          <h3>Sales by Service Type</h3>
          <div className="pie-wrapper">
            {serviceTypeData?.data?.some(amount => amount > 0) ? (
              <Pie
                data={serviceTypeChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                      labels: { color: "#1f2937" },
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const value = context.parsed;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const percentage = ((value / total) * 100).toFixed(1);
                          return `${context.label}: ${formatPeso(value)} (${percentage}%)`;
                        }
                      }
                    },
                    datalabels: {
                      color: "#1a1a1a",
                      font: { weight: "bold", size: 13 },
                      formatter: (value, context) => {
                        const dataset = context.chart.data.datasets[0];
                        const total = dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${percentage}%`;
                      },
                    },
                  },
                }}
                plugins={[ChartDataLabels]}
              />
            ) : (
              <div className="no-data">
                <p>No service type data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Revenue Summary Table */}
      <div className="sales-table">
        <h3>Service Revenue Summary</h3>
        {salesData?.service_summary?.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Transactions</th>
                <th>Total Sales (₱)</th>
              </tr>
            </thead>
            <tbody>
              {salesData.service_summary.map((item, index) => (
                <tr key={index}>
                  <td>{item.service}</td>
                  <td>{item.transactions}</td>
                  <td>{formatPeso(item.total_sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">
            <p>No service revenue data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sales;