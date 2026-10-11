// Stage 5 — auto-extracted from server.js
module.exports = {
  "id": 5,
  "stage": 5,
  "title": "Packet Analysis & Key Recovery",
  "domain": "Network Analysis",
  "difficulty": "Moderate",
  "points": 300,
  "tools": "Wireshark, tshark, ssh-keygen",
  "description": "A Nova Tech incident response team captured network traffic moments before the insider disconnected. Something sensitive was exfiltrated. Recover it.",
  "flag": "CTF{p4ck3t_f0r3ns1cs_k3y_r3c0v3r3d}",
  "resource": {
    "label": "Download PCAP",
    "url": "/challenge-files/incident.pcap",
    "filename": "incident.pcap"
  },
  "hints": [
    {
      "no": 1,
      "text": "Multiple protocols are present. Only one carries credentials in plaintext.",
      "penalty": 5
    },
    {
      "no": 2,
      "text": "Look at the higher-numbered TCP streams — that is where the data was transferred.",
      "penalty": 10
    },
    {
      "no": 3,
      "text": "Once you reassemble the suspicious stream, look at the very top of the recovered file. A comment block sits above the key — the flag is written inside it.",
      "penalty": 15
    }
  ],
  "steps": [
    {
      "no": 1,
      "title": "Tool",
      "instruction": "You have a packet capture. Which tool opens .pcap files? (one word)",
      "placeholder": "tool",
      "answer": "wireshark"
    },
    {
      "no": 2,
      "title": "Stream",
      "instruction": "Opened in {prev}. One TCP stream contains the exfiltrated data. Which display filter isolates it? (include spaces)",
      "placeholder": "display filter",
      "answer": "tcp.stream eq 3"
    },
    {
      "no": 3,
      "title": "Protocol",
      "instruction": "{prev} reveals a plaintext transfer. Which protocol was used? (3 letters)",
      "placeholder": "xxx",
      "answer": "ftp"
    },
    {
      "no": 4,
      "title": "Artifact",
      "instruction": "{prev} transferred a sensitive file. What is its filename?",
      "placeholder": "filename",
      "answer": "id_rsa"
    },
    {
      "no": 5,
      "title": "Recover the key",
      "instruction": "Extract the {prev} private key from the captured stream. The key authenticates as a specific Nova Tech user. Which user does it belong to? (just the username)",
      "placeholder": "username",
      "answer": "developer"
    }
  ]
};
