// /visualIllusions/illusions/ponzo.js
export function init({ stageEl, controlsEl }) {
  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");

  stageEl.appendChild(canvas);

  // Controls
  controlsEl.innerHTML = `
    <label class="field">
      <span>Line position</span>
      <input id="pos" type="range" min="50" max="470" value="160" />
    </label>
    <div class="small">This is a placeholder Ponzo module. Next we’ll port your real one in.</div>
  `;

  const pos = controlsEl.querySelector("#pos");

  function draw() {
    const y = parseInt(pos.value, 10);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Converging rails
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(220, 500);
    ctx.lineTo(450, 40);
    ctx.moveTo(680, 500);
    ctx.lineTo(450, 40);
    ctx.stroke();

    // Two identical horizontal lines
    ctx.strokeStyle = "#e11";
    ctx.lineWidth = 10;

    const len = 280;
    // top line (near convergence)
    ctx.beginPath();
    ctx.moveTo(450 - len / 2, y);
    ctx.lineTo(450 + len / 2, y);
    ctx.stroke();

    // bottom line
    ctx.beginPath();
    ctx.moveTo(450 - len / 2, 420);
    ctx.lineTo(450 + len / 2, 420);
    ctx.stroke();

    // Label
    ctx.fillStyle = "#111";
    ctx.font = "18px Arial";
    ctx.fillText("Both red lines are the same length.", 20, 30);
  }

  const onInput = () => draw();
  pos.addEventListener("input", onInput);
  draw();

  // cleanup function (important!)
  return () => {
    pos.removeEventListener("input", onInput);
    stageEl.innerHTML = "";
    controlsEl.innerHTML = "";
  };
}
