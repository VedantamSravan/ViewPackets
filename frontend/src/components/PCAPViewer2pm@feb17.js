import { useState, useEffect } from "react";
import apiService from '../services/apiService';
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
  List,
  ListItem,
  Divider,
  Grid,
  Pagination,
  CircularProgress,
  Button,
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
  const [selectedStreamPackets, setSelectedStreamPackets] = useState([]); // Packets for Follow Stream Dialog

  const [selectedStream, setSelectedStream] = useState(""); // Selected stream
  const [packets, setPackets] = useState([]); // ✅ Default empty array
  const [filteredPackets, setFilteredPackets] = useState([]); // ✅ Default empty array
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true); // ✅ Loading state
  const [error, setError] = useState(null); // ✅ Error state
  const limit = 10; // Number of packets per page

  useEffect(() => {
    const fetchPackets = async () => {
      setLoading(true); // Start loading
      setError(null);
      try {
        const data = await apiService.getPackets(page, limit);
        setPackets(data || []); // ✅ Ensure an array is always set
        setFilteredPackets(data || []); // ✅ Ensure an array is always set
      } catch (error) {
        console.error('Failed to fetch packets:', error);
        setError('Failed to load packets. Please try again.');
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchPackets();
  }, [page, limit]);

  const fetchFollowStreamPackets = async (streamKey) => {
    try {
      const response = await apiService.getStreamPackets(streamKey, 1, 50); // Fetch all packets for this stream
      setSelectedStreamPackets(response.packets || []);
      setDialogOpen(true); // Open Dialog
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <input
          type="text"
          placeholder="Filter packets..."
          className="p-2 w-2/3 border rounded"
          value={filter}
          onChange={handleFilterChange}
          style={{ width: "700px", height: "30px" }}
        />
        <Pagination
          count={5} // Adjust based on total pages
          page={page}
          onChange={(event, value) => setPage(value)}
          color="primary"
        />
      </div>

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
          <TableContainer component={Paper} className="shadow-md overflow-auto" style={{ height: "300px" }}>
            <Table>
              <TableHead>
                <TableRow className="bg-gray-800 text-white">
                  <TableCell>No.</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Protocol</TableCell>
                  <TableCell>Length</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => fetchFollowStreamPackets(selectedStream)}
                    >
                      Follow Stream
                    </Button>
                  </TableCell>                </TableRow>
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
                      <TableCell>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedPacket(packet);
                            setSelectedField(null);
                          }}
                          className="text-blue-500 underline hover:text-blue-700"
                        >
                          {index + 1 + (page - 1) * limit}
                        </a>
                      </TableCell>
                      <TableCell>{packet.timestamp}</TableCell>
                      <TableCell>{packet.src_ip}</TableCell>
                      <TableCell>{packet.dst_ip}</TableCell>
                      <TableCell>{packet.protocol}</TableCell>
                      <TableCell>{packet.length}</TableCell>
                      <TableCell>{packet.info || "N/A"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No packets available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider className="my-2" />

          {/* Packet Details & Packet Bytes */}
          <Grid container spacing={2} style={{ height: "calc(100vh - 400px)" }}>
            {selectedPacket && (
              <>
                <Grid item xs={6}>
                  <Box className="p-4 border rounded bg-white shadow-md h-full overflow-auto">
                    <Typography variant="h6" className="font-bold">Packet Details</Typography>
                    <List>
                      <ListItem>Frame: {selectedPacket.length} bytes</ListItem>
                      <ListItem>Ethernet: Src → {selectedPacket.src_ip}, Dst → {selectedPacket.dst_ip}</ListItem>
                      <ListItem>Protocol: {selectedPacket.protocol}</ListItem>
                    </List>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box className="p-4 border rounded bg-white shadow-md h-full overflow-auto">
                    <Typography variant="h6" className="font-bold">Packet Bytes</Typography>
                    {selectedPacket.packet_dump ? (
                      <pre className="overflow-auto p-2 bg-gray-100 border">
                        {selectedPacket.packet_dump}
                      </pre>
                    ) : (
                      <Typography className="text-center text-gray-500 mt-4">
                        No Data Found
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </>
            )}
          </Grid>

          {/* Status Bar */}
          <Box className="p-2 bg-gray-800 text-white text-center rounded mt-2">
            <Typography variant="body1">
              Packets: {filteredPackets.length} | Page: {page} | Selected: {selectedPacket ? `Packet ${selectedPacket.index}` : "None"}
            </Typography>
          </Box>
        </>
      )}
    </div>
  );
};

export default PCAPViewer;
