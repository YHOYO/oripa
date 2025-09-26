import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { parseOpx, serializeOpx } from "../opx.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadSample(name) {
  const filePath = resolve(__dirname, "../../../../documents/web/samples/opx", name);
  return readFileSync(filePath, "utf8");
}

function round(value) {
  return Number(value.toFixed(4));
}

function roundPoint(point) {
  return { x: round(point.x), y: round(point.y) };
}

test("parseOpx handles mixed crease types", () => {
  const snippet = `<?xml version="1.0" encoding="UTF-8"?>
<java version="1.8.0" class="java.beans.XMLDecoder">
 <object class="oripa.DataSet">
  <void property="lines">
   <array class="oripa.OriLineProxy" length="2">
    <void index="0">
     <object class="oripa.OriLineProxy">
      <void property="type">
       <int>2</int>
      </void>
      <void property="x0">
       <double>0.0</double>
      </void>
      <void property="x1">
       <double>10.0</double>
      </void>
      <void property="y0">
       <double>0.0</double>
      </void>
      <void property="y1">
       <double>0.0</double>
      </void>
     </object>
    </void>
    <void index="1">
     <object class="oripa.OriLineProxy">
      <void property="type">
       <int>3</int>
      </void>
      <void property="x0">
       <double>10.0</double>
      </void>
      <void property="x1">
       <double>10.0</double>
      </void>
      <void property="y0">
       <double>0.0</double>
      </void>
      <void property="y1">
       <double>10.0</double>
      </void>
     </object>
    </void>
   </array>
  </void>
 </object>
</java>`;

  const { lines } = parseOpx(snippet);

  assert.equal(lines.length, 2);
  assert.deepEqual(roundPoint(lines[0].start), { x: 0, y: 0 });
  assert.equal(lines[0].type, "mountain");
  assert.equal(lines[1].type, "valley");
});

test("parseOpx ignores malformed entries", () => {
  const malformed = `<?xml version="1.0" encoding="UTF-8"?>
<java version="1.8.0" class="java.beans.XMLDecoder">
 <object class="oripa.DataSet">
  <void property="lines">
   <array class="oripa.OriLineProxy" length="2">
    <void index="0">
     <object class="oripa.OriLineProxy">
      <void property="type">
       <int>2</int>
      </void>
      <void property="x0">
       <double>0.0</double>
      </void>
      <void property="x1">
       <double>10.0</double>
      </void>
      <void property="y0">
       <double>0.0</double>
      </void>
      <void property="y1">
       <double>0.0</double>
      </void>
     </object>
    </void>
    <void index="1">
     <object class="oripa.OriLineProxy">
      <void property="type">
       <int>3</int>
      </void>
      <void property="x0">
       <double>10.0</double>
      </void>
     </object>
    </void>
   </array>
  </void>
 </object>
</java>`;

  const { lines } = parseOpx(malformed);
  assert.equal(lines.length, 1);
});

test("parseOpx loads bundled samples", () => {
  const sample = loadSample("crane_base_mitani.opx");
  const { lines } = parseOpx(sample);

  assert(lines.length > 0);
  assert(lines.every((line) => line.start && line.end));
});

test("serializeOpx writes the expected XML shape", () => {
  const xml = serializeOpx({
    lines: [
      { start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, type: "mountain" },
      { start: { x: 10, y: 0 }, end: { x: 10, y: 10 }, type: "valley" },
    ],
  });

  assert(xml.includes('<array class="oripa.OriLineProxy" length="2">'));
  assert(xml.includes("<int>2</int>"));
  assert(xml.includes("<int>3</int>"));
});

test("serializeOpx round-trips through parseOpx", () => {
  const original = [
    { start: { x: 0, y: 0 }, end: { x: 20, y: 10 }, type: "border" },
    { start: { x: -5, y: 7.5 }, end: { x: 5, y: 7.5 }, type: "auxiliary" },
  ];

  const xml = serializeOpx({ lines: original });
  const { lines } = parseOpx(xml);

  assert.equal(lines.length, 2);
  assert.equal(lines[0].type, "border");
  assert.deepEqual(roundPoint(lines[1].start), { x: -5, y: 7.5 });
});
