import test from "node:test";
import assert from "node:assert/strict";

import { analyzeLocalFlatFoldability } from "../localFlatFoldability.js";

const ORIGIN = { x: 0, y: 0 };

function toVertex(id, position) {
  return { id, position };
}

function toEdge(id, start, end, type) {
  return { id, start, end, type };
}

test("analyzeLocalFlatFoldability computes Kawasaki and Maekawa theorems", () => {
  const vertices = [
    toVertex("v-origin", ORIGIN),
    toVertex("v-east", { x: 1, y: 0 }),
    toVertex("v-north", { x: 0, y: 1 }),
    toVertex("v-west", { x: -1, y: 0 }),
    toVertex("v-south", { x: 0, y: -1 }),
  ];

  const edges = [
    toEdge("e-east", ORIGIN, { x: 1, y: 0 }, "mountain"),
    toEdge("e-north", ORIGIN, { x: 0, y: 1 }, "valley"),
    toEdge("e-west", ORIGIN, { x: -1, y: 0 }, "mountain"),
    toEdge("e-south", ORIGIN, { x: 0, y: -1 }, "mountain"),
  ];

  const report = analyzeLocalFlatFoldability({ vertices, edges });
  const originReport = report.find((entry) => entry.vertexId === "v-origin");

  assert.ok(originReport, "expected a report for the origin vertex");
  assert.equal(originReport.degree, 4);
  assert.equal(originReport.sectors.length, 4);
  assert.ok(originReport.kawasaki.applicable);
  assert.ok(originReport.kawasaki.satisfied);
  assert.ok(originReport.kawasaki.deviation <= 1e-6);
  assert.ok(originReport.maekawa.applicable);
  assert.ok(originReport.maekawa.satisfied);
  assert.equal(originReport.maekawa.mountainCount, 3);
  assert.equal(originReport.maekawa.valleyCount, 1);
});

test("vertices with menos de cuatro pliegues no activan los teoremas", () => {
  const vertices = [
    toVertex("v-origin", ORIGIN),
    toVertex("v-east", { x: 1, y: 0 }),
    toVertex("v-north", { x: 0, y: 1 }),
  ];

  const edges = [
    toEdge("e-east", ORIGIN, { x: 1, y: 0 }, "mountain"),
    toEdge("e-north", ORIGIN, { x: 0, y: 1 }, "valley"),
    toEdge("e-diagonal", ORIGIN, { x: 1, y: 1 }, "auxiliary"),
  ];

  const report = analyzeLocalFlatFoldability({ vertices, edges });
  const originReport = report.find((entry) => entry.vertexId === "v-origin");

  assert.ok(originReport, "expected a report for the origin vertex");
  assert.equal(originReport.degree, 3);
  assert.equal(originReport.kawasaki.applicable, false);
  assert.equal(originReport.maekawa.applicable, false);
  assert.equal(originReport.maekawa.mountainCount, 1);
  assert.equal(originReport.maekawa.valleyCount, 1);
});
