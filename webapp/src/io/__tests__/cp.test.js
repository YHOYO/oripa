import test from "node:test";
import assert from "node:assert/strict";

import { parseCp, serializeCp } from "../cp.js";

test("parseCp reads crease pattern segments", () => {
  const contents = `2 0 0 10 0\n3 10 0 10 10\n1 -5 2.5 5 2.5`;
  const { lines } = parseCp(contents);

  assert.equal(lines.length, 3);
  assert.deepEqual(lines[0], {
    type: "mountain",
    start: { x: 0, y: 0 },
    end: { x: 10, y: 0 },
  });
  assert.equal(lines[1].type, "valley");
  assert.equal(lines[2].type, "border");
});

test("parseCp ignores malformed rows", () => {
  const contents = `2 0 0 10\nhello world\n3 0 0 10 10`;
  const { lines } = parseCp(contents);

  assert.equal(lines.length, 1);
  assert.equal(lines[0].type, "valley");
});

test("serializeCp skips unsupported edge types", () => {
  const result = serializeCp({
    lines: [
      { type: "mountain", start: { x: 0, y: 0 }, end: { x: 5, y: 5 } },
      { type: "auxiliary", start: { x: 1, y: 1 }, end: { x: 2, y: 2 } },
      { type: "border", start: { x: -1, y: -1 }, end: { x: 3, y: 3 } },
    ],
  });

  const rows = result.split("\n");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].startsWith("2"), true);
  assert.equal(rows[1].startsWith("1"), true);
});

test("serializeCp round-trips through parseCp", () => {
  const text = serializeCp({
    lines: [
      { type: "mountain", start: { x: 0, y: 0 }, end: { x: 10, y: 0 } },
      { type: "valley", start: { x: 10, y: 0 }, end: { x: 10, y: 10 } },
      { type: "border", start: { x: -5.5, y: 2.25 }, end: { x: 3.75, y: -1.125 } },
    ],
  });

  const { lines } = parseCp(text);
  assert.equal(lines.length, 3);
  assert.equal(lines[0].type, "mountain");
  assert.equal(lines[2].type, "border");
});
