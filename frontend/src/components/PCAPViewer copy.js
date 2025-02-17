import { useState, useEffect } from "react";
import axios from "axios";
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
} from "@mui/material";

const PCAPViewer = () => {
  const [packets, setPackets] = useState([]);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 10; // Number of packets per page

  useEffect(() => {
    axios
      .get(`http://localhost:8080/packets?page=${page}&limit=${limit}`)
      .then((response) => setPackets(response.data))
      .catch((error) => console.error("Error fetching packets:", error));
  }, [page]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col">
      {/* Filter Input (Search Bar) */}
      <input
        type="text"
        placeholder="Filter packets..."
        className="p-2 mb-2 w-full border rounded"
      />

      {/* Pagination (Moved to Top) */}
      <div className="flex justify-center mb-2">
        <Pagination
          count={5} // Adjust based on total pages
          page={page}
          onChange={(event, value) => setPage(value)}
          color="primary"
        />
      </div>

      {/* Packet List (Minimized Height) */}
      <TableContainer
        component={Paper}
        className="shadow-md h-[25vh] overflow-auto"
      >
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
            </TableRow>
          </TableHead>
          <TableBody>
            {packets.map((packet, index) => (
              <TableRow key={index}>
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Divider className="my-2" />

      {/* Packet Details and Packet Bytes Side by Side (More Space) */}
      <Grid container spacing={2} className="h-[65vh]">
        {/* Packet Details Pane */}
        {selectedPacket && (
          <Grid item xs={6}>
            <Box className="p-4 border rounded bg-white shadow-md h-full overflow-auto">
              <Typography variant="h6" className="font-bold">
                Packet Details
              </Typography>
              <List>
                <ListItem
                  onClick={() => setSelectedField(selectedPacket.timestamp)}
                  className="cursor-pointer hover:bg-gray-200 p-1"
                >
                  Frame: {selectedPacket.length} bytes on wire
                </ListItem>
                <ListItem
                  onClick={() => setSelectedField(selectedPacket.src_ip)}
                  className="cursor-pointer hover:bg-gray-200 p-1"
                >
                  Ethernet: Src → {selectedPacket.src_ip}, Dst → {selectedPacket.dst_ip}
                </ListItem>
                <ListItem
                  onClick={() => setSelectedField(selectedPacket.protocol)}
                  className="cursor-pointer hover:bg-gray-200 p-1"
                >
                  Protocol: {selectedPacket.protocol}
                </ListItem>
              </List>
            </Box>
          </Grid>
        )}

        {/* Packet Bytes Pane */}
        {selectedPacket && selectedPacket.packet_dump && (
          <Grid item xs={6}>
            <Box className="p-4 border rounded bg-white shadow-md h-full overflow-auto">
              <Typography variant="h6" className="font-bold">
                Packet Bytes
              </Typography>
              <pre className="overflow-auto p-2 bg-gray-100 border">{selectedPacket.packet_dump}</pre>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Status Bar */}
      <Box className="p-2 bg-gray-800 text-white text-center rounded mt-2">
        <Typography variant="body1">
          Packets: {packets.length} | Page: {page} | Selected:{" "}
          {selectedPacket ? `Packet ${selectedPacket.index}` : "None"}
        </Typography>
      </Box>
    </div>
  );
};

export default PCAPViewer;
