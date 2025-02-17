package main
import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"sync"
	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcap"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)


// PacketData holds packet details
type PacketData struct {
	Index        int    `json:"index"`
	Timestamp    string `json:"timestamp"`
	SrcIP        string `json:"src_ip"`
	SrcPort      uint16 `json:"src_port"`
	DstIP        string `json:"dst_ip"`
	DstPort      uint16 `json:"dst_port"`
	Protocol     string `json:"protocol"`
	Length       int    `json:"length"`
	PayloadHex   string `json:"payload_hex,omitempty"`
	PayloadASCII string `json:"payload_ascii,omitempty"`
	Info         string `json:"info,omitempty"`
}

// Store TCP streams (Key = "SrcIP:SrcPort->DstIP:DstPort")
var (
	streams      = make(map[string][]PacketData)
	streamsMutex sync.Mutex
)

// Load packets from a PCAP file
func loadPackets(filename string) {
	handle, err := pcap.OpenOffline(filename)
	if err != nil {
		log.Fatalf("Error opening pcap file: %v", err)
	}
	defer handle.Close()

	packetSource := gopacket.NewPacketSource(handle, handle.LinkType())
	index := 1

	// Process each packet
	for packet := range packetSource.Packets() {
		processPacket(packet, index)
		index++
	}
}

func generatePacketInfo(packet gopacket.Packet) string {
    if packet.Layer(layers.LayerTypeDNS) != nil {
        return "DNS Query Detected"
    }
    if packet.Layer(layers.LayerTypeTCP) != nil {
        return "TCP Packet"
    }
    if packet.Layer(layers.LayerTypeUDP) != nil {
        return "UDP Packet"
    }
    if packet.Layer(layers.LayerTypeICMPv4) != nil || packet.Layer(layers.LayerTypeICMPv6) != nil {
        return "ICMP Packet"
    }
    if packet.ApplicationLayer() != nil {
        return "Application Layer Data"
    }
    return "Unknown Packet Type"
}

// Process a packet and store it in the corresponding TCP stream
func processPacket(packet gopacket.Packet, index int) {
	var srcIP, dstIP string
	var srcPort, dstPort uint16
	var protocol, payloadHex, payloadASCII string

	length := len(packet.Data())

	// Handle IPv4 and IPv6
	if ipLayer := packet.Layer(layers.LayerTypeIPv4); ipLayer != nil {
		ip, _ := ipLayer.(*layers.IPv4)
		srcIP = ip.SrcIP.String()
		dstIP = ip.DstIP.String()
		protocol = ip.Protocol.String()
	} else if ipLayer := packet.Layer(layers.LayerTypeIPv6); ipLayer != nil {
		ip, _ := ipLayer.(*layers.IPv6)
		srcIP = ip.SrcIP.String()
		dstIP = ip.DstIP.String()
		protocol = ip.NextHeader.String()
	}

	// Handle TCP and UDP
	if tcpLayer := packet.Layer(layers.LayerTypeTCP); tcpLayer != nil {
		tcp, _ := tcpLayer.(*layers.TCP)
		srcPort = uint16(tcp.SrcPort)
		dstPort = uint16(tcp.DstPort)
		protocol = "TCP"

		if len(tcp.Payload) > 0 {
			payloadHex = hex.EncodeToString(tcp.Payload)
			payloadASCII = string(tcp.Payload)
		}
	} else if udpLayer := packet.Layer(layers.LayerTypeUDP); udpLayer != nil {
		udp, _ := udpLayer.(*layers.UDP)
		srcPort = uint16(udp.SrcPort)
		dstPort = uint16(udp.DstPort)
		protocol = "UDP"
	}

	// Create stream key (bidirectional)
	forwardKey := fmt.Sprintf("%s:%d -> %s:%d", srcIP, srcPort, dstIP, dstPort)
	reverseKey := fmt.Sprintf("%s:%d -> %s:%d", dstIP, dstPort, srcIP, srcPort)

	// Store packet in the corresponding stream
	packetData := PacketData{
		Index:        index,
		Timestamp:    packet.Metadata().Timestamp.String(),
		SrcIP:        srcIP,
		SrcPort:      srcPort,
		DstIP:        dstIP,
		DstPort:      dstPort,
		Protocol:     protocol,
		Length:       length,
		PayloadHex:   payloadHex,
		PayloadASCII: payloadASCII,
		Info:         generatePacketInfo(packet),
	}

	streamsMutex.Lock()
	streams[forwardKey] = append(streams[forwardKey], packetData)
	streams[reverseKey] = append(streams[reverseKey], packetData)
	streamsMutex.Unlock()
}

// API: Retrieve all streams
func getStreamsHandler(w http.ResponseWriter, r *http.Request) {
	streamsMutex.Lock()
	defer streamsMutex.Unlock()

	var streamKeys []string
	for key := range streams {
		streamKeys = append(streamKeys, key)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(streamKeys)
}

// API: Follow a specific TCP stream or all streams (Paginated)
func followStreamHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	streamKey, hasStreamKey := vars["stream"] // Get stream key from URL

	// Get pagination parameters
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 50
	}

	var allPackets []PacketData

	streamsMutex.Lock()
	if hasStreamKey && streamKey != "" {
		if packets, exists := streams[streamKey]; exists {
			allPackets = packets
		} else {
			streamsMutex.Unlock()
			http.Error(w, "Stream not found", http.StatusNotFound)
			return
		}
	} else {
		for _, packets := range streams {
			allPackets = append(allPackets, packets...)
		}
	}
	streamsMutex.Unlock()

	// Sort packets by index
	sort.Slice(allPackets, func(i, j int) bool {
		return allPackets[i].Index < allPackets[j].Index
	})

	// Paginate packets
	start := (page - 1) * limit
	end := start + limit
	if start > len(allPackets) {
		start = len(allPackets)
	}
	if end > len(allPackets) {
		end = len(allPackets)
	}
	paginatedPackets := allPackets[start:end]
	totalPages := (len(allPackets) + limit - 1) / limit

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"packets":    paginatedPackets,
		"totalPages": totalPages,
	})
}

// API: Upload and process a PCAP file
func uploadPcapHandler(w http.ResponseWriter, r *http.Request) {
	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		http.Error(w, "File size too large", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("pcap")
	if err != nil {
		http.Error(w, "Failed to retrieve file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		os.Mkdir(uploadDir, os.ModePerm)
	}

	filePath := filepath.Join(uploadDir, handler.Filename)
	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Failed to save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	if err != nil {
		http.Error(w, "Failed to write file", http.StatusInternalServerError)
		return
	}

	go loadPackets(filePath)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "File uploaded successfully",
		"filename": handler.Filename,
	})
}

// API Handler: Retrieve all captured packets with pagination
func getPacketsHandler(w http.ResponseWriter, r *http.Request) {
	// Get pagination parameters from query
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 50
	}

	// Collect all packets from all streams
	var allPackets []PacketData
	streamsMutex.Lock()
	for _, streamPackets := range streams {
		allPackets = append(allPackets, streamPackets...)
	}
	streamsMutex.Unlock()

	// Sort packets by index
	sort.Slice(allPackets, func(i, j int) bool {
		return allPackets[i].Index < allPackets[j].Index
	})

	// Calculate pagination boundaries
	start := (page - 1) * limit
	end := start + limit
	if start > len(allPackets) {
		start = len(allPackets)
	}
	if end > len(allPackets) {
		end = len(allPackets)
	}

	// Extract paginated packets
	paginatedPackets := allPackets[start:end]
	totalPages := (len(allPackets) + limit - 1) / limit

	// Send JSON response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"packets":    paginatedPackets,
		"totalPages": totalPages,
	})
}


// Main function
func main() {
	router := mux.NewRouter()
	router.HandleFunc("/streams", getStreamsHandler).Methods("GET")
	router.HandleFunc("/stream/{stream}", followStreamHandler).Methods("GET")
	router.HandleFunc("/stream/", followStreamHandler).Methods("GET") // Support all streams
	router.HandleFunc("/upload-pcap", uploadPcapHandler).Methods("POST")
	router.HandleFunc("/packets", getPacketsHandler).Methods("GET")

	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:3000"}),
		handlers.AllowedMethods([]string{"GET", "POST", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type"}),
	)

	loggedRouter := handlers.LoggingHandler(os.Stdout, corsHandler(router))
	fmt.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", loggedRouter))
}
