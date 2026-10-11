const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

//* ---------- MySQL ---------- */
const db = mysql.createPool({
  host: 'db', user: 'ctfuser', password: 'ctf_pass', database: 'ctfdb',
  waitForConnections: true, connectionLimit: 10
});

/* ---------- Ensure tables exist (with retry) ---------- */
function initSchema(attempt = 1) {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE,
      email VARCHAR(100) UNIQUE,
      password VARCHAR(100),
      score INT DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT, challenge_id INT,
      awarded INT DEFAULT 0,
      solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_sub (user_id, challenge_id)
    )`,
    `ALTER TABLE submissions ADD COLUMN awarded INT DEFAULT 0`,
    `CREATE TABLE IF NOT EXISTS unlocked_hints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT, challenge_id INT, hint_no INT,
      UNIQUE KEY unique_hint (user_id, challenge_id, hint_no)
    )`,
    `CREATE TABLE IF NOT EXISTS step_progress (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT, challenge_id INT, step_no INT,
      UNIQUE KEY unique_step (user_id, challenge_id, step_no)
    )`,
    `ALTER TABLE users ADD COLUMN started_at TIMESTAMP NULL DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN completed_at TIMESTAMP NULL DEFAULT NULL`
  ];

  let pending = queries.length;
  let retryNeeded = false;

  queries.forEach((q) => {
    db.query(q, (err) => {
      if (err) {
        // Ignore "Duplicate column" — column already exists (schema OK)
        if (err.code === 'ER_DUP_FIELDNAME' || /Duplicate column/i.test(err.message)) {
          // no-op
        } else {
          retryNeeded = true;
          console.error(`[db] query failed: ${err.message}`);
        }
      }
      pending--;
      if (pending === 0) {
        if (retryNeeded) {
          if (attempt >= 30) {
            console.error('[db] init failed after 30 attempts. Continuing anyway.');
          } else {
            console.log(`[db] init attempt ${attempt} failed, retrying in 2s...`);
            setTimeout(() => initSchema(attempt + 1), 2000);
          }
        } else {
          console.log('[db] schema ready');
        }
      }
    });
  });
}

initSchema();

/* ---------- Challenges ---------- */
const { stage1, stage2, stage3, stage4, stage5, stage6 } = require('./challenges');

/* ---------- Challenges ---------- */
const CHALLENGES = [stage1, stage2, stage3, stage4, stage5, stage6];;

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
  res.json({
    username: req.user.username,
    score: req.user.score,
    started_at: req.user.started_at || null,
    completed_at: req.user.completed_at || null
  });
});

/* ---------- Challenges ---------- */
app.get('/api/challenges', auth, (req, res) => {
  // Auto-start timer on first access
  if (!req.user.started_at) {
    db.query('UPDATE users SET started_at = NOW() WHERE id = ?', [req.user.id]);
  }
  db.query('SELECT challenge_id, awarded FROM submissions WHERE user_id = ?', [req.user.id], (err, solved) => {   if (err) return res.status(500).json({ error: 'DB error' });
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

          // Mark completion time if this was the last stage
          db.query('SELECT COUNT(*) AS cnt FROM submissions WHERE user_id = ?', [req.user.id], (err3, cntRows) => {
            if (!err3 && cntRows[0].cnt >= 6) {
              db.query('UPDATE users SET completed_at = NOW() WHERE id = ? AND completed_at IS NULL', [req.user.id]);
            }
          });

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

          db.query('SELECT COUNT(*) AS cnt FROM submissions WHERE user_id = ?', [req.user.id], (err3, cntRows) => {
            if (!err3 && cntRows[0].cnt >= 6) {
              db.query('UPDATE users SET completed_at = NOW() WHERE id = ? AND completed_at IS NULL', [req.user.id]);
            }
          });

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
    `SELECT
       u.username,
       u.score,
       COUNT(s.id) AS solved,
       u.started_at,
       u.completed_at
     FROM users u
     LEFT JOIN submissions s ON u.id = s.user_id
     GROUP BY u.id
     ORDER BY u.score DESC, u.completed_at ASC, u.started_at ASC`,
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