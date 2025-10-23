// import React from "react";
// import "./DashboardUI.css";
// import { Bar, Pie } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   ArcElement,
//   Tooltip,
//   Legend,
// } from "chart.js";
// import ChartDataLabels from "chartjs-plugin-datalabels";

// ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, ChartDataLabels);

// function DashboardUI() {
//   // Summary Cards
//   const summary = [
//     { title: "Total Products", value: "5 Products" },
//     { title: "Total Staffs", value: "6 Staffs" },
//     { title: "Total Transactions", value: "152 Transactions" },
//     { title: "Overall Sales", value: "₱145,000" },
//   ];

//   // Daily Sales (Bar Chart)
//   const dailySalesData = {
//     labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
//     datasets: [
//       {
//         label: "₱ Sales",
//         data: [2150, 2000, 1450, 900, 1050, 800],
//         backgroundColor: "#3b82f6",
//         borderRadius: 6,
//       },
//     ],
//   };

//   // Pie Chart (Sales by Service)
//   const serviceSalesData = {
//     labels: ["Printing", "Photocopying", "T-shirt Printing", "Thesis Binding", "Supplies"],
//     datasets: [
//       {
//         data: [18000, 9000, 4500, 3500, 2000],
//         backgroundColor: ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
//       },
//     ],
//   };

//   // Low Stock Table
//   const lowStockItems = [
//     { item: "A4 Bond Paper", stock: 8, status: "⚠️ Low" },
//     { item: "Black Ink", stock: 1, status: "🔴 Out of Stock" },
//     { item: "Blue Pen", stock: 12, status: "✅ In Stock" },
//   ];

//   // Recent Transactions
//   const recentTransactions = [
//     { customer: "John D.", service: "Printing (A4)", amount: "₱90", date: "Oct 23", status: "✅ Completed" },
//     { customer: "Maria S.", service: "Photocopying", amount: "₱25", date: "Oct 23", status: "✅ Completed" },
//     { customer: "Ana R.", service: "Thesis Binding", amount: "₱400", date: "Oct 22", status: "⏳ Pending" },
//   ];

//   // Notifications
//   const notifications = [
//     "⚠️ Black Ink is running low (2 remaining)",
//     "📦 3 pending transactions need approval",
//     "📊 Weekly Sales Report ready to export",
//   ];

//   return (
//     <div className="dashboard-ui">
//       {/* Summary Cards */}
//       <div className="dashboard-summary">
//         {summary.map((item, index) => (
//           <div key={index} className="summary-card">
//             <h2>{item.value}</h2>
//             <p>{item.title}</p>
//           </div>
//         ))}
//       </div>

//       {/* Charts Section */}
//       <div className="dashboard-charts">
//         <div className="chart-box">
//           <h3>Daily / Weekly Sales</h3>
//           <Bar
//             data={dailySalesData}
//             options={{
//               responsive: true,
//               plugins: { legend: { display: false } },
//             }}
//           />
//         </div>
//         <div className="chart-box">
//           <h3>Sales by Service</h3>
//           <div className="pie-wrapper">
//             <Pie
//               data={serviceSalesData}
//               options={{
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: {
//                   legend: { position: "right", labels: { color: "#1f2937" } },
//                   datalabels: {
//                     color: "#1a1a1a",
//                     font: { weight: "bold", size: 13 },
//                     formatter: (value, context) => {
//                       const dataset = context.chart.data.datasets[0];
//                       const total = dataset.data.reduce((a, b) => a + b, 0);
//                       const percent = ((value / total) * 100).toFixed(1);
//                       return `${percent}%`;
//                     },
//                   },
//                 },
//               }}
//               plugins={[ChartDataLabels]}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Low Stock & Transactions */}
//       <div className="dashboard-tables">
//         <div className="table-box">
//           <h3>Low Stock Items</h3>
//           <table>
//             <thead>
//               <tr>
//                 <th>Item</th>
//                 <th>Stock</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {lowStockItems.map((item, i) => (
//                 <tr key={i}>
//                   <td>{item.item}</td>
//                   <td>{item.stock}</td>
//                   <td>{item.status}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         <div className="table-box">
//           <h3>Recent Transactions</h3>
//           <table>
//             <thead>
//               <tr>
//                 <th>Customer</th>
//                 <th>Service</th>
//                 <th>Amount</th>
//                 <th>Date</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recentTransactions.map((tx, i) => (
//                 <tr key={i}>
//                   <td>{tx.customer}</td>
//                   <td>{tx.service}</td>
//                   <td>{tx.amount}</td>
//                   <td>{tx.date}</td>
//                   <td>{tx.status}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Notifications */}
//       <div className="dashboard-notifications">
//         <h3>Notifications / Reminders</h3>
//         <ul>
//           {notifications.map((n, i) => (
//             <li key={i}>{n}</li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// }

// export default DashboardUI;
// import React from "react";
// import "./DashboardUI.css";
// import { Pie } from "react-chartjs-2";
// import {
//     Chart as ChartJS,
//     ArcElement,
//     Tooltip,
//     Legend,
// } from "chart.js";
// import ChartDataLabels from "chartjs-plugin-datalabels";

// ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// function DashboardUI() {
//     // Summary Cards
//     const summary = [
//         { title: "Total Products", value: "5 Products" },
//         { title: "Total Staffs", value: "6 Staffs" },
//         { title: "Total Transactions", value: "152 Transactions" },
//         { title: "Overall Sales", value: "₱145,000" },
//     ];

//     // Overall Sales Pie Chart (by Service/Product)
//     const overallSalesData = {
//         labels: [
//             "Printing",
//             "Photocopying",
//             "T-shirt Printing",
//             "Thesis Binding",
//             "Supplies",
//         ],
//         datasets: [
//             {
//                 data: [80000, 25000, 20000, 15000, 5000],
//                 backgroundColor: [
//                     "#1d4ed8", // dark blue
//                     "#3b82f6", // blue
//                     "#60a5fa", // light blue
//                     "#93c5fd", // softer blue
//                     "#bfdbfe", // very light blue
//                 ],
//                 borderColor: "#ffffff",
//                 borderWidth: 2,
//             },
//         ],
//     };

//     // Low Stock Table
//     const lowStockItems = [
//         { item: "A4 Bond Paper", stock: 8, status: "⚠️ Low" },
//         { item: "Black Ink", stock: 1, status: "🔴 Out of Stock" },
//         { item: "Blue Pen", stock: 12, status: "✅ In Stock" },
//     ];

//     // Recent Transactions
//     const recentTransactions = [
//         {
//             customer: "John D.",
//             service: "Printing (A4)",
//             amount: "₱90",
//             date: "Oct 23",
//             status: "✅ Completed",
//         },
//         {
//             customer: "Maria S.",
//             service: "Photocopying",
//             amount: "₱25",
//             date: "Oct 23",
//             status: "✅ Completed",
//         },
//         {
//             customer: "Ana R.",
//             service: "Thesis Binding",
//             amount: "₱400",
//             date: "Oct 22",
//             status: "⏳ Pending",
//         },
//     ];

//     // Notifications
//     const notifications = [
//         "⚠️ Black Ink is running low (2 remaining)",
//         "📦 3 pending transactions need approval",
//         "📊 Overall Sales Report ready to export",
//     ];

//     return (
//         <div className="dashboard-ui">
//             {/* Summary Cards */}
//             <div className="dashboard-summary">
//                 {summary.map((item, index) => (
//                     <div key={index} className="summary-card">
//                         <h2>{item.value}</h2>
//                         <p>{item.title}</p>
//                     </div>
//                 ))}
//             </div>

//             {/* Overall Sales Chart */}
//             <div className="dashboard-charts">
//                 <div className="chart-box">
//                     <h3>Overall Sales by Service / Product</h3>
//                     <div className="pie-wrapper">
//                         <Pie
//                             data={overallSalesData}
//                             options={{
//                                 responsive: true,
//                                 maintainAspectRatio: false,
//                                 plugins: {
//                                     legend: {
//                                         position: "right",
//                                         labels: {
//                                             color: "#1f2937",
//                                             font: { size: 13 },
//                                         },
//                                     },
//                                     datalabels: {
//                                         color: "#000",
//                                         font: { weight: "bold", size: 12 },
//                                         formatter: (value, context) => {
//                                             const dataset = context.chart.data.datasets[0];
//                                             const total = dataset.data.reduce((a, b) => a + b, 0);
//                                             const percentage = ((value / total) * 100).toFixed(1);
//                                             return `${percentage}%`;
//                                         },
//                                     },
//                                     tooltip: {
//                                         callbacks: {
//                                             label: (context) =>
//                                                 `${context.label}: ₱${context.parsed.toLocaleString()}`,
//                                         },
//                                     },
//                                 },
//                             }}
//                             plugins={[ChartDataLabels]}
//                         />
//                     </div>
//                 </div>
//                 <div className="table-box">
//                     <h3>Recent Transactions</h3>
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Customer</th>
//                                 <th>Service</th>
//                                 <th>Amount</th>
//                                 <th>Date</th>
//                                 <th>Status</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {recentTransactions.map((tx, i) => (
//                                 <tr key={i}>
//                                     <td>{tx.customer}</td>
//                                     <td>{tx.service}</td>
//                                     <td>{tx.amount}</td>
//                                     <td>{tx.date}</td>
//                                     <td>{tx.status}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//             {/* Low Stock & Transactions */}
//             <div className="dashboard-tables">
//                 <div className="table-box">
//                     <h3>Low Stock Items</h3>
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Item</th>
//                                 <th>Stock</th>
//                                 <th>Status</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {lowStockItems.map((item, i) => (
//                                 <tr key={i}>
//                                     <td>{item.item}</td>
//                                     <td>{item.stock}</td>
//                                     <td>{item.status}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>

//                 </div>
//                 <div className="dashboard-notifications">
//                     <h3>Notifications / Reminders</h3>
//                     <ul>
//                         {notifications.map((n, i) => (
//                             <li key={i}>{n}</li>
//                         ))}
//                     </ul>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default DashboardUI;

import React from "react";
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
    // Summary Cards
    const summary = [
        { title: "Total Products", value: "5 Products" },
        { title: "Total Staffs", value: "6 Staffs" },
        { title: "Total Transactions", value: "152 Transactions" },
        { title: "Overall Sales", value: "₱145,000" },
    ];

    // Overall Sales Pie Chart
    const overallSalesData = {
        labels: [
            "Printing",
            "Photocopying",
            "T-shirt Printing",
            "Thesis Binding",
            "Supplies",
        ],
        datasets: [
            {
                data: [80000, 25000, 20000, 15000, 5000],
                backgroundColor: [
                    "#1d4ed8",
                    "#3b82f6",
                    "#60a5fa",
                    "#93c5fd",
                    "#bfdbfe",
                ],
                borderColor: "#ffffff",
                borderWidth: 2,
            },
        ],
    };

    // Transactions Data
    const transactionsData = [
        {
            queueNumber: "001",
            transactionId: "T-001",
            customerName: "J. Dela Cruz",
            serviceType: "Photocopying",
            pricePerUnit: "20",
            quantity: "1",
            totalAmount: "20.00",
            status: "Pending",
            date: "2025-10-20",
        },
        {
            queueNumber: "002",
            transactionId: "T-002",
            customerName: "M. Santos",
            serviceType: "Printing",
            pricePerUnit: "10",
            quantity: "10",
            totalAmount: "100.00",
            status: "Pending",
            date: "2025-10-21",
        },
        {
            queueNumber: "003",
            transactionId: "T-003",
            customerName: "P. Ramirez",
            serviceType: "Thesis Hardbound",
            pricePerUnit: "400",
            quantity: "1",
            totalAmount: "400.00",
            status: "Completed",
            date: "2025-10-18",
        },
        {
            queueNumber: "004",
            transactionId: "T-004",
            customerName: "A. Fuentes",
            serviceType: "Photocopying",
            pricePerUnit: "1",
            quantity: "50",
            totalAmount: "50.00",
            status: "Completed",
            date: "2025-10-19",
        },
        {
            queueNumber: "005",
            transactionId: "T-005",
            customerName: "C. Garcia",
            serviceType: "Photocopying",
            pricePerUnit: "1",
            quantity: "5",
            totalAmount: "5.00",
            status: "Cancelled",
            date: "2025-10-17",
        },
        {
            queueNumber: "006",
            transactionId: "T-006",
            customerName: "S. Reyes",
            serviceType: "Tshirt Printing",
            pricePerUnit: "200",
            quantity: "5",
            totalAmount: "1000.00",
            status: "Cancelled",
            date: "2025-10-16",
        },
    ];

    // Sort and show only 5 most recent transactions
    const recentTransactions = [...transactionsData]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    // Low Stock Table
    const lowStockItems = [
        { item: "A4 Bond Paper", stock: 8, status: "Low" },
        { item: "Black Ink", stock: 1, status: "Out of Stock" },
        { item: "Blue Pen", stock: 12, status: "In Stock" },
    ];

    // Notifications
    const notifications = [
        "Black Ink is running low (2 remaining)",
        "2 pending transactionsl",
    ];

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
                                            const percentage = ((value / total) * 100).toFixed(1);
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
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="table-box">
                    <h3>Recent Transactions</h3>
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
                                    <td>{tx.customerName}</td>
                                    <td>{tx.serviceType}</td>
                                    <td>₱{parseFloat(tx.totalAmount).toLocaleString()}</td>
                                    <td>
                                        {new Date(tx.date).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </td>
                                    <td>{tx.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Low Stock & Notifications */}
            <div className="dashboard-tables">
                <div className="table-box">
                    <h3>Low Stock Items</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Stock</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStockItems.map((product, i) => (
                                <tr key={i}>
                                    <td>{product.item}</td>
                                    <td>{product.stock}</td>
                                    <td>
                                        <span
                                            className={`status-tag ${product.status.includes("In Stock")
                                                    ? "in-stock"
                                                    : product.status.includes("Low")
                                                        ? "low-stock"
                                                        : "out-stock"
                                                }`}
                                        >
                                            {product.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="dashboard-notifications">
                    <h3>Notifications / Reminders</h3>
                    <ul>
                        {notifications.map((n, i) => (
                            <li key={i}>{n}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default DashboardUI;

