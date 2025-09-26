import { cross, subtract, EPSILON } from "./vector2.js";

export function orientation(a, b, c) {
  return cross(subtract(b, a), subtract(c, a));
}

export function isCounterClockwise(a, b, c, epsilon = EPSILON) {
  return orientation(a, b, c) > epsilon;
}

export function isClockwise(a, b, c, epsilon = EPSILON) {
  return orientation(a, b, c) < -epsilon;
}

export function isCollinear(a, b, c, epsilon = EPSILON) {
  return Math.abs(orientation(a, b, c)) <= epsilon;
}
