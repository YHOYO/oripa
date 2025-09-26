import test from "node:test";
import assert from "node:assert/strict";

import { createBisectorTool } from "../bisectorTool.js";

function createDocumentStoreMock() {
  const edges = [
    {
      id: "edge-1",
      type: "mountain",
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
    },
    {
      id: "edge-2",
      type: "mountain",
      start: { x: 0, y: 0 },
      end: { x: 0, y: 100 },
    },
  ];

  const addedEdges = [];

  return {
    getDocument() {
      return { edges };
    },
    addEdge(edge) {
      addedEdges.push(edge);
    },
    get addedEdges() {
      return addedEdges;
    },
  };
}

test("selecting two edges configures the bisector without creating segments", () => {
  const documentStore = createDocumentStoreMock();
  const tool = createBisectorTool({ documentStore });

  tool.activate?.();

  // Select the first edge.
  tool.onPointerDown({ point: { x: 60, y: 1 } });
  tool.onPointerUp({ point: { x: 60, y: 1 } });

  // Select the second edge.
  tool.onPointerDown({ point: { x: 1, y: 60 } });
  tool.onPointerUp({ point: { x: 1, y: 60 } });

  assert.equal(documentStore.addedEdges.length, 0);
});

test("dragging after selecting two edges creates an angle bisector", () => {
  const documentStore = createDocumentStoreMock();
  const tool = createBisectorTool({ documentStore });

  tool.activate?.();

  // Select the reference edges.
  tool.onPointerDown({ point: { x: 60, y: 1 } });
  tool.onPointerUp({ point: { x: 60, y: 1 } });
  tool.onPointerDown({ point: { x: 1, y: 60 } });
  tool.onPointerUp({ point: { x: 1, y: 60 } });

  // Drag to define the segment length.
  tool.onPointerDown({ point: { x: 0, y: 0 } });
  tool.onPointerUp({ point: { x: 50, y: 50 } });

  assert.equal(documentStore.addedEdges.length, 1);

  const [edge] = documentStore.addedEdges;
  assert.deepEqual(edge.start, { x: 0, y: 0 });
  assert.equal(edge.type, "mountain");
  assert.ok(Math.abs(edge.end.x - 50) < 1e-6);
  assert.ok(Math.abs(edge.end.y - 50) < 1e-6);
});
