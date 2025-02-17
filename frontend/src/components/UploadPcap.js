import React, { useState } from "react";
import apiService from "../services/apiService";
import { Button, CircularProgress, Typography, Box } from "@mui/material";

const UploadPcap = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage(""); // Clear previous messages
  };

  // Handle upload when button is clicked
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a PCAP file.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const response = await apiService.uploadPcap(file);
      setMessage("File uploaded successfully!");
      console.log("Server Response:", response);
      onUploadSuccess(); // Refresh packet list
    } catch (error) {
      setMessage("Failed to upload file.");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box className="p-4 border rounded bg-white shadow-md" textAlign="center">
      <input
        type="file"
        accept=".pcap"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="pcap-upload"
      />
      <label htmlFor="pcap-upload">
        <Button variant="contained" component="span" color="primary">
          Choose File
        </Button>
      </label>

      <Button
        variant="contained"
        color="secondary"
        onClick={handleUpload}
        disabled={uploading || !file}
        style={{ marginLeft: "10px" }}
      >
        {uploading ? <CircularProgress size={20} /> : "Upload"}
      </Button>

      {file && <Typography variant="body2" style={{ marginTop: "8px" }}>Selected: {file.name}</Typography>}
      {message && <Typography color={message.includes("successfully") ? "green" : "error"}>{message}</Typography>}
    </Box>
  );
};

export default UploadPcap;
