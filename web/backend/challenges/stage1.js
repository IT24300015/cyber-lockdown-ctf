// Stage 1 — auto-extracted from server.js
module.exports = {
  "id": 1,
  "stage": 1,
  "title": "The Insider Footprint",
  "domain": "OSINT",
  "difficulty": "Easy",
  "points": 100,
  "tools": "git, curl, Web Browser",
  "description": "A former Nova Tech employee leaked an internal Git repository shortly before resigning. The public copy was scrubbed, but history tells a different story. Investigate the leaked repository and recover what the insider exposed.",
  "flag": "CTF{0s1nt_r3p0_m3t4d4t4_l34k}",
  "resource": {
    "label": "Download Git Repo",
    "url": "/challenge-files/git-repo.zip",
    "filename": "git-repo.zip"
  },
  "hints": [
    {
      "no": 1,
      "text": "The repository history may contain information the current files do not.",
      "penalty": 5
    },
    {
      "no": 2,
      "text": "Deleted files are still recoverable from older commits.",
      "penalty": 10
    },
    {
      "no": 3,
      "text": "The flag was written next to the staging URL in the same deleted file. Run \"git log -p\" and read every line of the removed file — not just the URL.",
      "penalty": 15
    }
  ],
  "steps": [
    {
      "no": 1,
      "title": "Explore the repository",
      "instruction": "Download and extract the leaked repository. Look at its complete history. How many commits exist in total? (a number)",
      "placeholder": "number of commits",
      "answer": "3"
    },
    {
      "no": 2,
      "title": "Find the removed file",
      "instruction": "Across those {prev} commits, one file was removed in the most recent commit. What is its filename?",
      "placeholder": "filename",
      "answer": "config.env"
    },
    {
      "no": 3,
      "title": "Recover the URL",
      "instruction": "View the contents of the removed {prev} file. It exposed an internal Nova Tech address. What is the full URL?",
      "placeholder": "http://...",
      "answer": "http://192.168.56.20/staging"
    },
    {
      "no": 4,
      "title": "Extract the flag",
      "instruction": "The {prev} page and the flag were both in that file. Recover the flag and submit it to complete the challenge.",
      "placeholder": "CTF{...}",
      "answer": "CTF{0s1nt_r3p0_m3t4d4t4_l34k}"
    }
  ]
};
