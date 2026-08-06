import { PHASE_COLORS, appState } from "./config.js";
import { generateMethodsStatement, generateAPAReport } from "./export.js";
import { parseFilenameMeta } from "./fileParser.js";

// Escapes text before it's inserted into innerHTML/attribute strings.
// Needed anywhere we interpolate filenames, phase labels, or demographic
// values — all of which are attacker/user-controlled and would otherwise
// be able to break out of the surrounding markup.
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// For text embedded as a single-quoted JS-string argument inside a
// double-quoted inline event-handler attribute (e.g. onchange="fn('...')").
// Escapes the value as a JS string literal first (so a "'" in the value
// can't terminate the argument early), then HTML-escapes the result so the
// attribute itself can't be broken out of either.
function escapeJsAttr(str) {
  const jsEscaped = String(str ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return escapeHtml(jsEscaped);
}

export function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
}

export function hideError() { errorBox.style.display = 'none'; }

export function renderMetricCards(s, phaseMetrics) {
  const grid    = document.getElementById('metricsGrid');
  const metrics = [
    { label: 'RMSSD',   key: 'rmssd',  unit: 'ms', desc: 'Root Mean Square of Successive Differences'  },
    { label: 'Mean HR', key: 'meanHR', unit: 'bpm', desc: 'Average Heart Rate in beats per minute' },
    { label: 'SDNN',    key: 'sdnn',   unit: 'ms', desc: 'Standard Deviation of NN intervals'  },
    { label: 'pNN50',   key: 'pnn50',  unit: '%', desc: 'Percentage of NN intervals that differ by more than 50ms'   },
  ];
  grid.innerHTML = metrics.map(m => {
    const phases = phaseMetrics.map((p, i) => {
      const c = PHASE_COLORS[i % PHASE_COLORS.length];
      return `<div style="font-size:11px;color:${c.border};margin-top:4px">${p.label}: ${p.m ? p.m[m.key] : '—'} ${m.unit}</div>`;
    }).join('');
    return `
      <div class="metric-card">
        <div class="label" title = "${m.desc}">${m.label}</div>
        <div class="value">${s ? s[m.key] : '—'}<span class="unit">${m.unit}</span></div>
        ${phases}
      </div>`;
  }).join('');
}

// Renders the summary metrics table with one column per phase, change scores, and full session
export function renderTable(session, phaseMetrics, sessionFreq, phaseFreq) {
  const metrics = [
    { label: 'Beat count', key: 'count',    unit: 'beats', desc: 'Total number of heartbeats detected' },
    { label: 'Mean RR',    key: 'meanRR',   unit: 'ms',    desc: 'Average time between successive heart'    },
    { label: 'Mean HR',    key: 'meanHR',   unit: 'bpm',   desc: 'Average Heart Rate in beats per minute'   },
    { label: 'RMSSD',      key: 'rmssd',    unit: 'ms',    desc: 'Root Mean Square of Successive Differences'    },
    { label: 'SDNN',       key: 'sdnn',     unit: 'ms',    desc: 'Standard Deviation of NN intervals'    },
    { label: 'pNN50',      key: 'pnn50',    unit: '%',     desc: 'Percentage of succesive NN intervals that vary by more than 50ms'     },
    { label: 'Min RR',     key: 'minRR',    unit: 'ms',    desc: 'Shortest interval between heartbeats'    },
    { label: 'Max RR',     key: 'maxRR',    unit: 'ms',    desc: 'Longest interval between heartbeats'    },
    { label: 'Duration',   key: 'duration', unit: 's',     desc: 'Total duration of the recording or phase'     },
  ];

  const table     = document.getElementById('summaryTable');
  const phaseCols = phaseMetrics.map((p, i) => {
    const c = PHASE_COLORS[i % PHASE_COLORS.length];
    return `<th style="color:${c.text}">${p.label}</th>`;
  }).join('');

  // Show change scores only when there are exactly 2 phases
  // Change = Phase 2 minus Phase 1 (absolute and percentage)
 const showChange = phaseMetrics.length === 2 &&
                     phaseMetrics[0].m &&
                     phaseMetrics[1].m;

  const changeHeaders = showChange
    ? `<th style="color:dimgray;">Change (abs)</th>
       <th style="color:dimgray;">Change (%)</th>
       <th style="color:dimgray;" title="Cohen's d using SDNN as the variability estimate">Cohen's d</th>`
    : '';

  const sessionCol = phaseMetrics.length > 0 ? '<th>Full session</th>' : '';

  table.innerHTML = `
    <thead><tr>
      <th>Metric</th><th>Unit</th>
      ${phaseCols}
      ${changeHeaders}
      ${sessionCol}
    </tr></thead>
    <tbody>
      ${metrics.map(m => {
        const phaseCells = phaseMetrics.map((p, i) => {
          const c   = PHASE_COLORS[i % PHASE_COLORS.length];
          const val = p.m ? p.m[m.key] : '—';
          return `<td style="color:${c.text};font-weight:500">${val}</td>`;
        }).join('');

        // Calculate absolute and percentage change between Phase 1 and Phase 2
        let changeCells = '';
        if (showChange) {
          const m1  = phaseMetrics[0].m;
          const m2  = phaseMetrics[1].m;
          const v1  = parseFloat(m1[m.key]);
          const v2  = parseFloat(m2[m.key]);
          const abs = v2 - v1;
          const pct = v1 !== 0 ? (abs / v1) * 100 : 0;

          // Colour: red for increase, blue for decrease, gray for no change
          const absColor = abs > 0 ? 'brown' : abs < 0 ? 'blue' : 'gray';
          const sign     = abs > 0 ? '+' : '';

          // Cohen's d uses SDNN as the variability estimate. Skipped for SDNN itself
          // (would just be (v2-v1)/pooled-of-itself, meaningless) and beat count.
          const skipD = m.key === 'sdnn' || m.key === 'count' || m.key === 'duration';
          const dVal  = skipD
            ? '—'
            : cohensD(m1[m.key], m1.sdnn, m1.count, m2[m.key], m2.sdnn, m2.count);

          changeCells = `
            <td style="color:${absColor};font-weight:500">
              ${sign}${abs.toFixed(2)}
            </td>
            <td style="color:${absColor};font-weight:500">
              ${sign}${pct.toFixed(1)}%
            </td>
            <td style="color:dimgray;font-weight:500">${dVal}</td>`;
        }

        const sessionCell = phaseMetrics.length > 0
          ? `<td>${session ? session[m.key] : '—'}</td>`
          : '';

        return `<tr>
          <td class="metric-name" title = "${m.desc}">${m.label}</td>
          <td class="unit-cell">${m.unit}</td>
          ${phaseCells}
          ${changeCells}
          ${sessionCell}
        </tr>`;
      }).join('')}
    </tbody>`;

  // Add frequency domain rows if data is available
  if (phaseFreq && phaseFreq.length > 0) {
    const freqMetrics = [
      { label: 'LF power', key: 'lf',   unit: 'ms²', desc: 'Low Frequency power' },
      { label: 'HF power', key: 'hf',   unit: 'ms²', desc: 'High Frequency power' },
      { label: 'LF/HF',    key: 'lfhf', unit: ''   , desc: 'Ratio of Low High Frequency power' },
    ];

    const warnings = phaseFreq.filter(p => p.f.warning).map(p => p.label);

    const freqRows = freqMetrics.map(m => {
      const phaseCells = phaseFreq.map((p, i) => {
        const c   = PHASE_COLORS[i % PHASE_COLORS.length];
        const val = p.f[m.key] ?? '—';
        return `<td style="color:${c.text};font-weight:500">${val}</td>`;
      }).join('');

      const sessionCell = phaseFreq.length > 0
        ? `<td>${sessionFreq ? sessionFreq[m.key] ?? '—' : '—'}</td>`
        : '';

      // Change scores not applicable for frequency domain metrics
      // Three placeholders to match the new Cohen's d column.
      const changeCell = phaseMetrics.length === 2 ? `<td>—</td><td>—</td><td>—</td>` : '';

      return `<tr>
        <td class="metric-name" title = "${m.desc}">${m.label}</td>
        <td class="unit-cell">${m.unit}</td>
        ${phaseCells}
        ${changeCell}
        ${sessionCell}
      </tr>`;
    }).join('');

    table.querySelector('tbody').innerHTML += freqRows;

    // Show warning if any phase was too short for reliable analysis
    if (warnings.length > 0) {
      table.querySelector('tbody').innerHTML += `
        <tr>
          <td colspan="20" style="font-size:11px;color:#888780;padding:8px 12px;">
            ⚠ Frequency domain: recording too short for reliable analysis in ${warnings.join(', ')} (minimum 60s per phase recommended)
          </td>
        </tr>`;
    }
  }
}

export function toggleDarkMode(){
    document.body.classList.toggle('dark')
}

// The tabbed single/batch layout (tabSingle/tabBatch/panelBatch) was removed
// when the dropzone/manifest workflow replaced it — only panelSingle and
// panelAbout still exist. This used to also reach for those removed elements
// and throw a TypeError the moment the footer's "About" link called it.
export function switchTab(tab) {
  const panelSingle  = document.getElementById('panelSingle');
  const panelAbout   = document.getElementById('panelAbout');
  const panelLicence = document.getElementById('panelLicence');
  if (!panelSingle || !panelAbout) return;

  panelSingle.style.display  = (tab === 'about' || tab === 'licence') ? 'none' : 'block';
  panelAbout.style.display   = tab === 'about'   ? 'block' : 'none';
  if (panelLicence) panelLicence.style.display = tab === 'licence' ? 'block' : 'none';
}

export function renderSessionMeta(fileName,sessionMetrics){
    const box = document.getElementById("sessionMeta");
    if(!box) return;
    const meta = parseFilenameMeta(fileName);

    // Show a Harvey Duo badge next to the participant ID if applicable
    const duoBadge = meta.isDuo
      ? `<span style="font-size:11px;background:#EAF3DE;color:#27500A;
                      padding:2px 8px;border-radius:10px;margin-left:8px;">
           Harvey Duo · Device ${escapeHtml(meta.duoSuffix)}
         </span>`
      : '';

    box.innerHTML = `
    <p><strong>Filename:</strong> ${escapeHtml(meta.filename)}</p>
    <p><strong>Participant ID:</strong> ${escapeHtml(meta.participantID)}${duoBadge}</p>
    <p><strong>H10 sensor:</strong> ${escapeHtml(meta.h10Mac)}</p>
    <p><strong>Date:</strong> ${escapeHtml(meta.date)}</p>
    <p><strong>Time:</strong> ${escapeHtml(meta.time)}</p>
    <p><strong>Total duration:</strong> ${escapeHtml(sessionMetrics.duration)}s</p>
    `;
}

export function renderLegend(phases) {
  const legend = document.getElementById('phaseLegend');
  legend.innerHTML = '';
  phases.forEach((p, i) => {
    const c     = PHASE_COLORS[i % PHASE_COLORS.length];
    const badge = document.createElement('span');
    badge.className        = 'phase-badge';
    badge.style.background = c.bg;
    badge.style.color      = c.text;
    badge.innerHTML = `<span class="phase-dot" style="background:${c.border}"></span>
    <input type = "text" value = "${escapeHtml(p.label)}"
    style = "width:90px;font-size:11px;"
    onchange = "updatePhaseLabel(${p.phaseNumber},this.value)"/>`;
    legend.appendChild(badge);
  });
  if (phases.length > 1) {
    const badge = document.createElement('span');
    badge.className        = 'phase-badge';
    badge.style.background = '#F1EFE8';
    badge.style.color      = '#444441';
    badge.innerHTML = `<span class="phase-dot" style="background:#888780"></span>Full session`;
    legend.appendChild(badge);
  }
}

export function renderArtefactPanel(currentMethod, currentThreshold) {
  const existing = document.getElementById('artefactPanel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id        = 'artefactPanel';
  panel.className = 'card';
  panel.innerHTML = `
    <div class="card-header">
      <span class="card-title">Processing options</span>
    </div>

    <!-- ── ARTEFACT HANDLING ── -->
    <div class="section-label">Artefact handling</div>

    <div style="display:flex; gap:24px; margin-bottom:16px; flex-wrap:wrap;">
      <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:14px;">
        <input type="radio" name="artefactMethod" value="interpolate" ${currentMethod === 'interpolate' ? 'checked' : ''} style="accent-color:var(--accent);">
        Interpolate <span class="muted-text">(recommended)</span>
      </label>
      <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:14px;">
        <input type="radio" name="artefactMethod" value="delete" ${currentMethod === 'delete' ? 'checked' : ''} style="accent-color:var(--accent);">
        Delete
      </label>
      <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:14px;">
        <input type="radio" name="artefactMethod" value="none" ${currentMethod === 'none' ? 'checked' : ''} style="accent-color:var(--accent);">
        None
      </label>
    </div>

    <div style="margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
        <label style="font-size:13px; color:var(--text-muted); min-width:80px;">Threshold</label>
        <input type="range" id="thresholdSlider" min="10" max="30" step="1" value="${currentThreshold}"
          ${currentMethod === 'none' ? 'disabled' : ''} style="flex:1; max-width:200px; accent-color:var(--accent);">
        <span id="thresholdLabel" style="font-size:13px; font-weight:600; min-width:36px;">${currentThreshold}%</span>
      </div>
      <div style="font-size:11px; color:var(--text-muted); padding-left:92px;">
        10% (strict) ← → 30% (lenient) · default: 20%
      </div>
    </div>

    <div style="margin-bottom:24px;">
      <div style="font-size:13px; color:var(--text-muted); margin-bottom:6px;">Methods statement</div>
      <div style="display:flex; gap:8px; align-items:flex-start;">
        <textarea id="methodsStatement" class="input-area" readonly
          style="flex:1; font-size:12px; resize:none; min-height:60px;"
        >${generateMethodsStatement(currentMethod, currentThreshold)}</textarea>
        <button class="btn btn-sm" onclick="copyMethodsStatement()">Copy</button>
      </div>
    </div>

    <div class="section-divider" style="margin-bottom:16px;">
    <div class="section-label">Output layout</div>
    <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:14px;">
    <input type="checkbox" id="combineDuoRows" onchange="window.onOutputLayoutChange()" style="accent-color:var(--accent);">
    Combine Duo pairs into single rows
    </label>
    </div>

    <!-- ── CHARTS ── -->
    <div class="section-divider">
      <div class="section-label">Charts</div>
      <div style="display:flex; flex-direction:column; gap:6px;">

        ${makeChartRow('rrChart',            'chartTachogram',    'Tachogram (RR intervals over time)', true)}
        ${makeChartOptsPanel('rrChart', true)}

        ${makeChartRow('hrChart',            'chartHR',           'Heart rate over time', false)}
        ${makeChartOptsPanel('hrChart', false)}

        ${makeChartRow('rmssdOverTimeChart', 'chartRmssd',        'RMSSD over time', false)}
        ${makeChartOptsPanel('rmssdOverTimeChart', false)}

        ${makeChartRow('poincareChart',      'chartPoincare',     'Poincaré plot', false)}
        ${makeChartOptsPanel('poincareChart', false, true)}

        ${makeChartRow('histogramChart',     'chartHistogram',    'RR interval histogram', false)}
        ${makeChartOptsPanel('histogramChart', false, false, true)}

        ${makeChartRow('accelerometerChart', 'chartAccelerometer','Accelerometer data', false)}
        ${makeChartOptsPanel('accelerometerChart', false, false, true)}

      </div>
    </div>
  `;

  const metricsGrid = document.getElementById('metricsGrid');
  document.getElementById('results').insertBefore(panel, metricsGrid);

  attachArtefactListeners();
}

// ── Helpers for building chart rows and option panels ──

function makeChartRow(chartId, checkboxId, label, defaultOn) {
  return `
    <div class="chart-option-row">
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; flex:1;">
        <input type="checkbox" id="${checkboxId}" ${defaultOn ? 'checked' : ''} onchange="toggleChart('${chartId}')" style="accent-color:var(--accent);">
        ${label}
      </label>
      <button class="btn btn-sm" onclick="toggleChartOptionsPanel('${chartId}')">Options ▾</button>
    </div>`;
}

// isPoincare / isSimple control which option rows to show
function makeChartOptsPanel(chartId, defaultOn, isPoincare = false, isSimple = false) {
  const timeSeriesOpts = isSimple || isPoincare ? '' : `
    <label><input type="checkbox" id="${chartId}_showPoints"> Show data points</label>
    <label><input type="checkbox" id="${chartId}_showPhaseShading" checked> Show phase shading</label>
    ${!isPoincare ? `<label><input type="checkbox" id="${chartId}_showArtefacts" checked> Show artefact markers</label>` : ''}
    <div class="opts-row">
      <span>Smoothing:</span>
      <label><input type="radio" name="${chartId}_smoothing" value="raw" checked> Raw</label>
      <label><input type="radio" name="${chartId}_smoothing" value="smooth"> Smooth</label>
    </div>
    <div class="opts-row">
      <span>Lock Y axis:</span>
      <label>Min <input type="number" id="${chartId}_yMin" placeholder="auto"></label>
      <label>Max <input type="number" id="${chartId}_yMax" placeholder="auto"></label>
    </div>
    <button class="btn btn-sm" onclick="applyChartOptions('${chartId}')">Apply</button>`;

  return `
    <div id="opts-${chartId}" class="chart-opts-panel" style="display:none; margin:2px 0 6px 24px;">
      ${timeSeriesOpts}
      <label><input type="checkbox" id="${chartId}_whiteBg"> White background</label>
      <label><input type="checkbox" id="${chartId}_showGrid" checked> Grid lines</label>
    </div>`;
}

// Attach change listeners to the radio buttons and threshold slider
export function attachArtefactListeners() {
  document.querySelectorAll('input[name="artefactMethod"]').forEach(radio => {
    radio.addEventListener('change', window.onSettingsChange);
  });
  const slider = document.getElementById('thresholdSlider');
  if (slider) {
    slider.addEventListener('input', () => {
      document.getElementById('thresholdLabel').textContent = slider.value + '%';
      window.onSettingsChange();
    });
  }
}

// Returns the currently selected artefact method from the radio buttons
export function getArtefactMethod() {
  const checked = document.querySelector('input[name="artefactMethod"]:checked');
  return checked ? checked.value : 'interpolate';
}

// Returns the current threshold slider value as an integer
export function getThreshold() {
  const slider = document.getElementById('thresholdSlider');
  return slider ? parseInt(slider.value) : 20;
}

export function renderQualitySummary(phaseQuality){
    const table = 
    document.getElementById("qualityTable")

    table.innerHTML = `
    <thead>
        <tr>
            <th> Phase </th>
            <th> beats recorded</th>
            <th> beats retained </th>
            <th> Beats handled </th>
            <th> rating </th>
        </tr>
        </thead>
        <tbody>
            ${phaseQuality.map(p => `
                <tr>
                <td>${escapeHtml(p.label)}</td>
                <td>${p.q.heartBeatDataTotal}</td>
                <td>${p.q.HeartBeatDataretained}</td>
                <td>${p.q.messedUpBeats}</td>
                <td>${p.q.rating} (${p.q.percentRetained}%)</td>
                </tr>
            `).join('')}
    </tbody>

    `;
   
}

// Render the batch summary table in the UI
export function renderBatchTable(rows) {
  const table = document.getElementById('batchTable');
  if (!table || rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  table.innerHTML = `
    <thead>
      <tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map(row => `
        <tr>${headers.map(h => `<td>${escapeHtml(row[h] ?? '—')}</td>`).join('')}</tr>
      `).join('')}
    </tbody>`;
}

export function renderGroupSummaryTable(rows) {
  const table = document.getElementById('groupSummaryTable');
  if (!table) return;

  // Get all column names except ParticipantID
  const allCols   = Object.keys(rows[0]).filter(k => k !== 'ParticipantID');

  // Group columns by metric name (e.g. RMSSD) across phases
  // Column format: Phase1_RMSSD → phase: Phase1, metric: RMSSD
  const metrics = [...new Set(allCols.map(c => c.split('_').slice(1).join('_')))];
  const phases  = [...new Set(allCols.map(c => c.split('_')[0]))];

  // Calculate mean and SD for each column
  function mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
  function sd(arr) {
    const m = mean(arr);
    return Math.sqrt(arr.map(v => (v - m) ** 2).reduce((a, b) => a + b, 0) / arr.length);
  }

  // Build header row with one column per phase
  const phaseHeaders = phases.map((p, i) => {
    const c = PHASE_COLORS[i % PHASE_COLORS.length];
    return `<th style="color:${c.text}">${escapeHtml(p.replace(/_/g, ' '))}</th>`;
  }).join('');

  // Build one row per metric
  const bodyRows = metrics.map(metric => {
    const cells = phases.map((phase, i) => {
      const col    = `${phase}_${metric}`;
      const values = rows.map(r => parseFloat(r[col])).filter(v => !isNaN(v));
      if (values.length === 0) return `<td>—</td>`;
      const c      = PHASE_COLORS[i % PHASE_COLORS.length];
      const m      = mean(values).toFixed(2);
      const s      = sd(values).toFixed(2);
      return `<td style="color:${c.text};font-weight:500">${m} ± ${s}</td>`;
    }).join('');
    return `<tr>
      <td class="metric-name">${escapeHtml(metric.replace(/_/g, ' '))}</td>
      ${cells}
    </tr>`;
  }).join('');

  table.innerHTML = `
    <thead><tr>
      <th>Metric</th>${phaseHeaders}
    </tr></thead>
    <tbody>${bodyRows}</tbody>`;
}

// Copies the methods statement text to the clipboard
export function copyMethodsStatement() {
  const stmt = document.getElementById('methodsStatement');
  if (!stmt) return;
  navigator.clipboard.writeText(stmt.value).then(() => {
    const btn      = stmt.nextElementSibling;
    const original = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = original; }, 1500);
  });
}

export function showAPAReport(){
  const report = generateAPAReport();
  document.getElementById(`apaReportBox`).value = report;
}

export function buildDemographicsHTML(participantID){

  const data = appState.demographics.get(participantID) || {};
  const pidAttr = escapeJsAttr(participantID);
  let html = `<div class="demographics-fields">`;

  appState.demographicFields.forEach(field => {
    const val = data[field] || '';
    html += `

    <label>
    <span class="field-label">${escapeHtml(field)}</span>
    <input type="text" value="${escapeHtml(val)}"
    onchange="updateDemographicValue('${pidAttr}', '${escapeJsAttr(field)}',this.value)">
    </label>
    `;
  });

  html += `<button class="btn btn-sm" onclick="addDemograaphicField()"> + Add Field>`;
  html += '</div>';
  return html;
}

export function renderManifest(manifest){
  document.getElementById('dropZone').style.display = 'none';
  document.getElementById('manifestPanel').style.display = 'block';

  const listEl = document.getElementById('manifestList');
  const warnEl = document.getElementById('manifestWarnings');

  warnEl.style.display = manifest.warnings.length > 0 ? 'block' : 'none';
  warnEl.innerHTML = manifest.warnings.map(w => escapeHtml(w)).join('<br>');

  let html = '<div style = "display: flex; flex-direction:column; gap:16px;">';


  manifest.sessions.forEach((s,index) => {
    let name = s.baseID;
    let type = 'Solo session';
    if(s.kind == 'duo-pair') {name = `${s.baseID}.1 + ${s.baseID}.2`; type = 'Harvey Duo pair'; }
    else if( s.kind === 'duo-unmatched') {name = `${s.baseID}${s.meta.duoSuffix || ''}`; type = `Duo ${s.missingPair}`;}

    html += `

    <div class="manifest-item">
    <div class="manifest-item-header">
    <div class="manifest-item-title">
    <strong class="manifest-item-name">${escapeHtml(name)}</strong>
    <span class="manifest-item-type">${escapeHtml(type)}</span>
    </div>
    <button class="btn btn-sm" onclick="removeManifestItem(${index})"> Remove</button>
    </div>
    ${buildDemographicsHTML(s.baseID)}
    </div>`;

  });

  manifest.demographics.forEach((d,index) => {
    html += `

    <div class="manifest-item demographics manifest-item-header">
    <div class="manifest-item-title">
    <strong class="manifest-item-name">${escapeHtml(d.name)}</strong>
    <span class="manifest-item-type">Demographics file (matched via ParticipantID)</span>
    </div>
    <button class="btn btn-sm" onclick="removeDemographicItem(${index})"> Remove </button>
    </div>`;
  });

  html += '</div>';
  listEl.innerHTML = html;
};