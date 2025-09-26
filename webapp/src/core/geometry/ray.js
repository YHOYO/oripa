import { createVector2, subtract, normalize, scale, add } from "./vector2.js";

function assertVector(label, value) {
  if (!value || typeof value.x !== "number" || typeof value.y !== "number") {
    throw new TypeError(`${label} must be a vector-like object`);
  }
}

export function createRay(origin, direction) {
  assertVector("origin", origin);
  assertVector("direction", direction);
  return Object.freeze({
    origin: createVector2(origin.x, origin.y),
    direction: normalize(direction),
  });
}

export function fromPoints(origin, through) {
  return createRay(origin, subtract(through, origin));
}

export function pointAt(ray, distance) {
  return add(ray.origin, scale(ray.direction, distance));
}
