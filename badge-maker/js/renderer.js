/**
 * ============================================================
 * BADGE RENDERER MODULE  (js/renderer.js)
 * ============================================================
 * Generates the SVG badge from a state object. Pure functions
 * — no DOM side-effects. All positioning is in SVG user-units
 * (the canvas is CONFIG.geometry.canvasSize × canvasSize).
 *
 * Key geometry concepts:
 *   outerR  – circumradius of the badge shape (fills canvas)
 *   innerR  – outerR minus borderThickness (the centre area)
 *   arcR    – midpoint of the border ring (text sits here)
 *   innerCx – visual centroid of the inner area (= cx for
 *             circle/square, slightly lower for triangle)
 *
 * Public API:
 *   BadgeRenderer.render(state)  → SVG string
 *   BadgeRenderer.getInnerBounds(state) → { cx, cy, r }
 *     Returns the usable inner area centre + radius so the
 *     UI can clamp X/Y offsets intelligently.
 * ============================================================
 */

const BadgeRenderer = (() => {

  // ─── Tiny helpers ────────────────────────────────────────

  const toRad = deg => (deg * Math.PI) / 180;

  const escXml = s =>
    s.replace(/&/g,"&amp;").replace(/</g,"&lt;")
     .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  // ─── Geometry: shared calculations ───────────────────────

  /**
   * Returns the core geometry values derived from CONFIG and
   * the current canvas size. Called at the top of render().
   */
  const calcGeometry = () => {
    const C   = CONFIG.geometry;
    const sz  = C.canvasSize;
    const cx  = sz / 2;
    const cy  = sz / 2;
    const outerR          = sz / 2 - 6;          // 6px inset so strokes don't clip
    const borderThickness = outerR * C.borderRatio;
    const innerR          = outerR - borderThickness;
    const arcR            = outerR - borderThickness / 2; // text arc radius
    return { sz, cx, cy, outerR, innerR, arcR, borderThickness, C };
  };

  // ─── Triangle geometry ───────────────────────────────────

  /**
   * Vertices of an equilateral triangle with a given circumradius,
   * centred at (cx, cy), apex pointing up.
   * Angles: -90° (top), 30° (bottom-right), 150° (bottom-left).
   */
  const equilateralVertices = (cx, cy, r) =>
    [-90, 30, 150].map(a => ({
      x: cx + r * Math.cos(toRad(a)),
      y: cy + r * Math.sin(toRad(a))
    }));

  /**
   * Inset an equilateral triangle's vertices by a perpendicular
   * edge distance `d` (the desired border thickness in px).
   *
   * For an equilateral triangle the circumradius R and inradius r
   * relate as:  inradius = R / 2  (for a regular triangle, r = R*sin(60°)/... )
   * More precisely: inradius = R * sin(60°) * 2/3 ... actually:
   *   For equilateral:  inradius = R / 2   (R = circumradius, r_in = R/2)
   *
   * To inset each edge by perpendicular distance d, the new circumradius is:
   *   R_inner = R - d / sin(60°)   ... which equals R - d * 2/√3
   *
   * The centroid stays fixed — no vertical nudge needed.
   * This guarantees the border is exactly `d` px thick on ALL three edges.
   *
   * @param {number} outerR      – circumradius of the outer triangle
   * @param {number} borderThick – desired perpendicular border thickness in px
   * @returns {number}           – circumradius of the inner triangle
   */
  const triangleInnerR = (outerR, borderThick) => {
    // sin(60°) = √3/2 ≈ 0.8660
    return outerR - borderThick / Math.sin(toRad(60));
  };

  /**
   * Build a rounded-corner SVG path from an array of vertices.
   * Uses quadratic bezier curves at each corner.
   */
  const roundedTrianglePath = (verts, cr) => {
    const n = verts.length;
    let d = "";
    for (let i = 0; i < n; i++) {
      const prev = verts[(i - 1 + n) % n];
      const curr = verts[i];
      const next = verts[(i + 1) % n];
      const d1x = curr.x - prev.x, d1y = curr.y - prev.y;
      const d2x = next.x - curr.x, d2y = next.y - curr.y;
      const len1 = Math.hypot(d1x, d1y);
      const len2 = Math.hypot(d2x, d2y);
      const r    = Math.min(cr, len1 / 2, len2 / 2);
      const p1x  = curr.x - (d1x / len1) * r;
      const p1y  = curr.y - (d1y / len1) * r;
      const p2x  = curr.x + (d2x / len2) * r;
      const p2y  = curr.y + (d2y / len2) * r;
      d += i === 0 ? `M ${p1x},${p1y} ` : `L ${p1x},${p1y} `;
      d += `Q ${curr.x},${curr.y} ${p2x},${p2y} `;
    }
    return d + "Z";
  };

  // ─── Shape SVG builders ──────────────────────────────────

  const circleShape = (cx, cy, outerR, innerR, bc, cc) => `
    <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${bc}" />
    <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="${cc}" />`;

  const squareShape = (cx, cy, outerR, innerR, bc, cc, cr) => {
    const os = outerR * 2, is = innerR * 2;
    return `
    <rect x="${cx-outerR}" y="${cy-outerR}" width="${os}" height="${os}"
          rx="${cr}" fill="${bc}" />
    <rect x="${cx-innerR}" y="${cy-innerR}" width="${is}" height="${is}"
          rx="${cr*0.55}" fill="${cc}" />`;
  };

  /**
   * Triangle badge shape with geometrically uniform border.
   * The inner triangle is computed by insetting each edge by the
   * same perpendicular distance — so all three sides are equal thickness.
   * The centroid is shared between outer and inner triangles (no nudge).
   */
  const triangleShape = (cx, cy, outerR, borderThick, bc, cc, cr) => {
    const innerR = triangleInnerR(outerR, borderThick);
    const ov = equilateralVertices(cx, cy, outerR);
    const iv = equilateralVertices(cx, cy, innerR);   // same centroid
    return `
    <path d="${roundedTrianglePath(ov, cr)}" fill="${bc}" />
    <path d="${roundedTrianglePath(iv, cr * (innerR / outerR))}" fill="${cc}" />`;
  };

  // ─── Clip paths ──────────────────────────────────────────

  /**
   * Build a <clipPath> matching the inner shape exactly.
   * Triangle clip path uses the same inset calculation.
   */
  const buildClipPath = (shape, cx, cy, outerR, borderThick, C) => {
    const id     = "inner-clip";
    const innerR = outerR - borderThick;   // used for circle/square
    if (shape === "circle") {
      return {
        id,
        def: `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${innerR}" /></clipPath>`
      };
    }
    if (shape === "square") {
      const s = innerR * 2;
      return {
        id,
        def: `<clipPath id="${id}">
          <rect x="${cx-innerR}" y="${cy-innerR}" width="${s}" height="${s}"
                rx="${C.squareCornerRadius*0.55}" />
        </clipPath>`
      };
    }
    // Triangle: use proper perpendicular inset so clip matches the visual inner shape
    const triInnerR = triangleInnerR(outerR, borderThick);
    const iv        = equilateralVertices(cx, cy, triInnerR);
    const cr        = C.triangleCornerRadius * (triInnerR / outerR);
    return {
      id,
      def: `<clipPath id="${id}">
        <path d="${roundedTrianglePath(iv, cr)}" />
      </clipPath>`
    };
  };

  // ─── Arc text helper ─────────────────────────────────────

  /**
   * Renders text along a circular arc path.
   * flip=false → top arc (reads left-to-right)
   * flip=true  → bottom arc (arc inverted so text reads correctly)
   */
  const arcText = ({ cx, cy, r, startAngle, sweep, text,
                     fontSize, fontFamily, fontWeight, colour,
                     letterSpacing, idSuffix, flip }) => {
    const id = `arc-path-${idSuffix}`;
    let d;
    if (!flip) {
      const sa = toRad(startAngle), ea = toRad(startAngle + sweep);
      const x1 = cx + r*Math.cos(sa), y1 = cy + r*Math.sin(sa);
      const x2 = cx + r*Math.cos(ea), y2 = cy + r*Math.sin(ea);
      d = `M ${x1},${y1} A ${r},${r} 0 ${sweep>180?1:0},1 ${x2},${y2}`;
    } else {
      const sa = toRad(startAngle + sweep), ea = toRad(startAngle);
      const x1 = cx + r*Math.cos(sa), y1 = cy + r*Math.sin(sa);
      const x2 = cx + r*Math.cos(ea), y2 = cy + r*Math.sin(ea);
      d = `M ${x1},${y1} A ${r},${r} 0 ${sweep>180?1:0},0 ${x2},${y2}`;
    }
    return `
      <defs><path id="${id}" d="${d}" /></defs>
      <text font-size="${fontSize}" font-family="${fontFamily}, sans-serif"
            font-weight="${fontWeight}" fill="${colour}"
            letter-spacing="${letterSpacing}">
        <textPath href="#${id}" startOffset="50%" text-anchor="middle">
          ${escXml(text)}
        </textPath>
      </text>`;
  };

  // ─── Per-shape text builders ─────────────────────────────

  /** Circle: curved arcs top and bottom of the ring. */
  const circleTextArcs = (cx, cy, arcR, state) => {
    const { topText, bottomText, fontSize, fontFamily, fontWeight,
            letterSpacing, textColour } = state;
    let svg = "";
    if (topText) svg += arcText({
      cx, cy, r: arcR, startAngle: -175, sweep: 170,
      text: topText, fontSize, fontFamily, fontWeight,
      colour: textColour, letterSpacing, idSuffix: "top", flip: false
    });
    if (bottomText) svg += arcText({
      cx, cy, r: arcR, startAngle: 5, sweep: 170,
      text: bottomText, fontSize, fontFamily, fontWeight,
      colour: textColour, letterSpacing, idSuffix: "bot", flip: true
    });
    return svg;
  };

  /** Square: horizontal text centred in top/bottom border strips. */
  const squareTextLabels = (cx, cy, outerR, innerR, state) => {
    const { topText, bottomText, fontSize, fontFamily, fontWeight,
            letterSpacing, textColour } = state;
    const mid = (outerR + innerR) / 2;
    let svg = "";
    const attr = `text-anchor="middle" font-family="${fontFamily}, sans-serif"
      font-weight="${fontWeight}" fill="${textColour}" letter-spacing="${letterSpacing}"`;
    if (topText) svg += `<text x="${cx}" y="${cy - mid + fontSize*0.38}"
      font-size="${fontSize}" ${attr}>${escXml(topText)}</text>`;
    if (bottomText) svg += `<text x="${cx}" y="${cy + mid + fontSize*0.38}"
      font-size="${fontSize}" ${attr}>${escXml(bottomText)}</text>`;
    return svg;
  };

  /** Triangle: bottom text in base strip, top text near apex. */
  const triangleTextLabels = (cx, cy, outerR, innerR, state) => {
    const { topText, bottomText, fontSize, fontFamily, fontWeight,
            letterSpacing, textColour } = state;
    const verts    = equilateralVertices(cx, cy, outerR);
    const topApex  = verts[0];
    const botLeft  = verts[2];
    const edgeMidY = (botLeft.y + verts[1].y) / 2;
    const borderH  = outerR - innerR;
    let svg = "";
    const attr = `text-anchor="middle" font-family="${fontFamily}, sans-serif"
      font-weight="${fontWeight}" fill="${textColour}" letter-spacing="${letterSpacing}"`;
    if (bottomText) {
      const y = edgeMidY - borderH * 0.22 + fontSize * 0.38;
      svg += `<text x="${cx}" y="${y}" font-size="${fontSize*0.88}" ${attr}>${escXml(bottomText)}</text>`;
    }
    if (topText) {
      const y = topApex.y + borderH * 0.55 + fontSize * 0.38;
      svg += `<text x="${cx}" y="${y}" font-size="${fontSize*0.72}" ${attr}
        letter-spacing="${Math.max(0, letterSpacing-1)}">${escXml(topText)}</text>`;
    }
    return svg;
  };

  // ─── Decorative stars ────────────────────────────────────

  const decorativeStars = (cx, cy, arcR, starSize, colour, shape) => {
    if (shape === "triangle") return "";
    const starPath = (x, y, r) => {
      const pts = Array.from({length:8}, (_,i) => {
        const a = toRad(i*45 - 90);
        const radius = i%2===0 ? r : r*0.4;
        return `${x + radius*Math.cos(a)},${y + radius*Math.sin(a)}`;
      });
      return `<polygon points="${pts.join(" ")}" fill="${colour}" />`;
    };
    return starPath(cx - arcR, cy, starSize) + starPath(cx + arcR, cy, starSize);
  };

  // ─── Content elements ────────────────────────────────────

  /**
   * University logo — positioned relative to innerCentroid.
   * Offsets (logoOffsetX, logoOffsetY) are RAW SVG pixel units
   * (matching the 500px canvas coordinate space). Positive Y = down.
   */
  const universityLogoElement = (icx, icy, innerR, state) => {
    const { logoDataUrl, logoScale, logoOffsetX, logoOffsetY } = state;
    if (!logoDataUrl) return "";

    const logoW = innerR * 2 * logoScale;
    const logoH = logoW;

    // Default anchor: bottom-centre of inner area
    const baseX = icx - logoW / 2;
    const baseY = icy + innerR * 0.32 - logoH / 2;

    // Offsets are raw px in the 500px canvas space
    const offsetX = logoOffsetX || 0;
    const offsetY = logoOffsetY || 0;

    return `<image href="${logoDataUrl}"
      x="${baseX + offsetX}" y="${baseY + offsetY}"
      width="${logoW}" height="${logoH}"
      preserveAspectRatio="xMidYMid meet" />`;
  };

  /**
   * Custom uploaded image — fills the inner area, clipped.
   * iconScale (0.3–2.0) controls size; offsets are RAW SVG px.
   */
  const customImageElement = (icx, icy, innerR, clipId, state) => {
    const { customImageUrl, iconScale, iconOffsetX, iconOffsetY } = state;
    if (!customImageUrl) return "";

    const baseSize = innerR * 1.6;
    const size     = baseSize * (iconScale || 1);
    // Offsets are raw px in the 500px canvas space
    const offsetX  = iconOffsetX || 0;
    const offsetY  = iconOffsetY || 0;

    return `<image href="${customImageUrl}"
      x="${icx - size/2 + offsetX}" y="${icy - size/2 + offsetY}"
      width="${size}" height="${size}"
      preserveAspectRatio="xMidYMid meet"
      clip-path="url(#${clipId})" />`;
  };

  /**
   * Tabler icon — same raw-px offset logic as custom image.
   * stroke-width is kept consistent; size driven by iconScale.
   */
  const tablerIconElement = (icx, icy, innerR, state) => {
    const { iconName, iconColour, iconScale, iconOffsetX, iconOffsetY } = state;
    if (!iconName) return "";

    const maxSize  = innerR * 1.85;
    const baseSize = innerR * 1.1;
    const size     = Math.min(baseSize * (iconScale || 1), maxSize);
    // Offsets are raw px in the 500px canvas space
    const offsetX  = iconOffsetX || 0;
    const offsetY  = iconOffsetY || 0;

    const sw = Math.max(0.8, 1.8 * (baseSize / size));

    return `<svg x="${icx - size/2 + offsetX}" y="${icy - size/2 + offsetY}"
      width="${size}" height="${size}" viewBox="0 0 24 24"
      fill="none" stroke="${iconColour || '#333333'}"
      stroke-width="${sw.toFixed(2)}"
      stroke-linecap="round" stroke-linejoin="round"
      overflow="visible">
      <use href="#tabler-${iconName}" />
    </svg>`;
  };

  // ─── Public: getInnerBounds ──────────────────────────────

  /**
   * Returns the centre and "radius" (half-width) of the inner
   * content area for a given shape. Used by the UI to clamp
   * X/Y sliders so content never drifts outside the border.
   *
   * @param {Object} state
   * @returns {{ icx, icy, innerR }}
   */
  const getInnerBounds = (state) => {
    const { cx, cy, outerR, innerR, borderThickness } = calcGeometry();
    const contentR = state.shape === "triangle"
      ? triangleInnerR(outerR, borderThickness)
      : innerR;
    return { icx: cx, icy: cy, innerR: contentR };
  };

  // ─── Main render ─────────────────────────────────────────

  /**
   * Render a complete badge SVG.
   *
   * State keys used here:
   *   shape, borderColour, centreColour, textColour
   *   topText, bottomText, fontSize, fontFamily, fontWeight, letterSpacing
   *   iconName, iconColour, iconScale, iconOffsetX, iconOffsetY
   *   logoDataUrl, showLogo, logoScale, logoOffsetX, logoOffsetY
   *   customImageUrl
   */
  const render = (state) => {
    const { sz, cx, cy, outerR, innerR, arcR, borderThickness, C } = calcGeometry();
    const { shape, borderColour, centreColour, textColour } = state;

    // For circle/square: innerCentroid is just cx,cy.
    // For triangle: centroid is now also cx,cy — no nudge needed because
    // the inset calculation keeps the centroid fixed.
    const icx = cx;
    const icy = cy;

    // ── Badge shell ──
    let shapeSvg = "";
    if (shape === "circle") {
      shapeSvg = circleShape(cx, cy, outerR, innerR, borderColour, centreColour);
    } else if (shape === "square") {
      shapeSvg = squareShape(cx, cy, outerR, innerR, borderColour, centreColour, C.squareCornerRadius);
    } else {
      // Pass borderThickness so all three edges are inset equally
      shapeSvg = triangleShape(cx, cy, outerR, borderThickness, borderColour, centreColour, C.triangleCornerRadius);
    }

    // ── Clip path for inner area ──
    const { id: clipId, def: clipDef } = buildClipPath(shape, cx, cy, outerR, borderThickness, C);

    // ── Text labels ──
    // For triangle, compute the correct inner circumradius using the inset formula
    const triInnerR = shape === "triangle" ? triangleInnerR(outerR, borderThickness) : innerR;

    let textSvg = "";
    if (shape === "circle")   textSvg = circleTextArcs(cx, cy, arcR, state);
    if (shape === "square")   textSvg = squareTextLabels(cx, cy, outerR, innerR, state);
    if (shape === "triangle") textSvg = triangleTextLabels(cx, cy, outerR, triInnerR, state);

    // ── Decorative stars (circle/square only) ──
    const starsSvg = decorativeStars(cx, cy, arcR, C.starSize, textColour, shape);

    // ── Use triInnerR for triangle content sizing, innerR for others ──
    const contentR = shape === "triangle" ? triInnerR : innerR;

    // ── Centre content (image OR icon, then logo on top) ──
    const customImgSvg = state.customImageUrl
      ? customImageElement(icx, icy, contentR, clipId, state)
      : "";

    const iconSvg = (!state.customImageUrl && state.iconName)
      ? tablerIconElement(icx, icy, contentR, state)
      : "";

    const logoSvg = (state.showLogo && state.logoDataUrl)
      ? universityLogoElement(icx, icy, contentR, state)
      : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 ${sz} ${sz}" width="${sz}" height="${sz}">
      <defs>${clipDef}</defs>
      ${shapeSvg}
      ${customImgSvg}
      ${iconSvg}
      ${logoSvg}
      ${textSvg}
      ${starsSvg}
    </svg>`;
  };

  return { render, getInnerBounds };

})();

window.BadgeRenderer = BadgeRenderer;