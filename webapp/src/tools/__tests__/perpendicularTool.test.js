import test from "node:test";
import assert from "node:assert/strict";

import { createPerpendicularTool } from "../perpendicularTool.js";

function createDocumentStoreMock() {
  const edges = [
    {
      id: "edge-1",
      type: "valley",
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
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

test("selecting a base edge does not create new segments", () => {
  const documentStore = createDocumentStoreMock();
  const tool = createPerpendicularTool({ documentStore });

  tool.activate?.();

  tool.onPointerDown({ point: { x: 25, y: 0.2 } });
  tool.onPointerUp({ point: { x: 25, y: 0.2 } });

  assert.equal(documentStore.addedEdges.length, 0);
});

test("dragging after selecting a base edge creates a perpendicular segment", () => {
  const documentStore = createDocumentStoreMock();
  const tool = createPerpendicularTool({ documentStore });

  tool.activate?.();

  // First click selects the base edge.
  tool.onPointerDown({ point: { x: 60, y: 0.1 } });
  tool.onPointerUp({ point: { x: 60, y: 0.1 } });

  // Second drag emits a perpendicular line.
  tool.onPointerDown({ point: { x: 60, y: 0 } });
  tool.onPointerUp({ point: { x: 60, y: 40 } });

  assert.equal(documentStore.addedEdges.length, 1);

  const [edge] = documentStore.addedEdges;
  assert.deepEqual(edge.start, { x: 60, y: 0 });
  assert.deepEqual(edge.end, { x: 60, y: 40 });
  assert.equal(edge.type, "valley");
});
