const HISTORY_DISTANCE_THRESHOLD = 0.5;

export function createMoveTool({ documentStore }) {
  let activeEdgeIds = [];
  let anchorPoint = null;
  let lastPoint = null;
  let accumulatedDelta = { x: 0, y: 0 };
  let hasMoved = false;

  function reset() {
    activeEdgeIds = [];
    anchorPoint = null;
    lastPoint = null;
    accumulatedDelta = { x: 0, y: 0 };
    hasMoved = false;
  }

  function onPointerDown(event) {
    const document = documentStore.getDocument();
    const selected = Array.isArray(document?.selection?.edges) ? document.selection.edges : [];

    if (selected.length === 0) {
      reset();
      return;
    }

    activeEdgeIds = [...selected];
    anchorPoint = { ...event.point };
    lastPoint = { ...event.point };
    accumulatedDelta = { x: 0, y: 0 };
    hasMoved = false;
  }

  function onPointerMove(event) {
    if (!anchorPoint || activeEdgeIds.length === 0) {
      return;
    }

    const nextPoint = { ...event.point };
    const delta = {
      x: nextPoint.x - lastPoint.x,
      y: nextPoint.y - lastPoint.y,
    };

    if (delta.x === 0 && delta.y === 0) {
      return;
    }

    documentStore.translateEdges(activeEdgeIds, delta);
    lastPoint = nextPoint;
    accumulatedDelta = {
      x: accumulatedDelta.x + delta.x,
      y: accumulatedDelta.y + delta.y,
    };
    hasMoved = true;
  }

  function onPointerUp() {
    if (!anchorPoint || activeEdgeIds.length === 0) {
      reset();
      return;
    }

    if (hasMoved) {
      const magnitude = Math.hypot(accumulatedDelta.x, accumulatedDelta.y);
      if (magnitude >= HISTORY_DISTANCE_THRESHOLD) {
        documentStore.recordEdgeTranslation(activeEdgeIds, accumulatedDelta);
      }
    }

    reset();
  }

  function onCancel() {
    if (hasMoved && activeEdgeIds.length > 0) {
      documentStore.translateEdges(activeEdgeIds, {
        x: -accumulatedDelta.x,
        y: -accumulatedDelta.y,
      });
    }

    reset();
  }

  return {
    id: "move",
    label: "Mover",
    shortcut: "M",
    cursor: "move",
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onCancel,
  };
}
