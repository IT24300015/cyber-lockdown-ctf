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

// Safe migration: add awarded column if it doesn't exist
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
      {no:2,text:'Deleted files are still recoverable from older commits.',penalty:10}
    ],
    steps:[
      {no:1, title:'Understand the repository',
        instruction:'Download and extract the leaked repository. Something was removed before the public push. What is the filename that was deleted in the most recent commit?',
        placeholder:'filename (e.g. secrets.txt)', answer:'config.env'},
      {no:2, title:'Recover the leaked URL',
        instruction:'The deleted file contained an internal Nova Tech address. What is the full staging URL that the insider exposed?',
        placeholder:'http://...', answer:'http://192.168.56.20/staging'},
      {no:3, title:'Extract the flag',
        instruction:'The same file also contained the flag. Extract it from the recovered file contents and submit it.',
        placeholder:'CTF{...}', answer:'CTF{0s1nt_r3p0_m3t4d4t4_l34k}'}
    ]
  },
  {
    id:2, stage:2, title:'Corrupted Evidence', domain:'Forensics', difficulty:'Easy', points:150,
    tools:'file, xxd, strings, Hex Editor',
    description:'A damaged disk artifact was recovered from the staging server. Its header appears tampered with. Rebuild the file, and recover the artifact hidden inside.',
    flag:'CTF{f0r3ns1c_h34d3r_r3p41r_2026}',
    resource:{ label:'Download Corrupted File', url:'/challenge-files/corrupted_log.bin', filename:'corrupted_log.bin' },
    hints:[
      {no:1,text:'Standard file utilities cannot recognise a file with a corrupted header.',penalty:5},
      {no:2,text:'Every file format begins with specific magic bytes. Identify the correct ones.',penalty:10}
    ],
    steps:[
      {no:1, title:'Identify the artifact',
        instruction:'Download the corrupted file. Your first task is to determine what the file actually is. What does a standard file-inspection tool report as its type?',
        placeholder:'file type', answer:'data'},
      {no:2, title:'Examine the header',
        instruction:'The file is not what it claims to be. Inspect its very first bytes with a hex tool. What are the first 4 bytes? (lowercase hex, no spaces)',
        placeholder:'xxxxxxxx', answer:'89504e47'},
      {no:3, title:'Recognise the format',
        instruction:'Those 4 bytes are a well-known magic number. Which file format do they belong to? (3 letters)',
        placeholder:'png', answer:'png'},
      {no:4, title:'Prepare to extract',
        instruction:'Once the header is repaired, the file must be mined for readable content. Which standard utility extracts human-readable text from a binary? (one word)',
        placeholder:'command', answer:'strings'},
      {no:5, title:'Capture the flag',
        instruction:'After repairing the file, recover the flag that was hidden inside it. Submit it below.',
        placeholder:'CTF{...}', answer:'CTF{f0r3ns1c_h34d3r_r3p41r_2026}'}
    ]
  },
  {
    id:3, stage:3, title:'Bypassing the Gatekeeper', domain:'Web Security', difficulty:'Moderate', points:200,
    tools:'Burp Suite, SQLmap, Web Browser',
    description:'The Nova Tech staging login portal does not safely handle user input. Exploit the flaw, bypass authentication, and access the admin session that holds the flag.',
    flag:'CTF{sqli_4uth_byp4ss_s3cur3_l0g1n}',
    hints:[
      {no:1,text:'Try entering unusual characters into the login form and observe the error responses.',penalty:5},
      {no:2,text:'A generic always-true condition combined with a comment operator will defeat the check.',penalty:10}
    ],
    steps:[
      {no:1, title:'Classify the flaw',
        instruction:'The login form lets user input reach the database query without sanitisation. Which class of attack does this enable? (4-letter abbreviation)',
        placeholder:'xxxx', answer:'sqli'},
      {no:2, title:'Confirm the flaw',
        instruction:'To test whether input is breaking the query, what single character is typically inserted first?',
        placeholder:'one character', answer:"'"},
      {no:3, title:'Craft the bypass',
        instruction:'To make the whole WHERE clause return true regardless of the password, which SQL condition is used? (no spaces, e.g. X=Y)',
        placeholder:'x=y', answer:'1=1'},
      {no:4, title:'Silence the rest',
        instruction:'The rest of the query must be discarded. Which 2-character SQL comment operator does this?',
        placeholder:'--', answer:'--'},
      {no:5, title:'Capture the flag',
        instruction:'Combine your payload, log in as admin, and submit the flag revealed on the dashboard.',
        placeholder:'CTF{...}', answer:'CTF{sqli_4uth_byp4ss_s3cur3_l0g1n}'}
    ]
  },
  {
    id:4, stage:4, title:'Unraveling the Cipher', domain:'Cryptography', difficulty:'Moderate', points:250,
    tools:'CyberChef, Python 3, Web Browser',
    description:'An encrypted log file was recovered from the staging server. The Nova Tech encryption scheme is intentionally weak, and the key has been carelessly leaked somewhere. Reverse the encryption and recover the stolen data.',
    flag:'CTF{cr3pt0_w34k_k3y_d3cr2pt3d}',
    resource:{ label:'Download Encrypted File', url:'/challenge-files/exfil.enc', filename:'exfil.enc' },
    hints:[
      {no:1,text:'The file contents look like printable characters, but they are not the real data.',penalty:5},
      {no:2,text:'The encryption key was accidentally committed to the source code of the login page.',penalty:10}
    ],
    steps:[
      {no:1, title:'Identify the outer encoding',
        instruction:'Open the exfil.enc file. The data is not raw ciphertext — it is wrapped in a common printable encoding. Which encoding scheme is it? (one word)',
        placeholder:'encoding', answer:'base64'},
      {no:2, title:'Identify the inner cipher',
        instruction:'After decoding, the result is a block of ciphertext. Which symmetric encryption algorithm was used? (3 letters)',
        placeholder:'xxx', answer:'aes'},
      {no:3, title:'Determine the key size',
        instruction:'The algorithm was run with a specific key length. How many bits is that key? (a number)',
        placeholder:'number', answer:'128'},
      {no:4, title:'Locate the key',
        instruction:'The key is not stored in the file itself. Where was it carelessly exposed by the developers? (one word)',
        placeholder:'location', answer:'comment'},
      {no:5, title:'Decrypt and submit',
        instruction:'Locate the key, decrypt the ciphertext, and submit the flag it reveals.',
        placeholder:'CTF{...}', answer:'CTF{cr3pt0_w34k_k3y_d3cr2pt3d}'}
    ]
  },
  {
    id:5, stage:5, title:'Packet Analysis & Key Recovery', domain:'Network Analysis', difficulty:'Moderate', points:300,
    tools:'Wireshark, tshark, ssh-keygen',
    description:'A Nova Tech incident response team captured network traffic moments before the insider disconnected. The capture contains an unencrypted credential transfer. Recover the private key and the flag.',
    flag:'CTF{p4ck3t_f0r3ns1cs_k3y_r3c0v3r3d}',
    resource:{ label:'Download PCAP', url:'/challenge-files/incident.pcap', filename:'incident.pcap' },
    hints:[
      {no:1,text:'Several TCP streams are present. Only one carries credentials in plaintext.',penalty:5},
      {no:2,text:'The suspicious stream contains a private key file transfer.',penalty:10}
    ],
    steps:[
      {no:1, title:'Choose your tool',
        instruction:'You need to analyse a .pcap file. Which industry-standard tool opens and dissects network captures? (one word)',
        placeholder:'tool', answer:'wireshark'},
      {no:2, title:'Isolate the conversation',
        instruction:'The capture contains several TCP streams. Which display filter will show only the 4th TCP stream? (include spaces)',
        placeholder:'filter', answer:'tcp.stream eq 4'},
      {no:3, title:'Identify the protocol',
        instruction:'Inside that stream, credentials are being transferred in clear text. Which protocol is responsible? (3 letters)',
        placeholder:'xxx', answer:'ftp'},
      {no:4, title:'Identify the transferred key',
        instruction:'Alongside credentials, the transfer includes a private key. What type of private key is it? (3 letters)',
        placeholder:'xxx', answer:'ssh'},
      {no:5, title:'Verify the key',
        instruction:'Before using the recovered key, you must validate it. Which command-line utility inspects and verifies SSH keys? (one word)',
        placeholder:'command', answer:'ssh-keygen'},
      {no:6, title:'Capture the flag',
        instruction:'Extract the flag that was hidden in the stream metadata and submit it.',
        placeholder:'CTF{...}', answer:'CTF{p4ck3t_f0r3ns1cs_k3y_r3c0v3r3d}'}
    ]
  },
  {
    id:6, stage:6, title:'Crown Jewels (Root Access)', domain:'Linux System', difficulty:'Hard', points:400,
    tools:'ssh, find, cat, LinPEAS',
    description:'You have recovered an SSH private key from the packet capture. Log into the Nova Tech server as the developer user, then escalate privileges to root to retrieve the master flag.',
    flag:'CTF{r00t_pr1v_3sc_c4pst0n3_m4st3r}',
    hints:[
      {no:1,text:'High-privilege binaries with the SUID bit set are often misconfigured.',penalty:5},
      {no:2,text:'A misconfigured SUID binary that calls another program without a full path can be hijacked.',penalty:10}
    ],
    steps:[
      {no:1, title:'Access the server',
        instruction:'Using the SSH key recovered in Stage 5, log into the target host. Which user account is the key associated with? (one word)',
        placeholder:'username', answer:'developer'},
      {no:2, title:'Enumerate privileged binaries',
        instruction:'Search the filesystem for executables running with elevated (SUID) permissions. Which standard command locates SUID binaries? (one word, 4 letters)',
        placeholder:'command', answer:'find'},
      {no:3, title:'Identify the target',
        instruction:'One of the SUID binaries is unusual and not part of the default system. What is its filename?',
        placeholder:'filename', answer:'syscheck'},
      {no:4, title:'Classify the weakness',
        instruction:'The binary calls another program using a relative path. What class of attack exploits this misconfiguration? (two words)',
        placeholder:'two words', answer:'path hijacking'},
      {no:5, title:'Read the final target',
        instruction:'After successfully escalating to root, which command reads the contents of /root/root.txt? (one word)',
        placeholder:'command', answer:'cat'},
      {no:6, title:'Capture the master flag',
        instruction:'Retrieve and submit the root flag.',
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

/* ---------- Helper: compute awarded points ---------- */
function computeAwarded(ch, unlockedHintNos) {
  let penalty = 0;
  ch.hints.forEach(h => {
    if (unlockedHintNos.includes(h.no)) penalty += h.penalty;
  });
  const awarded = Math.max(0, ch.points - penalty);
  return { awarded, penalty };
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
          const awarded = isSolved ? (solvedMap[c.id] || 0) : 0;
          return {
            ...c,
            hints: c.hints.map(h => ({
              ...h,
              unlocked: (unlockedMap[c.id] || []).includes(h.no),
              text: (unlockedMap[c.id] || []).includes(h.no) ? h.text : null
            })),
            steps: c.steps.map(s => ({
              no: s.no, title: s.title, instruction: s.instruction, placeholder: s.placeholder
            })),
            completedSteps: stepMap[c.id] || [],
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
  if (clean !== expected) return res.json({ correct: false, message: 'Incorrect answer. Try again.' });

  db.query('INSERT IGNORE INTO step_progress (user_id, challenge_id, step_no) VALUES (?,?,?)',
    [req.user.id, cid, no]);
  res.json({ correct: true });
});

/* --- FIXED SUBMIT: subtract hint penalties --- */
app.post('/api/challenges/:id/submit', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { flag } = req.body;
  const ch = CHALLENGES.find(c => c.id === id);
  if (!ch) return res.status(404).json({ error: 'Not found' });
  if (ch.flag !== flag) return res.json({ correct: false, message: 'Incorrect flag. Try again.' });

  // 1. Look up which hints the user unlocked
  db.query('SELECT hint_no FROM unlocked_hints WHERE user_id = ? AND challenge_id = ?',
    [req.user.id, id], (err, hintRows) => {
      const unlockedNos = (hintRows || []).map(r => r.hint_no);
      const { awarded, penalty } = computeAwarded(ch, unlockedNos);

      // 2. Check if already submitted
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

          // 3. Insert submission with computed awarded amount + update score
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

/* ---------- Static + SPA ---------- */
app.use('/challenge-files', express.static('/app/static'));
app.use(express.static('/app/frontend/dist'));
app.get('*', (req, res) => res.sendFile('/app/frontend/dist/index.html'));

app.listen(3000, () => console.log('Backend running on port 3000'));
