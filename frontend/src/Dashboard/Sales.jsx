// import React from "react";
// import "./Sales.css";
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

// ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// function Sales() {
//   // Daily Sales (Bar Chart)
//   const dailySalesData = {
//     labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
//     datasets: [
//       {
//         label: "₱ Sales",
//         data: [2150, 2000, 1450, 900, 1050, 800, 700],
//         backgroundColor: "#1d4ed8",
//         borderRadius: 6,
//       },
//     ],
//   };

//   // Calculate daily average
//   const totalSales = dailySalesData.datasets[0].data.reduce((a, b) => a + b, 0);
//   const dailyAverage = Math.round(totalSales / dailySalesData.datasets[0].data.length);

//   // Sales by Category (Pie Chart)
//   const categoryData = {
//     labels: ["Printing", "Photocopying", "T-shirt Printing", "Thesis Binding", "Supplies"],
//     datasets: [
//       {
//         data: [18000, 9000, 4500, 3500, 2000],
//         backgroundColor: ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
//       },
//     ],
//   };

//   // Table Data
//   const categoryTable = [
//     { category: "Printing", transactions: "120", total: "₱18,000" },
//     { category: "Photocopying", transactions: "30", total: "₱13,000" },
//     { category: "T-shirt Printing", transactions: "11", total: "₱1000" },
//     { category: "Thesis Binding", transactions: "5", total: "₱1000" },
//   ];

//   return (
//     <div className="sales-container">
//       {/* <div className="sales-header">
//         <h1>Sales Overview</h1>
//         <p>Monitor your daily, weekly, and category sales performance.</p>
//       </div> */}

//       {/* Summary Cards */}
//       <div className="sales-summary">
//         <div className="summary-card">
//           <h2>₱2,150</h2>
//           <p>Today's Sales</p>
//         </div>
//         <div className="summary-card">
//           <h2>₱12,500</h2>
//           <p>Weekly Sales</p>
//         </div>
//         <div className="summary-card">
//           <h2>₱{dailyAverage.toLocaleString()}</h2>
//           <p>Daily Average Sales</p>
//         </div>
//         <div className="summary-card">
//           <h2>Printing</h2>
//           <p>Top Service</p>
//         </div>
//       </div>

//       {/* Charts Section */}
//       <div className="sales-visuals">
//         <div className="daily-sales">
//           <h3>Daily Sales</h3>
//           <Bar
//             data={dailySalesData}
//             options={{ responsive: true, plugins: { legend: { display: false } } }}
//           />
//         </div>

//         <div className="sales-category">
//           <h3>Sales by Category</h3>
//           <Pie
//             data={categoryData}
//             options={{
//               responsive: true,
//               plugins: { legend: { position: "right" } },
//             }}
//           />
//         </div>
//       </div>

//       {/* Table Section */}
//       <div className="sales-table">
//         <h3>Sales by Category</h3>
//         <table>
//           <thead>
//             <tr>
//               <th>Service</th>
//               <th>Transactions</th>
//               <th>Total Sales(₱)</th>
//             </tr>
//           </thead>
//           <tbody>
//             {categoryTable.map((item, index) => (
//               <tr key={index}>
//                 <td>{item.category}</td>
//                 <td>{item.transactions}</td>
//                 <td>{item.total}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default Sales;
import React from "react";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function Sales() {
  // Bar Chart (Daily Sales)
  const dailySalesData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "₱ Sales",
        data: [2150, 2000, 1450, 900, 1050, 800],
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      },
    ],
  };

  // Calculate average
  const totalSales = dailySalesData.datasets[0].data.reduce((a, b) => a + b, 0);
  const dailyAverage = Math.round(totalSales / dailySalesData.datasets[0].data.length);

  // Pie Chart (Sales by Category)
  const categoryData = {
    labels: ["Printing", "Photocopying", "T-shirt Printing", "Thesis Binding", "Supplies"],
    datasets: [
      {
        data: [18000, 9000, 4500, 3500, 2000],
        backgroundColor: ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"],
      },
    ],
  };

  // Table data
  const categoryTable = [
    { category: "Printing", transactions: "120", total: "₱18,000" },
    { category: "Photocopying", transactions: "45", total: "₱9,000" },
    { category: "T-shirt Printing", transactions: "22", total: "₱4,500" },
    { category: "Thesis Binding", transactions: "15", total: "₱3,500" },
    { category: "Supplies", transactions: "10", total: "₱2,000" },
  ];

  return (
    <div className="sales-container">
      {/* Summary Cards */}
      <div className="sales-summary">
        <div className="summary-card">
          <h2>₱2,150</h2>
          <p>Today's Sales</p>
        </div>
        <div className="summary-card">
          <h2>₱12,500</h2>
          <p>Weekly Sales</p>
        </div>
        <div className="summary-card">
          <h2>₱{dailyAverage.toLocaleString()}</h2>
          <p>Daily Average</p>
        </div>
        <div className="summary-card">
          <h2>Printing</h2>
          <p>Top Service</p>
        </div>
      </div>

      {/* Charts */}
      <div className="sales-visuals">
        <div className="daily-sales">
          <h3>Daily Sales</h3>
          <Bar
            data={dailySalesData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
            }}
          />
        </div>

        <div className="sales-category">
          <h3>Sales by Category</h3>
          <div className="pie-wrapper">
            <Pie
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "right",
                    labels: { color: "#1f2937" },
                  },
                  datalabels: {
                    color: "#1a1a1aff",
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
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="sales-table">
        <h3>Service Revenue Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Transactions</th>
              <th>Total Sales (₱)</th>
            </tr>
          </thead>
          <tbody>
            {categoryTable.map((item, index) => (
              <tr key={index}>
                <td>{item.category}</td>
                <td>{item.transactions}</td>
                <td>{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Sales;