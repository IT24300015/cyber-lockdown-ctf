# Risk Register — Outcomes

| Risk | Mitigation | Verified |
|------|-----------|----------|
| System corruption (player deletes files) | reset_box.sh recreates containers | Yes — <10s |
| Isolation leak | Host-Only + iptables DOCKER-USER | Yes — nmap shows only 22/80/8000 |
| Solver deadlock | 3 hints per stage with penalty | Yes |
| Resource exhaustion | CPU/memory limits per container | Yes — docker stats |
| Wrong flag format bypass | Strict flag string comparison | Yes |
