// Stage 2 — auto-extracted from server.js
module.exports = {
  "id": 2,
  "stage": 2,
  "title": "Corrupted Evidence",
  "domain": "Forensics",
  "difficulty": "Easy",
  "points": 150,
  "tools": "Browser-based forensic tools, Image Zoom, Base64 decoder",
  "description": "A Nova Tech workstation was recovered with a suspicious employee ID badge on it. The image looks ordinary, but the insider hid something in plain sight. Investigate the archive.",
  "flag": "CTF{f0r3ns1c_h34d3r_r3p41r_2026}",
  "resource": {
    "label": "Open Internal Archive",
    "url": "/forensics/",
    "external": true
  },
  "hints": [
    {
      "no": 1,
      "text": "Some details are only visible when you look closely. Use the Image Zoom tool.",
      "penalty": 5
    },
    {
      "no": 2,
      "text": "Not everything is in the metadata. Some things are in the pixels.",
      "penalty": 10
    },
    {
      "no": 3,
      "text": "The employee username from the image unlocks their record in the Employee Lookup. The record returns a token. Decoding the token exposes a path. Investigate what the archive holds at that path.",
      "penalty": 15
    }
  ],
  "steps": [
    {
      "no": 1,
      "title": "Examine the badge",
      "instruction": "Open the Nova Tech Internal Archive. A recovered employee ID badge is the only file. What is the employee ID number printed on the badge? (format NT-YYYY-NNNN)",
      "placeholder": "NT-2026-XXXX",
      "answer": "NT-2026-0417"
    },
    {
      "no": 2,
      "title": "Look closer",
      "instruction": "The employee with ID {prev} hid a secondary credential inside the image itself. Use the Image Zoom tool and inspect the corners. What is the hidden username?",
      "placeholder": "username",
      "answer": "auditr_2026"
    },
    {
      "no": 3,
      "title": "Access the archive",
      "instruction": "Use the username {prev} to search the internal archive. A base64-encoded token is returned. What is that token?",
      "placeholder": "base64 token",
      "answer": "L3NlY3VyZS9hdWRpdC0yMDI2LmxvZw=="
    },
    {
      "no": 4,
      "title": "Retrieve the flag",
      "instruction": "Decode the {prev} to reveal a file path. Open the file at that path to find the flag. What is it?",
      "placeholder": "CTF{...}",
      "answer": "CTF{f0r3ns1c_h34d3r_r3p41r_2026}"
    }
  ]
};
