from scapy.all import sniff, IP, TCP, UDP
import threading
import time
import random
from typing import List, Dict

class LiveCaptureService:
    def __init__(self):
        self.is_sniffing = False
        self.captured_packets = []
        self.threat_log = []
        self.lock = threading.Lock()

    def packet_callback(self, packet):
        if IP in packet:
            ip_src = packet[IP].src
            ip_dst = packet[IP].dst
            proto = "TCP" if TCP in packet else "UDP" if UDP in packet else "Other"
            
            packet_info = {
                "timestamp": time.time(),
                "src": ip_src,
                "dst": ip_dst,
                "proto": proto,
                "size": len(packet)
            }
            
            with self.lock:
                self.captured_packets.append(packet_info)
                # Keep only last 100
                if len(self.captured_packets) > 100:
                    self.captured_packets.pop(0)

    def start_capture(self):
        if self.is_sniffing:
            return
        
        self.is_sniffing = True
        self.sniff_thread = threading.Thread(target=self._run_sniff, daemon=True)
        self.sniff_thread.start()

    def _run_sniff(self):
        try:
            # Try real sniffing (requires Npcap/WinPcap and Admin)
            sniff(prn=self.packet_callback, store=0, stop_filter=lambda x: not self.is_sniffing, timeout=5)
            if not self.is_sniffing: return
            
            # If no packets captured after 5s or error, start simulation fallback
            if len(self.captured_packets) == 0:
                self._run_simulation()
        except Exception as e:
            print(f"Network sniffing failed (Permission/Driver): {e}")
            self._run_simulation()

    def _run_simulation(self):
        print("Starting Network Traffic Simulation (Demo Mode)...")
        hosts = ["192.168.1.10", "192.168.1.15", "10.0.0.42", "172.16.0.5", "192.168.1.1", "203.0.113.5", "8.8.8.8"]
        services = ["TCP", "UDP", "HTTP", "HTTPS", "DNS"]
        
        while self.is_sniffing:
            packet_info = {
                "timestamp": time.time(),
                "src": random.choice(hosts),
                "dst": random.choice(hosts),
                "proto": random.choice(services),
                "size": random.randint(40, 1500)
            }
            with self.lock:
                self.captured_packets.append(packet_info)
                if len(self.captured_packets) > 50:
                    self.captured_packets.pop(0)
            time.sleep(random.uniform(0.5, 2.0))

    def stop_capture(self):
        self.is_sniffing = False

    def get_live_data(self) -> Dict:
        with self.lock:
            return {
                "is_active": self.is_sniffing,
                "packets": list(self.captured_packets),
                "stats": {
                    "total": len(self.captured_packets),
                    "bandwidth": sum(p["size"] for p in self.captured_packets),
                    "mode": "live" if any(p.get('real', False) for p in self.captured_packets) else "simulated"
                }
            }
