import test from "node:test";
import assert from "node:assert/strict";
import { createVector2 } from "../vector2.js";
import { createLineSegment } from "../lineSegment.js";
import { createRay } from "../ray.js";
import { intersectSegments, intersectRaySegment } from "../intersections.js";

test("intersectSegments detects orthogonal crossings", () => {
  const horizontal = createLineSegment(createVector2(0, 0), createVector2(10, 0));
  const vertical = createLineSegment(createVector2(5, -5), createVector2(5, 5));
  const result = intersectSegments(horizontal, vertical);
  assert.ok(result);
  assert.equal(result.type, "proper");
  assert.deepEqual(result.point, createVector2(5, 0));
});

test("intersectSegments returns null when segments do not overlap", () => {
  const a = createLineSegment(createVector2(0, 0), createVector2(1, 0));
  const b = createLineSegment(createVector2(2, 0), createVector2(3, 0));
  assert.equal(intersectSegments(a, b), null);
});

test("intersectRaySegment handles collinear overlaps", () => {
  const ray = createRay(createVector2(0, 0), createVector2(1, 0));
  const segment = createLineSegment(createVector2(2, 0), createVector2(5, 0));
  const result = intersectRaySegment(ray, segment);
  assert.ok(result);
  assert.equal(result.type, "collinear");
  assert.deepEqual(result.point, createVector2(2, 0));
});

test("intersectRaySegment ignores intersections behind the ray origin", () => {
  const ray = createRay(createVector2(0, 0), createVector2(1, 0));
  const segment = createLineSegment(createVector2(-4, 0), createVector2(-2, 0));
  assert.equal(intersectRaySegment(ray, segment), null);
});
