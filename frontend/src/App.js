import React, { useState } from "react";
import UploadPcap from "./components/UploadPcap";
import PCAPViewer from "./components/PCAPViewer";
import { Container, Typography, Divider } from "@mui/material";

const App = () => {
  const [refreshPackets, setRefreshPackets] = useState(false);

  const handleUploadSuccess = () => {
    setRefreshPackets((prev) => !prev); // Toggle state to refresh PCAPViewer
  };

  return (
    <Container maxWidth="lg" style={{ marginTop: "20px" }}>
      <Typography variant="h4" align="center" gutterBottom>
        PCAP Analyzer
      </Typography>

      {/* Upload PCAP Section */}
      <UploadPcap onUploadSuccess={handleUploadSuccess} />

      <Divider style={{ margin: "20px 0" }} />

      {/* Display Packet Viewer */}
      <PCAPViewer refreshTrigger={refreshPackets} />
    </Container>
  );
};

export default App;
