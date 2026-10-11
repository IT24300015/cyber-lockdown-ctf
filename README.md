# Cyber Lockdown — CTF Play Box

A containerized Capture The Flag platform for beginner to intermediate
cybersecurity students. Built on an isolated Host-Only network using
Docker Compose, a custom Node.js + React portal, and a self-hosted
CTFd scoring backend.

---

## Overview

Cyber Lockdown recreates an insider threat scenario at a fictional
defense technology firm. Six progressive stages cover OSINT,
digital forensics, web security, cryptography, network analysis,
and Linux privilege escalation.

The environment is fully isolated — no external network exposure,
no internet access from the challenge containers, and no impact on
institutional or public systems.

---

## Architecture

    ┌───────────────────────┐         ┌────────────────────────────┐
    │   Kali (Attacker)     │         │   Ubuntu (Target Host)     │
    │   192.168.56.10       │ ──────► │   192.168.56.20            │
    │                       │  Host-  │                            │
    │   Firefox, Wireshark, │  Only   │   Docker Engine + Compose  │
    │   Burp, Python, SSH   │  net    │                            │
    └───────────────────────┘         │   ┌─ ctfd      :8000       │
                                      │   ├─ web       :80         │
                                      │   ├─ db (internal only)    │
                                      │   └─ linuxbox  :22         │
                                      └────────────────────────────┘

### Containers

| Service    | Purpose                              | Port |
|------------|--------------------------------------|------|
| `ctfd`     | Scoring platform, flag validation    | 8000 |
| `web`      | Node.js + React challenge portal     | 80   |
| `db`       | MySQL backend for portal + progress  | —    |
| `linuxbox` | SSH-accessible Linux challenge host  | 22   |

---

## Prerequisites

| Component          | Minimum                        |
|--------------------|--------------------------------|
| OS (host)          | Linux, macOS, or Windows + WSL |
| Docker Engine      | 20.x or newer                  |
| Docker Compose     | v2.x                           |
| RAM                | 8 GB (12 GB recommended)       |
| Disk               | 40 GB free                     |
| Hypervisor (VM)    | VirtualBox 7.x or VMware       |
| VMs                | Ubuntu Server 24.04 LTS (target), Kali Linux (attacker) |

Recommended tools on the attacker VM (Kali):

    nmap, curl, git, burp suite, sqlmap, wireshark, tshark,
    python3, cyberchef, ssh, netcat, pipx, node.js

---

## Installation

### 1. Clone the repository

    git clone https://github.com/IT24300015/cyber-lockdown-ctf.git
    cd cyber-lockdown-ctf

Or copy the `ctf-box` folder to `~/ctf-box` on the Ubuntu target VM.

### 2. Set up the network

The target VM must be on a Host-Only network.

Create the network in your hypervisor:

- **VirtualBox:** File → Host Network Manager → Create `vboxnet0`
  with subnet `192.168.56.0/24`
- **VMware:** Edit → Virtual Network Editor → Create VMnet1 as
  Host-Only, subnet `192.168.56.0/24`

Assign static IPs:

    Ubuntu target  → 192.168.56.20
    Kali attacker  → 192.168.56.10

### 3. Install Docker

    sudo apt update
    sudo apt install -y git docker.io docker-compose-v2
    sudo systemctl enable --now docker
    sudo usermod -aG docker $USER

Log out and back in for the group change to apply.

### 4. Configure firewall isolation

Block container traffic from reaching the internet:

    sudo iptables -I DOCKER-USER -i br-+ -o enp0s3 -j DROP
    sudo iptables -I DOCKER-USER -i docker0 -o enp0s3 -j DROP

Persist the rules:

    sudo apt install -y iptables-persistent
    sudo netfilter-persistent save

---

## Running the Box

### Start all services

    cd ~/ctf-box
    sudo docker compose up -d --build

Wait 2–3 minutes on the first run while Docker builds the images
and initializes MySQL.

### Verify the containers

    sudo docker compose ps

All four services should show **Up**:

    NAME        STATUS
    ctfd        Up
    db          Up (healthy)
    linuxbox    Up
    web         Up

### Access the platform

| Service      | URL                              |
|--------------|----------------------------------|
| Main portal  | http://192.168.56.20             |
| Scoreboard   | http://192.168.56.20:8000        |
| SSH target   | ssh developer@192.168.56.20      |

### View logs

    sudo docker compose logs -f web
    sudo docker compose logs -f ctfd

Press `Ctrl+C` to exit the log view.

---

## Stopping the Box

    cd ~/ctf-box
    sudo docker compose down

This stops and removes containers but preserves volumes
(CTFd scoreboard and any submitted flags).

To remove volumes as well:

    sudo docker compose down -v

Warning: this deletes the scoreboard and all user progress.

---

## Resetting the Box

The reset script restores challenge state without wiping the
CTFd scoreboard.

    cd ~/ctf-box
    bash scripts/reset_box.sh

What it does:

1. Wipes player progress from the challenge database
2. Recreates the `web` and `linuxbox` containers from the cached image
3. Verifies services start correctly
4. Preserves CTFd data (scoreboard, users, submissions)
5. Runs in under 10 seconds

Run this between test sessions to restore a clean challenge
state — for example, after a destructive exploit test.

---

## Project Structure

    ctf-box/
    ├── README.md                  ← this file
    ├── CHANGELOG.md               ← design changes from initial proposal
    ├── docker-compose.yml         ← service definitions
    │
    ├── web/                       ← Node.js + React portal
    │   ├── Dockerfile
    │   ├── backend/
    │   │   ├── server.js          ← Express API + MySQL
    │   │   ├── package.json
    │   │   └── challenges/        ← per-stage challenge data
    │   │       ├── index.js
    │   │       ├── stage1.js
    │   │       ├── stage2.js
    │   │       ├── stage3.js
    │   │       ├── stage4.js
    │   │       ├── stage5.js
    │   │       └── stage6.js
    │   ├── frontend/              ← Vite + React UI
    │   │   ├── src/
    │   │   ├── public/
    │   │   ├── package.json
    │   │   └── vite.config.js
    │   └── static/                ← challenge files, images, PCAP
    │       ├── forensics/
    │       ├── staging/
    │       ├── secure/
    │       ├── git-repo.zip
    │       ├── incident.pcap
    │       ├── exfil.enc
    │       └── stage4_evidence.zip
    │
    ├── linuxbox/                  ← SSH container for final stage
    │   ├── Dockerfile
    │   ├── setup.sh
    │   ├── syscheck.c
    │   └── keys/                  ← SSH key pair
    │
    ├── scripts/                   ← setup + automation
    │   ├── reset_box.sh
    │   ├── generate_pcap.py
    │   ├── generate_badge.py
    │   ├── generate_encrypted_file.py
    │   └── collect_evidence.sh
    │
    ├── ctfd/                      ← CTFd configuration
    └── evidence/                  ← testing + validation evidence

---

## Environment & Tech Stack

| Layer            | Technology                              |
|------------------|-----------------------------------------|
| Virtualization   | VirtualBox 7.x or VMware Workstation    |
| Network          | Host-Only subnet 192.168.56.0/24        |
| Containerization | Docker Engine, Docker Compose v2        |
| Target OS        | Ubuntu Server 24.04 LTS                 |
| Attacker OS      | Kali Linux 2024.x                       |
| Web Backend      | Node.js 20, Express, mysql2             |
| Web Frontend     | React 18, Vite 5                        |
| Database         | MySQL 8.0 (internal network only)       |
| SSH Host         | Ubuntu 22.04 (Docker base image)        |
| Scoring Platform | CTFd                                    |
| Language (tool)  | Python 3 for setup + solver scripts     |

---

## Security Notes

- All challenge containers run as non-root users, except the
  `linuxbox` container which intentionally runs as root to
  support a SUID-based privilege escalation challenge.
- Container internet access is blocked via iptables DOCKER-USER
  rules to prevent challenge exploits from leaking externally.
- MySQL is not exposed to the host network — reachable only
  from the `web` container on the internal Docker bridge.
- Ports 22, 80, and 8000 are the only exposed services.
- Resource limits (CPU and memory) are enforced per container.

---

## Development

### Rebuild just the web container after code changes

    sudo docker compose up -d --build web

### Copy files into a running container (without rebuilding)

    sudo docker cp web/backend/server.js web:/app/server.js
    sudo docker cp web/backend/challenges web:/app/challenges
    sudo docker restart web

Useful when network access is restricted during a build.

### Regenerate challenge assets

    python3 scripts/generate_pcap.py
    python3 scripts/generate_badge.py
    python3 scripts/generate_encrypted_file.py

---

## Troubleshooting

| Symptom                                    | Fix                                              |
|--------------------------------------------|--------------------------------------------------|
| `permission denied` on docker.sock         | `sudo usermod -aG docker $USER` then re-login    |
| MySQL takes ~2 minutes to become healthy   | Normal on first run                              |
| Web container restarts repeatedly          | `sudo docker compose logs web` and check errors  |
| `Cannot find module './challenges'`        | Re-copy the `challenges` folder into the container |
| Other PCs can't reach the portal           | Check Windows Firewall allows ports 80, 8000, 22 |

---

## License

This project was built for academic purposes as part of the
SLIIT IE3132 Penetration Testing module, BSc (Hons) in IT,
Cyber Security specialization, Year 3 Semester 1, 2026.

---

## Author

Group ID — 7

- IT24300015 — Da Silva H.V.N.N.
- IT24101184 — Arundha H D J
- IT24101551 — Kuyilini T
- IT24100936 — De Silva K.H.Y.S.T.
