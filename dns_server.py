# Captivity II
# Coded by Wo0ozer

import socketserver
from dnslib import DNSRecord, DNSHeader, DNSQuestion, QTYPE, RR, A
from config import PORTAL_IP, DNS_SERVER_PORT, DNS_LISTEN_IP, AUTHORIZED_IPS

class SimpleDNSHandler(socketserver.BaseRequestHandler):
    def handle(self):
        data, socket = self.request
        try:
            request = DNSRecord.parse(data)
            client_ip = self.client_address[0]
            print(f"DNS request received from {client_ip}: {request.q.qname} ({QTYPE[request.q.qtype]})")
            
            # --- Kernlogica ---
            # Leid A/AAAA queries om naar de portal IP
            reply = request.reply()
            if request.q.qtype in (QTYPE.A, QTYPE.AAAA):
                qname = request.q.qname
                if request.q.qtype == QTYPE.A:
                    reply.add_answer(RR(qname, QTYPE.A, rdata=A(PORTAL_IP), ttl=60))
                    print(f"Redirecting {qname} (A) for {client_ip} to {PORTAL_IP}")
            else:
                print(f"Ignoring non-A/AAAA request type {QTYPE[request.q.qtype]} from {client_ip}")
                
            socket.sendto(reply.pack(), self.client_address)
        except Exception as e:
            print(f"Error processing DNS request: {e}")

if __name__ == "__main__":
    print(f"Starting DNS server on {DNS_LISTEN_IP}:{DNS_SERVER_PORT}")
    print(f"Redirecting A/AAAA queries to portal at {PORTAL_IP}")
    try:
        server = socketserver.UDPServer((DNS_LISTEN_IP, DNS_SERVER_PORT), SimpleDNSHandler)
        server.serve_forever()
    except PermissionError:
        print("\nERROR: Permission denied. Kon niet binden aan poort 53.")
        print("Probeer het script uit te voeren met root/administrator rechten (bv. sudo python dns_server.py)")
    except OSError as e:
        print(f"\nERROR: Kon de DNS server niet starten. Is poort {DNS_SERVER_PORT} al in gebruik? ({e})")
    except KeyboardInterrupt:
        print("\nDNS server shutting down.")
        server.shutdown()
