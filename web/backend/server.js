const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

/* ---------- MySQL ---------- */
const db = mysql.createPool({
  host: 'db', user: 'ctfuser', password: 'ctf_pass', database: 'ctfdb',
  waitForConnections: true, connectionLimit: 10
});

db.query(`CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(100),
  score INT DEFAULT 0
)`);

db.query(`CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT, challenge_id INT,
  awarded INT DEFAULT 0,
  solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_sub (user_id, challenge_id)
)`);

db.query(`ALTER TABLE submissions ADD COLUMN awarded INT DEFAULT 0`, () => {});

db.query(`CREATE TABLE IF NOT EXISTS unlocked_hints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT, challenge_id INT, hint_no INT,
  UNIQUE KEY unique_hint (user_id, challenge_id, hint_no)
)`);

db.query(`CREATE TABLE IF NOT EXISTS step_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT, challenge_id INT, step_no INT,
  UNIQUE KEY unique_step (user_id, challenge_id, step_no)
)`);

/* ---------- Challenges ---------- */
const CHALLENGES = [
  {
    id:1, stage:1, title:'The Insider Footprint', domain:'OSINT', difficulty:'Easy', points:100,
    tools:'git, curl, Web Browser',
    description:'A former Nova Tech employee leaked an internal Git repository shortly before resigning. The public copy was scrubbed, but history tells a different story. Investigate the leaked repository and recover what the insider exposed.',
    flag:'CTF{0s1nt_r3p0_m3t4d4t4_l34k}',
    resource:{ label:'Download Git Repo', url:'/challenge-files/git-repo.zip', filename:'git-repo.zip' },
    hints:[
      {no:1,text:'The repository history may contain information the current files do not.',penalty:5},
      {no:2,text:'Deleted files are still recoverable from older commits.',penalty:10},
      {no:3,text:'The flag was written next to the staging URL in the same deleted file. Run "git log -p" and read every line of the removed file — not just the URL.',penalty:15}
    ],
    steps:[
      {no:1, title:'Explore the repository',
        instruction:'Download and extract the leaked repository. Look at its complete history. How many commits exist in total? (a number)',
        placeholder:'number of commits', answer:'3'},
      {no:2, title:'Find the removed file',
        instruction:'Across those {prev} commits, one file was removed in the most recent commit. What is its filename?',
        placeholder:'filename', answer:'config.env'},
      {no:3, title:'Recover the URL',
        instruction:'View the contents of the removed {prev} file. It exposed an internal Nova Tech address. What is the full URL?',
        placeholder:'http://...', answer:'http://192.168.56.20/staging'},
      {no:4, title:'Extract the flag',
        instruction:'The {prev} page and the flag were both in that file. Recover the flag and submit it to complete the challenge.',
        placeholder:'CTF{...}', answer:'CTF{0s1nt_r3p0_m3t4d4t4_l34k}'}
    ]
  },
    {
    id:2, stage:2, title:'Corrupted Evidence', domain:'Forensics', difficulty:'Easy', points:150,
    tools:'Browser-based forensic tools, Image Zoom, Base64 decoder',
    description:'A Nova Tech workstation was recovered with a suspicious employee ID badge on it. The image looks ordinary, but the insider hid something in plain sight. Investigate the archive.',
    flag:'CTF{f0r3ns1c_h34d3r_r3p41r_2026}',
    resource:{
      label:'Open Internal Archive',
      url:'/forensics/',
      external: true
    },
    hints:[
      {no:1,text:'Some details are only visible when you look closely. Use the Image Zoom tool.',penalty:5},
      {no:2,text:'Not everything is in the metadata. Some things are in the pixels.',penalty:10},
      {no:3,text:'The employee username from the image unlocks their record in the Employee Lookup. The record returns a token. Decoding the token exposes a path. Investigate what the archive holds at that path.',penalty:15}
    ],
    steps:[
      {no:1, title:'Examine the badge',
        instruction:'Open the Nova Tech Internal Archive. A recovered employee ID badge is the only file. What is the employee ID number printed on the badge? (format NT-YYYY-NNNN)',
        placeholder:'NT-2026-XXXX', answer:'NT-2026-0417'},
      {no:2, title:'Look closer',
        instruction:'The employee with ID {prev} hid a secondary credential inside the image itself. Use the Image Zoom tool and inspect the corners. What is the hidden username?',
        placeholder:'username', answer:'auditr_2026'},
      {no:3, title:'Access the archive',
        instruction:'Use the username {prev} to search the internal archive. A base64-encoded token is returned. What is that token?',
        placeholder:'base64 token', answer:'L3NlY3VyZS9hdWRpdC0yMDI2LmxvZw=='},
      {no:4, title:'Retrieve the flag',
        instruction:'Decode the {prev} to reveal a file path. Open the file at that path to find the flag. What is it?',
        placeholder:'CTF{...}', answer:'CTF{f0r3ns1c_h34d3r_r3p41r_2026}'}
    ]
  },
    {
    id:3, stage:3, title:'Bypassing the Gatekeeper', domain:'Web Security', difficulty:'Moderate', points:200,
    tools:'Web Browser, Burp Suite, SQLmap',
    description:'The insider leaked a staging URL in Stage 1. That portal uses unsafe SQL query construction — a flaw the insider was aware of. Bypass the login, access the admin panel, and recover the audit flag.',
    flag:'CTF{sqli_4uth_byp4ss_s3cur3_l0g1n}',
    resource:{
      label:'Open Staging Portal',
      url:'/staging/',
      external: true
    },

    hints:[
      {no:1,text:'The staging URL was already exposed in Stage 1. Revisit that config file if needed.',penalty:5},
      {no:2,text:'The username field is where the flaw lives. Test with a single quote first.',penalty:10},
      {no:3,text:'After the SQLi bypass, you land on the admin dashboard. The flag is not rendered on the page — inspect the HTML source code and look for internal developer comments.',penalty:15}
    ],
    steps:[
      {no:1, title:'Locate the portal',
        instruction:'A leaked staging URL from an earlier stage points to an internal employee login page. What is the URL path of that portal? (just the path, no domain, no leading slash)',
        placeholder:'path', answer:'staging'},
      {no:2, title:'Identify the flaw',
        instruction:'The portal at /{prev} accepts unsanitised input in the login form. Submit a single quote character in the username field and observe the response. What class of vulnerability does this reveal? (4-letter abbreviation)',
        placeholder:'xxxx', answer:'sqli',
        altAnswers: ['sql injection', 'sql-injection', 'sql-i']},
      {no:3, title:'Craft the bypass',
        instruction:'You have confirmed {prev}. To make the login query always return a row, inject a condition that is always true and comment out the rest of the query. What is the complete payload you would enter in the username field? (format: \' OR 1=1 -- -)',
        placeholder:'payload', answer:"' OR 1=1 -- -",
        altAnswers: [
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
        ]},
      {no:4, title:'Retrieve the audit flag',
        instruction:'Enter the payload {prev} into the portal\'s login form with any password. Authentication is bypassed and you are taken to the staging admin dashboard. The flag is not shown on the page — inspect the page source to recover it.',
        placeholder:'CTF{...}', answer:'CTF{sqli_4uth_byp4ss_s3cur3_l0g1n}'}
    ]
  },
  {
    id:4, stage:4, title:'Unraveling the Cipher', domain:'Cryptography', difficulty:'Moderate', points:250,
    tools:'Python 3, pycryptodome, base64',
    description:'An encrypted log file was recovered from the staging server. The insider built their own encryption pipeline — but they left the key behind. Reverse the encoding, identify the cipher, find the key, and recover the flag.',
    flag:'CTF{cr3pt0_w34k_k3y_d3cr2pt3d}',
    resource:[
      { label:'Download Evidence Package', url:'/challenge-files/stage4_evidence.zip', filename:'stage4_evidence.zip' },
      { label:'Open Staging Portal', url:'/staging/', external: true }
    ],
    hints:[
      {no:1,text:'The file looks like text but it is not plaintext. Standard encoding tools will identify the first layer.',penalty:5},
      {no:2,text:'After decoding, the data comes in fixed 16-byte blocks — the signature of a well-known block cipher.',penalty:10},
      {no:3,text:'The AES key is exposed as an HTML comment in the deployed staging portal (Stage 3). Revisit it and press Ctrl+U. A starter decryptor script is bundled with the evidence package.',penalty:15}
    ],
    steps:[
      {no:1, title:'Identify the encoding',
        instruction:'Download the evidence package, extract it, and inspect the encrypted file. It is not raw binary — it is wrapped in a printable encoding. Which encoding scheme was used? (one word)',
        placeholder:'encoding', answer:'base64'},
      {no:2, title:'Identify the cipher',
        instruction:'After decoding the {prev}, you are left with a block of binary ciphertext. The decoded bytes come in fixed-size blocks. Which symmetric cipher was used? (3 letters)',
        placeholder:'xxx', answer:'aes'},
      {no:3, title:'Locate the key',
        instruction:'You have confirmed the use of {prev}. The insider left the encryption key exposed in the staging portal from Stage 3 — open it and inspect what the browser hides from ordinary visitors. Where do developers frequently leave sensitive strings that are visible only to those who inspect the page? (one word)',
        placeholder:'location', answer:'comment'},
      {no:4, title:'Decrypt and submit',
        instruction:'The key was hidden in a {prev} on the staging portal (Stage 3). Extract the evidence package, supply the key you found, and run the bundled decryptor script against the encrypted file. Submit the flag it reveals.',
        placeholder:'CTF{...}', answer:'CTF{cr3pt0_w34k_k3y_d3cr2pt3d}'}
    ]
  },
  {
    id:5, stage:5, title:'Packet Analysis & Key Recovery', domain:'Network Analysis', difficulty:'Moderate', points:300,
    tools:'Wireshark, tshark, ssh-keygen',
    description:'A Nova Tech incident response team captured network traffic moments before the insider disconnected. Something sensitive was exfiltrated. Recover it.',
    flag:'CTF{p4ck3t_f0r3ns1cs_k3y_r3c0v3r3d}',
    resource:{ label:'Download PCAP', url:'/challenge-files/incident.pcap', filename:'incident.pcap' },
    hints:[
      {no:1,text:'Multiple protocols are present. Only one carries credentials in plaintext.',penalty:5},
      {no:2,text:'Look at the higher-numbered TCP streams — that is where the data was transferred.',penalty:10},
      {no:3,text:'Once you reassemble the suspicious stream, look at the very top of the recovered file. A comment block sits above the key — the flag is written inside it.',penalty:15}
    ],
    steps:[
      {no:1, title:'Tool',
        instruction:'You have a packet capture. Which tool opens .pcap files? (one word)',
        placeholder:'tool', answer:'wireshark'},
      {no:2, title:'Stream',
        instruction:'Opened in {prev}. One TCP stream contains the exfiltrated data. Which display filter isolates it? (include spaces)',
        placeholder:'display filter', answer:'tcp.stream eq 3'},
      {no:3, title:'Protocol',
        instruction:'{prev} reveals a plaintext transfer. Which protocol was used? (3 letters)',
        placeholder:'xxx', answer:'ftp'},
      {no:4, title:'Artifact',
        instruction:'{prev} transferred a sensitive file. What is its filename?',
        placeholder:'filename', answer:'id_rsa'},
      {no:5, title:'Recover the key',
        instruction:'Extract the {prev} private key from the captured stream. The key authenticates as a specific Nova Tech user. Which user does it belong to? (just the username)',
        placeholder:'username', answer:'developer'}
    ]
  },
  {
    id:6, stage:6, title:'Crown Jewels (Root Access)', domain:'Linux System', difficulty:'Hard', points:400,
    tools:'ssh, find, strings, cat, LinPEAS',
    description:'You have recovered an SSH private key from the packet capture. The insider left a backdoor on the target system before disconnecting. Log in, find it, and escalate to root to retrieve the master flag.',
    flag:'CTF{r00t_pr1v_3sc_c4pst0n3_m4st3r}',
    hints:[
      {no:1,text:'SUID binaries run with elevated privileges. One of them is not part of a standard system.',penalty:5},
      {no:2,text:'Inspect the unusual binary — look at how it invokes other programs.',penalty:10},
      {no:3,text:'The root flag is stored in a file only root can read. Once you hijack the PATH, re-run the SUID binary — it will execute your fake command as root, which can print the flag file.',penalty:15}
    ],
    steps:[
      {no:1, title:'Authenticate',
        instruction:'Use the SSH key recovered in Stage 5 to log into the target host. Which user account is the key associated with?',
        placeholder:'username', answer:'developer'},
      {no:2, title:'Enumerate privileged binaries',
        instruction:'Logged in as {prev}. Now search the filesystem for SUID binaries — executables that run with elevated privileges. Which standard command locates them? (one word, 4 letters)',
        placeholder:'command', answer:'find'},
      {no:3, title:'Identify the backdoor',
        instruction:'Your {prev} search reveals multiple SUID binaries. Most are standard system tools. Which one is NOT part of a default Linux system?',
        placeholder:'binary name', answer:'syscheck'},
      {no:4, title:'Study the binary',
        instruction:'Run {prev} and inspect its strings. Which standard binary does it invoke internally without using an absolute path?',
        placeholder:'command', answer:'cat'},
      {no:5, title:'Classify the attack',
        instruction:'Because {prev} is called without a full path, the binary relies on the PATH variable. What class of attack exploits this? (two words)',
        placeholder:'two words', answer:'path hijacking'},
      {no:6, title:'Locate the target',
        instruction:'You have everything needed to escalate. What is the full path of the file containing the root flag?',
        placeholder:'/path/to/file', answer:'/root/root.txt'},
      {no:7, title:'Capture the master flag',
        instruction:'You now know the target path. Hijack the PATH to escalate to root and read the flag file. Submit it here to complete the challenge.',
        placeholder:'CTF{...}', answer:'CTF{r00t_pr1v_3sc_c4pst0n3_m4st3r}'}
    ]
  }
];

/* ---------- Auth middleware ---------- */
function auth(req, res, next) {
  const h = req.headers['authorization'];
  const token = h && h.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  const uid = token.replace('token_', '');
  db.query('SELECT * FROM users WHERE id = ?', [uid], (err, rows) => {
    if (err || rows.length === 0) return res.status(403).json({ error: 'Invalid token' });
    req.user = rows[0];
    next();
  });
}

/* ---------- Auth routes ---------- */
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
  db.query('INSERT INTO users (username,email,password) VALUES (?,?,?)',
    [username, email, password],
    (err) => {
      if (err) return res.status(400).json({ error: 'Username or email already exists' });
      res.json({ success: true });
    });
});

/* --- INTENTIONALLY VULNERABLE (Stage 3 SQLi) --- */
app.post('/api/auth/login', (req, res) => {
  const { login, password } = req.body;
  const q = `SELECT * FROM users WHERE (username = '${login}' OR email = '${login}') AND password = '${password}'`;
  db.query(q, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Query failed' });
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: 'token_' + rows[0].id, user: { username: rows[0].username, score: rows[0].score } });
  });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ username: req.user.username, score: req.user.score });
});

/* ---------- Challenges ---------- */
app.get('/api/challenges', auth, (req, res) => {
  db.query('SELECT challenge_id, awarded FROM submissions WHERE user_id = ?', [req.user.id], (err, solved) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    const solvedMap = {};
    (solved || []).forEach(s => { solvedMap[s.challenge_id] = s.awarded || 0; });
    const solvedIds = (solved || []).map(s => s.challenge_id);

    db.query('SELECT challenge_id, hint_no FROM unlocked_hints WHERE user_id = ?', [req.user.id], (e2, unlocked) => {
      db.query('SELECT challenge_id, step_no FROM step_progress WHERE user_id = ?', [req.user.id], (e3, steps) => {
        const unlockedMap = {};
        (unlocked || []).forEach(u => {
          unlockedMap[u.challenge_id] = unlockedMap[u.challenge_id] || [];
          unlockedMap[u.challenge_id].push(u.hint_no);
        });
        const stepMap = {};
        (steps || []).forEach(s => {
          stepMap[s.challenge_id] = stepMap[s.challenge_id] || [];
          stepMap[s.challenge_id].push(s.step_no);
        });

        const list = CHALLENGES.map(c => {
          const isSolved = solvedIds.includes(c.id);
          const isLocked = c.stage > 1 && !solvedIds.includes(c.id - 1);
          const completedList = stepMap[c.id] || [];
          const awarded = isSolved ? (solvedMap[c.id] || 0) : 0;

          // Build steps with {prev} substitution
          const chSteps = c.steps.map((s, idx) => {
            const prevStep = idx > 0 ? c.steps[idx - 1] : null;
            const prevDone = !prevStep || completedList.includes(prevStep.no);

            let instruction = s.instruction;
            if (instruction.includes('{prev}')) {
              if (prevDone && prevStep) {
                instruction = instruction.replace('{prev}', prevStep.answer);
              } else {
                instruction = '🔒 Complete the previous step to reveal this instruction.';
              }
            }

            return {
              no: s.no,
              title: s.title,
              instruction,
              placeholder: s.placeholder
            };
          });

          return {
            ...c,
            hints: c.hints.map(h => ({
              ...h,
              unlocked: (unlockedMap[c.id] || []).includes(h.no),
              text: (unlockedMap[c.id] || []).includes(h.no) ? h.text : null
            })),
            steps: chSteps,
            completedSteps: completedList,
            solved: isSolved,
            locked: isLocked,
            awarded: awarded,
            solves: 0
          };
        });
        res.json({ challenges: list });
      });
    });
  });
});

/* --- Step verification with auto-complete on final step --- */
app.post('/api/challenges/:id/steps/:no/verify', auth, (req, res) => {
  const cid = parseInt(req.params.id, 10);
  const no = parseInt(req.params.no, 10);
  const { answer } = req.body;
  const ch = CHALLENGES.find(c => c.id === cid);
  if (!ch) return res.status(404).json({ error: 'Challenge not found' });
  const step = ch.steps.find(s => s.no === no);
  if (!step) return res.status(404).json({ error: 'Step not found' });

  const clean = (answer || '').trim().toLowerCase();
  const expected = step.answer.toLowerCase();
  const alternatives = (step.altAnswers || []).map(a => a.toLowerCase());

  const matches = clean === expected || alternatives.includes(clean);
  if (!matches) return res.json({ correct: false, message: 'Incorrect answer. Try again.' });

  // Save step progress
  db.query('INSERT IGNORE INTO step_progress (user_id, challenge_id, step_no) VALUES (?,?,?)',
    [req.user.id, cid, no]);

  // Is this the last step?
  const isLastStep = no === ch.steps[ch.steps.length - 1].no;

  if (!isLastStep) {
    return res.json({ correct: true });
  }

  // For stages 1-4 and 6: last step IS the flag → auto-complete + award
  // For stage 5: last step is 'developer', flag must be submitted separately
  const lastStepAnswer = ch.steps[ch.steps.length - 1].answer;
  const lastStepIsFlag = lastStepAnswer.toLowerCase() === ch.flag.toLowerCase();

  if (!lastStepIsFlag) {
    // Stage 5 pattern — do NOT auto-complete; wait for flag submission
    return res.json({ correct: true, flagRequired: true });
  }

  // Auto-complete for other stages
  db.query('SELECT hint_no FROM unlocked_hints WHERE user_id = ? AND challenge_id = ?',
    [req.user.id, cid], (err, hintRows) => {
      const unlockedNos = (hintRows || []).map(r => r.hint_no);
      let penalty = 0;
      ch.hints.forEach(h => {
        if (unlockedNos.includes(h.no)) penalty += h.penalty;
      });
      const awarded = Math.max(0, ch.points - penalty);

      db.query('SELECT * FROM submissions WHERE user_id = ? AND challenge_id = ?',
        [req.user.id, cid], (err2, rows) => {
          if (rows && rows.length > 0) {
            return res.json({
              correct: true,
              challengeComplete: true,
              alreadySolved: true,
              awarded: rows[0].awarded || ch.points,
              basePoints: ch.points,
              hintPenalty: ch.points - (rows[0].awarded || ch.points)
            });
          }

          db.query('INSERT INTO submissions (user_id, challenge_id, awarded) VALUES (?,?,?)',
            [req.user.id, cid, awarded]);
          db.query('UPDATE users SET score = score + ? WHERE id = ?', [awarded, req.user.id]);

          res.json({
            correct: true,
            challengeComplete: true,
            awarded,
            basePoints: ch.points,
            hintPenalty: penalty
          });
        });
    });
});

/* --- Flag submission (used by Stage 5) --- */
app.post('/api/challenges/:id/submit', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { flag } = req.body;
  const ch = CHALLENGES.find(c => c.id === id);
  if (!ch) return res.status(404).json({ error: 'Not found' });
  if (ch.flag !== flag) return res.json({ correct: false, message: 'Incorrect flag. Try again.' });

  db.query('SELECT hint_no FROM unlocked_hints WHERE user_id = ? AND challenge_id = ?',
    [req.user.id, id], (err, hintRows) => {
      const unlockedNos = (hintRows || []).map(r => r.hint_no);
      let penalty = 0;
      ch.hints.forEach(h => {
        if (unlockedNos.includes(h.no)) penalty += h.penalty;
      });
      const awarded = Math.max(0, ch.points - penalty);

      db.query('SELECT * FROM submissions WHERE user_id = ? AND challenge_id = ?',
        [req.user.id, id], (err2, rows) => {
          if (rows && rows.length > 0) {
            const prevAwarded = rows[0].awarded || ch.points;
            return res.json({
              correct: true,
              alreadySolved: true,
              awarded: prevAwarded,
              basePoints: ch.points,
              hintPenalty: ch.points - prevAwarded
            });
          }

          db.query('INSERT INTO submissions (user_id, challenge_id, awarded) VALUES (?,?,?)',
            [req.user.id, id, awarded]);
          db.query('UPDATE users SET score = score + ? WHERE id = ?', [awarded, req.user.id]);

          res.json({
            correct: true,
            awarded,
            basePoints: ch.points,
            hintPenalty: penalty
          });
        });
    });
});

app.post('/api/challenges/:id/hints/:no/unlock', auth, (req, res) => {
  const cid = parseInt(req.params.id, 10);
  const no = parseInt(req.params.no, 10);
  const ch = CHALLENGES.find(c => c.id === cid);
  const hint = ch && ch.hints.find(h => h.no === no);
  if (!hint) return res.status(404).json({ error: 'Hint not found' });

  db.query('SELECT * FROM unlocked_hints WHERE user_id=? AND challenge_id=? AND hint_no=?',
    [req.user.id, cid, no], (err, rows) => {
      const already = rows && rows.length > 0;
      if (!already) {
        db.query('INSERT INTO unlocked_hints (user_id,challenge_id,hint_no) VALUES (?,?,?)',
          [req.user.id, cid, no]);
      }
      res.json({
        success: true,
        alreadyUnlocked: already,
        hint: { text: hint.text, penalty: hint.penalty }
      });
    });
});

/* ---------- Scoreboard ---------- */
app.get('/api/scoreboard', auth, (req, res) => {
  db.query(
    `SELECT u.username, u.score, COUNT(s.id) AS solved
     FROM users u LEFT JOIN submissions s ON u.id = s.user_id
     GROUP BY u.id ORDER BY u.score DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows);
    });
});

/* ---------- Staging portal (Stage 3) ---------- */
const sqliSessions = new Set();

app.post('/api/staging-login', (req, res) => {
  const { username, password } = req.body;

  // Detect SQL injection attempt
  const sqliPatterns = [
    /'\s*or\s+1\s*=\s*1/i,
    /'\s*or\s+'1'\s*=\s*'1/i,
    /--/,
    /#/,
    /\/\*/,
    /'\s*or\s+true/i,
  ];
  const isSqli = sqliPatterns.some(p => p.test(username));

  if (isSqli) {
    const token = 'admin_' + Math.random().toString(36).slice(2, 14);
    sqliSessions.add(token);
    return res.json({ success: true, adminUrl: '/staging/admin?token=' + token });
  }

  // Normal (non-SQLi) login attempt — always fails for the staging portal
  return res.status(401).json({ success: false, error: 'Invalid credentials.' });
});

app.get('/staging/admin', (req, res) => {
  const { token } = req.query;
  if (!token || !sqliSessions.has(token)) {
    return res.redirect('/staging/');
  }
  res.sendFile('/app/static/staging/admin.html');
});

/* ---------- Static + SPA ---------- */
app.use('/staging', express.static('/app/static/staging'));
app.use('/challenge-files', express.static('/app/static'));
app.use('/forensics', express.static('/app/static/forensics'));
app.use(express.static('/app/frontend/dist'));
app.get('*', (req, res) => res.sendFile('/app/frontend/dist/index.html'));

app.listen(3000, () => console.log('Backend running on port 3000'));