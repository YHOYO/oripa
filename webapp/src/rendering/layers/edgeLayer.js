const EDGE_COLORS = {
  mountain: "#ff6b6b",
  valley: "#6bc1ff",
  border: "#f5f7fa",
  auxiliary: "#9d9d9d",
};

const SELECTED_EDGE_COLOR = "#ffe066";
const SELECTED_EDGE_WIDTH = 4;

export function createEdgeLayer({ context }) {
  function render({ document }) {
    if (!document) return;

    const edges = document.edges ?? [];
    const selectedEdgeIds = new Set(document.selection?.edges ?? []);

    context.save();
    context.lineWidth = 2;
    context.lineCap = "round";

    if (edges.length === 0) {
      context.restore();
      return;
    }

    for (const edge of edges) {
      const { type = "auxiliary", start, end } = edge;
      if (!start || !end) continue;

      context.beginPath();
      context.strokeStyle = EDGE_COLORS[type] ?? EDGE_COLORS.auxiliary;
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }

    if (selectedEdgeIds.size > 0) {
      context.lineWidth = SELECTED_EDGE_WIDTH;
      context.strokeStyle = SELECTED_EDGE_COLOR;
      context.globalAlpha = 0.85;
      context.setLineDash([4, 3]);

      for (const edge of edges) {
        if (!selectedEdgeIds.has(edge.id)) continue;
        const { start, end } = edge;
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
      }

      context.setLineDash([]);
    }

    context.restore();
  }

  return {
    render,
  };
}
