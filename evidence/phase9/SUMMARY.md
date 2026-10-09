# Phase 9 — Testing & Validation Evidence

## Test Results Summary

### 1. Reset Mechanism
- Reset time: **9–19 seconds** (varies with cache state)
- All 4 containers Up after reset
- DB tables restored automatically
- Deleted files (root.txt, syscheck, git-repo.zip) restored
- CTFd scoreboard preserved

### 2. Container Security
| Container | User | UID | Resource Limit |
|---|---|---|---|
| ctfd | ctfd | 1001 | 512M / 1.0 CPU |
| web | node | 1000 | 512M / 1.0 CPU |
| db | mysql (PID 1) | 999 | 512M / 1.0 CPU |
| linuxbox | root (intentional) | 0 | 256M / 0.5 CPU |

- no-new-privileges on ctfd/web/db
- Capability drop on web: ALL except CHOWN/SETUID/SETGID/NET_BIND_SERVICE
- linuxbox retains root for Stage 6 SUID challenge

### 3. Network Isolation
- Only 3 ports open from Kali: 22, 80, 8000
- MySQL (3306) NOT exposed to host
- Container → internet BLOCKED via iptables FORWARD rule
- Host-Only network 192.168.56.0/24 for attacker ↔ target

### 4. Challenge Files Verified
- Stage 1: git-repo.zip (23110 bytes, 3 commits)
- Stage 2: badge.jpg + forensics tools
- Stage 3: staging portal with SQLi
- Stage 4: exfil.enc (780 bytes) + evidence zip
- Stage 5: incident.pcap (6918 bytes)
- Stage 6: /usr/local/bin/syscheck (SUID, 16176 bytes)

### 5. All 6 Stages Playable
- Full playthrough verified from Kali
- Chained step instructions work
- Hint penalties applied
- Auto-complete on final step

## Conclusion
Phase 9 confirms the CTF box is stable, isolated, and reproducible.
