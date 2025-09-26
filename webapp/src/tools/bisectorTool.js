import { add, distance, normalize, scale, subtract } from "../core/geometry/vector2.js";
import { distanceToPoint } from "../core/geometry/lineSegment.js";
import { intersectSegments } from "../core/geometry/intersections.js";

const PICK_TOLERANCE = 8;
const DRAG_TOLERANCE = 5;
const MIN_SEGMENT_LENGTH = 1e-1;
const POINT_TOLERANCE = 1e-6;

export function createBisectorTool({ documentStore }) {
  let firstEdge = null;
  let secondEdge = null;
  let pivot = null;
  let bisectorDirection = null;
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

    if (dragDistance <= DRAG_TOLERANCE) {
      selectEdge(releasePoint);
      pointerAnchor = null;
      return;
    }

    if (!pivot || !bisectorDirection) {
      pointerAnchor = null;
      return;
    }

    const projectedLength = projectLengthOntoBisector(releasePoint);
    if (Math.abs(projectedLength) < MIN_SEGMENT_LENGTH) {
      pointerAnchor = null;
      return;
    }

    const direction = projectedLength >= 0 ? bisectorDirection : scale(bisectorDirection, -1);
    const length = Math.abs(projectedLength);
    const endPoint = add(pivot, scale(direction, length));

    documentStore.addEdge({
      start: pivot,
      end: endPoint,
      type: inferEdgeType(),
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
    firstEdge = null;
    secondEdge = null;
    pivot = null;
    bisectorDirection = null;
    pointerAnchor = null;
  }

  function selectEdge(point) {
    const candidate = pickEdge(point);
    if (!candidate) {
      return;
    }

    if (!firstEdge || (firstEdge && secondEdge)) {
      firstEdge = candidate;
      secondEdge = null;
      pivot = null;
      bisectorDirection = null;
      return;
    }

    if (candidate.id === firstEdge.id) {
      return;
    }

    secondEdge = candidate;
    updateBisector();
    if (!bisectorDirection) {
      secondEdge = null;
    }
  }

  function projectLengthOntoBisector(point) {
    const vector = subtract(point, pivot);
    return vector.x * bisectorDirection.x + vector.y * bisectorDirection.y;
  }

  function inferEdgeType() {
    if (firstEdge?.type === secondEdge?.type) {
      return firstEdge.type ?? "auxiliary";
    }

    if (firstEdge?.type && !secondEdge?.type) {
      return firstEdge.type;
    }

    if (secondEdge?.type && !firstEdge?.type) {
      return secondEdge.type;
    }

    return "auxiliary";
  }

  function pickEdge(point) {
    const document = documentStore.getDocument();
    if (!document) {
      return null;
    }

    const edges = document.edges ?? [];
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

  function updateBisector() {
    pivot = null;
    bisectorDirection = null;

    if (!firstEdge || !secondEdge) {
      return;
    }

    const intersection = intersectSegments(firstEdge, secondEdge, { epsilon: POINT_TOLERANCE });
    const intersectionPoint = intersection?.point;
    if (!intersectionPoint) {
      return;
    }

    const vectorA = edgeDirectionFromPoint(firstEdge, intersectionPoint);
    const vectorB = edgeDirectionFromPoint(secondEdge, intersectionPoint);

    if (!vectorA || !vectorB) {
      return;
    }

    const unitA = normalize(vectorA);
    const unitB = normalize(vectorB);
    const sum = { x: unitA.x + unitB.x, y: unitA.y + unitB.y };
    const unitSum = normalize(sum);

    if (unitSum.x === 0 && unitSum.y === 0) {
      return;
    }

    pivot = {
      x: intersectionPoint.x,
      y: intersectionPoint.y,
    };
    bisectorDirection = unitSum;
  }

  function edgeDirectionFromPoint(edge, point) {
    const { start, end } = edge;
    const distanceToStart = distance(start, point);
    const distanceToEnd = distance(end, point);

    if (distanceToStart <= POINT_TOLERANCE && distanceToEnd <= POINT_TOLERANCE) {
      return null;
    }

    if (distanceToStart <= POINT_TOLERANCE) {
      return subtract(end, start);
    }

    if (distanceToEnd <= POINT_TOLERANCE) {
      return subtract(start, end);
    }

    // For intersections occurring in the middle of an edge, choose the closest endpoint.
    return distanceToStart < distanceToEnd ? subtract(start, point) : subtract(end, point);
  }

  return {
    id: "bisector",
    label: "Bisectriz",
    shortcut: "B",
    cursor: "crosshair",
    activate,
    deactivate,
    onPointerDown,
    onPointerMove() {},
    onPointerUp,
    onCancel,
  };
}
