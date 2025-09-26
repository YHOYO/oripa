import test from "node:test";
import assert from "node:assert/strict";

import { createSymmetryTool } from "../symmetryTool.js";

function createDocumentStoreMock() {
  const edges = [
    {
      id: "edge-1",
      type: "mountain",
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

test("selecting an axis edge does not emit mirrored segments", () => {
  const documentStore = createDocumentStoreMock();
  const tool = createSymmetryTool({ documentStore });

  tool.activate?.();

  tool.onPointerDown({ point: { x: 10, y: 0.2 } });
  tool.onPointerUp({ point: { x: 10, y: 0.2 } });

  assert.equal(documentStore.addedEdges.length, 0);
});

test("dragging after picking an axis creates a mirrored segment", () => {
  const documentStore = createDocumentStoreMock();
  const tool = createSymmetryTool({ documentStore });

  tool.activate?.();

  tool.onPointerDown({ point: { x: 20, y: 0 } });
  tool.onPointerUp({ point: { x: 20, y: 0 } });

  tool.onPointerDown({ point: { x: 20, y: 10 } });
  tool.onPointerUp({ point: { x: 50, y: 30 } });

  assert.equal(documentStore.addedEdges.length, 1);

  const [edge] = documentStore.addedEdges;
  assert.deepEqual(edge.start, { x: 20, y: -10 });
  assert.deepEqual(edge.end, { x: 50, y: -30 });
  assert.equal(edge.type, "mountain");
});
