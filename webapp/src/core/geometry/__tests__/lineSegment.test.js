import test from "node:test";
import assert from "node:assert/strict";

import {
  createLineSegment,
  closestPoint,
  distanceToPoint,
  reflectPoint,
} from "../../geometry/lineSegment.js";
import { createVector2 } from "../../geometry/vector2.js";

test("closestPoint clamps to the segment extents", () => {
  const segment = createLineSegment(createVector2(0, 0), createVector2(10, 0));

  const before = closestPoint(segment, { x: -5, y: 5 });
  assert.deepEqual(before, createVector2(0, 0));

  const after = closestPoint(segment, { x: 20, y: -3 });
  assert.deepEqual(after, createVector2(10, 0));
});

test("distanceToPoint reports the perpendicular distance", () => {
  const segment = createLineSegment(createVector2(0, 0), createVector2(0, 10));
  const distance = distanceToPoint(segment, { x: 4, y: 5 });
  assert.equal(distance, 4);
});

test("distanceToPoint handles degenerate segments", () => {
  const segment = createLineSegment(createVector2(2, 2), createVector2(2, 2));
  const distance = distanceToPoint(segment, { x: 5, y: 6 });
  assert.equal(distance, Math.hypot(3, 4));
});

test("reflectPoint mirrors coordinates across the segment axis", () => {
  const segment = createLineSegment(createVector2(0, 0), createVector2(10, 0));
  const reflected = reflectPoint(segment, { x: 4, y: 5 });
  assert.deepEqual(reflected, createVector2(4, -5));
});

test("reflectPoint returns null for degenerate segments", () => {
  const segment = createLineSegment(createVector2(1, 1), createVector2(1, 1));
  const reflected = reflectPoint(segment, { x: 2, y: 3 });
  assert.equal(reflected, null);
});
