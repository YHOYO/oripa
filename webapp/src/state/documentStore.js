import { createObservable } from "./observable.js";
import { createVector2 } from "../core/geometry/vector2.js";
import { createLineSegment, toJSON as segmentToJSON } from "../core/geometry/lineSegment.js";
import { parseOpx, serializeOpx } from "../io/opx.js";
import { parseCp, serializeCp } from "../io/cp.js";

const VALID_EDGE_TYPES = new Set(["mountain", "valley", "border", "auxiliary"]);

function createInitialDocument() {
  const timestamp = new Date().toISOString();
  const edges = createInitialEdges();
  const vertices = extractVertices(edges);

  return {
    id: "untitled-1",
    name: "Untitled crease pattern",
    createdAt: timestamp,
    vertices,
    edges,
    selection: {
      edges: [],
      box: null,
    },
    metadata: {
      unit: "mm",
      author: "",
      canvasBounds: { width: 1280, height: 720 },
    },
    counters: {
      edges: edges.length,
      history: 2,
    },
    history: [
      {
        id: "init",
        label: "Documento inicial",
        timestamp,
      },
      {
        id: "frame",
        label: "Marco base generado",
        timestamp,
      },
    ],
  };
}

function createInitialEdges() {
  const marginX = 200;
  const marginY = 120;
  const width = 880;
  const height = 480;

  const topLeft = createVector2(marginX, marginY);
  const topRight = createVector2(marginX + width, marginY);
  const bottomRight = createVector2(marginX + width, marginY + height);
  const bottomLeft = createVector2(marginX, marginY + height);
  const center = createVector2(marginX + width / 2, marginY + height / 2);

  const segments = [
    { segment: createLineSegment(topLeft, topRight), type: "border" },
    { segment: createLineSegment(topRight, bottomRight), type: "border" },
    { segment: createLineSegment(bottomRight, bottomLeft), type: "border" },
    { segment: createLineSegment(bottomLeft, topLeft), type: "border" },
    { segment: createLineSegment(topLeft, bottomRight), type: "mountain" },
    { segment: createLineSegment(topRight, bottomLeft), type: "valley" },
    { segment: createLineSegment(center, topLeft), type: "auxiliary" },
    { segment: createLineSegment(center, topRight), type: "auxiliary" },
    { segment: createLineSegment(center, bottomRight), type: "auxiliary" },
    { segment: createLineSegment(center, bottomLeft), type: "auxiliary" },
  ];

  return segments.map(({ segment, type }, index) => ({
    id: `edge-${index + 1}`,
    type,
    ...segmentToJSON(segment),
  }));
}

function extractVertices(edges) {
  const map = new Map();
  edges.forEach((edge) => {
    const candidates = [edge.start, edge.end];
    candidates.forEach((point) => {
      const key = `${point.x.toFixed(4)}:${point.y.toFixed(4)}`;
      if (!map.has(key)) {
        map.set(key, { id: `v-${map.size + 1}`, position: { ...point } });
      }
    });
  });
  return Array.from(map.values());
}

export function createDocumentStore() {
  const observable = createObservable();
  let currentDocument = null;
  let edgeCounter = 0;
  let historyCounter = 0;
  let clipboard = createClipboardState();

  function bootstrapEmptyDocument() {
    setDocument(createInitialDocument());
  }

  function getDocument() {
    return currentDocument;
  }

  function setDocument(document) {
    currentDocument = document ?? null;
    updateCountersFromDocument(currentDocument);
    observable.emit(currentDocument);
  }

  function updateCountersFromDocument(document) {
    if (!document) {
      edgeCounter = 0;
      historyCounter = 0;
      return;
    }

    const counters = document.counters ?? {};

    if (Number.isFinite(counters.edges)) {
      edgeCounter = counters.edges;
    } else if (Array.isArray(document.edges)) {
      edgeCounter = document.edges.length;
    } else {
      edgeCounter = 0;
    }

    if (Number.isFinite(counters.history)) {
      historyCounter = counters.history;
    } else if (Array.isArray(document.history)) {
      historyCounter = document.history.length;
    } else {
      historyCounter = 0;
    }
  }

  function applyMutation(mutation) {
    if (typeof mutation !== "function") {
      throw new Error("mutation must be a function");
    }

    const nextDocument = mutation(currentDocument);
    setDocument(nextDocument);
  }

  function importFromOpx(xmlSource) {
    const parsed = parseOpx(xmlSource);
    const document = createDocumentFromImportedLines(parsed?.lines, {
      source: "opx",
      name: parsed?.metadata?.name,
      metadata: {
        unit: parsed?.metadata?.unit,
        author: parsed?.metadata?.author,
      },
    });

    setDocument(document);
  }

  function importFromCp(textSource) {
    const parsed = parseCp(textSource);
    const document = createDocumentFromImportedLines(parsed?.lines, {
      source: "cp",
    });

    setDocument(document);
  }

  function exportToOpx() {
    if (!currentDocument) {
      throw new Error("document must be initialized before exporting");
    }

    const lines = (currentDocument.edges ?? []).map((edge) => ({
      start: edge.start,
      end: edge.end,
      type: edge.type,
    }));

    return serializeOpx({ lines });
  }

  function exportToCp() {
    if (!currentDocument) {
      throw new Error("document must be initialized before exporting");
    }

    return serializeCp({
      lines: currentDocument.edges ?? [],
    });
  }

  function addEdge({ start, end, type = "auxiliary" }) {
    if (!currentDocument) {
      throw new Error("document must be initialized before adding edges");
    }

    if (!isValidPoint(start) || !isValidPoint(end)) {
      throw new Error("edges require valid start and end points");
    }

    const timestamp = new Date().toISOString();
    const newEdge = {
      id: `edge-${edgeCounter + 1}`,
      type,
      start: roundPoint(start),
      end: roundPoint(end),
    };

    applyMutation((doc) => {
      if (!doc) {
        return doc;
      }

      const edges = [...doc.edges, newEdge];
      const vertices = extractVertices(edges);
      const history = [
        ...doc.history,
        {
          id: `history-${historyCounter + 1}`,
          label: `Segmento añadido (${type})`,
          timestamp,
        },
      ];

      return {
        ...doc,
        edges,
        vertices,
        history,
        counters: {
          ...doc.counters,
          edges: Math.max(doc.counters?.edges ?? 0, edges.length),
          history: history.length,
        },
      };
    });
  }

  function setSelectedEdges(edgeIds) {
    if (!currentDocument) {
      throw new Error("document must be initialized before selecting edges");
    }

    const uniqueEdgeIds = normalizeEdgeIds(edgeIds);

    applyMutation((doc) => {
      if (!doc) {
        return doc;
      }

      const previousEdges = doc.selection?.edges ?? [];
      const hasChanged =
        previousEdges.length !== uniqueEdgeIds.length ||
        previousEdges.some((edgeId, index) => edgeId !== uniqueEdgeIds[index]);

      if (!hasChanged) {
        return doc;
      }

      return {
        ...doc,
        selection: {
          box: null,
          edges: uniqueEdgeIds,
        },
      };
    });
  }

  function clearSelection() {
    setSelectedEdges([]);
  }

  function setSelectionBox(box) {
    if (!currentDocument) {
      throw new Error("document must be initialized before updating selection");
    }

    const normalizedBox = normalizeBox(box);

    applyMutation((doc) => {
      if (!doc) {
        return doc;
      }

      const currentBox = doc.selection?.box ?? null;
      const unchanged = boxesAreEqual(currentBox, normalizedBox);

      if (unchanged) {
        return doc;
      }

      return {
        ...doc,
        selection: {
          edges: doc.selection?.edges ?? [],
          box: normalizedBox,
        },
      };
    });
  }

  function translateEdges(edgeIds, delta) {
    if (!currentDocument) {
      throw new Error("document must be initialized before translating edges");
    }

    const normalizedDelta = normalizeDelta(delta);
    if (!normalizedDelta) {
      return;
    }

    const { dx, dy } = normalizedDelta;
    if (dx === 0 && dy === 0) {
      return;
    }
    const targetIds = normalizeEdgeIds(edgeIds);
    if (targetIds.length === 0) {
      return;
    }

    const idSet = new Set(targetIds);

    applyMutation((doc) => {
      if (!doc) {
        return doc;
      }

      let changed = false;

      const edges = (doc.edges ?? []).map((edge) => {
        if (!edge || !idSet.has(edge.id) || !edge.start || !edge.end) {
          return edge;
        }

        changed = true;

        return {
          ...edge,
          start: roundPoint({
            x: edge.start.x + dx,
            y: edge.start.y + dy,
          }),
          end: roundPoint({
            x: edge.end.x + dx,
            y: edge.end.y + dy,
          }),
        };
      });

      if (!changed) {
        return doc;
      }

      const vertices = extractVertices(edges);

      return {
        ...doc,
        edges,
        vertices,
      };
    });
  }

  function scaleEdges(edgeIds, options) {
    if (!currentDocument) {
      throw new Error("document must be initialized before scaling edges");
    }

    const normalized = normalizeScaleOptions(options);
    if (!normalized) {
      return;
    }

    const { pivot, scale, basePositions } = normalized;
    const targetIds = normalizeEdgeIds(edgeIds);
    if (targetIds.length === 0) {
      return;
    }

    const idSet = new Set(targetIds);

    applyMutation((doc) => {
      if (!doc) {
        return doc;
      }

      let changed = false;

      const edges = (doc.edges ?? []).map((edge) => {
        if (!edge || !idSet.has(edge.id) || !edge.start || !edge.end) {
          return edge;
        }

        const source = basePositions?.get(edge.id) ?? edge;
        if (!source.start || !source.end) {
          return edge;
        }

        const scaledStart = roundPoint({
          x: pivot.x + (source.start.x - pivot.x) * scale,
          y: pivot.y + (source.start.y - pivot.y) * scale,
        });
        const scaledEnd = roundPoint({
          x: pivot.x + (source.end.x - pivot.x) * scale,
          y: pivot.y + (source.end.y - pivot.y) * scale,
        });

        if (
          scaledStart.x === edge.start.x &&
          scaledStart.y === edge.start.y &&
          scaledEnd.x === edge.end.x &&
          scaledEnd.y === edge.end.y
        ) {
          return edge;
        }

        changed = true;

        return {
          ...edge,
          start: scaledStart,
          end: scaledEnd,
        };
      });

      if (!changed) {
        return doc;
      }

      const vertices = extractVertices(edges);

      return {
        ...doc,
        edges,
        vertices,
      };
    });
  }

  function deleteEdges(edgeIds) {
    if (!currentDocument) {
      throw new Error("document must be initialized before deleting edges");
    }

    const targetIds = normalizeEdgeIds(edgeIds);
    if (targetIds.length === 0) {
      return;
    }

    const timestamp = new Date().toISOString();
    const idSet = new Set(targetIds);

    applyMutation((doc) => {
      if (!doc) {
        return doc;
      }

      const sourceEdges = doc.edges ?? [];
      const remainingEdges = [];
      const removedEdges = [];

      sourceEdges.forEach((edge) => {
        if (edge && idSet.has(edge.id)) {
          removedEdges.push(edge);
        } else {
          remainingEdges.push(edge);
        }
      });

      if (removedEdges.length === 0) {
        return doc;
      }

      const vertices = extractVertices(remainingEdges);
      const remainingSelection = (doc.selection?.edges ?? []).filter(
        (edgeId) => edgeId && !idSet.has(edgeId),
      );

      const history = [
        ...doc.history,
        {
          id: `history-${historyCounter + 1}`,
          label: `Eliminación (${removedEdges.length} segmento${
            removedEdges.length === 1 ? "" : "s"
          })`,
          timestamp,
          metadata: {
            edges: removedEdges.map((edge) => edge.id),
            removed: removedEdges.map((edge) => ({
              id: edge.id,
              type: edge.type ?? "auxiliary",
              start: edge.start ? { ...edge.start } : null,
              end: edge.end ? { ...edge.end } : null,
            })),
          },
        },
      ];

      return {
        ...doc,
        edges: remainingEdges,
        vertices,
        selection: {
          edges: remainingSelection,
          box: null,
        },
        history,
        counters: {
          ...(doc.counters ?? {}),
          edges: Math.max(doc.counters?.edges ?? 0, remainingEdges.length),
          history: history.length,
        },
      };
    });
  }

  function deleteSelectedEdges() {
    if (!currentDocument) {
      throw new Error("document must be initialized before deleting the selection");
    }

    const selected = currentDocument.selection?.edges ?? [];
    deleteEdges(selected);
  }

  function setEdgeType(edgeIds, type) {
    if (!currentDocument) {
      throw new Error("document must be initialized before updating edge types");
    }

    const normalizedType = normalizeEdgeType(type);
    if (!normalizedType) {
      return;
    }

    const targetIds = normalizeEdgeIds(edgeIds);
    if (targetIds.length === 0) {
      return;
    }

    const idSet = new Set(targetIds);
    const timestamp = new Date().toISOString();

    applyMutation((doc) => {
      if (!doc) {
        return doc;
      }

      let changedCount = 0;

      const edges = (doc.edges ?? []).map((edge) => {
        if (!edge || !idSet.has(edge.id)) {
          return edge;
        }

        if (edge.type === normalizedType) {
          return edge;
        }

        changedCount += 1;
        return {
          ...edge,
          type: normalizedType,
        };
      });

      if (changedCount === 0) {
        return doc;
      }

      const history = [
        ...doc.history,
        {
          id: `history-${historyCounter + 1}`,
          label: `Tipo actualizado (${changedCount} segmento${changedCount === 1 ? "" : "s"})`,
          timestamp,
          metadata: {
            type: normalizedType,
            edges: targetIds,
          },
        },
      ];

      return {
        ...doc,
        edges,
        history,
        counters: {
          ...(doc.counters ?? {}),
          history: history.length,
        },
      };
    });
  }

  function setSelectedEdgesType(type) {
    if (!currentDocument) {
      throw new Error("document must be initialized before updating selected edge types");
    }

    const selected = currentDocument.selection?.edges ?? [];
    setEdgeType(selected, type);
  }

  function recordEdgeTranslation(edgeIds, delta) {
    if (!currentDocument) {
      throw new Error("document must be initialized before logging translations");
    }

    const normalizedDelta = normalizeDelta(delta);
    if (!normalizedDelta) {
      return;
    }

    const magnitude = Math.hypot(normalizedDelta.dx, normalizedDelta.dy);
    if (magnitude === 0) {
      return;
    }

    const targetIds = normalizeEdgeIds(edgeIds);
    if (targetIds.length === 0) {
      return;
    }

    const timestamp = new Date().toISOString();

    applyMutation((doc) => {
      if (!doc) {
        return doc;
      }

      const history = [
        ...doc.history,
        {
          id: `history-${historyCounter + 1}`,
          label: `Movimiento (${targetIds.length} segmento${targetIds.length === 1 ? "" : "s"})`,
          timestamp,
          metadata: {
            delta: {
              x: Number(normalizedDelta.dx.toFixed(3)),
              y: Number(normalizedDelta.dy.toFixed(3)),
            },
            edges: targetIds,
          },
        },
      ];

      return {
        ...doc,
        history,
        counters: {
          ...(doc.counters ?? {}),
          history: history.length,
        },
      };
    });
  }

  function recordEdgeScaling(edgeIds, options) {
    if (!currentDocument) {
      throw new Error("document must be initialized before logging scaling operations");
    }

    const targetIds = normalizeEdgeIds(edgeIds);
    if (targetIds.length === 0) {
      return;
    }

    const pivot = isValidPoint(options?.pivot) ? roundPoint(options.pivot) : null;
    const scale = Number(options?.scale ?? 1);
    if (!Number.isFinite(scale) || scale <= 0 || scale === 1) {
      return;
    }

    const timestamp = new Date().toISOString();
    const roundedScale = Number(scale.toFixed(3));

    applyMutation((doc) => {
      if (!doc) {
        return doc;
      }

      const history = [
        ...doc.history,
        {
          id: `history-${historyCounter + 1}`,
          label: `Escalado (${targetIds.length} segmento${targetIds.length === 1 ? "" : "s"})`,
          timestamp,
          metadata: {
            scale: roundedScale,
            edges: targetIds,
            ...(pivot
              ? {
                  pivot,
                }
              : {}),
          },
        },
      ];

      return {
        ...doc,
        history,
        counters: {
          ...(doc.counters ?? {}),
          history: history.length,
        },
      };
    });
  }

  function copyEdges(edgeIds) {
    if (!currentDocument) {
      throw new Error("document must be initialized before copying");
    }

    const targetIds = normalizeEdgeIds(edgeIds);
    if (targetIds.length === 0) {
      return 0;
    }

    const edgesById = new Map((currentDocument.edges ?? []).map((edge) => [edge.id, edge]));
    const snapshot = targetIds
      .map((edgeId) => edgesById.get(edgeId))
      .filter((edge) => edge && edge.start && edge.end)
      .map((edge) => ({
        id: edge.id,
        type: edge.type ?? "auxiliary",
        start: { ...edge.start },
        end: { ...edge.end },
      }));

    if (snapshot.length === 0) {
      return 0;
    }

    const bounds = calculateBounds(snapshot);
    clipboard = {
      edges: snapshot,
      bounds,
      centroid: bounds ? calculateCentroid(bounds) : null,
      updatedAt: new Date().toISOString(),
      offsetCount: 0,
    };

    return snapshot.length;
  }

  function cutEdges(edgeIds) {
    if (!currentDocument) {
      throw new Error("document must be initialized before cutting");
    }

    const copied = copyEdges(edgeIds);
    if (copied === 0) {
      return 0;
    }

    deleteEdges(edgeIds);
    return copied;
  }

  function copySelectedEdges() {
    if (!currentDocument) {
      throw new Error("document must be initialized before copying the selection");
    }

    const selected = currentDocument.selection?.edges ?? [];
    return copyEdges(selected);
  }

  function cutSelectedEdges() {
    if (!currentDocument) {
      throw new Error("document must be initialized before cutting the selection");
    }

    const selected = currentDocument.selection?.edges ?? [];
    return cutEdges(selected);
  }

  function pasteClipboard(options = {}) {
    if (!currentDocument) {
      throw new Error("document must be initialized before pasting");
    }

    if (!clipboard?.edges || clipboard.edges.length === 0) {
      return [];
    }

    const offset = determinePasteOffset(options, clipboard);
    const dx = Number((offset.dx ?? 0).toFixed(3));
    const dy = Number((offset.dy ?? 0).toFixed(3));

    const timestamp = new Date().toISOString();
    const baseEdgeCounter = edgeCounter;

    const newEdges = clipboard.edges.map((edge, index) => ({
      id: `edge-${baseEdgeCounter + index + 1}`,
      type: edge.type ?? "auxiliary",
      start: roundPoint({
        x: edge.start.x + dx,
        y: edge.start.y + dy,
      }),
      end: roundPoint({
        x: edge.end.x + dx,
        y: edge.end.y + dy,
      }),
    }));

    const newEdgeIds = newEdges.map((edge) => edge.id);

    applyMutation((doc) => {
      if (!doc) {
        return doc;
      }

      const edges = [...(doc.edges ?? []), ...newEdges];
      const vertices = extractVertices(edges);
      const history = [
        ...doc.history,
        {
          id: `history-${historyCounter + 1}`,
          label: `Pegado (${newEdges.length} segmento${newEdges.length === 1 ? "" : "s"})`,
          timestamp,
          metadata: {
            edges: newEdgeIds,
            offset: { x: dx, y: dy },
          },
        },
      ];

      return {
        ...doc,
        edges,
        vertices,
        selection: {
          edges: newEdgeIds,
          box: null,
        },
        history,
        counters: {
          ...(doc.counters ?? {}),
          edges: Math.max(doc.counters?.edges ?? 0, edges.length),
          history: history.length,
        },
      };
    });

    clipboard = {
      ...clipboard,
      offsetCount: (clipboard?.offsetCount ?? 0) + 1,
    };

    return newEdgeIds;
  }

  function getClipboardSummary() {
    return {
      count: clipboard?.edges?.length ?? 0,
      updatedAt: clipboard?.updatedAt ?? null,
      bounds: clipboard?.bounds ?? null,
    };
  }

  return {
    subscribe: observable.subscribe,
    bootstrapEmptyDocument,
    getDocument,
    setDocument,
    importFromOpx,
    exportToOpx,
    importFromCp,
    exportToCp,
    applyMutation,
    addEdge,
    setSelectedEdges,
    clearSelection,
    setSelectionBox,
    translateEdges,
    recordEdgeTranslation,
    scaleEdges,
    recordEdgeScaling,
    deleteEdges,
    deleteSelectedEdges,
    setEdgeType,
    setSelectedEdgesType,
    copyEdges,
    cutEdges,
    copySelectedEdges,
    cutSelectedEdges,
    pasteClipboard,
    getClipboardSummary,
  };
}

function createDocumentFromImportedLines(lines, options = {}) {
  const timestamp = new Date().toISOString();
  const normalizedLines = Array.isArray(lines) ? lines : [];
  const edges = normalizedLines
    .map((line, index) => {
      const startCandidate = line?.start ?? {};
      const endCandidate = line?.end ?? {};

      if (!isValidPoint(startCandidate) || !isValidPoint(endCandidate)) {
        return null;
      }

      const normalizedType = normalizeEdgeType(line?.type) ?? "auxiliary";

      return {
        id: `edge-${index + 1}`,
        type: normalizedType,
        start: roundPoint(startCandidate),
        end: roundPoint(endCandidate),
      };
    })
    .filter(Boolean);

  const vertices = extractVertices(edges);
  const bounds = calculateBounds(edges);

  const normalizedSource =
    typeof options.source === "string" && options.source.length > 0
      ? options.source.toLowerCase()
      : "external";

  const labelSuffix = normalizedSource === "external" ? "" : ` (.${normalizedSource})`;
  const metadata = options.metadata ?? {};
  const unit = typeof metadata.unit === "string" && metadata.unit.length > 0 ? metadata.unit : "mm";
  const author = typeof metadata.author === "string" ? metadata.author : "";
  const nameCandidate =
    typeof options.name === "string" && options.name.trim().length > 0
      ? options.name.trim()
      : "Imported crease pattern";

  const canvasBounds = bounds
    ? {
        width: Math.max(1280, Math.ceil(bounds.maxX - bounds.minX + 40)),
        height: Math.max(720, Math.ceil(bounds.maxY - bounds.minY + 40)),
      }
    : { width: 1280, height: 720 };

  return {
    id: `import-${timestamp}`,
    name: nameCandidate,
    createdAt: timestamp,
    updatedAt: timestamp,
    edges,
    vertices,
    selection: { edges: [], box: null },
    metadata: {
      unit,
      author,
      source: normalizedSource,
      ...(bounds ? { bounds } : {}),
      canvasBounds,
    },
    counters: {
      edges: edges.length,
      history: 1,
    },
    history: [
      {
        id: "history-1",
        label: `Patrón importado${labelSuffix}`,
        timestamp,
        metadata: {
          source: normalizedSource,
          lines: edges.length,
        },
      },
    ],
  };
}

function isValidPoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function roundPoint(point) {
  return {
    x: Number(point.x.toFixed(3)),
    y: Number(point.y.toFixed(3)),
  };
}

function calculateBounds(edges) {
  if (!Array.isArray(edges) || edges.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  edges.forEach((edge) => {
    const points = [edge?.start, edge?.end];
    points.forEach((point) => {
      if (!isValidPoint(point)) {
        return;
      }

      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });
  });

  if (![minX, minY, maxX, maxY].every(Number.isFinite)) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function normalizeBox(box) {
  if (!box) {
    return null;
  }

  const { minX, minY, maxX, maxY } = box;
  if (![minX, minY, maxX, maxY].every(Number.isFinite)) {
    return null;
  }

  const normalizedMinX = Math.min(minX, maxX);
  const normalizedMaxX = Math.max(minX, maxX);
  const normalizedMinY = Math.min(minY, maxY);
  const normalizedMaxY = Math.max(minY, maxY);

  return {
    minX: normalizedMinX,
    minY: normalizedMinY,
    maxX: normalizedMaxX,
    maxY: normalizedMaxY,
  };
}

function boxesAreEqual(a, b) {
  if (a === b) {
    return true;
  }

  if (!a || !b) {
    return false;
  }

  return a.minX === b.minX && a.minY === b.minY && a.maxX === b.maxX && a.maxY === b.maxY;
}

function normalizeDelta(delta) {
  if (!delta) {
    return null;
  }

  const dx = Number(delta.dx ?? delta.x ?? 0);
  const dy = Number(delta.dy ?? delta.y ?? 0);

  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    return null;
  }

  if (dx === 0 && dy === 0) {
    return { dx: 0, dy: 0 };
  }

  return { dx, dy };
}

function normalizeEdgeIds(edgeIds) {
  return Array.from(
    new Set((edgeIds ?? []).filter((id) => typeof id === "string" && id.length > 0)),
  );
}

function normalizeScaleOptions(options) {
  if (!options) {
    return null;
  }

  const pivot = options.pivot;
  if (!isValidPoint(pivot)) {
    return null;
  }

  const scale = Number(options.scale);
  if (!Number.isFinite(scale) || scale <= 0) {
    return null;
  }

  const basePositions = normalizeBasePositions(options.basePositions);

  return {
    pivot: { x: Number(pivot.x), y: Number(pivot.y) },
    scale,
    basePositions,
  };
}

function normalizeBasePositions(basePositions) {
  if (!basePositions) {
    return null;
  }

  const result = new Map();
  const entries =
    basePositions instanceof Map
      ? Array.from(basePositions.entries())
      : Object.entries(basePositions);

  entries.forEach(([edgeId, value]) => {
    if (!value || typeof edgeId !== "string" || edgeId.length === 0) {
      return;
    }

    const { start, end } = value;
    if (!isValidPoint(start) || !isValidPoint(end)) {
      return;
    }

    result.set(edgeId, {
      start: { x: Number(start.x), y: Number(start.y) },
      end: { x: Number(end.x), y: Number(end.y) },
    });
  });

  return result.size > 0 ? result : null;
}

function normalizeEdgeType(type) {
  if (typeof type !== "string") {
    return null;
  }

  const normalized = type.toLowerCase();
  if (!VALID_EDGE_TYPES.has(normalized)) {
    return null;
  }

  return normalized;
}

function createClipboardState() {
  return {
    edges: [],
    bounds: null,
    centroid: null,
    updatedAt: null,
    offsetCount: 0,
  };
}

function determinePasteOffset(options, clipboardState) {
  const normalizedOffset = normalizeDelta(options?.offset ?? options?.delta);
  if (normalizedOffset) {
    return normalizedOffset;
  }

  const targetPoint = options?.targetPoint ?? options?.target ?? options?.point;
  if (isValidPoint(targetPoint) && clipboardState?.centroid) {
    return {
      dx: targetPoint.x - clipboardState.centroid.x,
      dy: targetPoint.y - clipboardState.centroid.y,
    };
  }

  const step = 20;
  const multiplier = (clipboardState?.offsetCount ?? 0) + 1;
  return { dx: step * multiplier, dy: step * multiplier };
}

function calculateCentroid(bounds) {
  if (!bounds) {
    return null;
  }

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  return { x: centerX, y: centerY };
}
