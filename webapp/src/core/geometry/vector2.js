const DEFAULT_EPSILON = 1e-9;

function assertFinite(value, label) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number`);
  }
}

export function createVector2(x = 0, y = 0) {
  assertFinite(x, "x");
  assertFinite(y, "y");
  return Object.freeze({ x, y });
}

export function clone(vector) {
  return createVector2(vector?.x ?? 0, vector?.y ?? 0);
}

export function add(a, b) {
  return createVector2(a.x + b.x, a.y + b.y);
}

export function subtract(a, b) {
  return createVector2(a.x - b.x, a.y - b.y);
}

export function scale(vector, scalar) {
  assertFinite(scalar, "scalar");
  return createVector2(vector.x * scalar, vector.y * scalar);
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

export function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

export function length(vector) {
  return Math.hypot(vector.x, vector.y);
}

export function lengthSquared(vector) {
  return vector.x * vector.x + vector.y * vector.y;
}

export function distance(a, b) {
  return length(subtract(a, b));
}

export function distanceSquared(a, b) {
  return lengthSquared(subtract(a, b));
}

export function normalize(vector, epsilon = DEFAULT_EPSILON) {
  const len = length(vector);
  if (len <= epsilon) {
    return createVector2(0, 0);
  }
  return scale(vector, 1 / len);
}

export function perpendicular(vector) {
  return createVector2(-vector.y, vector.x);
}

export function project(vector, onto) {
  const denom = lengthSquared(onto);
  if (denom === 0) {
    return createVector2(0, 0);
  }
  const factor = dot(vector, onto) / denom;
  return scale(onto, factor);
}

export function lerp(a, b, t) {
  assertFinite(t, "t");
  return add(scale(a, 1 - t), scale(b, t));
}

export function equals(a, b, epsilon = DEFAULT_EPSILON) {
  return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon;
}

export function angleBetween(a, b) {
  const denom = Math.sqrt(lengthSquared(a) * lengthSquared(b));
  if (denom === 0) {
    return 0;
  }
  const cosine = Math.min(Math.max(dot(a, b) / denom, -1), 1);
  return Math.acos(cosine);
}

export function rotate(vector, radians) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return createVector2(vector.x * cos - vector.y * sin, vector.x * sin + vector.y * cos);
}

export const EPSILON = DEFAULT_EPSILON;
