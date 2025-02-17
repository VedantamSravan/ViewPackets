import React from "react";

const PacketDetails = ({ packet, onClose }) => {
  if (!packet) return null;

  return (
    <div className="absolute top-10 left-10 bg-white shadow-lg rounded-md p-4 w-2/3">
      <h3 className="text-xl font-bold">Packet Details</h3>
      <button onClick={onClose} className="absolute top-2 right-2 text-red-600">❌</button>
      
      <div className="mt-3">
        <p><strong>Source IP:</strong> {packet.src_ip}</p>
        <p><strong>Destination IP:</strong> {packet.dst_ip}</p>
        <p><strong>Protocol:</strong> {packet.protocol}</p>
        <p><strong>Packet Length:</strong> {packet.length} bytes</p>
        <p><strong>Timestamp:</strong> {new Date(packet.timestamp).toLocaleString()}</p>
      </div>

      <h4 className="mt-4 font-bold">Raw Packet Data:</h4>
      <pre className="bg-gray-100 p-2 overflow-auto rounded">{packet.raw_packet}</pre>
    </div>
  );
};

export default PacketDetails;
