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
  Pagination,
  Typography,
  Box,
} from "@mui/material";

const PCAPTable = () => {
  const [packets, setPackets] = useState([]);
  const [page, setPage] = useState(1);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const limit = 10;

  useEffect(() => {
    axios
      .get(`http://localhost:8080/packets?page=${page}&limit=${limit}`)
      .then((response) => setPackets(response.data))
      .catch((error) => console.error("Error fetching packets:", error));
  }, [page]);

  return (
    <div className="p-4">
      {/* Packet List */}
      <Typography variant="h5" className="mb-4 font-bold">
        Packet Capture Data
      </Typography>
      <TableContainer component={Paper} className="shadow-md">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>Protocol</TableCell>
              <TableCell>Length</TableCell>
              <TableCell>Info</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packets.map((packet) => (
              <TableRow
                key={packet.index}
                onClick={() => setSelectedPacket(packet)}
                className="cursor-pointer hover:bg-gray-200"
              >
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

      <div className="flex justify-center mt-4">
        <Pagination
          count={5}
          page={page}
          onChange={(event, value) => setPage(value)}
          color="primary"
        />
      </div>

      {/* Packet Details Pane */}
      {selectedPacket && (
        <Box className="mt-6 p-4 border rounded bg-white shadow-md">
          <Typography variant="h6" className="font-bold">
            Packet Details
          </Typography>
          <Typography>Timestamp: {selectedPacket.timestamp}</Typography>
          <Typography>Source IP: {selectedPacket.src_ip}</Typography>
          <Typography>Source Port: {selectedPacket.src_port}</Typography>
          <Typography>Destination IP: {selectedPacket.dst_ip}</Typography>
          <Typography>Destination Port: {selectedPacket.dst_port}</Typography>
          <Typography>Protocol: {selectedPacket.protocol}</Typography>
          <Typography>Length: {selectedPacket.length}</Typography>
        </Box>
      )}

      {/* Packet Bytes Pane */}
      {selectedPacket && selectedPacket.packet_dump && (
        <Box className="mt-6 p-4 border rounded bg-white shadow-md">
          <Typography variant="h6" className="font-bold">
            Packet Bytes
          </Typography>
          <pre className="overflow-auto p-2 bg-gray-100 border">{selectedPacket.packet_dump}</pre>
        </Box>
      )}

      {/* Status Bar */}
      <Box className="mt-4 p-2 bg-gray-800 text-white text-center rounded">
        <Typography variant="body1">
          Total Packets: {packets.length} | Page: {page} | Showing {limit} packets per page
        </Typography>
      </Box>
    </div>
  );
};

export default PCAPTable;
