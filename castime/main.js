// ── State ──────────────────────────────────────────────────────────────────
let activities = [];
let groups = [];
let finalTask = { enabled: true, name: 'Final Gathering' };
let slotSecs = 600;
let warnSecs = 120;
let currentRound = 0;
let totalRounds = 0;
let secsLeft = 600;
let ticker = null;
let warnChirped = false;
let wakeLock = null;
let fanfareCtx = null;

const RAINBOW = ['#ff4d4d','#ff8c00','#ffd000','#4caf50','#2196f3','#9c27b0','#e91e8c'];

// ── Hardcoded Presets ──────────────────────────────────────────────────────
// Edit this array to add, remove, or change presets.
// Each preset has: name, slotMins, warnMins, activities[], groups[], finalTask{}
const PRESETS = [
  {
    name: 'Applicant Experience Day',
    slotMins: 10,
    warnMins: 2,
    activities: [
      { name: 'Operation Elevation (AS27)' },
      { name: 'Mind Maze (AS27)' },
      { name: 'Turbo Trouble (AS24)' },
      { name: 'Cogntive Curiosities (AS29)' },
      { name: 'Stack Attack (AS27)' },
      { name: 'Putting Pressure (AS27)' },
    ],
    groups: [
      { name: null }, // Group A
      { name: null }, // Group B
      { name: null }, // Group C
      { name: null }, // Group D
      { name: null }, // Group E
    ],
    finalTask: { enabled: true, name: 'Let\'s Build (AS27)' },
  },
  {
    name: 'Workshop Rotation (Short)',
    slotMins: 5,
    warnMins: 1,
    activities: [
      { name: 'Activity 1' },
      { name: 'Activity 2' },
      { name: 'Activity 3' },
      { name: 'Activity 4' },
      { name: 'Activity 5' },
    ],
    groups: [
      { name: null }, // Group A
      { name: null }, // Group B
      { name: null }, // Group C
      { name: null }, // Group D
    ],
    finalTask: { enabled: false, name: 'Final Gathering' },
  },
  // Add more presets here following the same structure ↑
];

// ── Preset bar rendering ───────────────────────────────────────────────────
function renderPresetBar() {
  const bar = document.getElementById('presetBar');
  if (!bar) return;
  bar.innerHTML = '';

  if (PRESETS.length === 0) return;

  const label = document.createElement('span');
  label.className = 'preset-bar-label';
  label.textContent = 'Presets';
  bar.appendChild(label);

  PRESETS.forEach((p, i) => {
    const btn = document.createElement('button');
    btn.className = 'preset-pill';
    btn.textContent = p.name;
    btn.onclick = () => applyPreset(i);
    bar.appendChild(btn);
  });
}

function applyPreset(index) {
  const p = PRESETS[index];
  if (!p) return;

  document.getElementById('slotMins').value = p.slotMins;
  document.getElementById('warnMins').value = p.warnMins;

  activities = p.activities.map(a => ({
    id: Date.now() + Math.random(),
    name: a.name || '',
  }));

  groups = p.groups.map((g, i) => ({
    id: Date.now() + Math.random(),
    label: generateGroupLabel(i),
    name: g.name,
  }));

  finalTask = { ...p.finalTask };

  // Highlight the active pill
  document.querySelectorAll('.preset-pill').forEach((btn, i) => {
    btn.classList.toggle('preset-pill--active', i === index);
  });

  renderSetup();
}

// ── Group label helpers ────────────────────────────────────────────────────
function generateGroupLabel(index) {
  let label = '';
  let i = index;
  do {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return 'Group ' + label;
}

function groupDisplayName(g) {
  return g.name !== null ? g.name : g.label;
}

// ── Setup ──────────────────────────────────────────────────────────────────
function addActivity(name = '') {
  activities.push({ id: Date.now() + Math.random(), name });
  renderSetup();
}

function addGroup(customName = null) {
  const label = generateGroupLabel(groups.length);
  groups.push({ id: Date.now() + Math.random(), label, name: customName });
  renderSetup();
}

function removeActivity(idx) { activities.splice(idx, 1); renderSetup(); }
function removeGroup(idx) {
  groups.splice(idx, 1);
  groups.forEach((g, i) => { g.label = generateGroupLabel(i); });
  renderSetup();
}

function renderSetup() {
  // Activities
  const al = document.getElementById('actList');
  al.innerHTML = '';
  activities.forEach((a, i) => {
    const d = document.createElement('div');
    d.className = 'entry-row';
    d.innerHTML = `
      <div class="dot" style="background:${RAINBOW[i % 7]}"></div>
      <input type="text" placeholder="Activity name" value="${a.name}"
        oninput="activities[${i}].name=this.value">
      <button class="btn btn-remove" onclick="removeActivity(${i})">✕</button>`;
    al.appendChild(d);
  });

  // Groups
  const gl = document.getElementById('grpList');
  gl.innerHTML = '';
  groups.forEach((g, i) => {
    const d = document.createElement('div');
    d.className = 'entry-row';
    d.innerHTML = `
      <div class="dot" style="background:${RAINBOW[i % 7]}"></div>
      <input type="text" placeholder="${g.label}" value="${g.name !== null ? g.name : ''}"
        oninput="groups[${i}].name = this.value.trim() !== '' ? this.value : null">
      <button class="btn btn-remove" onclick="removeGroup(${i})">✕</button>`;
    gl.appendChild(d);
  });

  // Final task
  const fw = document.getElementById('finalTaskWrap');
  fw.innerHTML = '';
  if (finalTask.enabled) {
    const d = document.createElement('div');
    d.className = 'entry-row';
    d.innerHTML = `
      <div class="dot" style="background:#aaa"></div>
      <input type="text" placeholder="Final gathering name" value="${finalTask.name}"
        oninput="finalTask.name = this.value.trim() || 'Final Gathering'">
      <button class="btn btn-remove" onclick="removeFinalTask()">✕</button>`;
    fw.appendChild(d);
  } else {
    const btn = document.createElement('button');
    btn.className = 'btn btn-add';
    btn.textContent = '+ Add final gathering';
    btn.onclick = () => { finalTask.enabled = true; finalTask.name = 'Final Gathering'; renderSetup(); };
    fw.appendChild(btn);
  }
}

function removeFinalTask() {
  finalTask.enabled = false;
  renderSetup();
}

// Defaults — load first preset if available, else fall back to sample data
if (PRESETS.length > 0) {
  applyPreset(0);
} else {
  ['Interview', 'Campus Tour', 'Q&A Session'].forEach(n => addActivity(n));
  [null, null, null].forEach(() => addGroup());
}

renderPresetBar();

// ── Start ──────────────────────────────────────────────────────────────────
function startSession() {
  if (activities.length < 2 || groups.length < 2) {
    alert('Please add at least 2 activities and 2 groups.');
    return;
  }
  slotSecs = parseInt(document.getElementById('slotMins').value) * 60 || 600;
  warnSecs = parseInt(document.getElementById('warnMins').value) * 60 || 120;
  totalRounds = activities.length;
  currentRound = 0;
  secsLeft = slotSecs;
  warnChirped = false;

  document.getElementById('setup').style.display = 'none';
  document.getElementById('runner').style.display = 'block';
  buildGrid();
  renderRound();
  acquireWakeLock();
  tick();
  ticker = setInterval(tick, 1000);
}

// ── Grid ───────────────────────────────────────────────────────────────────
function buildGrid() {
  const g = document.getElementById('actGrid');
  const cols = Math.min(activities.length, 3);
  g.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  g.innerHTML = '';
  activities.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'act-card';
    d.id = `ac${i}`;
    g.appendChild(d);
  });
}

function getAssignments(round) {
  return activities.map((_, ai) =>
    groups.filter((_, gi) => (gi + round) % activities.length === ai)
  );
}

function renderRound() {
  document.getElementById('roundLabel').textContent =
    `Round ${currentRound + 1} of ${totalRounds}`;
  const assign = getAssignments(currentRound);
  activities.forEach((a, i) => {
    const card = document.getElementById(`ac${i}`);
    const here = assign[i];
    const color = RAINBOW[i % 7];
    card.style.borderTopColor = color;
    card.innerHTML = `
      <div class="act-name">${a.name || `Activity ${i + 1}`}</div>
      <div class="chips">
        ${here.length
          ? here.map(g => {
              const gi = groups.indexOf(g);
              const c = RAINBOW[gi % 7];
              return `<span class="chip" style="background:${c}18;color:${c}">${groupDisplayName(g)}</span>`;
            }).join('')
          : '<span class="empty-chip">—</span>'
        }
      </div>`;
  });
}

// ── Tick ───────────────────────────────────────────────────────────────────
function tick() {
  updateDisplay();
  secsLeft--;
  if (secsLeft < 0) {
    clearInterval(ticker);
    ticker = null;
    triggerAlarm();
  }
}

function updateDisplay() {
  const m = Math.floor(Math.abs(secsLeft) / 60);
  const s = Math.abs(secsLeft) % 60;
  const str = (secsLeft < 0 ? '-' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  document.getElementById('ringTime').textContent = str;

  const pct = Math.max(0, secsLeft / slotSecs);
  document.getElementById('ringCircle').style.strokeDashoffset = 263.9 * (1 - pct);

  const elapsed = currentRound * slotSecs + (slotSecs - Math.max(0, secsLeft));
  document.getElementById('progBar').style.width =
    Math.min(100, (elapsed / (totalRounds * slotSecs)) * 100) + '%';

  const now = new Date();
  document.getElementById('liveClock').textContent =
    now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const wb = document.getElementById('warnBar');
  if (secsLeft <= warnSecs && secsLeft > 0) {
    wb.style.display = 'block';
    wb.textContent = `⏱ Change in ${Math.ceil(secsLeft / 60)} min${Math.ceil(secsLeft / 60) !== 1 ? 's' : ''}`;
    if (!warnChirped) { warnChirped = true; playChirp(); }
  } else {
    wb.style.display = 'none';
  }
}

// ── Skip ───────────────────────────────────────────────────────────────────
function skipRound() {
  if (ticker) { clearInterval(ticker); ticker = null; }
  secsLeft = 0;
  triggerAlarm();
}

// ── Alarm ─────────────────────────────────────────────────────────────────
function triggerAlarm() {
  const isLastRound = currentRound + 1 >= totalRounds;

  currentRound++;
  secsLeft = slotSecs;
  warnChirped = false;

  if (!isLastRound) {
    renderRound();
    ticker = setInterval(tick, 1000);
  }

  const stopFanfare = playFanfare();

  if (isLastRound) {
    document.getElementById('overlayTitle').textContent =
      finalTask.enabled ? finalTask.name : 'All done!';
    document.getElementById('overlaySub').textContent =
      finalTask.enabled
        ? 'Everyone comes together — no timer, enjoy!'
        : 'Great session — all rounds complete.';
    document.getElementById('overlayCards').innerHTML = finalTask.enabled
      ? `<div class="ov-card" style="border-top-color:#aaa">
           <div class="ov-act">All groups</div>
           <div class="ov-group">${groups.map(g => groupDisplayName(g)).join(', ')}</div>
         </div>`
      : '';
    document.getElementById('dismissBtn').textContent = '← Back to setup';
    document.getElementById('dismissBtn').onclick = () => { stopFanfare(); resetToSetup(); };
  } else {
    const assign = getAssignments(currentRound);
    document.getElementById('overlayTitle').textContent = 'Change places!';
    document.getElementById('overlaySub').textContent = 'Timer is running — move now!';
    document.getElementById('dismissBtn').textContent = "We've moved →";
    document.getElementById('dismissBtn').onclick = () => { stopFanfare(); dismissAlarm(); };
    document.getElementById('overlayCards').innerHTML = assign.map((here, ai) => {
      const color = RAINBOW[ai % 7];
      const actName = activities[ai].name || `Activity ${ai + 1}`;
      const groupNames = here.map(g => groupDisplayName(g)).join(' & ') || '—';
      return `<div class="ov-card" style="border-top-color:${color}">
        <div class="ov-act">${actName}</div>
        <div class="ov-group">${groupNames}</div>
      </div>`;
    }).join('');
  }

  document.getElementById('overlay').classList.add('active');
}

function dismissAlarm() {
  document.getElementById('overlay').classList.remove('active');
  renderRound();
}

// ── Fanfare ────────────────────────────────────────────────────────────────
function playFanfare() {
  let stopped = false;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    fanfareCtx = ctx;
    const notes = [523, 659, 784, 1047];
    const repGap = 1.0;
    const volumes = [0.25, 0.38, 0.55];
    for (let rep = 0; rep < 3; rep++) {
      notes.forEach((freq, ni) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.value = freq;
        const st = ctx.currentTime + rep * repGap + ni * 0.18;
        g.gain.setValueAtTime(0, st);
        g.gain.linearRampToValueAtTime(volumes[rep], st + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.4);
        o.start(st); o.stop(st + 0.42);
      });
    }
  } catch (e) {}
  return function stop() {
    if (!stopped && fanfareCtx) {
      try { fanfareCtx.close(); } catch (e) {}
      fanfareCtx = null;
      stopped = true;
    }
  };
}

// ── Chirp ─────────────────────────────────────────────────────────────────
function playChirp() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[0, 1800], [0.18, 1800]].forEach(([t, freq]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime + t);
      o.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + t + 0.08);
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.15);
    });
  } catch (e) {}
}

// ── Wake Lock ──────────────────────────────────────────────────────────────
async function acquireWakeLock() {
  const el = document.getElementById('wakeLockStatus');
  if (!('wakeLock' in navigator)) {
    if (el) el.innerHTML = '⚪ Wake lock not supported by this browser';
    return;
  }
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    if (el) el.innerHTML = '🟢 Screen will stay awake';
    wakeLock.addEventListener('release', () => {
      if (el) el.innerHTML = '🟡 Wake lock released (tab hidden)';
    });
  } catch (e) {
    if (el) el.innerHTML = '🔴 Wake lock blocked — screen may sleep';
  }
}

function releaseWakeLock() {
  if (wakeLock) { wakeLock.release(); wakeLock = null; }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && ticker) acquireWakeLock();
});

// ── Spacebar → dismiss overlay ─────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.getElementById('overlay').classList.contains('active')) {
    e.preventDefault(); // stop page scroll
    document.getElementById('dismissBtn').click();
  }
});

// ── Reset ─────────────────────────────────────────────────────────────────
function resetToSetup() {
  clearInterval(ticker); ticker = null;
  releaseWakeLock();
  document.getElementById('overlay').classList.remove('active');
  document.getElementById('runner').style.display = 'none';
  document.getElementById('setup').style.display = 'block';
}
