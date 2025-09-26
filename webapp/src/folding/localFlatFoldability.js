import { subtract, lengthSquared } from "../core/geometry/vector2.js";

const EPSILON = 1e-6;
const TAU = Math.PI * 2;
const CREASE_TYPES = new Set(["mountain", "valley"]);

function isValidPoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function normalizeAngle(radians) {
  const normalized = radians % TAU;
  return normalized < 0 ? normalized + TAU : normalized;
}

function keyFromPoint(point) {
  return `${point.x.toFixed(4)}:${point.y.toFixed(4)}`;
}

function normalizeEdgeType(type) {
  if (type === "mountain" || type === "valley") {
    return type;
  }
  if (type === "border") {
    return "border";
  }
  return "auxiliary";
}

function ensureVertexEntry(map, key, point) {
  if (map.has(key)) {
    return map.get(key);
  }

  const entry = {
    id: key,
    position: { x: point.x, y: point.y },
    incident: [],
  };
  map.set(key, entry);
  return entry;
}

function computeSectors(sortedAngles) {
  const sectors = [];
  const count = sortedAngles.length;
  for (let index = 0; index < count; index += 1) {
    const current = sortedAngles[index];
    const next = sortedAngles[(index + 1) % count];
    let delta = next.angle - current.angle;
    if (delta <= 0) {
      delta += TAU;
    }
    sectors.push(delta);
  }
  return sectors;
}

function computeKawasaki(sectors) {
  const count = sectors.length;
  const applicable = count >= 4 && count % 2 === 0;
  if (!applicable) {
    return { applicable: false, deviation: null, satisfied: false };
  }

  let evenSum = 0;
  let oddSum = 0;
  for (let index = 0; index < count; index += 1) {
    if (index % 2 === 0) {
      evenSum += sectors[index];
    } else {
      oddSum += sectors[index];
    }
  }

  const deviation = Math.abs(evenSum - oddSum);
  return { applicable: true, deviation, satisfied: deviation <= EPSILON };
}

function computeMaekawa(incident) {
  const creaseIncidents = incident.filter((item) => CREASE_TYPES.has(item.type));
  const mountainCount = creaseIncidents.filter((item) => item.type === "mountain").length;
  const valleyCount = creaseIncidents.filter((item) => item.type === "valley").length;
  const count = creaseIncidents.length;
  const applicable = count >= 4 && count % 2 === 0;

  if (!applicable) {
    return {
      applicable: false,
      deviation: null,
      satisfied: false,
      mountainCount,
      valleyCount,
    };
  }

  const deviation = Math.abs(Math.abs(mountainCount - valleyCount) - 2);
  return {
    applicable: true,
    deviation,
    satisfied: deviation <= EPSILON,
    mountainCount,
    valleyCount,
  };
}

export function analyzeLocalFlatFoldability({ vertices = [], edges = [] } = {}) {
  const vertexMap = new Map();

  vertices.forEach((vertex) => {
    if (!isValidPoint(vertex?.position)) {
      return;
    }
    const key = keyFromPoint(vertex.position);
    vertexMap.set(key, {
      id: vertex.id ?? key,
      position: { x: vertex.position.x, y: vertex.position.y },
      incident: [],
    });
  });

  edges.forEach((edge) => {
    if (!isValidPoint(edge?.start) || !isValidPoint(edge?.end)) {
      return;
    }

    const startKey = keyFromPoint(edge.start);
    const endKey = keyFromPoint(edge.end);
    const type = normalizeEdgeType(edge?.type);
    const vectorToEnd = subtract(edge.end, edge.start);
    const vectorToStart = subtract(edge.start, edge.end);

    const vectorToEndLength = lengthSquared(vectorToEnd);
    if (vectorToEndLength > EPSILON) {
      const startEntry = ensureVertexEntry(vertexMap, startKey, edge.start);
      startEntry.incident.push({
        angle: normalizeAngle(Math.atan2(vectorToEnd.y, vectorToEnd.x)),
        type,
        edgeId: edge.id ?? null,
      });
    }

    const vectorToStartLength = lengthSquared(vectorToStart);
    if (vectorToStartLength > EPSILON) {
      const endEntry = ensureVertexEntry(vertexMap, endKey, edge.end);
      endEntry.incident.push({
        angle: normalizeAngle(Math.atan2(vectorToStart.y, vectorToStart.x)),
        type,
        edgeId: edge.id ?? null,
      });
    }
  });

  const reports = [];
  vertexMap.forEach((entry) => {
    const { incident } = entry;
    const usable = incident.filter((item, index, array) => {
      if (!Number.isFinite(item.angle)) {
        return false;
      }
      return (
        array.findIndex((candidate) => Math.abs(candidate.angle - item.angle) <= EPSILON) === index
      );
    });

    if (usable.length < 2) {
      return;
    }

    usable.sort((a, b) => a.angle - b.angle);
    const sectors = computeSectors(usable);
    const kawasaki = computeKawasaki(sectors);
    const maekawa = computeMaekawa(usable);

    reports.push({
      vertexId: entry.id,
      position: entry.position,
      degree: usable.length,
      sectors,
      kawasaki,
      maekawa,
    });
  });

  reports.sort((a, b) => {
    if (a.vertexId < b.vertexId) return -1;
    if (a.vertexId > b.vertexId) return 1;
    return 0;
  });

  return reports;
}
