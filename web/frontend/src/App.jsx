import { useEffect, useState } from 'react';
import { api } from './api.js';

const P = {
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 10 0v4',
  unlock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z M7 11V7a5 5 0 0 1 9.9-1',
  check: 'M20 6L9 17l-5-5',
  terminal: 'M4 17l6-6-6-6 M12 19h8',
  trophy: 'M8 21h8 M12 17v4 M7 4h10v5a5 5 0 0 1-10 0V4z M17 5h3v2a3 3 0 0 1-3 3 M7 5H4v2a3 3 0 0 0 3 3',
  flag: 'M4 22V4 M4 4h13l-2 4 2 4H4',
  bulb: 'M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6',
  key: 'M15.5 7.5L19 4 M21 2l-2 2 M11.4 11.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8z M11.4 11.6L15.5 7.5 M17 6l3 3',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  alert: 'M12 9v4 M12 17h.01 M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
  code: 'M16 18l6-6-6-6 M8 6l-6 6 6 6',
  pulse: 'M22 12h-4l-3 9L9 3l-3 9H2',
  layers: 'M12 2l10 5-10 5L2 7z M2 17l10 5 10-5 M2 12l10 5 10-5',
  arrowLeft: 'M19 12H5 M12 19l-7-7 7-7',
  arrow: 'M5 12h14 M12 5l7 7-7 7',
};
const STAGE_ICON = { 1:'search', 2:'file', 3:'code', 4:'key', 5:'pulse', 6:'terminal' };
const tone = (d) => (d === 'Easy' ? 'easy' : d === 'Moderate' ? 'mod' : 'hard');

function Icon({ n, s = 18 }) {
  return (
    <svg className="ic" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[n]} />
    </svg>
  );
}

function Field({ icon, label, ...p }) {
  return (
    <label>
      <span>{label}</span>
      <div className="inp"><Icon n={icon} /><input {...p} /></div>
    </label>
  );
}

/* ============ AUTH ============ */
function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ username:'', email:'', password:'' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const switchTo = (m) => { setMode(m); setErr(''); };

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode === 'register') {
        await api('/auth/register', { method:'POST', body:{ username:f.username, email:f.email, password:f.password } });
        alert('Account created successfully! Please log in.');
        setF({ username:f.username, email:'', password:'' });
        setMode('login'); return;
      }
      const d = await api('/auth/login', { method:'POST', body:{ login:f.username, password:f.password } });
      localStorage.setItem('token', d.token);
      localStorage.setItem('user', JSON.stringify(d.user));
      onAuth();
    } catch (x) { setErr(x.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth">
      <aside className="brief">
        <div className="badge"><Icon n="shield" s={28} /></div>
        <h1 className="glow">Cyber Lockdown</h1>
        <ul className="boot">
          {['establishing secure channel... ok','case file: nova tech solutions','insider activity detected','clearance required'].map((t,i)=>(
            <li key={t} style={{'--i':i}}>{t}</li>
          ))}
        </ul>
        <p className="lead">An insider took defense documents, planted backdoors and vanished. You are the analyst on the case.</p>
        <ul className="feats">
          <li><Icon n="layers" />Six stages, from public footprints to root access</li>
          <li><Icon n="flag" />Five security domains, one story</li>
          <li><Icon n="bulb" />Hints when you are stuck, a live scoreboard when you are not</li>
        </ul>
      </aside>
      <form className="panel form" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={mode==='login'?'on':''} onClick={()=>switchTo('login')}>Log in</button>
          <button type="button" className={mode==='register'?'on':''} onClick={()=>switchTo('register')}>Create account</button>
        </div>
        <Field icon="user" label={mode==='login'?'Username or email':'Username'} value={f.username} onChange={set('username')} required autoFocus />
        {mode==='register' && <Field icon="mail" label="Email" type="email" value={f.email} onChange={set('email')} required />}
        <Field icon="key" label="Password" type="password" value={f.password} onChange={set('password')} required minLength={mode==='register'?8:undefined} />
        {err && <div className="msg bad"><Icon n="alert" />{err}</div>}
        <button className="btn" disabled={busy}><Icon n={mode==='login'?'unlock':'shield'} />{busy?'Please wait...':mode==='login'?'Log in':'Create account'}</button>
      </form>
    </div>
  );
}

/* ============ ROOMS ============ */
function Rooms({ onEnter }) {
  return (
    <main>
      <h1 className="glow">Available Rooms</h1>
      <p className="lead">Select a room to begin your investigation.</p>
      <div className="rooms">
        <button className="room" onClick={onEnter}>
          <div className="roomCover">
            <img src="/nova-tech.png" alt="Nova Tech Solutions"
              onError={(e)=>{ e.target.style.display='none'; e.target.parentElement.classList.add('noimg'); }} />
            <span className="roomFallback">NOVA TECH SOLUTIONS</span>
          </div>
          <div className="roomBody">
            <h3>Nova Tech Solutions</h3>
            <p>An insider threat investigation. Trace the trail from public footprint to root access.</p>
            <span className="roomMeta">6 STAGES · OSINT → LINUX · EASY → HARD</span>
          </div>
        </button>
      </div>
    </main>
  );
}

/* ============ CHALLENGES LIST ============ */
function Challenges({ me, list, onOpen }) {
  const solved = list.filter(c => c.solved).length;
  const nextId = list.find(c => !c.solved && !c.locked)?.id;
  return (
    <main>
      <h1 className="glow">Case: Nova Tech Solutions</h1>
      <p className="lead">Follow the insider's trail in order. Each solved stage opens the next.</p>
      <section className="hud">
        <div className="stat"><span>Stages cleared</span><b>{solved}<i>/{list.length}</i></b></div>
        <div className="stat"><span>Score</span><b>{me.score}</b></div>
        <div className="stat wide"><span>Case progress</span><div className="bar"><div style={{ width: list.length ? `${(solved/list.length)*100}%` : 0 }} /></div></div>
      </section>
      <ol className="trail">
        {list.map((c, i) => (
          <li key={c.id} style={{'--i':i}} className={`stage ${tone(c.difficulty)} ${c.locked?'locked':''} ${c.solved?'done':''} ${c.id===nextId?'next':''}`}>
            <span className="node"><Icon n={c.solved?'check':c.locked?'lock':STAGE_ICON[c.stage]} s={20} /></span>
            <button className="stagecard" disabled={c.locked} onClick={()=>onOpen(c.id)}>
              <span className="row"><b>{c.title}</b><span className={`pill ${tone(c.difficulty)}`}>{c.difficulty}</span></span>
              <span className="sub">{c.domain}</span>
              <span className="row small">
                <span className="pts"><Icon n="zap" s={14}/>{c.solved?`Solved, +${c.awarded} points`:`${c.points} points`}</span>
                <span>{c.locked?`Solve stage ${c.stage-1} to unlock`:`${c.completedSteps?.length || 0}/${c.steps?.length || 0} steps done`}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </main>
  );
}

/* ============ CELEBRATION POPUP ============ */
function Celebration({ data, onClose, onNext, hasNext }) {
  return (
    <div className="celebrationBack" onClick={onClose}>
      <div className="celebration" onClick={(e)=>e.stopPropagation()}>
        <div className="confetti">
          {[...Array(20)].map((_, i) => (
            <span key={i} style={{
              '--x': `${Math.random()*100}%`,
              '--delay': `${Math.random()*0.5}s`,
              '--color': ['#00e5ff','#a855ff','#39ff88','#ffc233','#ff3d6e'][i % 5]
            }} />
          ))}
        </div>
        <div className="celebrationIcon">🏆</div>
        <h2>Flag Accepted!</h2>

        {data.hintPenalty > 0 ? (
          <div className="pointsBreakdown">
            <div className="pointsRow"><span>Base points</span><b>{data.basePoints}</b></div>
            <div className="pointsRow penalty"><span>Hint penalty</span><b>-{data.hintPenalty}</b></div>
            <div className="pointsRow total"><span>Total awarded</span><b>+{data.awarded} pts</b></div>
          </div>
        ) : (
          <p className="bigPoints">+{data.awarded} pts</p>
        )}

        <p className="celebrationSub">
          <b>{data.title}</b> complete. The trail continues.
        </p>

        <div className="celebrationBtns">
          <button className="btn secondary" onClick={onClose}>Stay here</button>
          {hasNext && <button className="btn" onClick={onNext}>Next stage <Icon n="arrow" s={16} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ============ CHALLENGE FULL PAGE ============ */
function ChallengePage({ c, list, onBack, onChange, onOpenStage }) {
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState(null);
  const [flag, setFlag] = useState('');
  const [flagMsg, setFlagMsg] = useState('');
  const [flagBusy, setFlagBusy] = useState(false);
  const [hints, setHints] = useState(c.hints || []);
  const [hintBusy, setHintBusy] = useState(null);
  const [celebration, setCelebration] = useState(null);

  useEffect(() => { setHints(c.hints || []); }, [c]);

  const completed = c.completedSteps || [];
  const currentStep = c.steps?.find(s => !completed.includes(s.no));
  const nextStage = list?.find(x => x.stage === c.stage + 1);

  async function verifyStep(stepNo) {
    const answer = (answers[stepNo] || '').trim();
    if (!answer) return;
    setBusy(stepNo);
    setResults(prev => ({ ...prev, [stepNo]: null }));
    try {
      const r = await api(`/challenges/${c.id}/steps/${stepNo}/verify`, { method:'POST', body:{ answer } });
      setResults(prev => ({ ...prev, [stepNo]: { correct: r.correct, message: r.message } }));
      if (r.correct) {
        setAnswers(prev => ({ ...prev, [stepNo]: '' }));
        await onChange();
        // If backend auto-completed the challenge (last step IS the flag)
        if (r.challengeComplete) {
          setCelebration({
            awarded: r.awarded,
            basePoints: r.basePoints ?? c.points,
            hintPenalty: r.hintPenalty ?? 0,
            title: c.title,
            alreadySolved: !!r.alreadySolved
          });
        }
      }
    } catch (e) {
      setResults(prev => ({ ...prev, [stepNo]: { correct:false, message: e.message } }));
    } finally { setBusy(null); }
  }

  async function submitFlag(e) {
    e.preventDefault();
    const clean = flag.trim();
    if (!clean) return;
    setFlagBusy(true); setFlagMsg('');
    try {
      const r = await api(`/challenges/${c.id}/submit`, { method:'POST', body:{ flag: clean } });
      if (r.correct) {
        setFlag('');
        await onChange();
        setCelebration({
          awarded: r.awarded,
          basePoints: r.basePoints ?? c.points,
          hintPenalty: r.hintPenalty ?? 0,
          title: c.title,
          alreadySolved: !!r.alreadySolved
        });
      } else {
        setFlagMsg(r.message || 'Incorrect flag.');
      }
    } catch (e) { setFlagMsg(e.message); }
    finally { setFlagBusy(false); }
  }

  async function unlockHint(h) {
    if (h.unlocked || c.solved) return;
    if (!window.confirm(`Unlock Hint ${h.no}? This reduces your score by ${h.penalty} points.`)) return;
    setHintBusy(h.no);
    try {
      const d = await api(`/challenges/${c.id}/hints/${h.no}/unlock`, { method:'POST' });
      setHints(hints.map(x => x.no===h.no ? { ...x, unlocked:true, text:d.hint.text } : x));
    } catch (e) { alert(e.message); }
    finally { setHintBusy(null); }
  }

  function handleNext() {
    setCelebration(null);
    if (nextStage) onOpenStage(nextStage.id);
    else onBack();
  }

  return (
    <main className="challengePage">
      <button className="btn ghost backBtn" onClick={onBack}>
        <Icon n="arrowLeft" s={16}/> Back to challenges
      </button>

      <div className="chHeader">
        <div className="eyebrow">STAGE {c.stage} · {c.domain}</div>
        <h1 className="glow">{c.title}</h1>
        <div className="chMeta">
          <span className={`pill ${tone(c.difficulty)}`}>{c.difficulty}</span>
          <span className="pts"><Icon n="zap" s={14}/> {c.points} points</span>
          {c.solved && <span className="pill easy">✓ SOLVED</span>}
        </div>
        <p className="desc">{c.description}</p>
        <p className="sub"><Icon n="terminal" s={14}/> Tools: {c.tools}</p>
      </div>

      {c.resource && (
        <div className="resourceBox">
          <h3>📥 Evidence</h3>
          <p className="sub">Investigate from your Kali workstation.</p>
          {(Array.isArray(c.resource) ? c.resource : [c.resource]).map((r, i) => (
            <div key={i} className="resourceItem">
              {r.external ? (
                <a className="resourceBtn" href={r.url} target="_blank" rel="noopener noreferrer">
                  🖥 {r.label}
                </a>
              ) : (
                <a className="resourceBtn" href={r.url} download={r.filename}>
                  ↓ {r.label}
                </a>
              )}
              {r.filename && !r.external && <p className="fileName">{r.filename}</p>}
            </div>
          ))}
        </div>
      )}

    

      <h2 className="sectionTitle">Steps</h2>
      <ol className="stepTrail">
        {c.steps?.map((step) => {
          const isDone = completed.includes(step.no);
          const isActive = currentStep?.no === step.no;
          const isLocked = !isDone && !isActive;
          const result = results[step.no];
          return (
            <li key={step.no} className={`stepItem ${isDone?'done':''} ${isActive?'active':''} ${isLocked?'locked':''}`}>
              <div className="stepNode">{isDone ? '✓' : isLocked ? '🔒' : step.no}</div>
              <div className="stepCard">
                <h4>Step {step.no}: {step.title}</h4>
                <p>{step.instruction}</p>
                {isActive && (
                  <form onSubmit={(e)=>{ e.preventDefault(); verifyStep(step.no); }} className="stepForm">
                    <input type="text" placeholder={step.placeholder || 'Enter your answer...'}
                      value={answers[step.no] || ''}
                      onChange={(e)=>setAnswers({ ...answers, [step.no]: e.target.value })}
                      disabled={busy === step.no} autoFocus />
                    <button type="submit" disabled={busy === step.no}>
                      {busy === step.no ? 'Checking...' : 'Verify'}
                    </button>
                  </form>
                )}
                {isDone && <p className="okMsg">✓ Correct</p>}
                {result && !result.correct && !isDone && (
                  <p className="badMsg">✗ {result.message || 'Incorrect. Try again.'}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {hints.length > 0 && (
        <div className="hintsSection">
          <h3>💡 Hints</h3>
          <p className="sub">Unlocking a hint reduces the points awarded when you solve this stage.</p>
          <div className="hintList">
            {hints.map(h => (
              <div className="hint" key={h.no}>
                <div className="row">
                  <strong>Hint {h.no}</strong>
                  <span className="sub">-{h.penalty} pts</span>
                </div>
                {h.unlocked
                  ? <p>{h.text}</p>
                  : <button type="button" className="hintUnlockBtn" disabled={hintBusy===h.no || c.solved} onClick={()=>unlockHint(h)}>
                      {hintBusy===h.no ? 'Unlocking...' : `🔒 Unlock Hint (-${h.penalty} pts)`}
                    </button>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flagSection">
        <h3>🚩 Submit Flag</h3>
        {c.solved ? (
          <div className="solvedBox big"><strong>✓ Challenge complete</strong> +{c.awarded} points</div>
        ) : completed.length < c.steps.length ? (
          <p className="sub">🔒 Complete all steps above to unlock flag submission.</p>
        ) : (
          <>
            <p className="sub">You have all the information you need. Submit the flag to complete the challenge.</p>
            <form className="flagForm" onSubmit={submitFlag}>
              <input type="text" placeholder="CTF{...}" value={flag} onChange={(e)=>setFlag(e.target.value)} disabled={flagBusy}/>
              <button type="submit" disabled={flagBusy}>{flagBusy?'Checking...':'Submit flag'}</button>
            </form>
            {flagMsg && <p className="authmsg">{flagMsg}</p>}
          </>
        )}
      </div>

      {celebration && (
        <Celebration
          data={celebration}
          onClose={()=>setCelebration(null)}
          onNext={handleNext}
          hasNext={!!nextStage}
        />
      )}
    </main>
  );
}

/* ============ SCOREBOARD ============ */
function Scoreboard({ me }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { api('/scoreboard').then(setRows); }, []);
  return (
    <main>
      <h1 className="glow">Scoreboard</h1>
      <div className="panel">
        <table>
          <thead><tr><th>Rank</th><th>Player</th><th>Stages solved</th><th>Score</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.username} className={r.username===me.username?'me':''}>
                <td className={i<3?`rank r${i+1}`:'rank'}>{i<3 && <Icon n="trophy" s={16}/>}{i+1}</td>
                <td>{r.username}</td><td>{r.solved}</td><td className="pts">{r.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

/* ============ APP ============ */
export default function App() {
  const [me, setMe] = useState(null);
  const [list, setList] = useState([]);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState('rooms');
  const [activeId, setActiveId] = useState(null);

  const loadMe = () => api('/me').then(setMe).catch(()=>setMe(null));
  const loadChallenges = () => api('/challenges').then(d => setList(d.challenges || []));
  const refreshAll = async () => { await Promise.all([loadMe(), loadChallenges()]); };

  useEffect(() => {
    if (!localStorage.getItem('token')) { setReady(true); return; }
    Promise.all([loadMe(), loadChallenges()]).finally(()=>setReady(true));
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setMe(null); setList([]); setActiveId(null); setPage('rooms');
  };

  if (!ready) return null;
  if (!me) return <Auth onAuth={()=>{ refreshAll(); setPage('rooms'); }} />;

  const active = list.find(c => c.id === activeId);

  return (
    <>
      <header className="top">
        <div className="logo"><Icon n="shield" s={22}/>Cyber<b>Lockdown</b></div>
        <nav>
          <button className={page==='rooms'?'on':''} onClick={()=>setPage('rooms')}><Icon n="layers" s={16}/>Rooms</button>
          <button className={page==='challenges'?'on':''} onClick={()=>setPage('challenges')}><Icon n="grid" s={16}/>Challenges</button>
          <button className={page==='scoreboard'?'on':''} onClick={()=>setPage('scoreboard')}><Icon n="trophy" s={16}/>Scoreboard</button>
        </nav>
        <div className="who">
          <span className="user"><Icon n="user" s={16}/>{me.username}</span>
          <b className="pts"><Icon n="zap" s={15}/>{me.score}</b>
          <button className="iconbtn" onClick={logout} title="Log out"><Icon n="logout"/></button>
        </div>
      </header>

      {page === 'rooms' && <Rooms onEnter={()=>setPage('challenges')} />}
      {page === 'challenges' && <Challenges me={me} list={list} onOpen={(id)=>{ setActiveId(id); setPage('challenge'); }} />}
      {page === 'challenge' && active && (
        <ChallengePage
          c={active}
          list={list}
          onBack={()=>{ setActiveId(null); setPage('challenges'); }}
          onChange={refreshAll}
          onOpenStage={(id)=>{ setActiveId(id); }}
        />
      )}
      {page === 'scoreboard' && <Scoreboard me={me} />}
    </>
  );
}