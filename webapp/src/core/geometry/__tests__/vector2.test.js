import test from "node:test";
import assert from "node:assert/strict";
import {
  createVector2,
  add,
  subtract,
  scale,
  dot,
  cross,
  length,
  normalize,
  distance,
  equals,
  angleBetween,
  rotate,
} from "../vector2.js";

test("createVector2 enforces finite numbers", () => {
  assert.throws(() => createVector2(Number.NaN, 0), /finite number/);
  assert.throws(() => createVector2(0, Infinity), /finite number/);
});

test("add, subtract and scale combine vectors correctly", () => {
  const a = createVector2(2, 5);
  const b = createVector2(-3, 4);
  assert.deepEqual(add(a, b), createVector2(-1, 9));
  assert.deepEqual(subtract(a, b), createVector2(5, 1));
  assert.deepEqual(scale(b, 2), createVector2(-6, 8));
});

test("dot and cross products match expected values", () => {
  const a = createVector2(3, 2);
  const b = createVector2(-5, 4);
  assert.equal(dot(a, b), -7);
  assert.equal(cross(a, b), 22);
});

test("length, normalize and distance handle magnitude correctly", () => {
  const v = createVector2(3, 4);
  assert.equal(length(v), 5);
  assert.ok(equals(normalize(v), createVector2(0.6, 0.8)));
  assert.equal(distance(createVector2(0, 0), createVector2(6, 8)), 10);
});

test("equals respects tolerance for floating point comparisons", () => {
  const a = createVector2(1, 1);
  const b = createVector2(1 + 1e-10, 1 - 1e-10);
  assert.equal(equals(a, b), true);
});

test("angleBetween and rotate provide geometric utilities", () => {
  const xAxis = createVector2(1, 0);
  const rotated = rotate(xAxis, Math.PI / 2);
  assert.equal(angleBetween(xAxis, rotated).toFixed(5), (Math.PI / 2).toFixed(5));
});
