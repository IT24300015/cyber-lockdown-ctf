#!/usr/bin/env python3
"""
Generates incident.pcap with 5 TCP streams.
Stream 4 is FTP data containing the exfiltrated SSH private key.
The flag is embedded as a comment inside the transferred file.
"""
import struct
import time
import sys
import os

def pcap_header():
    return struct.pack('<IHHIIII',
        0xa1b2c3d4, 2, 4, 0, 0, 65535, 1)

def packet(ts_sec, data):
    return struct.pack('<IIII', ts_sec, 0, len(data), len(data)) + data

def eth(src, dst, payload):
    return dst + src + b'\x08\x00' + payload

def ip(src, dst, payload, proto=6):
    ver_ihl = 0x45
    tos = 0
    total = 20 + len(payload)
    ident = 0
    flags_off = 0
    ttl = 64
    csum = 0
    src_b = bytes(int(x) for x in src.split('.'))
    dst_b = bytes(int(x) for x in dst.split('.'))
    return struct.pack('!BBHHHBBH4s4s',
        ver_ihl, tos, total, ident, flags_off, ttl, proto, csum, src_b, dst_b) + payload

def tcp(sport, dport, seq, ack, flags, payload):
    data_off = (5 << 4)
    return struct.pack('!HHIIBBHHH',
        sport, dport, seq, ack, data_off, flags, 8192, 0, 0) + payload

def mac(hexstr):
    return bytes.fromhex(hexstr.replace(':', ''))

CLIENT_MAC = mac('08:00:27:aa:bb:cc')
SERVER_MAC = mac('08:00:27:11:22:33')
CLIENT_IP = '192.168.56.30'
SERVER_IP = '192.168.56.40'

def make_stream(sport, dport, client_msgs, server_msgs):
    pkts = []
    t = int(time.time())
    seq_c, seq_s = 1000, 5000
    pkts.append((t, 'C', sport, dport, seq_c, 0, 0x02, b''))
    pkts.append((t, 'S', dport, sport, seq_s, seq_c+1, 0x12, b''))
    pkts.append((t, 'C', sport, dport, seq_c+1, seq_s+1, 0x10, b''))
    seq_c += 1; seq_s += 1
    t += 1

    def send(direction, payload):
        nonlocal seq_c, seq_s, t
        if direction == 'C':
            pkts.append((t, 'C', sport, dport, seq_c, seq_s, 0x18, payload))
            seq_c += len(payload)
        else:
            pkts.append((t, 'S', dport, sport, seq_s, seq_c, 0x18, payload))
            seq_s += len(payload)
        t += 1

    i, j = 0, 0
    while i < len(client_msgs) or j < len(server_msgs):
        if i < len(client_msgs):
            send('C', client_msgs[i]); i += 1
        if j < len(server_msgs):
            send('S', server_msgs[j]); j += 1
    pkts.append((t, 'C', sport, dport, seq_c, seq_s, 0x11, b''))
    pkts.append((t, 'S', dport, sport, seq_s, seq_c+1, 0x11, b''))
    return pkts

def build():
    # Stream 1: HTTP distractor
    s1 = make_stream(50100, 80,
        [b'GET /index.html HTTP/1.1\r\nHost: novatech.local\r\n\r\n'],
        [b'HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nhello'])
    # Stream 2: DNS distractor
    s2 = make_stream(50101, 53,
        [b'\x00\x1a\x01\x00\x00\x01\x00\x00\x00\x00\x00\x00'],
        [b'\x00\x1a\x81\x80\x00\x01\x00\x01\x00\x00\x00\x00'])
    # Stream 3: FTP control (credentials visible!)
    s3 = make_stream(50102, 21,
        [b'USER developer\r\n',
         b'PASS d3v3l0p3r_2026!\r\n',
         b'TYPE I\r\n',
         b'PASV\r\n',
         b'RETR id_rsa\r\n',
         b'QUIT\r\n'],
        [b'220 Nova FTP ready\r\n',
         b'331 Password required\r\n',
         b'230 Login successful\r\n',
         b'200 Type set to I\r\n',
         b'227 Entering Passive Mode (192,168,56,40,196,10)\r\n',
         b'150 Opening binary mode\r\n',
         b'226 Transfer complete\r\n',
         b'221 Goodbye\r\n'])
    # Stream 4: FTP DATA — the SSH key with flag comment
    key_path = os.path.expanduser('~/ctf-box/linuxbox/keys/id_rsa')
    with open(key_path, 'rb') as f:
        key = f.read()
    payload = b'# === Nova Tech Insider Exfil ===\n'
    payload += b'# FLAG: CTF{p4ck3t_f0r3ns1cs_k3y_r3c0v3r3d}\n'
    payload += b'# key belongs to developer@novatech.local\n'
    payload += key
    chunks = [payload[i:i+100] for i in range(0, len(payload), 100)]
    s4 = make_stream(50103, 40000, [], chunks)
    # Stream 5: TLS distractor
    s5 = make_stream(50104, 443,
        [b'\x16\x03\x01\x00\x50'],
        [b'\x16\x03\x03\x00\x4a'])

    all_pkts = s1 + s2 + s3 + s4 + s5

    out_path = os.path.expanduser('~/ctf-box/web/static/incident.pcap')
    with open(out_path, 'wb') as f:
        f.write(pcap_header())
        for ts, direction, sport, dport, seq, ack, flags, payload in all_pkts:
            if direction == 'C':
                tcp_pkt = tcp(sport, dport, seq, ack, flags, payload)
                pkt = ip(CLIENT_IP, SERVER_IP, tcp_pkt)
                frame = eth(CLIENT_MAC, SERVER_MAC, pkt)
            else:
                tcp_pkt = tcp(sport, dport, seq, ack, flags, payload)
                pkt = ip(SERVER_IP, CLIENT_IP, tcp_pkt)
                frame = eth(SERVER_MAC, CLIENT_MAC, pkt)
            f.write(packet(ts, frame))
    print(f'Written: {out_path}')
    print(f'Total packets: {len(all_pkts)}')

if __name__ == '__main__':
    build()