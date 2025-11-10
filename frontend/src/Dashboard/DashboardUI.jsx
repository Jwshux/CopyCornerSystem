import React, { useState, useEffect } from "react";
import "./DashboardUI.css";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

function DashboardUI() {
    const [dashboardData, setDashboardData] = useState({
        products: [],
        staff: [],
        transactions: [],
        lowStockItems: [],
        salesByService: { labels: [], data: [] },
        overallSales: 0
    });
    const [loading, setLoading] = useState(true);

    // API Base URL
    const API_BASE = "https://copycornersystem-backend.onrender.com";

    // Fetch all dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                console.log("Fetching dashboard data from API...");

                // Fetch all data in parallel
                const [
                    productsResponse,
                    staffResponse,
                    transactionsResponse,
                    salesByServiceResponse,
                    salesAnalyticsResponse
                ] = await Promise.all([
                    fetch(`${API_BASE}/products?page=1&per_page=1000`).then(res => res.json()),
                    fetch(`${API_BASE}/staffs?page=1&per_page=1000`).then(res => res.json()),
                    fetch(`${API_BASE}/transactions?page=1&per_page=1000`).then(res => res.json()),
                    fetch(`${API_BASE}/sales/by-service-type`).then(res => res.json()),
                    fetch(`${API_BASE}/sales/analytics`).then(res => res.json())
                ]);

                console.log("API Responses:", {
                    products: productsResponse,
                    staff: staffResponse,
                    transactions: transactionsResponse,
                    salesByService: salesByServiceResponse,
                    salesAnalytics: salesAnalyticsResponse
                });

                // Extract data from responses
                const products = productsResponse.products || [];
                const staff = staffResponse.staffs || [];
                const transactions = transactionsResponse.transactions || [];
                const salesByService = salesByServiceResponse || { labels: [], data: [] };
                const overallSales = salesAnalyticsResponse.summary?.weekly_sales || 0;

                // Calculate low stock items (stock <= minimum_stock or stock <= 10)
                const lowStockItems = products.filter(product => {
                    const stock = parseInt(product.stock_quantity);
                    const minStock = parseInt(product.minimum_stock) || 10;
                    return stock <= minStock;
                });

                setDashboardData({
                    products,
                    staff,
                    transactions,
                    lowStockItems,
                    salesByService,
                    overallSales
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        
        // Refresh data every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Calculate summary statistics
    const totalProducts = dashboardData.products.length;
    const totalStaff = dashboardData.staff.length;
    const totalTransactions = dashboardData.transactions.length;
    const overallSales = dashboardData.overallSales;

    // Summary Cards with real data
    const summary = [
        { title: "Total Products", value: `${totalProducts} Products` },
        { title: "Total Staffs", value: `${totalStaff} Staffs` },
        { title: "Total Transactions", value: `${totalTransactions} Transactions` },
        { title: "Overall Sales", value: `₱${overallSales.toLocaleString()}` },
    ];

    // Overall Sales Pie Chart with real data
    const overallSalesData = {
        labels: dashboardData.salesByService.labels,
        datasets: [
            {
                data: dashboardData.salesByService.data,
                backgroundColor: [
                    "#1d4ed8",
                    "#3b82f6",
                    "#60a5fa",
                    "#93c5fd",
                    "#bfdbfe",
                    "#dbeafe",
                    "#eff6ff",
                ],
                borderColor: "#ffffff",
                borderWidth: 2,
            },
        ],
    };

    // Get recent completed transactions only (most recent 5)
    const recentTransactions = dashboardData.transactions
        .filter(transaction => transaction.status === 'Completed')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    if (loading) {
        return (
            <div className="dashboard-ui">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">Loading dashboard data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-ui">
            {/* Summary Cards */}
            <div className="dashboard-summary">
                {summary.map((item, index) => (
                    <div key={index} className="summary-card">
                        <h2>{item.value}</h2>
                        <p>{item.title}</p>
                    </div>
                ))}
            </div>

            {/* Overall Sales Chart + Recent Transactions */}
            <div className="dashboard-charts">
                <div className="chart-box">
                    <h3>Overall Sales by Service / Product</h3>
                    <div className="pie-wrapper">
                        {dashboardData.salesByService.data.length > 0 ? (
                            <Pie
                                data={overallSalesData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: "right",
                                            labels: {
                                                color: "#1f2937",
                                                font: { size: 13 },
                                            },
                                        },
                                        datalabels: {
                                            color: "#000",
                                            font: { weight: "bold", size: 12 },
                                            formatter: (value, context) => {
                                                const dataset = context.chart.data.datasets[0];
                                                const total = dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                                return `${percentage}%`;
                                            },
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) =>
                                                    `${context.label}: ₱${context.parsed.toLocaleString()}`,
                                            },
                                        },
                                    },
                                }}
                                plugins={[ChartDataLabels]}
                            />
                        ) : (
                            <div className="no-data-message">
                                No sales data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Transactions - Only Completed */}
                <div className="table-box">
                    <h3>Recent Transactions</h3>
                    {recentTransactions.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Service</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map((tx, i) => (
                                    <tr key={i}>
                                        <td>{tx.customer_name}</td>
                                        <td>{tx.service_type}</td>
                                        <td>₱{parseFloat(tx.total_amount).toLocaleString()}</td>
                                        <td>
                                            {new Date(tx.date).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </td>
                                        <td>
                                            <span className="status-tag in-stock">
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="no-data-message">
                            No completed transactions found
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock Items Only */}
            <div className="dashboard-tables">
                <div className="table-box">
                    <h3>Low Stock Items</h3>
                    {dashboardData.lowStockItems.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboardData.lowStockItems.map((product, i) => (
                                    <tr key={i}>
                                        <td>{product.product_name}</td>
                                        <td>{product.stock_quantity}</td>
                                        <td>
                                            <span
                                                className={`status-tag ${
                                                    parseInt(product.stock_quantity) === 0
                                                        ? "out-stock"
                                                        : "low-stock"
                                                }`}
                                            >
                                                {parseInt(product.stock_quantity) === 0 ? "Out of Stock" : "Low Stock"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="no-data-message">
                            All items are well stocked
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DashboardUI;