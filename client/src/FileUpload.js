import React, { useState } from "react";
import axios from "axios";

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadProgress(0);
    setUploadStatus("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("❌ No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploadStatus("Uploading...");

    try {
      const response = await axios.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setUploadStatus(`✅ ${response.data.message}`);
      setUploadProgress(100);
    } catch (error) {
      console.error("❌ File upload failed:", error);
      setUploadStatus("❌ Upload failed. Check server logs.");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
      <input
        type="file"
        onChange={handleFileChange}
        className="border border-gray-300 rounded-md px-2 py-1"
      />
      <button
        onClick={handleUpload}
        disabled={!selectedFile}
        className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400"
      >
        Upload
      </button>
      {uploadProgress > 0 && (
        <p className="text-sm text-gray-700">Uploading: {uploadProgress}%</p>
      )}
      {uploadStatus && (
        <p
          className={`text-sm ${
            uploadStatus.startsWith("❌") ? "text-red-600" : "text-green-600"
          }`}
        >
          {uploadStatus}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
