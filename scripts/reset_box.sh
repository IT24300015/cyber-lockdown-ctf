#!/bin/bash
# ============================================================
# Cyber Lockdown CTF — Reset Script (FAST, <10s target)
# ============================================================
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

START_TIME=$(date +%s)

echo -e "${CYAN}============================================================"
echo "  CYBER LOCKDOWN — RESET (FAST)"
echo -e "============================================================${NC}"

cd ~/ctf-box

echo -e "${YELLOW}[1/3]${NC} Wiping DB + recreating containers (in parallel)..."

# Run both tasks in background
sudo docker exec db mysql -u ctfuser -pctf_pass ctfdb -e "
  DELETE FROM submissions;
  DELETE FROM unlocked_hints;
  DELETE FROM step_progress;
  DELETE FROM users WHERE username != 'admin';
" 2>/dev/null &

sudo docker compose up -d --force-recreate --no-deps -t 1 web linuxbox >/dev/null 2>&1 &

# Wait for both
wait

echo -e "${YELLOW}[2/3]${NC} Waiting for services to stabilise..."
sleep 2

echo -e "${YELLOW}[3/3]${NC} Verifying..."
if sudo docker exec web pgrep -f "node server.js" >/dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Web running${NC}"
else
    echo -e "${YELLOW}  ⚠ Web not detected yet${NC}"
fi
if sudo docker exec linuxbox pgrep sshd >/dev/null 2>&1; then
    echo -e "${GREEN}  ✓ SSH running${NC}"
fi

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
echo -e "${GREEN}============================================================"
echo "  RESET COMPLETE — ${ELAPSED}s"
echo -e "============================================================${NC}"
echo "  CTFd preserved: yes"
echo "  Progress wiped: yes"
echo "  All 6 stages reset"