import React, { useState, useEffect } from "react";
import FileUpload from "./FileUpload";
import DataTable from "./DataTable";
import axios from "axios";

const App = () => {
  const [tableName, setTableName] = useState("");
  const [status, setStatus] = useState("");
  const [tables, setTables] = useState([]);

  // Fetch available table names on mount
  useEffect(() => {
    axios
      .get("/tables")
      .then((response) => {
        setTables(response.data.tables);
      })
      .catch((error) => {
        console.error("❌ Error fetching tables:", error);
      });
  }, []);

  const handleViewData = (selectedTable) => {
    setTableName(selectedTable);
  };

  const handleClearDatabase = async () => {
    const confirmDelete = window.confirm("⚠️ Are you sure you want to delete ALL tables?");
    if (!confirmDelete) return;

    setStatus("🗑️ Deleting all tables...");
    try {
      const response = await axios.delete("/clear-database");
      setStatus(`✅ ${response.data.message}`);
      setTables([]);
      setTableName("");
    } catch (error) {
      console.error("❌ Error deleting tables:", error);
      setStatus("❌ Failed to delete tables. Check server logs.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav Bar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-600">Excel Data Processor</h1>
            </div>
            {/* Optional nav links */}
            <div className="hidden md:flex space-x-4">
              <button className="text-gray-700 hover:text-blue-600">Home</button>
              <button className="text-gray-700 hover:text-blue-600">About</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* File Upload */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <FileUpload />
          </div>

          {/* Table list & Clear DB */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Available Tables</h2>
            {tables.length > 0 ? (
              <ul className="list-disc list-inside space-y-2">
                {tables.map((table) => (
                  <li key={table}>
                    <button
                      onClick={() => handleViewData(table)}
                      className="text-blue-600 hover:underline"
                    >
                      {table}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-700">No tables available</p>
            )}

            <button
              onClick={handleClearDatabase}
              className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              🚨 Clear All Data
            </button>

            {status && <p className="mt-4 text-gray-800">{status}</p>}
          </div>

          {/* If user selected a table, show data */}
          {tableName && (
            <div className="bg-white shadow rounded-lg p-6">
              <DataTable tableName={tableName} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-sm text-gray-500">
          &copy; {new Date().getFullYear()} My Company. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;
