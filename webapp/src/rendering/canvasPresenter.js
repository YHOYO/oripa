import { createGridLayer } from "./layers/gridLayer.js";
import { createEdgeLayer } from "./layers/edgeLayer.js";
import { createSelectionLayer } from "./layers/selectionLayer.js";

export function createCanvasPresenter({ canvas, documentStore }) {
  if (!canvas) {
    throw new Error("Canvas element is required");
  }

  const context = canvas.getContext("2d", { alpha: false });
  const layers = [
    createGridLayer({ canvas, context }),
    createEdgeLayer({ canvas, context }),
    createSelectionLayer({ canvas, context }),
  ];

  function render(document) {
    context.save();
    context.fillStyle = "#0c0f13";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();

    layers.forEach((layer) => layer.render({ document, documentStore }));
  }

  return {
    render,
  };
}
