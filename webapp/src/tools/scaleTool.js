const SCALE_CHANGE_THRESHOLD = 0.01;
const MIN_DISTANCE = 4;

export function createScaleTool({ documentStore }) {
  let activeEdgeIds = [];
  let pivot = null;
  let initialDistance = MIN_DISTANCE;
  let basePositions = null;
  let lastScale = 1;
  let hasScaled = false;

  function reset() {
    activeEdgeIds = [];
    pivot = null;
    initialDistance = MIN_DISTANCE;
    basePositions = null;
    lastScale = 1;
    hasScaled = false;
  }

  function onPointerDown(event) {
    const document = documentStore.getDocument();
    const selected = Array.isArray(document?.selection?.edges) ? document.selection.edges : [];
    if (selected.length === 0) {
      reset();
      return;
    }

    const snapshot = captureEdgeSnapshot(document, selected);
    if (snapshot.size === 0) {
      reset();
      return;
    }

    const centroid = computeCentroid(snapshot);
    if (!centroid) {
      reset();
      return;
    }

    pivot = centroid;
    basePositions = snapshot;
    activeEdgeIds = [...selected];

    const vector = {
      x: event.point.x - pivot.x,
      y: event.point.y - pivot.y,
    };
    const distance = Math.hypot(vector.x, vector.y);
    initialDistance = Math.max(distance, MIN_DISTANCE);
    lastScale = 1;
    hasScaled = false;
  }

  function onPointerMove(event) {
    if (!pivot || activeEdgeIds.length === 0 || !basePositions) {
      return;
    }

    const vector = {
      x: event.point.x - pivot.x,
      y: event.point.y - pivot.y,
    };
    const distance = Math.max(Math.hypot(vector.x, vector.y), MIN_DISTANCE);
    const nextScale = distance / initialDistance;

    if (!Number.isFinite(nextScale) || nextScale <= 0) {
      return;
    }

    if (Math.abs(nextScale - lastScale) < SCALE_CHANGE_THRESHOLD) {
      return;
    }

    documentStore.scaleEdges(activeEdgeIds, {
      pivot,
      scale: nextScale,
      basePositions,
    });

    lastScale = nextScale;
    hasScaled = true;
  }

  function onPointerUp() {
    if (!pivot || activeEdgeIds.length === 0) {
      reset();
      return;
    }

    if (hasScaled && lastScale > 0) {
      documentStore.recordEdgeScaling(activeEdgeIds, {
        pivot,
        scale: lastScale,
      });
    }

    reset();
  }

  function onCancel() {
    if (pivot && activeEdgeIds.length > 0 && basePositions) {
      documentStore.scaleEdges(activeEdgeIds, {
        pivot,
        scale: 1,
        basePositions,
      });
    }

    reset();
  }

  return {
    id: "scale",
    label: "Escalar",
    shortcut: "S",
    cursor: "nwse-resize",
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onCancel,
  };
}

function captureEdgeSnapshot(document, edgeIds) {
  const snapshot = new Map();
  const edges = Array.isArray(document?.edges) ? document.edges : [];
  const idSet = new Set(edgeIds);

  edges.forEach((edge) => {
    if (!edge || !idSet.has(edge.id)) {
      return;
    }

    if (!edge.start || !edge.end) {
      return;
    }

    snapshot.set(edge.id, {
      start: { x: edge.start.x, y: edge.start.y },
      end: { x: edge.end.x, y: edge.end.y },
    });
  });

  return snapshot;
}

function computeCentroid(snapshot) {
  let count = 0;
  let sumX = 0;
  let sumY = 0;

  snapshot.forEach((edge) => {
    if (!edge) {
      return;
    }
    const { start, end } = edge;
    if (!start || !end) {
      return;
    }

    sumX += start.x + end.x;
    sumY += start.y + end.y;
    count += 2;
  });

  if (count === 0) {
    return null;
  }

  return {
    x: sumX / count,
    y: sumY / count,
  };
}
