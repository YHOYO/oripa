import { distance } from "../core/geometry/vector2.js";
import { distanceToPoint } from "../core/geometry/lineSegment.js";
import { intersectSegments } from "../core/geometry/intersections.js";

const CLICK_TOLERANCE = 6;
const DELETE_KEYS = new Set(["Delete", "Backspace"]);

export function createSelectTool({ documentStore }) {
  let anchor = null;
  let lastPoint = null;
  let cursorPoint = null;

  function handleKeydown(event) {
    if (event.defaultPrevented) {
      return;
    }

    const document = documentStore.getDocument();
    const selectedEdges = document?.selection?.edges ?? [];

    if (!event.altKey && !event.ctrlKey && !event.metaKey) {
      if (!DELETE_KEYS.has(event.key)) {
        return;
      }

      if (selectedEdges.length === 0) {
        return;
      }

      documentStore.deleteSelectedEdges();
      event.preventDefault();
      return;
    }

    if (event.altKey) {
      return;
    }

    const usesPrimaryModifier = event.ctrlKey || event.metaKey;
    if (!usesPrimaryModifier) {
      return;
    }

    const key = event.key?.toLowerCase();
    if (!key) {
      return;
    }

    if (key === "c") {
      if (selectedEdges.length === 0) {
        return;
      }
      documentStore.copySelectedEdges();
      event.preventDefault();
      return;
    }

    if (key === "x") {
      if (selectedEdges.length === 0) {
        return;
      }
      documentStore.cutSelectedEdges();
      event.preventDefault();
      return;
    }

    if (key === "v") {
      const pasted = documentStore.pasteClipboard({ targetPoint: cursorPoint });
      if (pasted.length > 0) {
        event.preventDefault();
      }
    }
  }

  function onPointerDown(event) {
    anchor = { ...event.point };
    lastPoint = { ...event.point };
    cursorPoint = { ...event.point };
    documentStore.setSelectionBox(createBox(anchor, lastPoint));
  }

  function onPointerMove(event) {
    cursorPoint = { ...event.point };
    if (!anchor) {
      return;
    }

    lastPoint = { ...event.point };
    documentStore.setSelectionBox(createBox(anchor, lastPoint));
  }

  function onPointerUp(event) {
    if (!anchor) {
      return;
    }

    cursorPoint = { ...event.point };
    const releasePoint = { ...event.point };
    documentStore.setSelectionBox(null);

    const dragDistance = distance(anchor, releasePoint);
    if (dragDistance <= CLICK_TOLERANCE) {
      selectNearestEdge(releasePoint);
    } else {
      selectEdgesInBox(createBox(anchor, releasePoint));
    }

    anchor = null;
    lastPoint = null;
  }

  function onCancel() {
    anchor = null;
    lastPoint = null;
    documentStore.setSelectionBox(null);
  }

  function activate() {
    document.addEventListener("keydown", handleKeydown);
  }

  function deactivate() {
    document.removeEventListener("keydown", handleKeydown);
  }

  function selectNearestEdge(point) {
    const document = documentStore.getDocument();
    if (!document) {
      return;
    }

    const { edges = [] } = document;
    let closestId = null;
    let closestDistance = Infinity;

    for (const edge of edges) {
      if (!edge?.start || !edge?.end) {
        continue;
      }

      const segmentDistance = distanceToPoint(edge, point);
      if (segmentDistance < closestDistance) {
        closestDistance = segmentDistance;
        closestId = edge.id;
      }
    }

    if (closestId && closestDistance <= CLICK_TOLERANCE) {
      documentStore.setSelectedEdges([closestId]);
    } else {
      documentStore.clearSelection();
    }
  }

  function selectEdgesInBox(box) {
    if (!box) {
      documentStore.clearSelection();
      return;
    }

    const document = documentStore.getDocument();
    if (!document) {
      return;
    }

    const selected = (document.edges ?? [])
      .filter((edge) => edge && edge.start && edge.end && segmentIntersectsBox(edge, box))
      .map((edge) => edge.id);

    if (selected.length > 0) {
      documentStore.setSelectedEdges(selected);
    } else {
      documentStore.clearSelection();
    }
  }

  return {
    id: "select",
    label: "Seleccionar",
    shortcut: "V",
    cursor: "default",
    activate,
    deactivate,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onCancel,
  };
}

function createBox(a, b) {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  };
}

function segmentIntersectsBox(edge, box) {
  if (pointInBox(edge.start, box) || pointInBox(edge.end, box)) {
    return true;
  }

  const boxSegments = [
    { start: { x: box.minX, y: box.minY }, end: { x: box.maxX, y: box.minY } },
    { start: { x: box.maxX, y: box.minY }, end: { x: box.maxX, y: box.maxY } },
    { start: { x: box.maxX, y: box.maxY }, end: { x: box.minX, y: box.maxY } },
    { start: { x: box.minX, y: box.maxY }, end: { x: box.minX, y: box.minY } },
  ];

  return boxSegments.some((boundary) => intersectSegments(edge, boundary));
}

function pointInBox(point, box) {
  return point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY;
}
