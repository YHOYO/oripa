import { distance } from "../core/geometry/vector2.js";
import { distanceToPoint, reflectPoint } from "../core/geometry/lineSegment.js";

const PICK_TOLERANCE = 8;
const DRAG_TOLERANCE = 5;
const MIN_SEGMENT_LENGTH = 1e-1;

export function createSymmetryTool({ documentStore }) {
  let axisEdge = null;
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

    if (!axisEdge) {
      selectAxisEdge(releasePoint);
      pointerAnchor = null;
      return;
    }

    if (dragDistance <= DRAG_TOLERANCE) {
      selectAxisEdge(releasePoint);
      pointerAnchor = null;
      return;
    }

    const reflectedStart = reflectPoint(axisEdge, pointerAnchor);
    const reflectedEnd = reflectPoint(axisEdge, releasePoint);

    if (!reflectedStart || !reflectedEnd) {
      pointerAnchor = null;
      return;
    }

    const mirroredLength = distance(reflectedStart, reflectedEnd);
    if (mirroredLength < MIN_SEGMENT_LENGTH) {
      pointerAnchor = null;
      return;
    }

    documentStore.addEdge({
      start: reflectedStart,
      end: reflectedEnd,
      type: axisEdge.type ?? "auxiliary",
    });

    pointerAnchor = null;
  }

  function onCancel() {
    reset();
  }

  function activate() {
    reset();
  }

  function deactivate() {
    reset();
  }

  function reset() {
    axisEdge = null;
    pointerAnchor = null;
  }

  function selectAxisEdge(point) {
    const candidate = pickEdge(point);
    if (!candidate) {
      return;
    }

    axisEdge = candidate;
  }

  function pickEdge(point) {
    const document = documentStore.getDocument();
    if (!document) {
      return null;
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
      return null;
    }

    return {
      id: candidate.id,
      type: candidate.type,
      start: { ...candidate.start },
      end: { ...candidate.end },
    };
  }

  return {
    id: "symmetry",
    label: "Simetría",
    shortcut: "Y",
    cursor: "crosshair",
    activate,
    deactivate,
    onPointerDown,
    onPointerMove() {},
    onPointerUp,
    onCancel,
  };
}
