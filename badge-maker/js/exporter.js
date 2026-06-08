/**
 * ============================================================
 * EXPORT MODULE  (js/exporter.js)
 * ============================================================
 * Rasterises the SVG badge to JPEG and triggers a download.
 * Also exposes a size-estimation utility used by the UI to
 * show a live file-size meter (with a 250 KB Moodle cap).
 *
 * Public API:
 *   BadgeExporter.downloadJpeg(svgString, filename, size, quality)
 *     → Promise<void>  — renders and downloads the JPEG
 *
 *   BadgeExporter.estimateSize(svgString, size, quality)
 *     → Promise<number>  — resolves to estimated byte count
 *
 *   BadgeExporter.svgToCanvas(svgString, size)
 *     → Promise<HTMLCanvasElement>  — shared rasterise helper
 * ============================================================
 */

const BadgeExporter = (() => {

  // ── Shared rasteriser ──────────────────────────────────────

  /**
   * Render an SVG string onto an offscreen canvas of the given
   * pixel size and return the canvas.
   *
   * @param {string} svgString
   * @param {number} size  – canvas width & height in px
   * @returns {Promise<HTMLCanvasElement>}
   */
  const svgToCanvas = (svgString, size) => new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();

    img.onload = () => {
      const canvas  = document.createElement("canvas");
      canvas.width  = size;
      canvas.height = size;
      const ctx     = canvas.getContext("2d");

      // JPEG doesn't support transparency — fill with white first
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);

      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not render SVG to canvas."));
    };

    img.src = url;
  });

  // ── Size estimator ─────────────────────────────────────────

  /**
   * Estimate the JPEG file size in bytes without triggering a
   * download. Renders to canvas then reads the blob size.
   *
   * @param {string} svgString
   * @param {number} size     – pixel dimensions
   * @param {number} quality  – JPEG quality 0.0–1.0
   * @returns {Promise<number>}  byte count
   */
  const estimateSize = async (svgString, size, quality) => {
    try {
      const canvas = await svgToCanvas(svgString, size);
      return await new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob ? blob.size : 0), "image/jpeg", quality);
      });
    } catch (e) {
      console.warn("Size estimation failed:", e);
      return 0;
    }
  };

  // ── JPEG downloader ────────────────────────────────────────

  /**
   * Render the badge SVG as a JPEG and trigger a browser download.
   *
   * @param {string} svgString  – complete SVG markup
   * @param {string} filename   – download name without extension
   * @param {number} size       – output pixel dimensions
   * @param {number} quality    – JPEG quality 0.0–1.0 (default 0.92)
   * @returns {Promise<void>}
   */
  const downloadJpeg = async (svgString, filename, size, quality = 0.92) => {
    const outputSize = size  || CONFIG.export.outputSize;
    const safeName   = (filename || CONFIG.export.filename)
                         .replace(/[^a-z0-9_-]/gi, "_");

    try {
      const canvas = await svgToCanvas(svgString, outputSize);

      canvas.toBlob(blob => {
        if (!blob) {
          alert("Export failed — could not create image blob.");
          return;
        }

        const jpegUrl = URL.createObjectURL(blob);
        const a       = document.createElement("a");
        a.href        = jpegUrl;
        a.download    = `${safeName}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(jpegUrl);

      }, "image/jpeg", quality);

    } catch (e) {
      console.error("Badge export failed:", e);
      alert("Export failed. Please try again or use a different browser.");
    }
  };

  // ── Public API ─────────────────────────────────────────────

  return { downloadJpeg, estimateSize, svgToCanvas };

})();

window.BadgeExporter = BadgeExporter;