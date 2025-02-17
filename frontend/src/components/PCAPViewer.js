import { useState, useEffect } from "react";
import apiService from "../services/apiService";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Pagination,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

// Define Wireshark-style coloring rules
const getRowColor = (protocol) => {
  const colors = {
    TCP: "#B4FFB4", // Light Green
    UDP: "#B4D8FF", // Light Blue
    ICMP: "#FFF4B4", // Light Yellow
    ARP: "#FFD1A4", // Light Orange
    DNS: "#E4B4FF", // Light Purple
    Default: "#EAEAEA", // Light Gray
  };
  return colors[protocol] || colors["Default"];
};

const PCAPViewer = () => {
  const [packets, setPackets] = useState([]); // Packet data
  const [filteredPackets, setFilteredPackets] = useState([]); // Filtered packets
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [selectedStream, setSelectedStream] = useState("");
  const [selectedStreamPackets, setSelectedStreamPackets] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const limit = 10; // Number of packets per page

  // Fetch packets when component mounts or page changes
  useEffect(() => {
    const fetchPackets = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiService.getPackets(page, limit);
        if (response.packets) {
          setPackets(response.packets);
          setFilteredPackets(response.packets);
          setTotalPages(response.totalPages || 1);
        } else {
          setPackets([]);
          setFilteredPackets([]);
        }
      } catch (error) {
        console.error("Failed to fetch packets:", error);
        setError("Failed to load packets. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchPackets();
  }, [page, limit]);

  // Fetch stream packets for follow stream feature
  const fetchFollowStreamPackets = async (streamKey) => {
    try {
      const response = await apiService.getStreamPackets(streamKey, 1, 50);
      setSelectedStreamPackets(response.packets || []);
      setDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch follow stream packets:", error);
    }
  };

  // Function to handle filtering packets
  const handleFilterChange = (e) => {
    const searchText = e.target.value.toLowerCase();
    setFilter(searchText);
    if (!searchText) {
      setFilteredPackets(packets);
    } else {
      const filtered = packets.filter((packet) =>
        Object.values(packet).some((value) =>
          String(value).toLowerCase().includes(searchText)
        )
      );
      setFilteredPackets(filtered);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col">
      {/* Filter and Pagination */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <input
          type="text"
          placeholder="Filter packets..."
          className="p-2 w-2/3 border rounded"
          value={filter}
          onChange={handleFilterChange}
          style={{ width: "700px", height: "30px" }}
        />
        <Pagination
          count={totalPages}
          page={page}
          onChange={(event, value) => setPage(value)}
          color="primary"
        />
      </Box>

      {/* Loading & Error Handling */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center">{error}</Typography>
      ) : (
        <>
          {/* Packet Table */}
          <TableContainer component={Paper} className="shadow-md overflow-auto" style={{ height: "500px" }}>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-800 text-white">
                  <TableCell>No.</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Protocol</TableCell>
                  <TableCell>Length</TableCell>
                  <TableCell>Info</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPackets.length > 0 ? (
                  filteredPackets.map((packet, index) => (
                    <TableRow
                      key={index}
                      style={{
                        backgroundColor: getRowColor(packet.protocol),
                        cursor: "pointer",
                      }}
                    >
                      <TableCell>{index + 1 + (page - 1) * limit}</TableCell>
                      <TableCell>{packet.timestamp}</TableCell>
                      <TableCell>{packet.src_ip}:{packet.src_port}</TableCell>
                      <TableCell>{packet.dst_ip}:{packet.dst_port}</TableCell>
                      <TableCell>{packet.protocol}</TableCell>
                      <TableCell>{packet.length}</TableCell>
                      <TableCell>{packet.info || "N/A"}</TableCell>
          
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => fetchFollowStreamPackets(`${packet.src_ip}:${packet.src_port} -> ${packet.dst_ip}:${packet.dst_port}`)}
                        >
                          Follow Stream
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No packets available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Follow Stream Dialog */}
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
            <DialogTitle>Follow Stream: {selectedStream}</DialogTitle>
            <DialogContent>
              {selectedStreamPackets.length > 0 ? (
                <TableContainer component={Paper} className="shadow-md overflow-auto" style={{ maxHeight: "400px" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>No.</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell>Destination</TableCell>
                        <TableCell>Payload</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedStreamPackets.map((packet, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{packet.timestamp}</TableCell>
                          <TableCell>{packet.src_ip}:{packet.src_port}</TableCell>
                          <TableCell>{packet.dst_ip}:{packet.dst_port}</TableCell>
                          <TableCell>{packet.payload_ascii || "No Data"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No packets in this stream.</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)} color="primary">Close</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default PCAPViewer;
