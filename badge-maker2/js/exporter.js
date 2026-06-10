/**
 * ============================================================
 * EXPORTER  (js/exporter.js)
 * ============================================================
 * Rasterises SVG → JPEG and provides size estimation.
 * ============================================================
 */

const BadgeExporter = (() => {

  const svgToCanvas = (svgString, size) => new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("SVG render failed")); };
    img.src = url;
  });

  const estimateSize = async (svgString, size, quality) => {
    try {
      const canvas = await svgToCanvas(svgString, size);
      return await new Promise(r => canvas.toBlob(b => r(b ? b.size : 0), "image/jpeg", quality));
    } catch (e) { return 0; }
  };

  const downloadJpeg = async (svgString, filename, size, quality = 0.92) => {
    const safeName = (filename || "badge").replace(/[^a-z0-9_-]/gi, "_");
    try {
      const canvas = await svgToCanvas(svgString, size);
      canvas.toBlob(blob => {
        if (!blob) { alert("Export failed."); return; }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${safeName}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, "image/jpeg", quality);
    } catch (e) {
      console.error("Export failed:", e);
      alert("Export failed. Please try again.");
    }
  };

  return { svgToCanvas, estimateSize, downloadJpeg };

})();

window.BadgeExporter = BadgeExporter;
