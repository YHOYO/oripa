const BORDER_COLOR = "rgba(255, 224, 102, 0.9)";
const FILL_COLOR = "rgba(255, 224, 102, 0.15)";

export function createSelectionLayer({ context }) {
  function render({ document }) {
    const box = document?.selection?.box;
    if (!box) {
      return;
    }

    const width = box.maxX - box.minX;
    const height = box.maxY - box.minY;
    if (width <= 0 || height <= 0) {
      return;
    }

    context.save();
    context.strokeStyle = BORDER_COLOR;
    context.fillStyle = FILL_COLOR;
    context.lineWidth = 1.5;
    context.setLineDash([5, 4]);

    context.fillRect(box.minX, box.minY, width, height);
    context.strokeRect(box.minX, box.minY, width, height);

    context.restore();
  }

  return {
    render,
  };
}
