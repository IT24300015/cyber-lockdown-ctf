// Stage 6 — auto-extracted from server.js
module.exports = {
  "id": 6,
  "stage": 6,
  "title": "Crown Jewels (Root Access)",
  "domain": "Linux System",
  "difficulty": "Hard",
  "points": 400,
  "tools": "ssh, find, strings, cat, LinPEAS",
  "description": "You have recovered an SSH private key from the packet capture. The insider left a backdoor on the target system before disconnecting. Log in, find it, and escalate to root to retrieve the master flag.",
  "flag": "CTF{r00t_pr1v_3sc_c4pst0n3_m4st3r}",
  "hints": [
    {
      "no": 1,
      "text": "SUID binaries run with elevated privileges. One of them is not part of a standard system.",
      "penalty": 5
    },
    {
      "no": 2,
      "text": "Inspect the unusual binary — look at how it invokes other programs.",
      "penalty": 10
    },
    {
      "no": 3,
      "text": "The root flag is stored in a file only root can read. Once you hijack the PATH, re-run the SUID binary — it will execute your fake command as root, which can print the flag file.",
      "penalty": 15
    }
  ],
  "steps": [
    {
      "no": 1,
      "title": "Authenticate",
      "instruction": "Use the SSH key recovered in Stage 5 to log into the target host. Which user account is the key associated with?",
      "placeholder": "username",
      "answer": "developer"
    },
    {
      "no": 2,
      "title": "Enumerate privileged binaries",
      "instruction": "Logged in as {prev}. Now search the filesystem for SUID binaries — executables that run with elevated privileges. Which standard command locates them? (one word, 4 letters)",
      "placeholder": "command",
      "answer": "find"
    },
    {
      "no": 3,
      "title": "Identify the backdoor",
      "instruction": "Your {prev} search reveals multiple SUID binaries. Most are standard system tools. Which one is NOT part of a default Linux system?",
      "placeholder": "binary name",
      "answer": "syscheck"
    },
    {
      "no": 4,
      "title": "Study the binary",
      "instruction": "Run {prev} and inspect its strings. Which standard binary does it invoke internally without using an absolute path?",
      "placeholder": "command",
      "answer": "cat"
    },
    {
      "no": 5,
      "title": "Classify the attack",
      "instruction": "Because {prev} is called without a full path, the binary relies on the PATH variable. What class of attack exploits this? (two words)",
      "placeholder": "two words",
      "answer": "path hijacking"
    },
    {
      "no": 6,
      "title": "Locate the target",
      "instruction": "You have everything needed to escalate. What is the full path of the file containing the root flag?",
      "placeholder": "/path/to/file",
      "answer": "/root/root.txt"
    },
    {
      "no": 7,
      "title": "Capture the master flag",
      "instruction": "You now know the target path. Hijack the PATH to escalate to root and read the flag file. Submit it here to complete the challenge.",
      "placeholder": "CTF{...}",
      "answer": "CTF{r00t_pr1v_3sc_c4pst0n3_m4st3r}"
    }
  ]
};
