import test from "node:test";
import assert from "node:assert/strict";

import { serializeFold } from "../fold.js";

test("serializeFold deduplicates vertices and maps assignments", () => {
  const foldJson = serializeFold({
    lines: [
      { start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, type: "mountain" },
      { start: { x: 10, y: 0 }, end: { x: 10, y: 10 }, type: "valley" },
      { start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, type: "border" },
      { start: { x: 10, y: 10 }, end: { x: 0, y: 10 }, type: "auxiliary" },
    ],
    metadata: {
      name: "Test Pattern",
      author: "Jane Doe",
      unit: "mm",
      updatedAt: "2024-05-19T12:00:00.000Z",
    },
  });

  const parsed = JSON.parse(foldJson);

  assert.equal(parsed.file_title, "Test Pattern");
  assert.equal(parsed.file_author, "Jane Doe");
  assert.equal(parsed.frame_unit, "millimeter");
  assert.equal(parsed.file_created, "2024-05-19T12:00:00.000Z");
  assert.deepEqual(parsed.edges_assignment, ["M", "V", "B", "U"]);
  assert.equal(parsed.vertices_coords.length, 4);
  assert.equal(parsed.edges_vertices.length, 4);
});

test("serializeFold skips malformed lines", () => {
  const foldJson = serializeFold({
    lines: [
      { start: { x: 0, y: 0 }, end: { x: 5, y: 5 }, type: "mountain" },
      { start: { x: 5 }, end: { x: 10, y: 10 }, type: "valley" },
    ],
  });

  const parsed = JSON.parse(foldJson);

  assert.equal(parsed.edges_vertices.length, 1);
  assert.equal(parsed.edges_assignment.length, 1);
});
