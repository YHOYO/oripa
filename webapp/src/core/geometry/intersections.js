import { subtract, cross, dot, add, scale, EPSILON } from "./vector2.js";

function clamp01(value, epsilon) {
  return value > -epsilon && value < 1 + epsilon;
}

export function intersectSegments(a, b, { epsilon = EPSILON } = {}) {
  const p = a.start;
  const r = subtract(a.end, a.start);
  const q = b.start;
  const s = subtract(b.end, b.start);
  const denominator = cross(r, s);
  const numerator = cross(subtract(q, p), r);

  if (Math.abs(denominator) <= epsilon && Math.abs(numerator) <= epsilon) {
    // Collinear - report overlap midpoint if exists
    const t0 = dot(subtract(q, p), r) / dot(r, r);
    const t1 = t0 + dot(s, r) / dot(r, r);
    const tMin = Math.max(Math.min(t0, t1), 0);
    const tMax = Math.min(Math.max(t0, t1), 1);
    if (tMin <= tMax) {
      const point = add(p, scale(r, (tMin + tMax) * 0.5));
      return { point, parameters: { a: (tMin + tMax) * 0.5, b: null }, type: "collinear" };
    }
    return null;
  }

  if (Math.abs(denominator) <= epsilon) {
    return null; // Parallel
  }

  const t = cross(subtract(q, p), s) / denominator;
  const u = cross(subtract(q, p), r) / denominator;

  if (!clamp01(t, epsilon) || !clamp01(u, epsilon)) {
    return null;
  }

  return { point: add(p, scale(r, t)), parameters: { a: t, b: u }, type: "proper" };
}

export function intersectRaySegment(ray, segment, { epsilon = EPSILON } = {}) {
  const rayVector = ray.direction;
  const segVector = subtract(segment.end, segment.start);
  const denominator = cross(rayVector, segVector);
  const diff = subtract(segment.start, ray.origin);

  if (Math.abs(denominator) <= epsilon) {
    // Parallel or collinear
    const crossDiff = cross(diff, rayVector);
    if (Math.abs(crossDiff) > epsilon) {
      return null;
    }
    // Collinear overlap, report nearest point on segment in front of ray
    const projection = dot(diff, rayVector);
    const projectionEnd = projection + dot(segVector, rayVector);
    const candidates = [projection, projectionEnd].filter((value) => value >= -epsilon);
    if (candidates.length === 0) {
      return null;
    }
    const distanceAlongRay = Math.min(...candidates);
    return {
      point: add(ray.origin, scale(rayVector, distanceAlongRay)),
      parameters: { ray: distanceAlongRay, segment: null },
      type: "collinear",
    };
  }

  const t = cross(diff, segVector) / denominator;
  const u = cross(diff, rayVector) / denominator;

  if (t < -epsilon || u < -epsilon || u > 1 + epsilon) {
    return null;
  }

  return {
    point: add(ray.origin, scale(rayVector, t)),
    parameters: { ray: t, segment: u },
    type: "proper",
  };
}
