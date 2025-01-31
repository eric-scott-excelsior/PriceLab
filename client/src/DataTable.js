import React, { useState, useEffect } from "react";
import axios from "axios";

const DataTable = ({ tableName }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tableName) return;
    setLoading(true);
    setError("");

    axios
      .get(`/data/${tableName}`)
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching data:", err);
        setError("❌ Failed to fetch data.");
        setLoading(false);
      });
  }, [tableName]);

  if (loading) return <p className="text-gray-700">Loading data...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Data from {tableName}</h2>
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                {Object.keys(data[0]).map((key) => (
                  <th
                    key={key}
                    className="px-3 py-2 border-b border-gray-300 text-left text-gray-700"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {Object.values(row).map((value, idx) => (
                    <td
                      key={idx}
                      className="px-3 py-2 border-b border-gray-200 text-sm text-gray-700"
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-700">No data available.</p>
      )}
    </div>
  );
};

export default DataTable;
