import {
  createVector2,
  subtract,
  add,
  scale,
  distance,
  normalize,
  EPSILON,
  dot,
  lengthSquared,
} from "./vector2.js";

function assertVector(label, value) {
  if (!value || typeof value.x !== "number" || typeof value.y !== "number") {
    throw new TypeError(`${label} must be a vector-like object`);
  }
}

export function createLineSegment(start, end) {
  assertVector("start", start);
  assertVector("end", end);
  return Object.freeze({
    start: createVector2(start.x, start.y),
    end: createVector2(end.x, end.y),
  });
}

export function isDegenerate(segment, epsilon = EPSILON) {
  return distance(segment.start, segment.end) <= epsilon;
}

export function direction(segment) {
  return normalize(subtract(segment.end, segment.start));
}

export function vector(segment) {
  return subtract(segment.end, segment.start);
}

export function length(segment) {
  return distance(segment.start, segment.end);
}

export function midpoint(segment) {
  return scale(add(segment.start, segment.end), 0.5);
}

export function reverse(segment) {
  return createLineSegment(segment.end, segment.start);
}

export function pointAt(segment, t) {
  return add(segment.start, scale(vector(segment), t));
}

export function boundingBox(segment) {
  return {
    minX: Math.min(segment.start.x, segment.end.x),
    maxX: Math.max(segment.start.x, segment.end.x),
    minY: Math.min(segment.start.y, segment.end.y),
    maxY: Math.max(segment.start.y, segment.end.y),
  };
}

export function expand(segment, delta) {
  return createLineSegment(
    add(segment.start, scale(direction(segment), -delta)),
    add(segment.end, scale(direction(segment), delta)),
  );
}

export function toJSON(segment) {
  return { start: { ...segment.start }, end: { ...segment.end } };
}

export function closestPoint(segment, point) {
  assertVector("point", point);

  const segmentVector = subtract(segment.end, segment.start);
  const lengthSq = lengthSquared(segmentVector);

  if (lengthSq === 0) {
    return createVector2(segment.start.x, segment.start.y);
  }

  const t = Math.max(0, Math.min(1, dot(subtract(point, segment.start), segmentVector) / lengthSq));

  return add(segment.start, scale(segmentVector, t));
}

export function distanceToPoint(segment, point) {
  const nearest = closestPoint(segment, point);
  return distance(nearest, point);
}

export function reflectPoint(segment, point) {
  assertVector("point", point);

  const segmentVector = subtract(segment.end, segment.start);
  const lengthSq = lengthSquared(segmentVector);

  if (lengthSq === 0) {
    return null;
  }

  const startToPoint = subtract(point, segment.start);
  const projectionLength = dot(startToPoint, segmentVector) / lengthSq;
  const projection = scale(segmentVector, projectionLength);

  const doubleProjection = scale(projection, 2);
  const reflectedVector = subtract(doubleProjection, startToPoint);

  const reflectedPoint = add(segment.start, reflectedVector);
  return createVector2(reflectedPoint.x, reflectedPoint.y);
}
