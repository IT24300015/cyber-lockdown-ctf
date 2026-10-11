// Stage 4 — auto-extracted from server.js
module.exports = {
  "id": 4,
  "stage": 4,
  "title": "Unraveling the Cipher",
  "domain": "Cryptography",
  "difficulty": "Moderate",
  "points": 250,
  "tools": "Python 3, pycryptodome, base64",
  "description": "An encrypted log file was recovered from the staging server. The insider built their own encryption pipeline — but they left the key behind. Reverse the encoding, identify the cipher, find the key, and recover the flag.",
  "flag": "CTF{cr3pt0_w34k_k3y_d3cr2pt3d}",
  "resource": [
    {
      "label": "Download Evidence Package",
      "url": "/challenge-files/stage4_evidence.zip",
      "filename": "stage4_evidence.zip"
    },
    {
      "label": "Open Staging Portal",
      "url": "/staging/",
      "external": true
    }
  ],
  "hints": [
    {
      "no": 1,
      "text": "The file looks like text but it is not plaintext. Standard encoding tools will identify the first layer.",
      "penalty": 5
    },
    {
      "no": 2,
      "text": "After decoding, the data comes in fixed 16-byte blocks — the signature of a well-known block cipher.",
      "penalty": 10
    },
    {
      "no": 3,
      "text": "The AES key is exposed as an HTML comment in the deployed staging portal (Stage 3). Revisit it and press Ctrl+U. A starter decryptor script is bundled with the evidence package.",
      "penalty": 15
    }
  ],
  "steps": [
    {
      "no": 1,
      "title": "Identify the encoding",
      "instruction": "Download the evidence package, extract it, and inspect the encrypted file. It is not raw binary — it is wrapped in a printable encoding. Which encoding scheme was used? (one word)",
      "placeholder": "encoding",
      "answer": "base64"
    },
    {
      "no": 2,
      "title": "Identify the cipher",
      "instruction": "After decoding the {prev}, you are left with a block of binary ciphertext. The decoded bytes come in fixed-size blocks. Which symmetric cipher was used? (3 letters)",
      "placeholder": "xxx",
      "answer": "aes"
    },
    {
      "no": 3,
      "title": "Locate the key",
      "instruction": "You have confirmed the use of {prev}. The insider left the encryption key exposed in the staging portal from Stage 3 — open it and inspect what the browser hides from ordinary visitors. Where do developers frequently leave sensitive strings that are visible only to those who inspect the page? (one word)",
      "placeholder": "location",
      "answer": "comment"
    },
    {
      "no": 4,
      "title": "Decrypt and submit",
      "instruction": "The key was hidden in a {prev} on the staging portal (Stage 3). Extract the evidence package, supply the key you found, and run the bundled decryptor script against the encrypted file. Submit the flag it reveals.",
      "placeholder": "CTF{...}",
      "answer": "CTF{cr3pt0_w34k_k3y_d3cr2pt3d}"
    }
  ]
};
