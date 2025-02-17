import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const apiService = {
    // Fetch list of TCP streams
    getStreams: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/streams`);
        if (!response.ok) throw new Error("Failed to fetch streams");
        return await response.json();
      } catch (error) {
        console.error("Error fetching streams:", error);
        throw error;
      }
    },
  
    // Fetch packets for a specific stream with pagination
    getStreamPackets: async (streamKey, page = 1, limit = 10) => {
      try {
        const encodedStreamKey = encodeURIComponent(streamKey); // Encode key to prevent URL issues
        const response = await fetch(`${API_BASE_URL}/stream/${encodedStreamKey}?page=${page}&limit=${limit}`);
        if (!response.ok) throw new Error("Failed to fetch stream packets");
        return await response.json();
      } catch (error) {
        console.error("Error fetching packets:", error);
        throw error;
      }
    },
  getPackets: async (page, limit) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/packets`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching packets:', error);
      throw error;
    }
  },
  uploadPcap: async (file) => {
    const formData = new FormData();
    formData.append('pcap', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload-pcap`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading PCAP file:', error);
      throw error;
    }
  },
};

export default apiService;
