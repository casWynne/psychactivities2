/**
 * ============================================================
 * CPD BADGE RENDERER  (js/renderer.js)
 * ============================================================
 * Pure SVG generation from state. No DOM side-effects.
 *
 * Badge shapes: scallop | circle | square | hexagon
 * Each shape provides its own outer border path and inner
 * clip path. The inner content (title, icons, decoratives)
 * is shared across shapes.
 *
 * Items now support per-item iconSize, labelSize, offsetX, offsetY.
 * Decoratives are a state-driven array of typed elements.
 *
 * Public API:
 *   BadgeRenderer.render(state) → SVG string
 * ============================================================
 */

const BadgeRenderer = (() => {

  const SZ = 500;
  const CX = SZ / 2;
  const CY = SZ / 2;

  // ── Helper ────────────────────────────────────────────────
  const toRad = deg => deg * Math.PI / 180;
  const f     = n   => Number(n).toFixed(2);

  // ── Shared gradient defs ──────────────────────────────────

  const buildDefs = (state, innerR, shape) => {
    const { borderGradient, centreGradientFrom, centreGradientTo,
            titleGradientFrom, titleGradientTo } = state;

    const stops = borderGradient.map((c, i) =>
      `<stop offset="${((i / (borderGradient.length - 1)) * 100).toFixed(1)}%" stop-color="${c}" />`
    ).join("\n      ");

    // Inner clip path varies by shape
    let clipPath = "";
    if (shape === "circle" || shape === "scallop") {
      clipPath = `<clipPath id="innerClip"><circle cx="${CX}" cy="${CY}" r="${innerR}" /></clipPath>`;
    } else if (shape === "square") {
      const cr = 18;
      clipPath = `<clipPath id="innerClip">
        <rect x="${CX-innerR}" y="${CY-innerR}" width="${innerR*2}" height="${innerR*2}" rx="${cr}" />
      </clipPath>`;
    } else if (shape === "hexagon") {
      const pts = hexPoints(CX, CY, innerR).map(p => `${f(p.x)},${f(p.y)}`).join(" ");
      clipPath = `<clipPath id="innerClip"><polygon points="${pts}" /></clipPath>`;
    }

    return `<defs>
      <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">${stops}</linearGradient>
      <linearGradient id="borderGrad2" x1="100%" y1="0%" x2="0%" y2="100%">${stops}</linearGradient>
      <radialGradient id="centreGrad" cx="50%" cy="40%" r="60%" fx="50%" fy="30%">
        <stop offset="0%"   stop-color="${centreGradientFrom}" />
        <stop offset="100%" stop-color="${centreGradientTo}" />
      </radialGradient>
      <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="${titleGradientFrom}" />
        <stop offset="100%" stop-color="${titleGradientTo}" />
      </linearGradient>
      <radialGradient id="glossGrad" cx="35%" cy="15%" r="55%">
        <stop offset="0%"   stop-color="rgba(255,255,255,0.45)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0)" />
      </radialGradient>
      ${clipPath}
    </defs>`;
  };

  // ── Shape: scallop ────────────────────────────────────────

  const scallopPath = (cx, cy, outerR, peakH, peaks) => {
    const valleyR   = outerR - peakH;
    const points    = peaks * 2;
    const angleStep = (Math.PI * 2) / points;
    const pts = Array.from({ length: points }, (_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r     = i % 2 === 0 ? outerR : valleyR;
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), angle, r };
    });

    let d = `M ${f(pts[0].x)},${f(pts[0].y)} `;
    for (let i = 0; i < points; i++) {
      const curr = pts[i], next = pts[(i + 1) % points];
      const cpR  = (curr.r + next.r) / 2 * 1.08;
      const cp1x = cx + cpR * Math.cos(curr.angle + angleStep * 0.35);
      const cp1y = cy + cpR * Math.sin(curr.angle + angleStep * 0.35);
      const cp2x = cx + cpR * Math.cos(next.angle - angleStep * 0.35);
      const cp2y = cy + cpR * Math.sin(next.angle - angleStep * 0.35);
      d += `C ${f(cp1x)},${f(cp1y)} ${f(cp2x)},${f(cp2y)} ${f(next.x)},${f(next.y)} `;
    }
    return d + "Z";
  };

  // ── Shape: hexagon ────────────────────────────────────────

  const hexPoints = (cx, cy, r, rotation = 0) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = toRad(60 * i + rotation);
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    });

  // ── Border builders ───────────────────────────────────────

  const buildBorder = (state) => {
    const shape   = state.badgeShape || "scallop";
    const S       = CONFIG.scallop;
    const outerR  = S.outerR;
    const innerR  = S.innerCircleR;
    const bw      = outerR - innerR;  // border width

    let outerPath = "", innerFill = "";

    if (shape === "scallop") {
      const path = scallopPath(CX, CY, outerR, S.peakHeight, S.peaks);
      return `
        <path d="${path}" fill="url(#borderGrad)" />
        <path d="${path}" fill="url(#borderGrad2)" opacity="0.5" />
        <path d="${path}" fill="url(#glossGrad)" />
        <circle cx="${CX}" cy="${CY}" r="${innerR}" fill="url(#centreGrad)" />
        <circle cx="${CX}" cy="${CY}" r="${innerR}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" />`;
    }

    if (shape === "circle") {
      return `
        <circle cx="${CX}" cy="${CY}" r="${outerR}" fill="url(#borderGrad)" />
        <circle cx="${CX}" cy="${CY}" r="${outerR}" fill="url(#borderGrad2)" opacity="0.5" />
        <circle cx="${CX}" cy="${CY}" r="${outerR}" fill="url(#glossGrad)" />
        <circle cx="${CX}" cy="${CY}" r="${innerR}" fill="url(#centreGrad)" />
        <circle cx="${CX}" cy="${CY}" r="${innerR}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" />`;
    }

    if (shape === "square") {
      const cr  = 22;  // corner radius
      const crI = 12;
      const o   = outerR, inn = innerR;
      return `
        <rect x="${CX-o}" y="${CY-o}" width="${o*2}" height="${o*2}" rx="${cr}" fill="url(#borderGrad)" />
        <rect x="${CX-o}" y="${CY-o}" width="${o*2}" height="${o*2}" rx="${cr}" fill="url(#borderGrad2)" opacity="0.5" />
        <rect x="${CX-o}" y="${CY-o}" width="${o*2}" height="${o*2}" rx="${cr}" fill="url(#glossGrad)" />
        <rect x="${CX-inn}" y="${CY-inn}" width="${inn*2}" height="${inn*2}" rx="${crI}" fill="url(#centreGrad)" />
        <rect x="${CX-inn}" y="${CY-inn}" width="${inn*2}" height="${inn*2}" rx="${crI}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" />`;
    }

    if (shape === "hexagon") {
      const outerPts = hexPoints(CX, CY, outerR).map(p => `${f(p.x)},${f(p.y)}`).join(" ");
      const innerPts = hexPoints(CX, CY, innerR).map(p => `${f(p.x)},${f(p.y)}`).join(" ");
      return `
        <polygon points="${outerPts}" fill="url(#borderGrad)" />
        <polygon points="${outerPts}" fill="url(#borderGrad2)" opacity="0.5" />
        <polygon points="${outerPts}" fill="url(#glossGrad)" />
        <polygon points="${innerPts}" fill="url(#centreGrad)" />
        <polygon points="${innerPts}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2" />`;
    }

    return "";
  };

  // ── Title ─────────────────────────────────────────────────

  const buildTitle = (state) => {
    const { titleMain, titleSub, showRules, titleSubColour,
            ruleColourLeft, ruleColourRight, fontFamily,
            titleMainSize, titleSubSize } = state;
    const font  = fontFamily || "Montserrat";
    const mainY = CY - 50;
    const subY  = mainY + titleSubSize + 4;
    let svg = `
    <text x="${CX}" y="${mainY}" text-anchor="middle"
          font-family="${font}, sans-serif" font-weight="900"
          font-size="${titleMainSize}" fill="url(#titleGrad)" letter-spacing="-2">${titleMain}</text>
    <text x="${CX}" y="${subY}" text-anchor="middle"
          font-family="${font}, sans-serif" font-weight="800"
          font-size="${titleSubSize}" fill="${titleSubColour}" letter-spacing="8">${titleSub}</text>`;

    if (showRules) {
      const ruleY = subY - titleSubSize * 0.3;
      const ruleW = 48, gap = 10;
      const hw    = (titleSub.length * titleSubSize * 0.38) / 2;
      svg += `
    <line x1="${CX-hw-gap-ruleW}" y1="${ruleY}" x2="${CX-hw-gap}" y2="${ruleY}"
          stroke="${ruleColourLeft}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="${CX+hw+gap}" y1="${ruleY}" x2="${CX+hw+gap+ruleW}" y2="${ruleY}"
          stroke="${ruleColourRight}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    return svg;
  };

  // ── Icon items ────────────────────────────────────────────

  /**
   * Each item now carries its own iconSize, labelSize, offsetX, offsetY.
   * Positions are computed from the auto-layout then offset is added.
   */
  const buildIconRow = (state) => {
    const { items, labelColour, fontFamily } = state;
    if (!items || items.length === 0) return "";
    const font     = fontFamily || "Montserrat";
    const count    = items.length;
    const rowY     = CY + 35;
    const colWidth = count === 1 ? 0 : count === 2 ? 120 : 120;

    const baseX = {
      1: [CX],
      2: [CX - colWidth/2, CX + colWidth/2],
      3: [CX - colWidth, CX, CX + colWidth],
    }[count] || [];

    let svg = "\n    <!-- Icon items -->";

    items.forEach((item, i) => {
      const iconSize  = item.iconSize  || 62;
      const labelSize = item.labelSize || 18;
      const ox        = item.offsetX   || 0;
      const oy        = item.offsetY   || 0;
      const bx        = baseX[i] || CX;
      const ix        = bx + ox;
      const iy        = rowY + oy;
      const colour    = item.colour || labelColour;

      if (item.iconName) {
        svg += `
    <svg x="${f(ix - iconSize/2)}" y="${f(iy - iconSize/2)}"
         width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24"
         fill="none" stroke="${colour}" stroke-width="1.5"
         stroke-linecap="round" stroke-linejoin="round">
      <use href="#tabler-${item.iconName}" />
    </svg>`;
      }

      const lines    = (item.label || "").split("\n");
      const lineH    = labelSize * 1.3;
      const labelTopY = iy + iconSize/2 + 10 + labelSize;

      lines.forEach((line, li) => {
        svg += `
    <text x="${f(ix)}" y="${f(labelTopY + li * lineH)}"
          text-anchor="middle" font-family="${font}, sans-serif"
          font-size="${labelSize}" font-weight="700"
          fill="${labelColour}" letter-spacing="1">${line}</text>`;
      });
    });

    return svg;
  };

  // ── Decoratives ───────────────────────────────────────────

  /** Single sprig path (drawn at origin, pointing upward). */
  const SPRIG_PATH = `M 0,0 L 0,-38
    M 0,-10 C -8,-18 -18,-16 -20,-10 M 0,-10 C 8,-18 18,-16 20,-10
    M 0,-22 C -7,-29 -15,-26 -16,-20 M 0,-22 C 7,-29 15,-26 16,-20
    M 0,-32 C -5,-38 -10,-36 -10,-30 M 0,-32 C 5,-38 10,-36 10,-30`;

  const buildDecoratives = (state) => {
    if (!state.decoratives || state.decoratives.length === 0) return "";
    let svg = "\n    <!-- Decoratives -->";

    state.decoratives.forEach(dec => {
      if (!dec.visible) return;
      const { type, x, y, size = 1, colour } = dec;
      // "colour" falls back to titleGrad for gradient-type elements
      const stroke = colour || state.titleGradientFrom;
      const fill   = colour || "url(#titleGrad)";
      const s      = size;

      if (type === "sprig-left") {
        svg += `
    <g transform="translate(${x},${y}) rotate(-30) scale(${s})">
      <path d="${SPRIG_PATH}" fill="none" stroke="${stroke}" stroke-width="${2.2/s}" stroke-linecap="round"/>
    </g>`;
      }
      else if (type === "sprig-right") {
        svg += `
    <g transform="translate(${x},${y}) rotate(30) scale(${-s},${s})">
      <path d="${SPRIG_PATH}" fill="none" stroke="${stroke}" stroke-width="${2.2/s}" stroke-linecap="round"/>
    </g>`;
      }
      else if (type === "sparkle") {
        // 4-pointed star
        const r1 = 14 * s, r2 = 4 * s;
        const pts = Array.from({ length: 8 }, (_, i) => {
          const a = toRad(i * 45 - 90);
          const r = i % 2 === 0 ? r1 : r2;
          return `${f(x + r * Math.cos(a))},${f(y + r * Math.sin(a))}`;
        });
        svg += `\n    <polygon points="${pts.join(" ")}" fill="${fill}" opacity="0.85"/>`;
      }
      else if (type === "star") {
        // 6-pointed star (Star of David style)
        const r1 = 14 * s, r2 = 7 * s;
        const pts = Array.from({ length: 12 }, (_, i) => {
          const a = toRad(i * 30 - 90);
          const r = i % 2 === 0 ? r1 : r2;
          return `${f(x + r * Math.cos(a))},${f(y + r * Math.sin(a))}`;
        });
        svg += `\n    <polygon points="${pts.join(" ")}" fill="${fill}" opacity="0.85"/>`;
      }
      else if (type === "dot") {
        svg += `\n    <circle cx="${x}" cy="${y}" r="${12 * s}" fill="${fill}" opacity="0.8"/>`;
      }
    });

    return svg;
  };

  // ── Main render ───────────────────────────────────────────

  const render = (state) => {
    const shape  = state.badgeShape || "scallop";
    const innerR = CONFIG.scallop.innerCircleR;

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 ${SZ} ${SZ}" width="${SZ}" height="${SZ}">
      ${buildDefs(state, innerR, shape)}
      ${buildBorder(state)}
      ${buildTitle(state)}
      ${buildIconRow(state)}
      ${buildDecoratives(state)}
    </svg>`;
  };

  return { render };

})();

window.BadgeRenderer = BadgeRenderer;
