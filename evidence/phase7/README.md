# Phase 7 — Isolation & Security Controls

## Summary

All 4 containers hardened with resource limits, capability restrictions,
and least-privilege principles applied. Isolation verified from Kali.

## Container Users (verified)

| Container | User | UID | Note |
|---|---|---|---|
| ctfd      | ctfd  | 1001 | Non-root |
| web       | node  | 1000 | Non-root (fix applied) |
| db        | mysql | 999  | mysqld PID 1 runs as mysql |
| linuxbox  | root  | 0    | Intentional — Stage 6 SUID challenge |

## Resource Limits (docker-compose.yml)

| Container | CPU Limit | Memory Limit | CPU Reserve | Memory Reserve |
|---|---|---|---|---|
| ctfd      | 1.0       | 512M         | 0.25        | 128M           |
| web       | 1.0       | 512M         | 0.25        | 128M           |
| db        | 1.0       | 512M         | 0.25        | 256M           |
| linuxbox  | 0.5       | 256M         | 0.10        | 64M            |

## Security Options

| Container | no-new-privileges | Capability Drop | Capabilities Added |
|---|---|---|---|
| ctfd      | ✅ enabled         | —                | —                  |
| web       | ✅ enabled         | ALL              | CHOWN, SETUID, SETGID, NET_BIND_SERVICE |
| db        | ✅ enabled         | —                | —                  |
| linuxbox  | ❌ intentionally off | —              | — (needs SUID for Stage 6) |

## Network Isolation (verified from Kali)

- Only 3 ports open on 192.168.56.20: **22, 80, 8000**
- MySQL (3306) NOT reachable from Kali — internal Docker network only
- Ubuntu target has NO internet (iptables FORWARD rule + no default route)
- Container breakout test: no host filesystem access, no cross-network reach

## Files Changed

- `docker-compose.yml` — added deploy.resources.limits, security_opt, cap_drop
- `web/Dockerfile` — added `USER node` to run as non-root (uid=1000)

## Verification Commands

\`\`\`bash
# Resource limits
docker inspect web --format '{{.HostConfig.Memory}} {{.HostConfig.NanoCpus}}'

# Security options
docker inspect web --format '{{.HostConfig.SecurityOpt}}'

# Container user
docker exec web id
docker exec db sh -c 'cat /proc/1/status | grep Uid'

# Isolation from Kali
nmap -p- 192.168.56.20         # only 22, 80, 8000 open
nmap -p 3306 192.168.56.20     # closed
ping -c 1 8.8.8.8              # fails (no internet)
\`\`\`

## Status

✅ Phase 7 complete
✅ All 6 stages still playable after hardening
