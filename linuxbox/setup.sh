#!/bin/bash
set -e

# Compile the SUID binary
gcc -o /usr/local/bin/syscheck /tmp/syscheck.c
chown root:root /usr/local/bin/syscheck
chmod 4755 /usr/local/bin/syscheck

# Lock down SSH key permissions
chown -R developer:developer /home/developer/.ssh
chmod 600 /home/developer/.ssh/authorized_keys

# Root flag
echo "CTF{r00t_pr1v_3sc_c4pst0n3_m4st3r}" > /root/root.txt
chmod 600 /root/root.txt

# Decoy file
echo "Nova Tech internal audit completed 2026-03-15" > /root/audit.log
chmod 600 /root/audit.log