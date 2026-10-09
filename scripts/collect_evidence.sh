#!/bin/bash
# ============================================================
# Cyber Lockdown CTF — Evidence Collection Script
# Captures all proof needed for Assignment 02 submission.
# ============================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

EVIDENCE_DIR=~/ctf-box/evidence/phase9
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${CYAN}============================================================${NC}"
echo "  CYBER LOCKDOWN — EVIDENCE COLLECTION"
echo "  Output: ${EVIDENCE_DIR}"
echo -e "${CYAN}============================================================${NC}"

mkdir -p "$EVIDENCE_DIR"/{isolation,containers,stages,reset,git,network}

# ------------------------------------------------------------
# 1. SYSTEM INFO
# ------------------------------------------------------------
echo -e "${YELLOW}[1/7]${NC} Capturing system info..."

{
  echo "=== OS Info ==="
  uname -a
  cat /etc/os-release | head -3
  echo ""
  echo "=== Docker Version ==="
  docker --version
  docker compose version
  echo ""
  echo "=== Docker Running Containers ==="
  sudo docker compose ps
} > "$EVIDENCE_DIR/system-info.txt" 2>&1

# ------------------------------------------------------------
# 2. CONTAINER STATUS + RESOURCE LIMITS
# ------------------------------------------------------------
echo -e "${YELLOW}[2/7]${NC} Capturing container details..."

{
  echo "=== Container Status ==="
  sudo docker compose ps
  echo ""
  echo "=== Container Users ==="
  echo "--- ctfd ---"
  sudo docker exec ctfd id 2>&1
  echo "--- web ---"
  sudo docker exec web id 2>&1
  echo "--- db (PID 1 process) ---"
  sudo docker exec db sh -c 'cat /proc/1/status | grep -E "^(Name|Uid)"' 2>&1
  echo "--- linuxbox ---"
  sudo docker exec linuxbox id 2>&1
  echo ""
  echo "=== Resource Limits ==="
  for c in ctfd web db linuxbox; do
    echo "--- $c ---"
    sudo docker inspect $c --format 'Memory: {{.HostConfig.Memory}}B | CPU: {{.HostConfig.NanoCpus}}nc | SecurityOpt: {{.HostConfig.SecurityOpt}} | CapDrop: {{.HostConfig.CapDrop}}' 2>&1
  done
} > "$EVIDENCE_DIR/containers/details.txt" 2>&1

# ------------------------------------------------------------
# 3. ISOLATION TESTS
# ------------------------------------------------------------
echo -e "${YELLOW}[3/7]${NC} Running isolation tests..."

{
  echo "=== iptables FORWARD rules ==="
  sudo iptables -L FORWARD -v -n
  echo ""
  echo "=== IP Routing ==="
  ip route
  echo ""
  echo "=== No Default Route (should be empty) ==="
  ip route | grep -i default || echo "(no default route — target has no internet)"
  echo ""
  echo "=== Network Adapters ==="
  ip -brief addr
} > "$EVIDENCE_DIR/isolation/host-network.txt" 2>&1

# ------------------------------------------------------------
# 4. STAGE FILES VERIFICATION
# ------------------------------------------------------------
echo -e "${YELLOW}[4/7]${NC} Verifying challenge files..."

{
  echo "=== Stage 1 — Git Repo ==="
  ls -lh ~/ctf-box/web/static/git-repo.zip 2>&1
  echo "Commits in repo:"
  cd ~/ctf-box/web/static/git-repo 2>/dev/null && git log --oneline 2>&1
  cd ~/ctf-box
  echo ""

  echo "=== Stage 2 — ID Badge ==="
  ls -lh ~/ctf-box/web/static/forensics/badge.jpg 2>&1
  echo "Forensics site files:"
  ls -la ~/ctf-box/web/static/forensics/ 2>&1
  echo ""

  echo "=== Stage 3 — Staging Portal ==="
  ls -la ~/ctf-box/web/static/staging/ 2>&1
  echo ""

  echo "=== Stage 4 — Encrypted File + Zip ==="
  ls -lh ~/ctf-box/web/static/exfil.enc 2>&1
  wc -c ~/ctf-box/web/static/exfil.enc 2>&1
  ls -lh ~/ctf-box/web/static/stage4_evidence.zip 2>&1
  unzip -l ~/ctf-box/web/static/stage4_evidence.zip 2>&1
  echo ""

  echo "=== Stage 5 — PCAP ==="
  ls -lh ~/ctf-box/web/static/incident.pcap 2>&1
  echo ""

  echo "=== Stage 6 — SSH Container ==="
  sudo docker exec linuxbox ls -la /root/root.txt 2>&1
  sudo docker exec linuxbox cat /root/root.txt 2>&1
  sudo docker exec linuxbox ls -la /usr/local/bin/syscheck 2>&1
  sudo docker exec linuxbox id developer 2>&1
} > "$EVIDENCE_DIR/stages/files.txt" 2>&1

# ------------------------------------------------------------
# 5. RESET TIMING TEST
# ------------------------------------------------------------
echo -e "${YELLOW}[5/7]${NC} Testing reset timing..."

{
  echo "=== Reset Script Test ==="
  echo "Breaking environment..."
  sudo docker exec linuxbox rm -f /root/root.txt 2>&1 || true
  sudo docker exec db mysql -u ctfuser -pctf_pass ctfdb -e "DROP TABLE users;" 2>/dev/null || true
  sudo docker exec web rm -f /app/static/git-repo.zip 2>&1 || true

  echo "Running reset_box.sh..."
  START=$(date +%s)
  bash ~/ctf-box/scripts/reset_box.sh 2>&1
  END=$(date +%s)
  ELAPSED=$((END - START))
  echo ""
  echo "=== Reset completed in ${ELAPSED}s ==="

  echo ""
  echo "=== Verification After Reset ==="
  echo "--- Root flag ---"
  sudo docker exec linuxbox cat /root/root.txt 2>&1
  echo "--- SUID binary ---"
  sudo docker exec linuxbox ls -la /usr/local/bin/syscheck 2>&1
  echo "--- Git repo zip ---"
  sudo docker exec web ls -la /app/static/git-repo.zip 2>&1
  echo "--- DB tables ---"
  sudo docker exec db mysql -u ctfuser -pctf_pass ctfdb -e "SHOW TABLES;" 2>&1
} > "$EVIDENCE_DIR/reset/reset-test.txt" 2>&1

# ------------------------------------------------------------
# 6. GIT HISTORY
# ------------------------------------------------------------
echo -e "${YELLOW}[6/7]${NC} Capturing git history..."

{
  echo "=== Git Log ==="
  cd ~/ctf-box
  git log --oneline --all
  echo ""
  echo "=== Files Tracked ==="
  git ls-files | head -50
  echo ""
  echo "=== Recent Commits (detailed) ==="
  git log -10 --stat
} > "$EVIDENCE_DIR/git/history.txt" 2>&1

# ------------------------------------------------------------
# 7. PORT SCAN + NETWORK MAP
# ------------------------------------------------------------
echo -e "${YELLOW}[7/7]${NC} Capturing network state..."

{
  echo "=== Listening Ports on Host ==="
  sudo ss -tulpn | grep -E ":80|:8000|:22" || echo "No matching ports found"
  echo ""
  echo "=== Docker Networks ==="
  sudo docker network ls
  echo ""
  echo "=== Container Network IPs ==="
  for c in ctfd web db linuxbox; do
    echo "--- $c ---"
    sudo docker inspect $c --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>&1
  done
  echo ""
  echo "=== Port Mappings ==="
  sudo docker compose ps --format "table {{.Name}}\t{{.Ports}}"
} > "$EVIDENCE_DIR/network/ports.txt" 2>&1

# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------
echo ""
echo -e "${GREEN}============================================================${NC}"
echo "  EVIDENCE COLLECTION COMPLETE"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "  Location: $EVIDENCE_DIR"
echo ""
echo "  Contents:"
find "$EVIDENCE_DIR" -type f | sort

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review each file in $EVIDENCE_DIR"
echo "  2. Commit to Git: git add evidence/phase9 && git commit -m 'Phase 9: evidence'"
echo "  3. Include in your submission package"
echo ""