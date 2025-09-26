const MIN_SEGMENT_LENGTH = 1e-1;

export function createSegmentTool({ documentStore }) {
  let startPoint = null;

  function onPointerDown(event) {
    startPoint = { ...event.point };
  }

  function onPointerUp(event) {
    if (!startPoint) {
      return;
    }

    const endPoint = { ...event.point };
    const length = measureDistance(startPoint, endPoint);

    if (length < MIN_SEGMENT_LENGTH) {
      startPoint = null;
      return;
    }

    documentStore.addEdge({
      start: startPoint,
      end: endPoint,
      type: "auxiliary",
    });

    startPoint = null;
  }

  function onCancel() {
    startPoint = null;
  }

  return {
    id: "segment",
    label: "Segmento",
    shortcut: "L",
    cursor: "crosshair",
    onPointerDown,
    onPointerMove() {},
    onPointerUp,
    onCancel,
  };
}

function measureDistance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}
