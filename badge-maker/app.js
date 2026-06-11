/* =====================================================================
   Badge Maker 2.0 — app.js
   Vanilla JS, no storage, no network calls. Safe for GitHub Pages.

   ── HOW TO EXTEND ────────────────────────────────────────────────────
   • Icons:        add entries to ICON_LIBRARY below (any category).
   • Decorations:  add entries to DECORATIONS, then give each shape a
                   default position in DECOR_DEFAULTS.
   • Colours:      add entries to COLOR_PRESETS.
   • Layout:       per-shape text positions / icon slots live in SHAPES.
   All positions use centre-origin coordinates: x → right, y → up.
   The badge canvas is 512 × 512 (centre = 0,0; edge ≈ ±256).
   ===================================================================== */

"use strict";

/* =====================================================================
   1. CONFIG — edit freely
   ===================================================================== */

const COLOR_PRESETS = {
  rainbow:{ label:"Rainbow", stops:[
    {color:"#ff5f6d",at:0},{color:"#ffa42b",at:18},{color:"#ffd23f",at:36},
    {color:"#3ddc84",at:55},{color:"#2f8df5",at:76},{color:"#8b5cf6",at:100}]},
  bronze:{ label:"Bronze", stops:[
    {color:"#5e3a1e",at:0},{color:"#cd7f32",at:35},{color:"#f1c189",at:60},{color:"#8c5a2b",at:100}]},
  silver:{ label:"Silver", stops:[
    {color:"#8e9aa9",at:0},{color:"#eef2f7",at:40},{color:"#a7b1c0",at:70},{color:"#dfe6ee",at:100}]},
  gold:{ label:"Gold", stops:[
    {color:"#8a6d1a",at:0},{color:"#ffd700",at:40},{color:"#fff3b0",at:65},{color:"#d4a017",at:100}]},
  red:{ label:"Red", stops:[{color:"#7f1d1d",at:0},{color:"#f87171",at:55},{color:"#b91c1c",at:100}]},
  orange:{ label:"Orange", stops:[{color:"#7c2d12",at:0},{color:"#fb923c",at:55},{color:"#c2410c",at:100}]},
  yellow:{ label:"Yellow", stops:[{color:"#854d0e",at:0},{color:"#fde047",at:55},{color:"#ca8a04",at:100}]},
  green:{ label:"Green", stops:[{color:"#14532d",at:0},{color:"#4ade80",at:55},{color:"#15803d",at:100}]},
  blue:{ label:"Blue", stops:[{color:"#1e3a8a",at:0},{color:"#60a5fa",at:55},{color:"#1d4ed8",at:100}]},
  indigo:{ label:"Indigo", stops:[{color:"#312e81",at:0},{color:"#818cf8",at:55},{color:"#4338ca",at:100}]},
  violet:{ label:"Violet", stops:[{color:"#4c1d95",at:0},{color:"#c084fc",at:55},{color:"#7e22ce",at:100}]},
};

/* Icons are 24×24, Tabler-style strokes. `svg` is the inner markup.   */
const ICON_LIBRARY = {
  "Research skills":{
    flask:{ label:"Flask", svg:'<path d="M10 3v6l-4.6 8.1A2 2 0 0 0 7.2 20h9.6a2 2 0 0 0 1.8-2.9L14 9V3"/><path d="M9 3h6"/><path d="M8.5 14h7"/>' },
    "bell-curve":{ label:"Bell curve", svg:'<path d="M3 19h18"/><path d="M4 19c4.5 0 5-12 8-12s3.5 12 8 12"/>' },
    search:{ label:"Magnifier", svg:'<circle cx="10" cy="10" r="6.5"/><path d="M15 15l5.5 5.5"/>' },
    "clipboard-check":{ label:"Clipboard", svg:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/><path d="M9 13.5l2 2 4-4.5"/>' },
  },
  "Employability":{
    briefcase:{ label:"Briefcase", svg:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>' },
    award:{ label:"Award", svg:'<circle cx="12" cy="9" r="5"/><path d="M9.2 13.4L7.8 21l4.2-2.7L16.2 21l-1.4-7.6"/>' },
    target:{ label:"Target", svg:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>' },
    presentation:{ label:"Presentation", svg:'<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/><path d="M7 12l3-3 2 2 4-4"/>' },
  },
  "Academic":{
    book:{ label:"Book", svg:'<path d="M5 19.5V5a2 2 0 0 1 2-2h12v16H7a2 2 0 0 0-2 2z"/><path d="M5 19.5A2.5 2.5 0 0 0 7.5 22H19v-3"/>' },
    pencil:{ label:"Pencil", svg:'<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/>' },
    "grad-cap":{ label:"Graduation", svg:'<path d="M22 9L12 5 2 9l10 4 10-4z"/><path d="M6 11.2V15c0 1.6 2.7 3 6 3s6-1.4 6-3v-3.8"/><path d="M22 9v5"/>' },
    bulb:{ label:"Idea", svg:'<path d="M12 3a6 6 0 0 0-4 10.4c.7.6 1 1.6 1 2.6h6c0-1 .3-2 1-2.6A6 6 0 0 0 12 3z"/><path d="M9.5 19h5M10.5 22h3"/>' },
  },
  "Community & wellbeing":{
    heart:{ label:"Heart", svg:'<path d="M12 20s-7.2-4.6-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-1.8 4.4-9 9-9 9z"/>' },
    users:{ label:"People", svg:'<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.2 2.6-5 6-5s6 1.8 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M17.5 14.6c2.3.4 3.5 2.1 3.5 4.4"/>' },
    star:{ label:"Star", svg:'<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8z"/>' },
    trophy:{ label:"Trophy", svg:'<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 5H5a3 3 0 0 0 3.2 4M16 5h3a3 3 0 0 1-3.2 4"/><path d="M12 14v4M8 21h8M9.5 18h5"/>' },
  },
};

/* Decorative elements. `fill:true` = solid shape, otherwise strokes.  */
const DECORATIONS = {
  "laurel-left":{ label:"Laurel (left)", svg:'<path d="M19 21C13 18.5 9.5 13.5 9.5 5"/><path d="M9.5 7C7.5 6.5 6.3 5 6 2.6 8.4 3 9.8 4.4 10.2 6.4"/><path d="M10 11C8 10.8 6.4 9.6 5.7 7.3 8.1 7.4 9.7 8.6 10.4 10.5"/><path d="M11.4 14.7C9.4 14.9 7.6 14 6.4 12 8.8 11.7 10.6 12.6 11.6 14.3"/><path d="M13.6 17.8C11.6 18.3 9.7 17.7 8.2 15.9 10.6 15.3 12.5 15.9 13.8 17.4"/>' },
  "laurel-right":{ label:"Laurel (right)", flip:true, svg:'<path d="M19 21C13 18.5 9.5 13.5 9.5 5"/><path d="M9.5 7C7.5 6.5 6.3 5 6 2.6 8.4 3 9.8 4.4 10.2 6.4"/><path d="M10 11C8 10.8 6.4 9.6 5.7 7.3 8.1 7.4 9.7 8.6 10.4 10.5"/><path d="M11.4 14.7C9.4 14.9 7.6 14 6.4 12 8.8 11.7 10.6 12.6 11.6 14.3"/><path d="M13.6 17.8C11.6 18.3 9.7 17.7 8.2 15.9 10.6 15.3 12.5 15.9 13.8 17.4"/>' },
  sparkle:{ label:"Sparkle", fill:true, svg:'<path d="M12 2c.8 4.8 2.9 7.4 8 8.2-5.1.8-7.2 3.4-8 8.2-.8-4.8-2.9-7.4-8-8.2 5.1-.8 7.2-3.4 8-8.2z"/>' },
  divider:{ label:"Divider", svg:'<path d="M2 12h7M15 12h7"/><path d="M12 9.6l2 2.4-2 2.4-2-2.4z"/>' },
};

/* Default position / scale of each decoration, PER SHAPE.
   Edit these numbers to taste — x right, y up, from badge centre.     */
const DECOR_DEFAULTS = {
  circle:{
    "laurel-left":  { x:-92, y:-118, scale:2.1 },
    "laurel-right": { x: 92, y:-118, scale:2.1 },
    sparkle:        { x:  0, y:-122, scale:1.7 },
    divider:        { x:  0, y:  32, scale:3.2 },
  },
  square:{
    "laurel-left":  { x:-104, y:-128, scale:2.2 },
    "laurel-right": { x: 104, y:-128, scale:2.2 },
    sparkle:        { x:   0, y:-134, scale:1.8 },
    divider:        { x:   0, y:  34, scale:3.6 },
  },
  hexagon:{
    "laurel-left":  { x:-78, y:-104, scale:1.9 },
    "laurel-right": { x: 78, y:-104, scale:1.9 },
    sparkle:        { x:  0, y:-112, scale:1.6 },
    divider:        { x:  0, y:  30, scale:3.0 },
  },
};

/* Per-shape layout: text positions and the slots new icons drop into. */
const SHAPES = {
  circle:{ label:"Circle",
    title:   { y: 62, maxW:280 },
    subtitle:{ y: 14, maxW:260 },
    iconSlots:[ {x:-82,y:-48},{x:0,y:-48},{x:82,y:-48},{x:0,y:118} ],
  },
  square:{ label:"Square",
    title:   { y: 72, maxW:320 },
    subtitle:{ y: 22, maxW:300 },
    iconSlots:[ {x:-92,y:-52},{x:0,y:-52},{x:92,y:-52},{x:0,y:128} ],
  },
  hexagon:{ label:"Hexagon",
    title:   { y: 56, maxW:250 },
    subtitle:{ y: 10, maxW:230 },
    iconSlots:[ {x:-70,y:-44},{x:0,y:-44},{x:70,y:-44},{x:0,y:104} ],
  },
};

const MAX_EXPORT_BYTES = 256 * 1024;

/* =====================================================================
   2. STATE
   ===================================================================== */
const state = {
  shape:"circle",
  scallops:true, scallopCount:14, scallopDepth:9,
  borderWidth:46,
  preset:"rainbow",
  stops: COLOR_PRESETS.rainbow.stops.map(s=>({...s})),
  title:   { text:"RESEARCH", size:46, color:"#3b3f8c" },
  subtitle:{ text:"Skills Award", size:20, color:"#5a5f73" },
  icons:[],        // {uid, iconId, custom?, svg, label, x, y, scale, color|null}
  decorations:[],  // {uid, decorId, x, y, scale, color|null}
  grid:false,
};
let uidCounter = 1;
const uid = () => "u" + (uidCounter++);

/* =====================================================================
   3. GEOMETRY
   ===================================================================== */
const CX = 256, CY = 256, R_OUT = 244;

/* Outline point at parameter t (0..1) for a shape of "radius" R.
   Returns {x,y} in SVG space, plus unit outward normal.               */
function outlinePoint(shape, t, R){
  const a = t * Math.PI * 2 - Math.PI/2;            // start at top
  if (shape === "circle"){
    return { x:CX + R*Math.cos(a), y:CY + R*Math.sin(a), nx:Math.cos(a), ny:Math.sin(a) };
  }
  if (shape === "square"){                          // squircle (superellipse n=4)
    const n = 4, c = Math.cos(a), s = Math.sin(a);
    const x = Math.sign(c)*Math.pow(Math.abs(c),2/n)*R;
    const y = Math.sign(s)*Math.pow(Math.abs(s),2/n)*R;
    const len = Math.hypot(x,y)||1;
    return { x:CX+x, y:CY+y, nx:x/len, ny:y/len };
  }
  // hexagon: flat polar formula (pointy-top)
  const seg = Math.PI/3;
  const local = ((a%seg)+seg)%seg - seg/2;
  const r = R * Math.cos(seg/2) / Math.cos(local);
  const x = r*Math.cos(a), y = r*Math.sin(a);
  const len = Math.hypot(x,y)||1;
  return { x:CX+x, y:CY+y, nx:x/len, ny:y/len };
}

/* Build a closed path, optionally with a scalloped (wavy) edge.       */
function shapePath(shape, R, scallops){
  const N = 240;
  let d = "";
  for (let i=0; i<=N; i++){
    const t = i/N;
    const p = outlinePoint(shape, t, R);
    let x = p.x, y = p.y;
    if (scallops){
      const wave = state.scallopDepth * Math.cos(t * Math.PI*2 * state.scallopCount);
      x += p.nx * wave; y += p.ny * wave;
    }
    d += (i? "L":"M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d + "Z";
}

/* Inner usable radius of the badge face (for auto-fit + counters).    */
const faceRadius = () => R_OUT - state.borderWidth - (state.scallops? state.scallopDepth:0) - 6;

/* =====================================================================
   4. RENDER BADGE
   ===================================================================== */
const stage = document.getElementById("stage-canvas");

function gradientDefs(){
  const stops = [...state.stops].sort((a,b)=>a.at-b.at)
    .map(s=>`<stop offset="${s.at}%" stop-color="${s.color}"/>`).join("");
  return `
  <defs>
    <linearGradient id="bm-grad" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>
    <linearGradient id="bm-metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"  stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="70%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.28"/>
    </linearGradient>
    <radialGradient id="bm-face" cx="0.5" cy="0.38" r="0.75">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="78%" stop-color="#fbfaff"/>
      <stop offset="100%" stop-color="#eef0f7"/>
    </radialGradient>
    <radialGradient id="bm-shine" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

function iconMarkup(item, kind){
  const def = kind==="decor" ? DECORATIONS[item.decorId] : null;
  const inner = kind==="decor" ? def.svg : item.svg;
  const flip  = kind==="decor" && def.flip;
  const colour = item.color || "url(#bm-grad)";
  const isFill = kind==="decor" && def.fill;
  const paint = isFill
    ? `fill="${colour}" stroke="none"`
    : `fill="none" stroke="${colour}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const sx = (flip? -1:1) * item.scale;
  const tx = (CX + item.x).toFixed(1), ty = (CY - item.y).toFixed(1);
  return `<g transform="translate(${tx} ${ty}) scale(${sx} ${item.scale}) translate(-12 -12)" ${paint}>${inner}</g>`;
}

function gridMarkup(){
  if (!state.grid) return "";
  let g = '<g class="bm-grid" font-family="Inter,sans-serif" font-size="9">';
  for (let v=-224; v<=224; v+=32){
    const major = v % 64 === 0;
    const c = major? "#9aa6c0":"#c9d1e4";
    g += `<line x1="${CX+v}" y1="12" x2="${CX+v}" y2="500" stroke="${c}" stroke-width="${v===0?1.6:0.7}"/>`;
    g += `<line x1="12" y1="${CY+v}" x2="500" y2="${CY+v}" stroke="${c}" stroke-width="${v===0?1.6:0.7}"/>`;
    if (major && v!==0){
      g += `<text x="${CX+v+2}" y="${CY-3}" fill="#7c89a6">${v}</text>`;
      g += `<text x="${CX+3}" y="${CY-v-3}" fill="#7c89a6">${v}</text>`;
    }
  }
  g += `<text x="${CX+4}" y="${CY+11}" fill="#5a6478" font-weight="700">0,0</text></g>`;
  return g;
}

function badgeSVG({forExport=false} = {}){
  const sh = state.shape;
  const outer = shapePath(sh, R_OUT, state.scallops);
  const faceR = R_OUT - state.borderWidth;
  const face  = shapePath(sh, faceR, false);
  const rim   = shapePath(sh, faceR + 3, false);
  const L = SHAPES[sh];

  let text = "";
  if (state.title.text){
    text += `<text x="${CX}" y="${CY - L.title.y}" text-anchor="middle"
      font-family="'Sora','Inter',sans-serif" font-weight="700" font-size="${state.title.size}"
      letter-spacing="2" fill="${state.title.color}">${esc(state.title.text)}</text>`;
  }
  if (state.subtitle.text){
    text += `<text x="${CX}" y="${CY - L.subtitle.y}" text-anchor="middle"
      font-family="'Inter',sans-serif" font-weight="600" font-size="${state.subtitle.size}"
      letter-spacing="3" fill="${state.subtitle.color}">${esc(state.subtitle.text.toUpperCase())}</text>`;
  }

  const icons = state.icons.map(i=>iconMarkup(i,"icon")).join("");
  const decor = state.decorations.map(d=>iconMarkup(d,"decor")).join("");

  return `<svg class="badge" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="Badge: ${esc(state.title.text)}">
  ${gradientDefs()}
  <path d="${outer}" fill="url(#bm-grad)"/>
  <path d="${outer}" fill="url(#bm-metal)"/>
  <path d="${rim}" fill="none" stroke="#ffffff" stroke-opacity="0.75" stroke-width="2.5"/>
  <path d="${face}" fill="url(#bm-face)"/>
  <path d="${face}" fill="none" stroke="url(#bm-grad)" stroke-opacity="0.35" stroke-width="1.5"/>
  <ellipse cx="380" cy="105" rx="60" ry="26" transform="rotate(38 380 105)" fill="url(#bm-shine)" opacity="0.8"/>
  ${text}${icons}${decor}${forExport? "":gridMarkup()}
  </svg>`;
}

const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

function render(){
  stage.innerHTML = badgeSVG();
  updateCounters();
}

/* =====================================================================
   5. PANEL — build + events
   ===================================================================== */

/* ---- shape ---- */
document.querySelectorAll(".shape-opt").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".shape-opt").forEach(b=>b.setAttribute("aria-pressed","false"));
    btn.setAttribute("aria-pressed","true");
    state.shape = btn.dataset.shape;
    // re-seat decorations on their per-shape defaults
    state.decorations.forEach(d=>{
      const def = DECOR_DEFAULTS[state.shape][d.decorId];
      if (def) Object.assign(d, def);
    });
    buildPlacedLists(); render();
  });
});
bindNumber("adv-scallop-count","scallopCount");
bindNumber("adv-scallop-depth","scallopDepth");
bindNumber("adv-border-width","borderWidth");
document.getElementById("adv-scallops").checked = state.scallops;
document.getElementById("adv-scallops").addEventListener("change", e=>{
  state.scallops = e.target.checked; render();
});

function bindNumber(id, key, obj=state){
  const el = document.getElementById(id);
  el.value = obj[key];
  el.addEventListener("input", ()=>{
    const v = Number(el.value);
    if (!Number.isNaN(v)) { obj[key] = clamp(v, Number(el.min)||-999, Number(el.max)||999); render(); }
  });
}
const clamp = (v,lo,hi)=>Math.min(hi,Math.max(lo,v));

/* ---- colour swatches ---- */
const swatchGrid = document.getElementById("swatch-grid");
Object.entries(COLOR_PRESETS).forEach(([key,p])=>{
  const b = document.createElement("button");
  b.className = "swatch";
  b.title = p.label;
  b.setAttribute("aria-label", p.label);
  b.setAttribute("aria-pressed", key===state.preset ? "true":"false");
  b.style.background = `linear-gradient(135deg, ${p.stops.map(s=>`${s.color} ${s.at}%`).join(",")})`;
  const lab = document.createElement("span"); lab.textContent = p.label; b.appendChild(lab);
  b.addEventListener("click", ()=>{
    state.preset = key;
    state.stops = p.stops.map(s=>({...s}));
    swatchGrid.querySelectorAll(".swatch").forEach(s=>s.setAttribute("aria-pressed","false"));
    b.setAttribute("aria-pressed","true");
    buildStopList(); render();
  });
  swatchGrid.appendChild(b);
});

/* ---- gradient stop editor ---- */
const stopList = document.getElementById("stop-list");
function buildStopList(){
  stopList.innerHTML = "";
  state.stops.forEach((s,i)=>{
    const row = document.createElement("div");
    row.className = "stop-row";
    row.innerHTML = `
      <input type="color" value="${s.color}" aria-label="Colour point ${i+1}">
      <span class="pos-label">at</span>
      <input type="number" min="0" max="100" step="1" value="${s.at}" aria-label="Position % of point ${i+1}">
      <span class="pos-label">%</span>
      <button class="del" title="Remove this colour point" ${state.stops.length<=2? "disabled":""}>🗑</button>`;
    const inputs = row.querySelectorAll("input");
    const col = inputs[0], num = inputs[1];
    col.addEventListener("input", ()=>{ s.color = col.value; render(); });
    num.addEventListener("input", ()=>{ s.at = clamp(Number(num.value)||0,0,100); render(); });
    row.querySelector(".del").addEventListener("click", ()=>{
      if (state.stops.length>2){ state.stops.splice(i,1); buildStopList(); render(); }
    });
    stopList.appendChild(row);
  });
}
document.getElementById("btn-add-stop").addEventListener("click", ()=>{
  state.stops.push({ color:"#888888", at:50 });
  buildStopList(); render();
});
buildStopList();

/* ---- text ---- */
const inputTitle = document.getElementById("input-title");
const inputSubtitle = document.getElementById("input-subtitle");
inputTitle.value = state.title.text;
inputSubtitle.value = state.subtitle.text;

function maxChars(which){
  const L = SHAPES[state.shape][which];
  const factor = which==="title" ? 0.66 : 0.62;  // rough glyph width incl. letter-spacing
  return Math.max(4, Math.floor(L.maxW / (state[which].size * factor)));
}
function updateCounters(){
  [["title",inputTitle,"count-title"],["subtitle",inputSubtitle,"count-subtitle"]].forEach(([k,inp,cid])=>{
    const max = maxChars(k);
    inp.maxLength = max;
    if (state[k].text.length > max){ state[k].text = state[k].text.slice(0,max); inp.value = state[k].text; }
    const c = document.getElementById(cid);
    c.textContent = `${state[k].text.length}/${max}`;
    c.classList.toggle("over", state[k].text.length >= max);
  });
}
inputTitle.addEventListener("input", ()=>{ state.title.text = inputTitle.value; render(); });
inputSubtitle.addEventListener("input", ()=>{ state.subtitle.text = inputSubtitle.value; render(); });
bindNumber("adv-title-size","size",state.title);
bindNumber("adv-subtitle-size","size",state.subtitle);
bindColor("adv-title-color", state.title);
bindColor("adv-subtitle-color", state.subtitle);
function bindColor(id, obj){
  const el = document.getElementById(id);
  el.value = obj.color;
  el.addEventListener("input", ()=>{ obj.color = el.value; render(); });
}

/* ---- icon library tiles ---- */
const catWrap = document.getElementById("icon-categories");
Object.entries(ICON_LIBRARY).forEach(([cat, icons])=>{
  const sec = document.createElement("div");
  sec.className = "icon-cat";
  sec.innerHTML = `<h3>${cat}</h3>`;
  const grid = document.createElement("div"); grid.className = "tile-grid";
  Object.entries(icons).forEach(([id, ic])=>{
    const t = document.createElement("button");
    t.className = "tile"; t.title = `Add ${ic.label}`;
    t.innerHTML = `<svg viewBox="0 0 24 24">${ic.svg}</svg>`;
    t.addEventListener("click", ()=>addIcon(id, ic));
    grid.appendChild(t);
  });
  sec.appendChild(grid); catWrap.appendChild(sec);
});

function addIcon(id, ic){
  const slots = SHAPES[state.shape].iconSlots;
  const slot = slots[state.icons.length % slots.length];
  state.icons.push({ uid:uid(), iconId:id, svg:ic.svg, label:ic.label, x:slot.x, y:slot.y, scale:1.9, color:null });
  buildPlacedLists(); render();
}

/* ---- Tabler import ---- */
document.getElementById("btn-import-icon").addEventListener("click", ()=>{
  const box = document.getElementById("import-svg");
  const msg = document.getElementById("import-msg");
  try{
    const doc = new DOMParser().parseFromString(box.value, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) throw new Error("no svg");
    svg.querySelectorAll("script,style,foreignObject,image").forEach(n=>n.remove());
    svg.querySelectorAll("*").forEach(n=>{
      [...n.attributes].forEach(a=>{
        if (/^on/i.test(a.name) || a.value.includes("javascript:")) n.removeAttribute(a.name);
        if (["stroke","fill"].includes(a.name)) n.removeAttribute(a.name); // recolourable
      });
    });
    state.icons.push({
      uid:uid(), iconId:"custom", svg:svg.innerHTML, label:"Imported icon",
      ...SHAPES[state.shape].iconSlots[state.icons.length % 4], scale:1.9, color:null
    });
    box.value = ""; msg.textContent = "Icon added to the badge ✓";
    buildPlacedLists(); render();
  }catch{
    msg.textContent = "That didn't look like SVG code. Use “Copy SVG” on tabler.io/icons and paste the whole snippet.";
  }
});

/* ---- decoration tiles ---- */
const decorTiles = document.getElementById("decor-tiles");
Object.entries(DECORATIONS).forEach(([id, d])=>{
  const t = document.createElement("button");
  t.className = "tile"; t.title = `Add ${d.label}`;
  t.innerHTML = `<svg viewBox="0 0 24 24" ${d.fill? 'style="fill:#1c2330;stroke:none"':""}>${d.svg}</svg>`;
  t.addEventListener("click", ()=>{
    const def = DECOR_DEFAULTS[state.shape][id] || {x:0,y:0,scale:2};
    state.decorations.push({ uid:uid(), decorId:id, ...def, color:null });
    buildPlacedLists(); render();
  });
  decorTiles.appendChild(t);
});

/* ---- placed item editors (icons + decorations) ---- */
function buildPlacedLists(){
  buildPlaced("placed-icons", state.icons, (it)=>it.label,
    (it)=>`<svg viewBox="0 0 24 24">${it.svg}</svg>`);
  buildPlaced("placed-decor", state.decorations, (it)=>DECORATIONS[it.decorId].label,
    (it)=>`<svg viewBox="0 0 24 24" ${DECORATIONS[it.decorId].fill? 'style="fill:#1c2330;stroke:none"':""}>${DECORATIONS[it.decorId].svg}</svg>`);
}
function buildPlaced(containerId, list, nameFn, thumbFn){
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = "";
  list.forEach((it, idx)=>{
    const card = document.createElement("div");
    card.className = "placed";
    card.innerHTML = `
      <div class="placed-top">${thumbFn(it)}<span class="name">${nameFn(it)}</span>
        <button class="del" title="Remove">🗑</button></div>
      <div class="placed-fields">
        <label>X <input type="number" step="2" value="${it.x}"></label>
        <label>Y <input type="number" step="2" value="${it.y}"></label>
        <label>Scale <input type="number" step="0.1" min="0.3" max="8" value="${it.scale}"></label>
        <label>Colour <input type="color" value="${it.color || "#888888"}"></label>
        <button class="btn tiny" title="Use the badge colour style">↺ style</button>
      </div>`;
    const [nx, ny, ns, nc] = card.querySelectorAll("input");
    nx.addEventListener("input", ()=>{ it.x = Number(nx.value)||0; render(); });
    ny.addEventListener("input", ()=>{ it.y = Number(ny.value)||0; render(); });
    ns.addEventListener("input", ()=>{ it.scale = clamp(Number(ns.value)||1, .3, 8); render(); });
    nc.addEventListener("input", ()=>{ it.color = nc.value; render(); });
    card.querySelector(".btn.tiny").addEventListener("click", ()=>{ it.color = null; nc.value = "#888888"; render(); });
    card.querySelector(".del").addEventListener("click", ()=>{ list.splice(idx,1); buildPlacedLists(); render(); });
    wrap.appendChild(card);
  });
}

/* ---- grid toggle ---- */
document.getElementById("toggle-grid").addEventListener("change", e=>{
  state.grid = e.target.checked; render();
});

/* ---- auto-fit ---- */
document.getElementById("btn-autofit").addEventListener("click", ()=>{
  const fr = faceRadius();
  // shrink text until it fits its max width
  ["title","subtitle"].forEach(k=>{
    const L = SHAPES[state.shape][k];
    const factor = k==="title"? 0.66:0.62;
    while (state[k].text.length * state[k].size * factor > L.maxW && state[k].size > 12){
      state[k].size -= 1;
    }
  });
  document.getElementById("adv-title-size").value = state.title.size;
  document.getElementById("adv-subtitle-size").value = state.subtitle.size;
  // pull icons/decorations inside the face
  [...state.icons, ...state.decorations].forEach(it=>{
    const half = 12 * it.scale;
    const dist = Math.hypot(it.x, it.y);
    const maxDist = fr - half - 8;
    if (dist > maxDist && dist > 0){
      const f = maxDist / dist;
      it.x = Math.round(it.x * f); it.y = Math.round(it.y * f);
    }
  });
  buildPlacedLists(); render();
});

/* =====================================================================
   6. HELP MODALS
   ===================================================================== */
const HELP = {
  shape:{ title:"Badge shape", body:`
    <p>Pick the overall outline of your badge. All other settings carry over when you switch shapes.</p>
    <ul>
      <li><strong>Scalloped edge</strong> (in advanced settings) adds a rosette-style wavy border — like a quality seal.</li>
      <li><strong>Border width</strong> changes how thick the coloured rim is.</li>
    </ul>`},
  colour:{ title:"Colour style", body:`
    <p>Choose a preset style for the badge border. <strong>Bronze, silver and gold</strong> work well for tiered awards; <strong>rainbow</strong> suits celebration badges.</p>
    <ul>
      <li>In advanced settings you can fine-tune every colour point of the gradient.</li>
      <li>Use <strong>＋ Add colour point</strong> for richer blends; a minimum of 2 points is required.</li>
    </ul>`},
  text:{ title:"Badge text", body:`
    <p>Every badge needs a <strong>title</strong> — keep it short and bold (e.g. RESEARCH). The <strong>subtitle</strong> is optional and sits underneath.</p>
    <ul>
      <li>The counter (e.g. 6/9) shows how many characters fit on the badge face. It adjusts automatically when you change the text size.</li>
      <li>Text positions are fixed per shape so badges stay consistent across a module.</li>
    </ul>`},
  icons:{ title:"Icons", body:`
    <p>Click any icon tile to add it to the badge. New icons drop into sensible slots; fine-tune them in the list that appears below the tiles.</p>
    <ul>
      <li><strong>X / Y</strong> move the icon (X: left–right, Y: down–up, from the badge centre). Turn on the <strong>positioning grid</strong> above the preview to see the coordinates.</li>
      <li><strong>Colour</strong> recolours the icon; <strong>↺ style</strong> returns it to the badge's gradient colours.</li>
      <li>Want a different icon? Open the import section to fetch any icon from Tabler's free library.</li>
    </ul>`},
  decor:{ title:"Decorations", body:`
    <p>Decorations are flourishes — laurels, sparkles and dividers — that give the badge a finished, award-like feel.</p>
    <ul>
      <li>Each decoration lands in a default spot for the current shape (laurels at the bottom, sparkle at the base, divider under the title).</li>
      <li>Adjust position, scale and colour in the list below the tiles, exactly like icons.</li>
    </ul>`},
};
const helpBackdrop = document.getElementById("help-backdrop");
document.querySelectorAll(".help-btn").forEach(b=>{
  b.addEventListener("click", ()=>{
    const h = HELP[b.dataset.help];
    document.getElementById("help-title").textContent = h.title;
    document.getElementById("help-body").innerHTML = h.body;
    helpBackdrop.hidden = false;
    document.getElementById("help-close").focus();
  });
});
document.getElementById("help-close").addEventListener("click", ()=>helpBackdrop.hidden = true);
helpBackdrop.addEventListener("click", e=>{ if (e.target===helpBackdrop) helpBackdrop.hidden = true; });

/* =====================================================================
   7. EXPORT
   ===================================================================== */
const exportBackdrop = document.getElementById("export-backdrop");
const fmtKB = b => (b/1024).toFixed(1) + " KB";
let jpgBlob = null;

document.getElementById("btn-export").addEventListener("click", async ()=>{
  if (!state.title.text.trim()){
    alert("Please add a title before exporting — every badge needs one.");
    inputTitle.focus(); return;
  }
  exportBackdrop.hidden = false;
  const warn = document.getElementById("export-warn");
  warn.textContent = "";

  // --- SVG size ---
  const svgText = exportSVGText();
  const svgBytes = new Blob([svgText], {type:"image/svg+xml"}).size;
  setPill("size-svg", svgBytes);

  // --- JPG size (rendered at 1024px, quality stepped to fit 256 KB) ---
  document.getElementById("size-jpg").textContent = "estimating…";
  try{
    jpgBlob = await makeJPG(svgText);
    setPill("size-jpg", jpgBlob.size);
    if (jpgBlob.size > MAX_EXPORT_BYTES)
      warn.textContent = "The JPG could not be compressed under 256 KB — try the SVG instead.";
  }catch{
    document.getElementById("size-jpg").textContent = "unavailable";
    warn.textContent = "JPG preview failed in this browser — the SVG download still works.";
  }
});
function setPill(id, bytes){
  const el = document.getElementById(id);
  el.textContent = fmtKB(bytes);
  el.classList.toggle("over", bytes > MAX_EXPORT_BYTES);
}
document.getElementById("export-close").addEventListener("click", ()=>exportBackdrop.hidden = true);
exportBackdrop.addEventListener("click", e=>{ if (e.target===exportBackdrop) exportBackdrop.hidden = true; });

function exportSVGText(){
  // Embed the design as metadata so the SVG can be re-imported and edited.
  // (Plain JSON inside a <metadata> tag — ignored by browsers and Moodle.)
  const designJSON = esc(JSON.stringify(serializeState()));
  const meta = `<metadata id="badge-maker-state">${designJSON}</metadata>`;
  return badgeSVG({forExport:true})
    .replace('class="badge" ','')
    .replace("</svg>", meta + "</svg>");
}
function serializeState(){
  const { grid, ...rest } = state;
  return { version:2, ...JSON.parse(JSON.stringify(rest)) };
}
function makeJPG(svgText){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgText], {type:"image/svg+xml"}));
    img.onload = ()=>{
      URL.revokeObjectURL(url);
      const c = document.createElement("canvas");
      c.width = c.height = 1024;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,1024,1024);
      ctx.drawImage(img, 0, 0, 1024, 1024);
      const tryQ = (q)=>{
        c.toBlob(b=>{
          if (!b) return reject();
          if (b.size <= MAX_EXPORT_BYTES || q <= 0.4) resolve(b);
          else tryQ(q - 0.1);
        }, "image/jpeg", q);
      };
      tryQ(0.92);
    };
    img.onerror = ()=>{ URL.revokeObjectURL(url); reject(); };
    img.src = url;
  });
}
function download(blob, name){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}
const fileStem = ()=> (state.title.text.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-") || "badge");
document.getElementById("btn-dl-svg").addEventListener("click", ()=>{
  download(new Blob([exportSVGText()], {type:"image/svg+xml"}), fileStem()+".svg");
});
document.getElementById("btn-dl-jpg").addEventListener("click", async ()=>{
  if (!jpgBlob) jpgBlob = await makeJPG(exportSVGText());
  download(jpgBlob, fileStem()+".jpg");
});

/* =====================================================================
   7b. IMPORT A PREVIOUSLY EXPORTED BADGE
   ===================================================================== */
const importBadgeInput = document.getElementById("import-badge-file");
document.getElementById("btn-import-badge").addEventListener("click", ()=>importBadgeInput.click());
importBadgeInput.addEventListener("change", ()=>{
  const file = importBadgeInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    importBadgeInput.value = "";          // allow re-importing the same file
    try{
      const doc = new DOMParser().parseFromString(reader.result, "image/svg+xml");
      const meta = doc.getElementById("badge-maker-state");
      if (!meta) throw new Error("no-meta");
      applyImportedState(JSON.parse(meta.textContent));
    }catch(err){
      alert(err.message === "no-meta"
        ? "This SVG wasn't exported from Badge Maker, so it can't be re-opened for editing.\n\nTip: badges exported here carry their design inside the file — export from Badge Maker and you can always import them again later."
        : "That file couldn't be read as a badge. Please choose an SVG exported from Badge Maker.");
    }
  };
  reader.readAsText(file);
});

function applyImportedState(s){
  // Validate + merge cautiously, so a hand-edited file can't break the app.
  if (!s || typeof s !== "object" || !s.title) throw new Error("Invalid badge data.");
  state.shape        = SHAPES[s.shape] ? s.shape : "circle";
  state.scallops     = !!s.scallops;
  state.scallopCount = clamp(Number(s.scallopCount)||14, 6, 40);
  state.scallopDepth = clamp(Number(s.scallopDepth)||9, 2, 20);
  state.borderWidth  = clamp(Number(s.borderWidth)||46, 20, 80);
  state.preset       = COLOR_PRESETS[s.preset] ? s.preset : "rainbow";
  state.stops        = Array.isArray(s.stops) && s.stops.length>=2
    ? s.stops.map(p=>({ color:safeColor(p.color), at:clamp(Number(p.at)||0,0,100) }))
    : COLOR_PRESETS[state.preset].stops.map(p=>({...p}));
  Object.assign(state.title,    { text:String(s.title.text||"").slice(0,60),    size:clamp(Number(s.title.size)||46,12,72),    color:safeColor(s.title.color,"#3b3f8c") });
  Object.assign(state.subtitle, { text:String(s.subtitle?.text||"").slice(0,60), size:clamp(Number(s.subtitle?.size)||20,10,40), color:safeColor(s.subtitle?.color,"#5a5f73") });
  state.icons = (Array.isArray(s.icons)? s.icons:[]).map(i=>({
    uid:uid(), iconId:String(i.iconId||"custom"),
    svg:sanitizeSVGFragment(String(i.svg||"")), label:String(i.label||"Icon").slice(0,40),
    x:num(i.x), y:num(i.y), scale:clamp(Number(i.scale)||1.9,.3,8),
    color:i.color? safeColor(i.color):null,
  }));
  state.decorations = (Array.isArray(s.decorations)? s.decorations:[])
    .filter(d=>DECORATIONS[d.decorId])
    .map(d=>({ uid:uid(), decorId:d.decorId, x:num(d.x), y:num(d.y),
               scale:clamp(Number(d.scale)||2,.3,8), color:d.color? safeColor(d.color):null }));
  syncPanel();
  render();
}
const num = v => clamp(Number(v)||0, -256, 256);
const safeColor = (v, fallback="#888888") => /^#[0-9a-fA-F]{3,8}$/.test(String(v)) ? v : fallback;

/* Strip anything executable from stored icon markup before re-injecting. */
function sanitizeSVGFragment(fragment){
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${fragment}</svg>`, "image/svg+xml");
  const svg = doc.querySelector("svg");
  if (!svg) return "";
  svg.querySelectorAll("script,style,foreignObject,image,use").forEach(n=>n.remove());
  svg.querySelectorAll("*").forEach(n=>{
    [...n.attributes].forEach(a=>{
      if (/^on/i.test(a.name) || /javascript:|data:/i.test(a.value)) n.removeAttribute(a.name);
      if (a.name === "href" || a.name === "xlink:href") n.removeAttribute(a.name);
    });
  });
  return svg.innerHTML;
}

/* Push current state back into every panel control after an import. */
function syncPanel(){
  document.querySelectorAll(".shape-opt").forEach(b=>
    b.setAttribute("aria-pressed", b.dataset.shape===state.shape ? "true":"false"));
  document.getElementById("adv-scallops").checked = state.scallops;
  document.getElementById("adv-scallop-count").value = state.scallopCount;
  document.getElementById("adv-scallop-depth").value = state.scallopDepth;
  document.getElementById("adv-border-width").value = state.borderWidth;
  swatchGrid.querySelectorAll(".swatch").forEach(s=>
    s.setAttribute("aria-pressed", s.title===COLOR_PRESETS[state.preset].label ? "true":"false"));
  buildStopList();
  inputTitle.value = state.title.text;
  inputSubtitle.value = state.subtitle.text;
  document.getElementById("adv-title-size").value = state.title.size;
  document.getElementById("adv-title-color").value = state.title.color;
  document.getElementById("adv-subtitle-size").value = state.subtitle.size;
  document.getElementById("adv-subtitle-color").value = state.subtitle.color;
  buildPlacedLists();
}

/* =====================================================================
   8. FIRST PAINT — a friendly starting badge
   ===================================================================== */
(function seed(){
  // a starter layout echoing the CPD Day badge: icons row + laurels + sparkle
  ["laurel-left","laurel-right","sparkle"].forEach(id=>{
    state.decorations.push({ uid:uid(), decorId:id, ...DECOR_DEFAULTS.circle[id], color:null });
  });
  buildPlacedLists();
  render();
})();
