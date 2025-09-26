import test from "node:test";
import assert from "node:assert/strict";

import { createDocumentStore } from "../../state/documentStore.js";
import { parseOpx } from "../../io/opx.js";
import { parseCp } from "../../io/cp.js";

test("addEdge appends a new edge and history entry", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const before = store.getDocument();
  const initialEdgeCount = before.edges.length;
  const initialHistoryCount = before.history.length;

  store.addEdge({
    start: { x: 10, y: 20 },
    end: { x: 120, y: 220 },
    type: "valley",
  });

  const after = store.getDocument();
  assert.equal(after.edges.length, initialEdgeCount + 1);
  assert.equal(after.history.length, initialHistoryCount + 1);

  const newEdge = after.edges.at(-1);
  assert.equal(newEdge.type, "valley");
  assert.deepEqual(newEdge.start, { x: 10, y: 20 });
  assert.deepEqual(newEdge.end, { x: 120, y: 220 });

  const lastHistory = after.history.at(-1);
  assert.match(lastHistory.label, /Segmento añadido/i);
});

test("addEdge requires initialized document", () => {
  const store = createDocumentStore();
  assert.throws(() => {
    store.addEdge({ start: { x: 0, y: 0 }, end: { x: 10, y: 10 } });
  });
});

test("addEdge validates start and end points", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  assert.throws(() => {
    store.addEdge({ start: { x: 0, y: 0 }, end: { x: Number.NaN, y: 10 } });
  });
});

test("selection state is tracked and mutable", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const initial = store.getDocument();
  assert.deepEqual(initial.selection, { edges: [], box: null });

  store.setSelectedEdges(["edge-1", "edge-2", "edge-1"]);
  const afterSelect = store.getDocument();
  assert.deepEqual(afterSelect.selection.edges, ["edge-1", "edge-2"]);
  assert.equal(afterSelect.selection.box, null);

  store.clearSelection();
  const cleared = store.getDocument();
  assert.deepEqual(cleared.selection.edges, []);
});

test("selection box updates are normalized", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  store.setSelectionBox({ minX: 100, minY: 200, maxX: 50, maxY: 150 });
  const doc = store.getDocument();
  assert.deepEqual(doc.selection.box, { minX: 50, minY: 150, maxX: 100, maxY: 200 });

  store.setSelectionBox(null);
  const cleared = store.getDocument();
  assert.equal(cleared.selection.box, null);
});

test("translateEdges moves selected edges without adding history entries", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const initialDoc = store.getDocument();
  const targetEdge = initialDoc.edges[0];
  const { id } = targetEdge;
  const originalStart = { ...targetEdge.start };
  const originalEnd = { ...targetEdge.end };
  const initialHistoryCount = initialDoc.history.length;

  store.translateEdges([id], { x: 12.3456, y: -7.8912 });

  const movedDoc = store.getDocument();
  const movedEdge = movedDoc.edges.find((edge) => edge.id === id);

  const expectedStart = {
    x: Number((originalStart.x + 12.3456).toFixed(3)),
    y: Number((originalStart.y - 7.8912).toFixed(3)),
  };
  const expectedEnd = {
    x: Number((originalEnd.x + 12.3456).toFixed(3)),
    y: Number((originalEnd.y - 7.8912).toFixed(3)),
  };

  assert.deepEqual(movedEdge.start, expectedStart);
  assert.deepEqual(movedEdge.end, expectedEnd);
  assert.equal(movedDoc.history.length, initialHistoryCount);
  assert.ok(
    movedDoc.vertices.some(
      (vertex) => vertex.position.x === expectedStart.x && vertex.position.y === expectedStart.y,
    ),
  );
});

test("recordEdgeTranslation appends a history entry with metadata", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const doc = store.getDocument();
  const edgeId = doc.edges[1].id;
  const historyBefore = doc.history.length;

  store.recordEdgeTranslation([edgeId], { x: 5, y: -3.25 });

  const after = store.getDocument();
  assert.equal(after.history.length, historyBefore + 1);
  const lastEntry = after.history.at(-1);
  assert.match(lastEntry.label, /Movimiento/);
  assert.deepEqual(lastEntry.metadata.edges, [edgeId]);
  assert.deepEqual(lastEntry.metadata.delta, { x: 5, y: -3.25 });
});

test("scaleEdges rescales edges around the provided pivot", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const doc = store.getDocument();
  const [edge] = doc.edges;
  const pivot = { x: 0, y: 0 };

  store.scaleEdges([edge.id], {
    pivot,
    scale: 2,
    basePositions: {
      [edge.id]: {
        start: { ...edge.start },
        end: { ...edge.end },
      },
    },
  });

  const updated = store.getDocument();
  const scaledEdge = updated.edges.find((candidate) => candidate.id === edge.id);

  assert.deepEqual(scaledEdge.start, {
    x: Number((edge.start.x * 2).toFixed(3)),
    y: Number((edge.start.y * 2).toFixed(3)),
  });
  assert.deepEqual(scaledEdge.end, {
    x: Number((edge.end.x * 2).toFixed(3)),
    y: Number((edge.end.y * 2).toFixed(3)),
  });
});

test("scaleEdges ignores invalid inputs", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const doc = store.getDocument();
  const targetId = doc.edges[0].id;
  const original = JSON.stringify(store.getDocument().edges);

  store.scaleEdges([targetId], { pivot: { x: 0, y: 0 }, scale: -1 });
  assert.equal(JSON.stringify(store.getDocument().edges), original);

  store.scaleEdges([], { pivot: { x: 0, y: 0 }, scale: 2 });
  assert.equal(JSON.stringify(store.getDocument().edges), original);
});

test("recordEdgeScaling appends history metadata", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const doc = store.getDocument();
  const [edgeA, edgeB] = doc.edges;
  const initialHistory = doc.history.length;

  store.recordEdgeScaling([edgeA.id, edgeB.id], {
    pivot: { x: 10, y: 10 },
    scale: 1.5,
  });

  const after = store.getDocument();
  assert.equal(after.history.length, initialHistory + 1);
  const lastEntry = after.history.at(-1);
  assert.match(lastEntry.label, /Escalado/);
  assert.deepEqual(lastEntry.metadata.edges, [edgeA.id, edgeB.id]);
  assert.deepEqual(lastEntry.metadata.scale, 1.5);
  assert.deepEqual(lastEntry.metadata.pivot, { x: 10, y: 10 });
});

test("setEdgeType updates the requested edges and registers history", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const before = store.getDocument();
  const [edgeA, edgeB] = before.edges;
  const initialHistory = before.history.length;

  store.setEdgeType([edgeA.id, edgeB.id], "mountain");

  const after = store.getDocument();
  const updatedEdgeA = after.edges.find((edge) => edge.id === edgeA.id);
  const updatedEdgeB = after.edges.find((edge) => edge.id === edgeB.id);

  assert.equal(updatedEdgeA.type, "mountain");
  assert.equal(updatedEdgeB.type, "mountain");
  assert.equal(after.history.length, initialHistory + 1);
  const lastHistory = after.history.at(-1);
  assert.match(lastHistory.label, /Tipo actualizado/);
  assert.deepEqual(lastHistory.metadata.edges, [edgeA.id, edgeB.id]);
  assert.equal(lastHistory.metadata.type, "mountain");
});

test("setSelectedEdgesType reuses the current selection", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const doc = store.getDocument();
  const [edgeA] = doc.edges;

  store.setSelectedEdges([edgeA.id]);
  store.setSelectedEdgesType("valley");

  const updated = store.getDocument();
  const changedEdge = updated.edges.find((edge) => edge.id === edgeA.id);
  assert.equal(changedEdge.type, "valley");
});

test("deleteEdges removes edges, selection box, and records metadata", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const initialDoc = store.getDocument();
  const [edgeA, edgeB] = initialDoc.edges;

  store.setSelectedEdges([edgeA.id, edgeB.id]);
  store.setSelectionBox({ minX: 0, minY: 0, maxX: 100, maxY: 100 });

  const beforeDeletion = store.getDocument();
  const initialHistoryCount = beforeDeletion.history.length;

  store.deleteEdges([edgeA.id]);

  const after = store.getDocument();
  assert.equal(
    after.edges.some((edge) => edge.id === edgeA.id),
    false,
  );
  assert.equal(after.selection.box, null);
  assert.deepEqual(after.selection.edges, [edgeB.id]);
  assert.equal(after.history.length, initialHistoryCount + 1);

  const lastEntry = after.history.at(-1);
  assert.match(lastEntry.label, /Eliminación/);
  assert.deepEqual(lastEntry.metadata.edges, [edgeA.id]);
  assert.ok(Array.isArray(lastEntry.metadata.removed));
  assert.ok(lastEntry.metadata.removed.some((edge) => edge.id === edgeA.id));
});

test("deleteSelectedEdges removes all selected edges with a single history entry", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const doc = store.getDocument();
  const targets = doc.edges.slice(0, 2).map((edge) => edge.id);
  store.setSelectedEdges(targets);

  const historyBefore = store.getDocument().history.length;

  store.deleteSelectedEdges();

  const after = store.getDocument();
  targets.forEach((id) => {
    assert.equal(
      after.edges.some((edge) => edge.id === id),
      false,
    );
  });
  assert.deepEqual(after.selection.edges, []);
  assert.equal(after.history.length, historyBefore + 1);
});

test("copySelectedEdges stores clipboard metadata and paste duplicates the snapshot", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const doc = store.getDocument();
  const [edgeA, edgeB] = doc.edges;
  store.setSelectedEdges([edgeA.id, edgeB.id]);

  const copied = store.copySelectedEdges();
  assert.equal(copied, 2);

  const clipboard = store.getClipboardSummary();
  assert.equal(clipboard.count, 2);

  const beforePaste = store.getDocument();
  const initialEdgeCount = beforePaste.edges.length;

  const pastedIds = store.pasteClipboard({ offset: { dx: 10, dy: -5 } });
  assert.equal(pastedIds.length, 2);

  const after = store.getDocument();
  assert.equal(after.edges.length, initialEdgeCount + 2);
  assert.deepEqual(after.selection.edges, pastedIds);

  const insertedEdges = pastedIds.map((id) => after.edges.find((edge) => edge.id === id));
  insertedEdges.forEach((edge, index) => {
    const source = index === 0 ? edgeA : edgeB;
    assert.deepEqual(edge.start, {
      x: Number((source.start.x + 10).toFixed(3)),
      y: Number((source.start.y - 5).toFixed(3)),
    });
    assert.deepEqual(edge.end, {
      x: Number((source.end.x + 10).toFixed(3)),
      y: Number((source.end.y - 5).toFixed(3)),
    });
  });

  const lastHistory = after.history.at(-1);
  assert.match(lastHistory.label, /Pegado/);
  assert.deepEqual(lastHistory.metadata.edges, pastedIds);
  assert.deepEqual(lastHistory.metadata.offset, { x: 10, y: -5 });
});

test("cutSelectedEdges removes edges while keeping the clipboard snapshot", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const doc = store.getDocument();
  const target = doc.edges[0];

  store.setSelectedEdges([target.id]);
  const removed = store.cutSelectedEdges();

  assert.equal(removed, 1);
  const after = store.getDocument();
  assert.equal(
    after.edges.some((edge) => edge.id === target.id),
    false,
  );
  assert.deepEqual(after.selection.edges, []);

  const clipboard = store.getClipboardSummary();
  assert.equal(clipboard.count, 1);
});

test("pasteClipboard centers the snapshot around the requested target point", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const doc = store.getDocument();
  const sourceId = doc.edges[0].id;
  store.setSelectedEdges([sourceId]);
  store.copySelectedEdges();

  const pastedIds = store.pasteClipboard({ targetPoint: { x: 50, y: 75 } });
  assert.equal(pastedIds.length, 1);

  const after = store.getDocument();
  const inserted = after.edges.find((edge) => edge.id === pastedIds[0]);
  const bounds = {
    minX: Math.min(inserted.start.x, inserted.end.x),
    maxX: Math.max(inserted.start.x, inserted.end.x),
    minY: Math.min(inserted.start.y, inserted.end.y),
    maxY: Math.max(inserted.start.y, inserted.end.y),
  };

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  assert.ok(Math.abs(centerX - 50) < 0.001);
  assert.ok(Math.abs(centerY - 75) < 0.001);
});

test("importFromOpx replaces the document with parsed edges", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
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

  store.importFromOpx(xml);

  const document = store.getDocument();
  assert.equal(document.edges.length, 2);
  assert.equal(document.edges[0].type, "mountain");
  assert.equal(document.history.length, 1);
  assert.match(document.history[0].label, /importado/);
  assert.deepEqual(document.selection, { edges: [], box: null });
  assert.ok(document.metadata.canvasBounds.width >= 1280);
  assert.ok(document.metadata.canvasBounds.height >= 720);
});

test("exportToOpx serializes the current document", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const document = store.getDocument();
  const xml = store.exportToOpx();
  const parsed = parseOpx(xml);

  assert.equal(parsed.lines.length, document.edges.length);
  assert(parsed.lines.every((line) => typeof line.type === "string"));
});

test("importFromCp loads CP text", () => {
  const store = createDocumentStore();
  const cpSource = `2 0 0 10 0\n3 10 0 10 10\n1 -5 2.5 5 2.5`;

  store.importFromCp(cpSource);

  const document = store.getDocument();
  assert.equal(document.edges.length, 3);
  assert.equal(document.edges[0].type, "mountain");
  assert.equal(document.metadata.source, "cp");
  assert.equal(document.history.length, 1);
  assert.match(document.history[0].label, /\.cp/);
});

test("exportToCp omits auxiliary edges", () => {
  const store = createDocumentStore();
  store.bootstrapEmptyDocument();

  const exported = store.exportToCp();
  const { lines } = parseCp(exported);

  assert(lines.length > 0);
  assert(lines.every((line) => line.type !== "auxiliary"));
});
