# Test Cases — Cyber Lockdown CTF

| TC | Test | Expected | Result |
|----|------|----------|--------|
| 01 | Register new user | Success | PASS |
| 02 | Solve Stage 1 with correct answers | 4/4 tasks verify | PASS |
| 03 | Submit wrong flag to CTFd | Rejected | PASS |
| 04 | Submit wrong answer in task | Rejected with message | PASS |
| 05 | Try to open Stage 3 before Stage 2 | Locked (padlock) | PASS |
| 06 | Stage 5 flag box hidden until tasks done | Hidden | PASS |
| 07 | Reset after destructive actions | <10s, all restored | PASS |
| 08 | Container → internet | Blocked | PASS |
| 09 | MySQL from Kali (port 3306) | Closed | PASS |
| 10 | Timer stops at 6/6 | Freezes | PASS |
