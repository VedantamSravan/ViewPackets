# View Packets - Packet Analyzer

## Overview
View Packets is a powerful and efficient packet analyzer designed for monitoring, capturing, and analyzing network traffic in real-time. It provides deep insights into network communications, helping users diagnose network issues, detect security threats, and optimize performance.

## Features
- **Real-Time Packet Capture**: Monitors and captures network packets in real time.
- **Protocol Analysis**: Supports multiple protocols such as TCP, UDP, ICMP, HTTP, and more.
- **Packet Filtering**: Allows filtering packets based on IP, ports, and protocols.
- **Live & Offline Analysis**: Analyzes both live network traffic and saved packet capture files (PCAP).
- **User-Friendly Interface**: Provides a structured and easy-to-use UI for analyzing network traffic.
- **Export & Report Generation**: Enables exporting captured packets and generating detailed reports.
- **API for Packet Data**: Provides a RESTful API for retrieving and analyzing captured packet data.
- **ReactJS Frontend**: Offers a modern web interface using ReactJS to visualize network packet data.

## Installation
### Prerequisites
Ensure you have the following dependencies installed:
- Go 1.18+
- `github.com/google/gopacket`
- `github.com/google/gopacket/layers`
- `github.com/google/gopacket/pcap`
- `github.com/gorilla/mux`
- `github.com/gorilla/handlers`
- Node.js & npm (for React frontend)

### Steps
#### Backend (Gorilla Mux Server)
1. Clone the repository:
   ```bash
   git clone https://github.com/VedantamSravan/ViewPackets
   cd view-packets
   ```
2. Install dependencies:
   ```bash
   go mod tidy
   ```
3. Run the backend application:
   ```bash
   go run main.go
   ```

#### Frontend (ReactJS UI)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```

## Usage
### Start packet capturing
```bash
go run main.go
```

### API Endpoints
#### Retrieve all streams
```bash
GET /streams
```
Returns a list of active TCP streams.

#### Follow a specific TCP stream
```bash
GET /stream/{stream}
```
Retrieves the packets for a given TCP stream.

#### Upload a PCAP file
```bash
POST /upload-pcap
```
Uploads and processes a PCAP file.

#### Retrieve captured packets
```bash
GET /packets?page=1&limit=50
```
Returns paginated captured packet data.

