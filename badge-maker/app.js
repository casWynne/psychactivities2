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
  ribbon:{ label:"Ribbon banner", fill:true, svg:'<path d="M2 8h20l-2.6 4L22 16H2l2.6-4L2 8z"/>' },
  crown:{ label:"Crown", svg:'<path d="M4.5 16.5L3 8l5 3.5L12 5l4 6.5L21 8l-1.5 8.5z"/><path d="M5 20h14"/>' },
  dots:{ label:"Dot divider", fill:true, svg:'<circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/>' },
  burst:{ label:"Starburst", svg:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>' },
};

/* Default position / scale of each decoration, PER SHAPE.
   Edit these numbers to taste — x right, y up, from badge centre.     */
const DECOR_DEFAULTS = {
  circle:{
    "laurel-left":  { x:-92, y:-118, scale:2.1 },
    "laurel-right": { x: 92, y:-118, scale:2.1 },
    sparkle:        { x:  0, y:-122, scale:1.7 },
    divider:        { x:  0, y:  32, scale:3.2 },
    ribbon:         { x:  0, y:-146, scale:3.2 },
    crown:          { x:  0, y: 128, scale:1.7 },
    dots:           { x:  0, y: -80, scale:2.0 },
    burst:          { x:  0, y: 134, scale:1.5 },
  },
  square:{
    "laurel-left":  { x:-104, y:-128, scale:2.2 },
    "laurel-right": { x: 104, y:-128, scale:2.2 },
    sparkle:        { x:   0, y:-134, scale:1.8 },
    divider:        { x:   0, y:  34, scale:3.6 },
    ribbon:         { x:   0, y:-158, scale:3.6 },
    crown:          { x:   0, y: 140, scale:1.9 },
    dots:           { x:   0, y: -88, scale:2.2 },
    burst:          { x:   0, y: 146, scale:1.6 },
  },
  hexagon:{
    "laurel-left":  { x:-78, y:-104, scale:1.9 },
    "laurel-right": { x: 78, y:-104, scale:1.9 },
    sparkle:        { x:  0, y:-112, scale:1.6 },
    divider:        { x:  0, y:  30, scale:3.0 },
    ribbon:         { x:  0, y:-128, scale:2.8 },
    crown:          { x:  0, y: 114, scale:1.5 },
    dots:           { x:  0, y: -72, scale:1.8 },
    burst:          { x:  0, y: 120, scale:1.4 },
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

/* Quick-alignment offsets for the L/C/R and T/M/B buttons on placed
   icons & decorations. EDIT ME to change the snap positions.         */
const ALIGN_STEP_X = 72;
const ALIGN_STEP_Y = 72;

/* =====================================================================
   2. STATE
   ===================================================================== */
const state = {
  shape:"circle",
  scallops:true, scallopCount:14, scallopDepth:9,
  borderWidth:46,
  preset:"rainbow",
  stops: COLOR_PRESETS.rainbow.stops.map(s=>({...s})),
  title:   { text:"RESEARCH", size:46, color:"#3b3f8c", x:0, y:62, arch:"none", archRadius:150 },
  subtitle:{ text:"Skills Award", size:20, color:"#5a5f73", x:0, y:14, arch:"none", archRadius:158 },
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
const stage   = document.getElementById("badge-holder");
const mini100 = document.getElementById("mini-100");
const mini60  = document.getElementById("mini-60");

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
  let inner = kind==="decor" ? def.svg : item.svg;
  const flip  = kind==="decor" && def.flip;
  const colour = item.color || "url(#bm-grad)";
  // normalise any icon canvas (24, 256, 512…) to a 24-unit design size
  const w = item.w || 24, h = item.h || 24;
  const normal = 24 / Math.max(w, h);
  let paint;
  if (kind!=="decor" && item.isImage){
    inner = `<image href="${item.dataUrl}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
    paint = "";
  } else if (kind!=="decor" && item.selfPainted){
    // icon body carries its own fills/strokes (e.g. Material, Phosphor):
    // swap currentColor for the chosen paint and leave the rest alone
    inner = inner.replace(/currentColor/g, colour);
    paint = "";
  } else if (kind==="decor" && def.fill){
    paint = `fill="${colour}" stroke="none"`;
  } else {
    paint = `fill="none" stroke="${colour}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  }
  const s = item.scale * normal;
  const sx = (flip? -1:1) * s;
  const tx = (CX + item.x).toFixed(1), ty = (CY - item.y).toFixed(1);
  return `<g transform="translate(${tx} ${ty}) scale(${sx} ${s}) translate(${-w/2} ${-h/2})" ${paint}>${inner}</g>`;
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
  const textEl = (k)=>{
    const t = state[k];
    if (!t.text) return "";
    const content = k==="subtitle" ? esc(t.text.toUpperCase()) : esc(t.text);
    const fontAttrs = k==="title"
      ? `font-family="'Sora','Inter',sans-serif" font-weight="700" font-size="${t.size}" letter-spacing="2" fill="${t.color}"`
      : `font-family="'Inter',sans-serif" font-weight="600" font-size="${t.size}" letter-spacing="3" fill="${t.color}"`;
    if (t.arch === "none"){
      return `<text x="${CX + t.x}" y="${CY - t.y}" text-anchor="middle" ${fontAttrs}>${content}</text>`;
    }
    // Arched text: a semicircular path centred on the badge; sweep=1 runs
    // over the top (text upright above), sweep=0 under the bottom.
    const r = t.archRadius;
    const sweep = t.arch === "up" ? 1 : 0;
    const pid = `bm-arc-${k}`;
    const d = `M ${CX - r} ${CY} A ${r} ${r} 0 0 ${sweep} ${CX + r} ${CY}`;
    return `<defs><path id="${pid}" d="${d}" fill="none"/></defs>
      <text text-anchor="middle" ${fontAttrs}><textPath href="#${pid}" startOffset="50%">${content}</textPath></text>`;
  };
  text += textEl("title");
  text += textEl("subtitle");

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
  const mini = badgeSVG({forExport:true});   // grid-free copy for the minis
  mini100.innerHTML = mini;
  mini60.innerHTML = mini;
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
    // re-seat decorations and text on their per-shape defaults
    state.decorations.forEach(d=>{
      const def = DECOR_DEFAULTS[state.shape][d.decorId];
      if (def) Object.assign(d, def);
    });
    state.title.x = 0;    state.title.y = SHAPES[state.shape].title.y;
    state.subtitle.x = 0; state.subtitle.y = SHAPES[state.shape].subtitle.y;
    syncTextPositionInputs();
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

/* Usable text width: straight texts use the per-shape limit; arched
   texts get ~58% of their semicircle's length as a safe maximum.     */
function maxWFor(which){
  const t = state[which];
  return t.arch !== "none" ? Math.PI * t.archRadius * 0.58 : SHAPES[state.shape][which].maxW;
}
function maxChars(which){
  const factor = which==="title" ? 0.66 : 0.62;  // rough glyph width incl. letter-spacing
  return Math.max(4, Math.floor(maxWFor(which) / (state[which].size * factor)));
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
// arch (curve) controls
[["title-arch","title"],["subtitle-arch","subtitle"]].forEach(([id,k])=>{
  const el = document.getElementById(id);
  el.value = state[k].arch;
  el.addEventListener("change", ()=>{ state[k].arch = el.value; render(); });
});
bindNumber("title-arch-r","archRadius",state.title);
bindNumber("subtitle-arch-r","archRadius",state.subtitle);
// text position controls + align buttons
bindNumber("adv-title-x","x",state.title);
bindNumber("adv-title-y","y",state.title);
bindNumber("adv-subtitle-x","x",state.subtitle);
bindNumber("adv-subtitle-y","y",state.subtitle);

function syncTextPositionInputs(){
  document.getElementById("adv-title-x").value = state.title.x;
  document.getElementById("adv-title-y").value = state.title.y;
  document.getElementById("adv-subtitle-x").value = state.subtitle.x;
  document.getElementById("adv-subtitle-y").value = state.subtitle.y;
}

document.querySelectorAll(".text-align").forEach(holder=>{
  const k = holder.dataset.target;            // "title" | "subtitle"
  holder.innerHTML = `
    <span class="align-label">Align</span>
    <span class="align-group" role="group" aria-label="Align ${k} horizontally">
      <button class="alg" data-x="${-ALIGN_STEP_X}" title="Align left">L</button>
      <button class="alg" data-x="0" title="Centre horizontally">C</button>
      <button class="alg" data-x="${ALIGN_STEP_X}" title="Align right">R</button>
    </span>
    <span class="align-group" role="group" aria-label="Align ${k} vertically">
      <button class="alg" data-y="${ALIGN_STEP_Y}" title="Align top">T</button>
      <button class="alg" data-y="0" title="Centre vertically">M</button>
      <button class="alg" data-y="${-ALIGN_STEP_Y}" title="Align bottom">B</button>
    </span>`;
  holder.querySelectorAll(".alg").forEach(b=>{
    b.addEventListener("click", ()=>{
      if (b.dataset.x !== undefined) state[k].x = Number(b.dataset.x);
      if (b.dataset.y !== undefined) state[k].y = Number(b.dataset.y);
      syncTextPositionInputs();
      render();
    });
  });
});
function bindColor(id, obj){
  const el = document.getElementById(id);
  el.value = obj.color;
  el.addEventListener("input", ()=>{ obj.color = el.value; render(); });
}

/* ---- icon library tiles ---- */
/* ---- icon library: collapsed accordions, one per category ----
   New categories/icons added to ICON_LIBRARY appear here automatically;
   tile grids wrap to new rows however many icons a category holds.   */
const catWrap = document.getElementById("icon-categories");
Object.entries(ICON_LIBRARY).forEach(([cat, icons])=>{
  const sec = document.createElement("details");
  sec.className = "icon-cat";
  const summary = document.createElement("summary");
  summary.innerHTML = `<span>${cat}</span><span class="cat-count">${Object.keys(icons).length}</span>`;
  sec.appendChild(summary);
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
  state.icons.push({
    uid:uid(), iconId:id, svg:ic.svg, label:ic.label,
    w:ic.w||24, h:ic.h||24, selfPainted:!!ic.selfPainted,
    x:slot.x, y:slot.y, scale:1.9, color:null
  });
  buildPlacedLists(); render();
}

/* ---- icon search (all open sets via the free Iconify API) ----
   api.iconify.design is free, keyless and CORS-enabled.
   ── EDIT ME: add/remove entries to change the set-filter dropdown.
   Keys are Iconify prefixes (see icon-sets.iconify.design).         */
const ICON_SET_FILTERS = {
  "":                 "All icon sets",
  "tabler":           "Tabler",
  "material-symbols": "Material Symbols",
  "ph":               "Phosphor",
  "lucide":           "Lucide",
  "bi":               "Bootstrap",
  "noto":             "Noto Emoji (colour)",
};
const SEARCH_FETCH_LIMIT = 256;   // how many matches to pull from the API
const SEARCH_PAGE_SIZE   = 24;    // how many tiles to show per "page"

const ICONIFY = "https://api.iconify.design";
const searchInput   = document.getElementById("icon-search-input");
const searchBtn     = document.getElementById("btn-icon-search");
const searchResults = document.getElementById("icon-search-results");
const searchMsg     = document.getElementById("icon-search-msg");
const setFilter     = document.getElementById("icon-set-filter");
const moreBtn       = document.getElementById("btn-more-icons");

Object.entries(ICON_SET_FILTERS).forEach(([value,label])=>{
  const o = document.createElement("option");
  o.value = value; o.textContent = label;
  setFilter.appendChild(o);
});

let pendingIcons = [];     // "prefix:name" strings not yet rendered
let totalFound   = 0;
let shownCount   = 0;
let setNamesCache = {};

searchBtn.addEventListener("click", searchIcons);
moreBtn.addEventListener("click", renderMoreResults);
searchInput.addEventListener("keydown", e=>{ if (e.key==="Enter"){ e.preventDefault(); searchIcons(); } });

async function searchIcons(){
  const q = searchInput.value.trim();
  if (!q) { searchInput.focus(); return; }
  searchResults.innerHTML = "";
  moreBtn.hidden = true;
  pendingIcons = []; totalFound = 0; shownCount = 0;
  searchMsg.textContent = "Searching…";
  searchBtn.disabled = true;
  try{
    const prefix = setFilter.value ? `&prefix=${encodeURIComponent(setFilter.value)}` : "";
    const res = await fetch(`${ICONIFY}/search?query=${encodeURIComponent(q)}&limit=${SEARCH_FETCH_LIMIT}${prefix}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    pendingIcons = data.icons || [];
    totalFound = data.total ?? pendingIcons.length;
    setNamesCache = data.collections || {};
    if (!pendingIcons.length){
      searchMsg.textContent = `No icons found for “${q}” — try a simpler or more general word, or switch the set filter back to “All icon sets”.`;
      return;
    }
    await renderMoreResults();
  }catch{
    searchMsg.textContent = "Couldn't reach the icon library — check your internet connection. The built-in icons above still work offline.";
  }finally{
    searchBtn.disabled = false;
  }
}

async function renderMoreResults(){
  moreBtn.disabled = true;
  const batch = pendingIcons.splice(0, SEARCH_PAGE_SIZE);
  // group by icon set so each set's bodies arrive in one request
  const bySet = {};
  batch.forEach(full=>{
    const [prefix, name] = full.split(":");
    if (prefix && name) (bySet[prefix] ||= []).push(name);
  });
  try{
    await Promise.all(Object.entries(bySet).map(async ([prefix, names])=>{
      const r = await fetch(`${ICONIFY}/${prefix}.json?icons=${names.join(",")}`);
      if (!r.ok) return;
      const set = await r.json();
      names.forEach(name=>{
        const ic = set.icons?.[name];
        if (!ic || !ic.body) return;
        const w = ic.width  || set.width  || 24;
        const h = ic.height || set.height || 24;
        const body = sanitizeSVGFragment(ic.body);
        if (!body) return;
        const setLabel = setNamesCache[prefix]?.name || prefix;
        const label = name.replace(/-/g, " ");
        const t = document.createElement("button");
        t.className = "tile"; t.title = `Add “${label}” (${setLabel})`;
        t.innerHTML = `<svg viewBox="0 0 ${w} ${h}">${body.replace(/currentColor/g, "#1c2330")}</svg>`;
        t.addEventListener("click", ()=>addIcon(`${prefix}:${name}`,
          { label, svg: body, w, h, selfPainted: true }));
        searchResults.appendChild(t);
        shownCount++;
      });
    }));
    moreBtn.hidden = pendingIcons.length === 0;
    const moreNote = totalFound > shownCount + pendingIcons.length
      ? ` (of ${totalFound} matches — refine your search to see the rest)` : "";
    searchMsg.textContent = shownCount
      ? `Showing ${shownCount} of ${shownCount + pendingIcons.length} loaded results${moreNote}. Click an icon to add it; hover a tile to see its icon set.`
      : "No usable icons in these results — try another word.";
  }catch{
    searchMsg.textContent = "Some results couldn't be loaded — check your connection and try again.";
  }finally{
    moreBtn.disabled = false;
  }
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
      });
    });
    // read the icon's canvas size so any set (24, 256, 512 units) scales correctly
    const vb = (svg.getAttribute("viewBox")||"").split(/[\s,]+/).map(Number);
    const w = (vb.length===4 && vb[2]>0) ? vb[2] : (Number(svg.getAttribute("width"))||24);
    const h = (vb.length===4 && vb[3]>0) ? vb[3] : (Number(svg.getAttribute("height"))||24);
    state.icons.push({
      uid:uid(), iconId:"custom", svg:svg.innerHTML, label:"Imported icon",
      w, h, selfPainted:true,
      ...SHAPES[state.shape].iconSlots[state.icons.length % 4], scale:1.9, color:null
    });
    box.value = ""; msg.textContent = "Icon added to the badge ✓";
    buildPlacedLists(); render();
  }catch{
    msg.textContent = "That didn't look like SVG code. Use “Copy SVG” on tabler.io/icons and paste the whole snippet.";
  }
});

/* ---- image upload (PNG/JPG embedded into the badge) ----
   Opinionated importer: validates type & size, auto-shrinks large
   images, and warns when an upload may hurt quality or file size.   */
const uploadInput = document.getElementById("upload-image");
const uploadMsg   = document.getElementById("upload-msg");
const UPLOAD_MAX_DIM   = 320;          // longest side after auto-resize (px)
const UPLOAD_HARD_KB   = 2048;         // reject anything larger outright
const UPLOAD_RESIZE_KB = 120;          // resize trigger
const UPLOAD_WARN_KB   = 180;          // warn that export may exceed 256 KB

uploadInput.addEventListener("change", ()=>{
  const file = uploadInput.files[0];
  uploadInput.value = "";
  if (!file) return;
  uploadMsg.textContent = "";
  if (!/^image\/(png|jpeg)$/.test(file.type)){
    uploadMsg.textContent = "Please choose a PNG or JPG image — other formats can't be embedded reliably.";
    return;
  }
  if (file.size > UPLOAD_HARD_KB * 1024){
    uploadMsg.textContent = `That image is ${Math.round(file.size/1024)} KB — far too large for a badge. Please use an image under ${UPLOAD_HARD_KB/2} KB (around 200–300 px square is ideal).`;
    return;
  }
  const objUrl = URL.createObjectURL(file);
  const img = new Image();
  img.onload = ()=>{
    URL.revokeObjectURL(objUrl);
    let w = img.naturalWidth, h = img.naturalHeight;
    const warnings = [];
    if (Math.max(w,h) < 96) warnings.push("it's quite small, so it may look blurry on the badge");
    if (Math.abs(w-h) > Math.max(w,h)*0.25) warnings.push("it isn't square, so it will sit as a rectangle (a square image usually looks better)");
    const finish = (dataUrl, fw, fh)=>{
      const kb = Math.round(dataUrl.length * 0.75 / 1024);
      if (kb > UPLOAD_WARN_KB) warnings.push(`the embedded image is ~${kb} KB, so the exported badge may exceed the 256 KB limit — check the size in the export window`);
      const slot = SHAPES[state.shape].iconSlots[state.icons.length % 4];
      state.icons.push({
        uid:uid(), iconId:"image", isImage:true, dataUrl, svg:"",
        label:(file.name || "Image").slice(0,24), w:fw, h:fh, selfPainted:false,
        x:slot.x, y:slot.y, scale:2.2, color:null
      });
      buildPlacedLists(); render();
      uploadMsg.textContent = `Image added (~${kb} KB)` + (warnings.length? `. Note: ${warnings.join("; ")}.` : ".");
    };
    if (Math.max(w,h) > UPLOAD_MAX_DIM || file.size > UPLOAD_RESIZE_KB * 1024){
      const f = Math.min(1, UPLOAD_MAX_DIM / Math.max(w,h));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w*f));
      c.height = Math.max(1, Math.round(h*f));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = file.type === "image/png"
        ? c.toDataURL("image/png")
        : c.toDataURL("image/jpeg", 0.85);
      warnings.push(`it was resized to ${c.width}×${c.height} px to keep the badge file small`);
      finish(dataUrl, c.width, c.height);
    } else {
      const r = new FileReader();
      r.onload  = ()=>finish(r.result, w, h);
      r.onerror = ()=>{ uploadMsg.textContent = "That image couldn't be read — please try another file."; };
      r.readAsDataURL(file);
    }
  };
  img.onerror = ()=>{
    URL.revokeObjectURL(objUrl);
    uploadMsg.textContent = "That image couldn't be read — please try another file.";
  };
  img.src = objUrl;
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
    (it)=> it.isImage
      ? `<svg viewBox="0 0 ${it.w||24} ${it.h||24}"><image href="${it.dataUrl}" width="${it.w||24}" height="${it.h||24}"/></svg>`
      : `<svg viewBox="0 0 ${it.w||24} ${it.h||24}">${String(it.svg).replace(/currentColor/g,"#1c2330")}</svg>`);
  buildPlaced("placed-decor", state.decorations, (it)=>DECORATIONS[it.decorId].label,
    (it)=>`<svg viewBox="0 0 24 24" ${DECORATIONS[it.decorId].fill? 'style="fill:#1c2330;stroke:none"':""}>${DECORATIONS[it.decorId].svg}</svg>`);
}
function buildPlaced(containerId, list, nameFn, thumbFn){
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = "";
  list.forEach((it, idx)=>{
    const card = document.createElement("div");
    card.className = "placed";
    const colourBits = it.isImage ? "" : `
        <label>Colour <input class="f-col" type="color" value="${it.color || "#888888"}"></label>
        <button class="btn tiny f-style" title="Use the badge colour style">↺ style</button>`;
    card.innerHTML = `
      <div class="placed-top">${thumbFn(it)}<span class="name">${nameFn(it)}</span>
        <button class="del" title="Remove">🗑</button></div>
      <div class="placed-fields">
        <label>X <input class="f-x" type="number" step="2" value="${it.x}"></label>
        <label>Y <input class="f-y" type="number" step="2" value="${it.y}"></label>
        <label>Scale <input class="f-scale" type="number" step="0.1" min="0.3" max="8" value="${it.scale}"></label>
        ${colourBits}
      </div>
      <div class="placed-align">
        <span class="align-label">Align</span>
        <span class="align-group" role="group" aria-label="Align horizontally">
          <button class="alg" data-x="${-ALIGN_STEP_X}" title="Align left">L</button>
          <button class="alg" data-x="0" title="Centre horizontally">C</button>
          <button class="alg" data-x="${ALIGN_STEP_X}" title="Align right">R</button>
        </span>
        <span class="align-group" role="group" aria-label="Align vertically">
          <button class="alg" data-y="${ALIGN_STEP_Y}" title="Align top">T</button>
          <button class="alg" data-y="0" title="Centre vertically">M</button>
          <button class="alg" data-y="${-ALIGN_STEP_Y}" title="Align bottom">B</button>
        </span>
      </div>`;
    const nx = card.querySelector(".f-x"), ny = card.querySelector(".f-y"), ns = card.querySelector(".f-scale");
    nx.addEventListener("input", ()=>{ it.x = Number(nx.value)||0; render(); });
    ny.addEventListener("input", ()=>{ it.y = Number(ny.value)||0; render(); });
    ns.addEventListener("input", ()=>{ it.scale = clamp(Number(ns.value)||1, .3, 8); render(); });
    const nc = card.querySelector(".f-col");
    if (nc){
      nc.addEventListener("input", ()=>{ it.color = nc.value; render(); });
      card.querySelector(".f-style").addEventListener("click", ()=>{ it.color = null; nc.value = "#888888"; render(); });
    }
    card.querySelectorAll(".alg").forEach(b=>{
      b.addEventListener("click", ()=>{
        if (b.dataset.x !== undefined){ it.x = Number(b.dataset.x); nx.value = it.x; }
        if (b.dataset.y !== undefined){ it.y = Number(b.dataset.y); ny.value = it.y; }
        render();
      });
    });
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
    const factor = k==="title"? 0.66:0.62;
    while (state[k].text.length * state[k].size * factor > maxWFor(k) && state[k].size > 12){
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
      <li>The counter (e.g. 6/9) shows how many characters fit on the badge face. It adjusts automatically when you change the text size — and gets more generous when text is arched (a curve holds more letters than a straight line).</li>
      <li><strong>Advanced settings</strong> hold each text's size, colour, X/Y position with quick <strong>Align</strong> buttons (L/C/R and T/M/B), and the <strong>Curve</strong> option, which bends text into an arch over the top or under the bottom of the badge — the classic seal look. Curve radius moves the arch nearer to (smaller) or further from (larger) the centre.</li>
      <li>X/Y and Align apply to straight text; arched text is positioned by its curve radius instead. Switching shape resets text to that shape's standard positions, so badges stay consistent across a module.</li>
    </ul>`},
  icons:{ title:"Icons", body:`
    <p>Icons live in collapsible categories — click a category name to open it, then click any tile to add that icon to the badge. New icons drop into sensible slots; fine-tune them in the list at the bottom of this card.</p>
    <ul>
      <li><strong>X / Y</strong> move the icon (X: left–right, Y: down–up, from the badge centre). Turn on the <strong>positioning grid</strong> above the preview to see the coordinates.</li>
      <li><strong>Colour</strong> recolours the icon; <strong>↺ style</strong> returns it to the badge's gradient colours.</li>
      <li><strong>Search for more icons</strong> covers 200,000+ free icons. Use the dropdown to stay within one icon set (for a consistent style) or leave it on “All icon sets”, and click <strong>Show more results</strong> to page through long lists. This needs an internet connection; the built-in icons always work.</li>
      <li><strong>Align buttons</strong> (L / C / R and T / M / B) snap an item to common positions in one click — handy for tidy rows.</li>
      <li><strong>Upload your own image</strong> embeds a PNG or JPG. A square, transparent-background PNG around 200–300 px works best; big images are shrunk automatically and you'll be warned if a file risks breaking the 256 KB limit.</li>
      <li>Prefer to browse? Visit icon-sets.iconify.design (linked under the search box), or copy an icon from Tabler's website via the import section.</li>
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
  const safeArch = v => ["none","up","down"].includes(v) ? v : "none";
  Object.assign(state.title,    { text:String(s.title.text||"").slice(0,60),    size:clamp(Number(s.title.size)||46,12,72),    color:safeColor(s.title.color,"#3b3f8c"),
    x:num(s.title.x ?? 0), y:(s.title.y !== undefined ? num(s.title.y) : SHAPES[state.shape].title.y),
    arch:safeArch(s.title.arch),    archRadius:clamp(Number(s.title.archRadius)||150,60,220) });
  Object.assign(state.subtitle, { text:String(s.subtitle?.text||"").slice(0,60), size:clamp(Number(s.subtitle?.size)||20,10,40), color:safeColor(s.subtitle?.color,"#5a5f73"),
    x:num(s.subtitle?.x ?? 0), y:(s.subtitle?.y !== undefined ? num(s.subtitle.y) : SHAPES[state.shape].subtitle.y),
    arch:safeArch(s.subtitle?.arch), archRadius:clamp(Number(s.subtitle?.archRadius)||158,60,220) });
  state.icons = (Array.isArray(s.icons)? s.icons:[]).map(i=>{
    const base = {
      uid:uid(), iconId:String(i.iconId||"custom"), label:String(i.label||"Icon").slice(0,40),
      w:clamp(Number(i.w)||24,1,2048), h:clamp(Number(i.h)||24,1,2048),
      x:num(i.x), y:num(i.y), scale:clamp(Number(i.scale)||1.9,.3,8),
      color:i.color? safeColor(i.color):null,
    };
    if (i.isImage){
      // only accept well-formed PNG/JPG data URLs of sane length
      const ok = typeof i.dataUrl === "string"
        && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(i.dataUrl)
        && i.dataUrl.length < 900000;
      if (!ok) return null;
      return { ...base, isImage:true, dataUrl:i.dataUrl, svg:"", selfPainted:false };
    }
    return { ...base, isImage:false, dataUrl:"", svg:sanitizeSVGFragment(String(i.svg||"")), selfPainted:!!i.selfPainted };
  }).filter(Boolean);
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
  document.getElementById("title-arch").value = state.title.arch;
  document.getElementById("title-arch-r").value = state.title.archRadius;
  document.getElementById("subtitle-arch").value = state.subtitle.arch;
  document.getElementById("subtitle-arch-r").value = state.subtitle.archRadius;
  syncTextPositionInputs();
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
