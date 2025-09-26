const EDGE_ASSIGNMENTS = {
  mountain: "M",
  valley: "V",
  border: "B",
  auxiliary: "U",
};

const EDGE_FOLD_ANGLES = {
  mountain: -180,
  valley: 180,
  border: 0,
  auxiliary: 0,
};

const UNIT_MAPPINGS = {
  mm: "millimeter",
  millimeter: "millimeter",
  millimeters: "millimeter",
  cm: "centimeter",
  centimeter: "centimeter",
  centimeters: "centimeter",
  in: "inch",
  inch: "inch",
  inches: "inch",
};

export function serializeFold({ lines, metadata } = {}) {
  const safeLines = Array.isArray(lines) ? lines : [];
  const vertices = [];
  const vertexLookup = new Map();
  const edgesVertices = [];
  const edgesAssignment = [];
  const edgesFoldAngle = [];
  const edgesLength = [];

  safeLines.forEach((line) => {
    const start = normalizePoint(line?.start);
    const end = normalizePoint(line?.end);

    if (!start || !end) {
      return;
    }

    const type = normalizeEdgeType(line?.type);
    const startIndex = getVertexIndex(start, vertices, vertexLookup);
    const endIndex = getVertexIndex(end, vertices, vertexLookup);

    edgesVertices.push([startIndex, endIndex]);
    edgesAssignment.push(EDGE_ASSIGNMENTS[type]);
    edgesFoldAngle.push(EDGE_FOLD_ANGLES[type]);
    edgesLength.push(formatNumber(Math.hypot(end.x - start.x, end.y - start.y)));
  });

  const title = normalizeTitle(metadata?.name);
  const author = normalizeAuthor(metadata?.author);
  const unit = normalizeUnit(metadata?.unit);
  const timestamp = normalizeTimestamp(metadata?.updatedAt);

  const foldDocument = {
    file_spec: 1.1,
    file_creator: "ORIPA Web Prototype",
    file_classes: ["singleModel"],
    frame_title: title,
    frame_unit: unit,
    file_title: title,
    file_created: timestamp,
    vertices_coords: vertices,
    edges_vertices: edgesVertices,
    edges_assignment: edgesAssignment,
  };

  if (author) {
    foldDocument.file_author = author;
  }

  if (edgesFoldAngle.length > 0) {
    foldDocument.edges_foldAngle = edgesFoldAngle;
  }

  if (edgesLength.length > 0) {
    foldDocument.edges_length = edgesLength;
  }

  return JSON.stringify(foldDocument, null, 2);
}

function normalizePoint(point) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    return null;
  }

  return {
    x: formatNumber(point.x),
    y: formatNumber(point.y),
  };
}

function normalizeEdgeType(type) {
  const normalized = typeof type === "string" ? type.toLowerCase() : "";
  return EDGE_ASSIGNMENTS[normalized] ? normalized : "auxiliary";
}

function getVertexIndex(point, vertices, lookup) {
  const key = `${point.x.toFixed(6)}:${point.y.toFixed(6)}`;
  if (lookup.has(key)) {
    return lookup.get(key);
  }

  const index = vertices.length;
  vertices.push([point.x, point.y]);
  lookup.set(key, index);
  return index;
}

function normalizeTitle(value) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return "Crease Pattern";
}

function normalizeAuthor(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function normalizeUnit(value) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (UNIT_MAPPINGS[normalized]) {
      return UNIT_MAPPINGS[normalized];
    }
  }
  return "unit";
}

function normalizeTimestamp(value) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return new Date().toISOString();
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const rounded = Math.abs(value) < 1e-9 ? 0 : value;
  return Number(rounded.toFixed(6));
}
