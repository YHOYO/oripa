import { distance } from "../core/geometry/vector2.js";
import { distanceToPoint, closestPoint } from "../core/geometry/lineSegment.js";

const PICK_TOLERANCE = 8;
const DRAG_TOLERANCE = 5;
const MIN_SEGMENT_LENGTH = 1e-1;

export function createPerpendicularTool({ documentStore }) {
  let baseEdge = null;
  let pointerAnchor = null;

  function onPointerDown(event) {
    pointerAnchor = { ...event.point };
  }

  function onPointerUp(event) {
    if (!pointerAnchor) {
      return;
    }

    const releasePoint = { ...event.point };
    const dragDistance = distance(pointerAnchor, releasePoint);

    if (!baseEdge) {
      selectBaseEdge(releasePoint);
      pointerAnchor = null;
      return;
    }

    if (dragDistance <= DRAG_TOLERANCE) {
      // Interpret clicks without a drag as requests to choose a new base edge.
      selectBaseEdge(releasePoint);
      pointerAnchor = null;
      return;
    }

    const foot = closestPoint(baseEdge, releasePoint);
    const length = distance(foot, releasePoint);

    if (length < MIN_SEGMENT_LENGTH) {
      pointerAnchor = null;
      return;
    }

    documentStore.addEdge({
      start: foot,
      end: releasePoint,
      type: baseEdge.type ?? "auxiliary",
    });

    pointerAnchor = null;
  }

  function onCancel() {
    baseEdge = null;
    pointerAnchor = null;
  }

  function activate() {
    baseEdge = null;
    pointerAnchor = null;
  }

  function deactivate() {
    baseEdge = null;
    pointerAnchor = null;
  }

  function selectBaseEdge(point) {
    const document = documentStore.getDocument();
    if (!document) {
      return;
    }

    const { edges = [] } = document;
    let candidate = null;
    let candidateDistance = Infinity;

    for (const edge of edges) {
      if (!edge?.start || !edge?.end) {
        continue;
      }

      const distanceToEdge = distanceToPoint(edge, point);
      if (distanceToEdge < candidateDistance) {
        candidateDistance = distanceToEdge;
        candidate = edge;
      }
    }

    if (!candidate || candidateDistance > PICK_TOLERANCE) {
      return;
    }

    baseEdge = {
      id: candidate.id,
      type: candidate.type,
      start: { ...candidate.start },
      end: { ...candidate.end },
    };
  }

  return {
    id: "perpendicular",
    label: "Perpendicular",
    shortcut: "P",
    cursor: "crosshair",
    activate,
    deactivate,
    onPointerDown,
    onPointerMove() {},
    onPointerUp,
    onCancel,
  };
}
