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
let breakTicker = null;
let breakSecsLeft = 0;
let isPaused = false;
let continuousTiming = false;
let warnEnabled = true;
let breakSecs = 0;
let breakAutoProgress = true;
let fanfareEnabled = true;
let warnSoundEnabled = true;
let timingMode = 'slot';
let warnChirped = false;
let wakeLock = null;
let fanfareCtx = null;

const RAINBOW = ['#ff4d4d','#ff8c00','#ffd000','#4caf50','#2196f3','#9c27b0','#e91e8c'];

// ── Hardcoded Presets ──────────────────────────────────────────────────────
// Each preset: name, slotMins, warnMins, warnEnabled, warnSound, fanfare,
//              breakEnabled, breakMins, breakAutoProgress, continuousTiming,
//              activities[], groups[], finalTask{}
const PRESETS = [
  {
    name: 'Applicant Experience Day',
    slotMins: 10,
    warnEnabled: true,
    warnMins: 2,
    warnSound: true,
    fanfare: true,
    breakEnabled: false,
    breakMins: 2,
    breakAutoProgress: true,
    continuousTiming: false,
    activities: [
      { name: 'Operation Elevation (AS27)' },
      { name: 'Mind Maze (AS27)' },
      { name: 'Turbo Trouble (AS24)' },
      { name: 'Cognitive Curiosities (AS29)' },
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
    finalTask: { enabled: true, name: `Let's Build` },
  },
  {
    name: 'Workshop Rotation (Short)',
    slotMins: 5,
    warnEnabled: true,
    warnMins: 1,
    warnSound: true,
    fanfare: true,
    breakEnabled: false,
    breakMins: 1,
    breakAutoProgress: true,
    continuousTiming: false,
    activities: [
      { name: 'Activity 1' },
      { name: 'Activity 2' },
      { name: 'Activity 3' },
      { name: 'Activity 4' },
    ],
    groups: [
      { name: null }, // Group A
      { name: null }, // Group B
      { name: null }, // Group C
      { name: null }, // Group D
    ],
    finalTask: { enabled: false, name: 'Final Gathering' },
  },
  {
    name: 'Pomodoro',
    slotMins: 25,
    warnEnabled: true,
    warnMins: 3,
    warnSound: true,
    fanfare: true,
    breakEnabled: true,
    breakMins: 5,
    breakAutoProgress: true,
    continuousTiming: false,
    activities: [
      { name: '🍅 Pomodoro 1' },
      { name: '🍅 Pomodoro 2' },
      { name: '🍅 Pomodoro 3' },
      { name: '🍅 Pomodoro 4' },
    ],
    groups: [
      { name: null }, // Solo
    ],
    finalTask: { enabled: true, name: '🌿 Long Break' },
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
  document.getElementById('warnToggle').checked = p.warnEnabled ?? true;
  document.getElementById('warnMins').value = p.warnMins ?? 2;
  document.getElementById('warnSoundToggle').checked = p.warnSound ?? true;
  document.getElementById('fanfareSoundToggle').checked = p.fanfare ?? true;
  document.getElementById('breakToggle').checked = p.breakEnabled ?? false;
  document.getElementById('breakMins').value = p.breakMins ?? 2;
  document.getElementById('breakAutoProgress').checked = p.breakAutoProgress ?? true;
  document.getElementById('continuousToggle').checked = p.continuousTiming ?? false;

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

  updateWarnFieldVisibility();
  updateBreakFieldVisibility();
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
  recalcFinishBy();
}

function addGroup(customName = null) {
  const label = generateGroupLabel(groups.length);
  groups.push({ id: Date.now() + Math.random(), label, name: customName });
  renderSetup();
}

function removeActivity(idx) { activities.splice(idx, 1); renderSetup(); recalcFinishBy(); }
function removeGroup(idx) {
  groups.splice(idx, 1);
  groups.forEach((g, i) => { g.label = generateGroupLabel(i); });
  renderSetup();
}

// ── Drag state ─────────────────────────────────────────────────────────────
let dragSrcIdx = null;

function renderSetup() {
  // Activities — draggable
  const al = document.getElementById('actList');
  al.innerHTML = '';
  activities.forEach((a, i) => {
    const d = document.createElement('div');
    d.className = 'entry-row draggable';
    d.draggable = true;
    d.dataset.idx = i;
    d.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">⠿</span>
      <div class="dot" style="background:${RAINBOW[i % 7]}"></div>
      <input type="text" placeholder="Activity name" value="${a.name}"
        oninput="activities[${i}].name=this.value">
      <button class="btn btn-remove" onclick="removeActivity(${i})">✕</button>`;

    d.addEventListener('dragstart', e => {
      dragSrcIdx = i;
      d.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    d.addEventListener('dragend', () => {
      d.classList.remove('dragging');
      document.querySelectorAll('.entry-row').forEach(r => r.classList.remove('drag-over'));
    });
    d.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.entry-row').forEach(r => r.classList.remove('drag-over'));
      d.classList.add('drag-over');
    });
    d.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrcIdx === null || dragSrcIdx === i) return;
      // Reorder array
      const moved = activities.splice(dragSrcIdx, 1)[0];
      activities.splice(i, 0, moved);
      dragSrcIdx = null;
      renderSetup();
    });

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

  // Final gathering — driven by the toggle in HTML, not dynamic DOM
  const fgToggle = document.getElementById('finalGatheringToggle');
  const fgName = document.getElementById('finalGatheringName');
  if (fgToggle) fgToggle.checked = finalTask.enabled;
  if (fgName) fgName.value = finalTask.name || 'Final Gathering';
  updateFinalGatheringVisibility();
}

// Defaults — blank state with Activity 1, 2, 3
(function initDefaults() {
  ['Activity 1', 'Activity 2', 'Activity 3'].forEach(n => addActivity(n));
  [null, null, null].forEach(() => addGroup());
  updateWarnFieldVisibility();
  updateBreakFieldVisibility();
  updateFinalGatheringVisibility();
})();

document.addEventListener('DOMContentLoaded', () => {
  renderPresetBar();
  populateSavedSessions();
});

// ── Start ──────────────────────────────────────────────────────────────────
function startSession() {
  if (activities.length < 2 || groups.length < 1) {
    alert('Please add at least 2 activities and 1 group.');
    return;
  }
  slotSecs = parseInt(document.getElementById('slotMins').value) * 60 || 600;
  warnEnabled = document.getElementById('warnToggle').checked;
  warnSecs = parseInt(document.getElementById('warnMins').value) * 60 || 120;
  warnSoundEnabled = document.getElementById('warnToggle').checked && document.getElementById('warnSoundToggle').checked;
  fanfareEnabled = document.getElementById('fanfareSoundToggle').checked;
  continuousTiming = document.getElementById('continuousToggle').checked;
  breakSecs = document.getElementById('breakToggle').checked
    ? (parseInt(document.getElementById('breakMins').value) * 60 || 0)
    : 0;
  breakAutoProgress = document.getElementById('breakAutoProgress').checked;
  finalTask.enabled = document.getElementById('finalGatheringToggle').checked;
  finalTask.name = document.getElementById('finalGatheringName').value.trim() || 'Final Gathering';
  totalRounds = activities.length;
  currentRound = 0;
  secsLeft = slotSecs;
  warnChirped = false;
  isPaused = false;

  document.getElementById('setup').style.display = 'none';
  document.getElementById('runner').style.display = 'block';
  buildGrid();
  renderRound();
  acquireWakeLock();
  syncLiveSettings();
  tick();
  ticker = setInterval(tick, 1000);
}

function togglePause() {
  if (isPaused) {
    isPaused = false;
    document.getElementById('pauseBtn').textContent = '⏸ Pause';
    tick();
    ticker = setInterval(tick, 1000);
  } else {
    isPaused = true;
    document.getElementById('pauseBtn').textContent = '▶ Resume';
    if (ticker) { clearInterval(ticker); ticker = null; }
  }
}

function updateWarnFieldVisibility() {
  const on = document.getElementById('warnToggle').checked;
  const input = document.getElementById('warnMins');
  input.disabled = !on;
  input.closest('.session-row-right').classList.toggle('session-row-right--disabled', !on);
}

function updateBreakFieldVisibility() {
  const on = document.getElementById('breakToggle').checked;
  const input = document.getElementById('breakMins');
  input.disabled = !on;
  input.closest('.session-row-right').classList.toggle('session-row-right--disabled', !on);
  // Also disable the auto-progress checkbox when break is off
  const autoProgress = document.getElementById('breakAutoProgress');
  autoProgress.disabled = !on;
  autoProgress.closest('.session-check-label').style.opacity = on ? '' : '0.38';
  autoProgress.closest('.session-check-label').style.pointerEvents = on ? '' : 'none';
}

function updateFinalGatheringVisibility() {
  const on = document.getElementById('finalGatheringToggle').checked;
  finalTask.enabled = on;
  const field = document.getElementById('finalGatheringField');
  const input = document.getElementById('finalGatheringName');
  field.classList.toggle('session-row-right--disabled', !on);
  input.disabled = !on;
}

// ── Grid ───────────────────────────────────────────────────────────────────
function isSingleGroup() { return groups.length === 1; }

function buildGrid() {
  const g = document.getElementById('actGrid');
  if (isSingleGroup()) {
    g.style.gridTemplateColumns = '1fr';
    g.innerHTML = '<div class="act-card act-card--single" id="ac0"></div>';
  } else {
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
}

function getAssignments(round) {
  return activities.map((_, ai) =>
    groups.filter((_, gi) => (gi + round) % activities.length === ai)
  );
}

function renderRound() {
  const roundsLeft = totalRounds - currentRound;
  document.getElementById('roundLabel').textContent =
    `Round ${currentRound + 1} of ${totalRounds}`;
  document.getElementById('roundsLeft').textContent =
    roundsLeft === 1 ? 'Last round!' : `${roundsLeft} rounds remaining`;

  if (isSingleGroup()) {
    const a = activities[currentRound % activities.length];
    const color = RAINBOW[currentRound % 7];
    const card = document.getElementById('ac0');
    card.style.borderTopColor = color;
    card.innerHTML = `
      <div class="act-name--single">${a.name || `Activity ${currentRound + 1}`}</div>
      <div class="act-name-sub">Current activity</div>`;
    // Show next activity if there is one
    const nextIdx = (currentRound + 1) % activities.length;
    const isLast = currentRound + 1 >= totalRounds;
    if (!isLast) {
      const next = activities[nextIdx];
      card.innerHTML += `<div class="act-next">Next: ${next.name || `Activity ${nextIdx + 1}`}</div>`;
    }
  } else {
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
  if (warnEnabled && secsLeft <= warnSecs && secsLeft > 0) {
    wb.style.display = 'block';
    wb.textContent = `⏱ Change in ${Math.ceil(secsLeft / 60)} min${Math.ceil(secsLeft / 60) !== 1 ? 's' : ''}`;
    if (!warnChirped) { warnChirped = true; if (warnSoundEnabled) playChirp(); }
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
    if (continuousTiming) {
      ticker = setInterval(tick, 1000);
    }
  }

  const stopFanfare = fanfareEnabled ? playFanfare() : () => {};

  if (isLastRound) {
    document.getElementById('overlayTitle').textContent =
      finalTask.enabled ? finalTask.name : 'All done!';
    document.getElementById('overlaySub').textContent =
      finalTask.enabled
        ? (isSingleGroup() ? 'No timer — enjoy!' : 'Everyone comes together — no timer, enjoy!')
        : 'Great session — all rounds complete.';
    document.getElementById('overlayCards').innerHTML = finalTask.enabled
      ? (isSingleGroup()
          ? ''
          : `<div class="ov-card" style="border-top-color:#aaa">
               <div class="ov-act">All groups</div>
               <div class="ov-group">${groups.map(g => groupDisplayName(g)).join(', ')}</div>
             </div>`)
      : '';
    document.getElementById('overlayBreak').style.display = 'none';
    document.getElementById('dismissBtn').textContent = '← Back to setup';
    document.getElementById('dismissBtn').onclick = () => { stopFanfare(); resetToSetup(); };
  } else {
    document.getElementById('overlayTitle').textContent = isSingleGroup() ? 'Next up!' : 'Change places!';
    document.getElementById('dismissBtn').textContent = isSingleGroup() ? "Let's go →" : "We've moved →";
    document.getElementById('dismissBtn').onclick = () => { stopFanfare(); dismissAlarm(); };

    if (isSingleGroup()) {
      const nextAct = activities[currentRound % activities.length];
      const color = RAINBOW[currentRound % 7];
      document.getElementById('overlayCards').innerHTML =
        `<div class="ov-card ov-card--single" style="border-top-color:${color}">
          <div class="ov-act">Up next</div>
          <div class="ov-group--single">${nextAct.name || `Activity ${currentRound + 1}`}</div>
        </div>`;
    } else {
      const assign = getAssignments(currentRound);
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

    // Break countdown
    if (breakSecs > 0) {
      breakSecsLeft = breakSecs;
      updateBreakDisplay();
      document.getElementById('overlayBreak').style.display = 'block';
      document.getElementById('overlaySub').textContent = isSingleGroup() ? 'Take a break' : 'Move to your next activity';
      breakTicker = setInterval(() => {
        breakSecsLeft--;
        if (breakSecsLeft <= 0) {
          clearInterval(breakTicker); breakTicker = null;
          updateBreakDisplay();
          if (breakAutoProgress) { stopFanfare(); dismissAlarm(); }
        } else {
          updateBreakDisplay();
        }
      }, 1000);
    } else {
      document.getElementById('overlayBreak').style.display = 'none';
      if (continuousTiming) {
        document.getElementById('overlaySub').textContent = isSingleGroup() ? 'Timer is running!' : 'Timer is running — move now!';
      } else {
        document.getElementById('overlaySub').textContent = isSingleGroup() ? 'Timer paused — ready?' : 'Timer is paused — move and confirm!';
      }
    }
  }

  document.getElementById('overlay').classList.add('active');
}

function updateBreakDisplay() {
  const m = Math.floor(breakSecsLeft / 60);
  const s = breakSecsLeft % 60;
  const str = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  document.getElementById('overlayBreakTime').textContent = str;
  // Shrink the ring as break counts down
  const pct = breakSecsLeft / breakSecs;
  document.getElementById('overlayBreakCircle').style.strokeDashoffset = 207.3 * (1 - pct);
}

function dismissAlarm() {
  if (breakTicker) { clearInterval(breakTicker); breakTicker = null; }
  document.getElementById('overlay').classList.remove('active');
  renderRound();
  if (!continuousTiming) {
    warnChirped = false;
    tick();
    ticker = setInterval(tick, 1000);
  }
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

// ── How-to accordion ──────────────────────────────────────────────────────
function toggleHowTo() {
  const body = document.getElementById('howtoBody');
  const btn = document.querySelector('.howto-trigger');
  const isOpen = body.classList.contains('howto-open');
  body.classList.toggle('howto-open', !isOpen);
  btn.setAttribute('aria-expanded', String(!isOpen));
  btn.querySelector('.howto-chevron').style.transform = isOpen ? '' : 'rotate(90deg)';
}

// ── Live settings panel ───────────────────────────────────────────────────
function toggleLiveSettings() {
  document.getElementById('liveSettings').classList.toggle('live-settings--open');
}

// Close live settings if clicking outside
document.addEventListener('click', (e) => {
  const panel = document.getElementById('liveSettings');
  const btn = document.getElementById('settingsBtn');
  if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
    panel.classList.remove('live-settings--open');
  }
});

// Sync live settings toggles to match setup values when session starts
function syncLiveSettings() {
  document.getElementById('liveFanfare').checked = fanfareEnabled;
  document.getElementById('liveWarnSound').checked = warnSoundEnabled;
  document.getElementById('liveContinuous').checked = continuousTiming;
}

// ── Theme ──────────────────────────────────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('castime-theme', next);
}

// Apply saved or system preference on load
(function initTheme() {
  const saved = localStorage.getItem('castime-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

// ── Reset ─────────────────────────────────────────────────────────────────
function resetToDefaults() {
  if (!confirm('Reset everything to defaults?')) return;
  activities = [];
  groups = [];
  finalTask = { enabled: true, name: 'Final Gathering' };
  document.getElementById('slotMins').value = 10;
  document.getElementById('warnToggle').checked = true;
  document.getElementById('warnMins').value = 2;
  document.getElementById('warnSoundToggle').checked = true;
  document.getElementById('breakToggle').checked = false;
  document.getElementById('breakMins').value = 2;
  document.getElementById('breakAutoProgress').checked = false;
  document.getElementById('fanfareSoundToggle').checked = true;
  document.getElementById('continuousToggle').checked = false;
  document.getElementById('finalGatheringToggle').checked = true;
  document.getElementById('finalGatheringName').value = 'Final Gathering';
  finalTask = { enabled: true, name: 'Final Gathering' };
  updateWarnFieldVisibility();
  updateBreakFieldVisibility();
  updateFinalGatheringVisibility();
  // Clear active preset highlight
  document.querySelectorAll('.preset-pill').forEach(btn => btn.classList.remove('preset-pill--active'));
  ['Activity 1', 'Activity 2', 'Activity 3'].forEach(n => addActivity(n));
  [null, null, null].forEach(() => addGroup());
  renderSetup();
}

function resetToSetup() {
  clearInterval(ticker); ticker = null;
  clearInterval(breakTicker); breakTicker = null;
  isPaused = false;
  releaseWakeLock();
  document.getElementById('overlay').classList.remove('active');
  document.getElementById('liveSettings').classList.remove('live-settings--open');
  document.getElementById('runner').style.display = 'none';
  document.getElementById('setup').style.display = 'block';
  const pb = document.getElementById('pauseBtn');
  if (pb) pb.textContent = '⏸ Pause';
}

// ── Timing mode toggle ────────────────────────────────────────────────────

function setTimingMode(mode) {
  timingMode = mode;
  document.getElementById('modeSlotField').style.display = mode === 'slot' ? '' : 'none';
  document.getElementById('modeFinishField').style.display = mode === 'finish' ? '' : 'none';
  document.getElementById('modeSlotBtn').classList.toggle('timing-mode-btn--active', mode === 'slot');
  document.getElementById('modeFinishBtn').classList.toggle('timing-mode-btn--active', mode === 'finish');
  if (mode === 'finish') applyFinishBy();
}

// ── Finish By ─────────────────────────────────────────────────────────────
function applyFinishBy() {
  const val = document.getElementById('finishBy').value;
  const hint = document.getElementById('finishByHint');
  if (!val) { hint.textContent = ''; return; }

  const now = new Date();
  const [h, m] = val.split(':').map(Number);
  const end = new Date(now);
  end.setHours(h, m, 0, 0);
  if (end <= now) end.setDate(end.getDate() + 1); // next day if past

  const numActs = activities.length || 3;
  const breakEnabled = document.getElementById('breakToggle').checked;
  const breakMinsVal = breakEnabled ? (parseFloat(document.getElementById('breakMins').value) || 0) : 0;
  const totalMins = (end - now) / 60000;
  const totalBreakMins = breakMinsVal * (numActs - 1);
  const slotMinsCalc = Math.max(1, Math.floor((totalMins - totalBreakMins) / numActs));

  document.getElementById('slotMins').value = slotMinsCalc;
  hint.textContent = `→ ${slotMinsCalc} min slots`;
}

// Recalculate if activities/breaks change while in finish-by mode
function recalcFinishBy() {
  if (timingMode === 'finish' && document.getElementById('finishBy').value) applyFinishBy();
}

// ── Save / Load Sessions ───────────────────────────────────────────────────
const STORAGE_KEY = 'castime-sessions';

function getStoredSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}

function captureCurrentSetup() {
  return {
    slotMins: document.getElementById('slotMins').value,
    warnEnabled: document.getElementById('warnToggle').checked,
    warnMins: document.getElementById('warnMins').value,
    warnSound: document.getElementById('warnSoundToggle').checked,
    fanfare: document.getElementById('fanfareSoundToggle').checked,
    breakEnabled: document.getElementById('breakToggle').checked,
    breakMins: document.getElementById('breakMins').value,
    breakAutoProgress: document.getElementById('breakAutoProgress').checked,
    continuousTiming: document.getElementById('continuousToggle').checked,
    finalEnabled: document.getElementById('finalGatheringToggle').checked,
    finalName: document.getElementById('finalGatheringName').value,
    activities: activities.map(a => ({ name: a.name })),
    groups: groups.map(g => ({ name: g.name })),
    savedAt: new Date().toLocaleString(),
  };
}

function applySetup(s) {
  document.getElementById('slotMins').value = s.slotMins ?? 10;
  document.getElementById('warnToggle').checked = s.warnEnabled ?? true;
  document.getElementById('warnMins').value = s.warnMins ?? 2;
  document.getElementById('warnSoundToggle').checked = s.warnSound ?? true;
  document.getElementById('fanfareSoundToggle').checked = s.fanfare ?? true;
  document.getElementById('breakToggle').checked = s.breakEnabled ?? false;
  document.getElementById('breakMins').value = s.breakMins ?? 2;
  document.getElementById('breakAutoProgress').checked = s.breakAutoProgress ?? false;
  document.getElementById('continuousToggle').checked = s.continuousTiming ?? false;
  document.getElementById('finalGatheringToggle').checked = s.finalEnabled ?? true;
  document.getElementById('finalGatheringName').value = s.finalName ?? 'Final Gathering';
  finalTask = { enabled: s.finalEnabled ?? true, name: s.finalName ?? 'Final Gathering' };

  activities = (s.activities || []).map(a => ({
    id: Date.now() + Math.random(), name: a.name || ''
  }));
  groups = (s.groups || []).map((g, i) => ({
    id: Date.now() + Math.random(), label: generateGroupLabel(i), name: g.name
  }));

  updateWarnFieldVisibility();
  updateBreakFieldVisibility();
  updateFinalGatheringVisibility();
  document.querySelectorAll('.preset-pill').forEach(b => b.classList.remove('preset-pill--active'));
  renderSetup();
}

function saveSession() {
  const name = prompt('Name this session:');
  if (!name || !name.trim()) return;
  const sessions = getStoredSessions();
  sessions[name.trim()] = captureCurrentSetup();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  populateSavedSessions();
  // Select the newly saved one
  document.getElementById('savedSessionSelect').value = name.trim();
}

function loadSession() {
  const name = document.getElementById('savedSessionSelect').value;
  if (!name) return;
  const sessions = getStoredSessions();
  if (!sessions[name]) return;
  applySetup(sessions[name]);
}

function deleteSession() {
  const name = document.getElementById('savedSessionSelect').value;
  if (!name) return;
  if (!confirm(`Delete "${name}"?`)) return;
  const sessions = getStoredSessions();
  delete sessions[name];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  populateSavedSessions();
}

function previewSavedSession() {
  const name = document.getElementById('savedSessionSelect').value;
  const sessions = getStoredSessions();
  const s = sessions[name];
  const hint = document.getElementById('savedSessionHint');
  if (!hint) return;
  if (s) {
    hint.textContent = `${s.activities?.length || 0} activities · ${s.groups?.length || 0} groups · saved ${s.savedAt || ''}`;
  } else {
    hint.textContent = '';
  }
}

function populateSavedSessions() {
  const sel = document.getElementById('savedSessionSelect');
  const sessions = getStoredSessions();
  const keys = Object.keys(sessions);
  sel.innerHTML = '<option value="">— Saved sessions —</option>';
  keys.forEach(k => {
    const o = document.createElement('option');
    o.value = k; o.textContent = k;
    sel.appendChild(o);
  });
  previewSavedSession();
}

// Init handled by DOMContentLoaded above