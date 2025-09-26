const GRID_SPACING = 40;
const GRID_COLOR = "rgba(255, 255, 255, 0.05)";

export function createGridLayer({ canvas, context }) {
  function render() {
    context.save();
    context.strokeStyle = GRID_COLOR;
    context.lineWidth = 1;

    for (let x = 0; x <= canvas.width; x += GRID_SPACING) {
      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, canvas.height);
      context.stroke();
    }

    for (let y = 0; y <= canvas.height; y += GRID_SPACING) {
      context.beginPath();
      context.moveTo(0, y + 0.5);
      context.lineTo(canvas.width, y + 0.5);
      context.stroke();
    }

    context.restore();
  }

  return {
    render,
  };
}
