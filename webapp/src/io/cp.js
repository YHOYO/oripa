const TYPE_CODE_TO_EDGE = new Map([
  [0, "auxiliary"],
  [1, "border"],
  [2, "mountain"],
  [3, "valley"],
]);

const EDGE_TYPE_TO_CODE = new Map([
  ["border", 1],
  ["mountain", 2],
  ["valley", 3],
]);

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function toNumber(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function normalizeEdgeType(typeCode) {
  if (!Number.isFinite(typeCode)) {
    return "auxiliary";
  }

  return TYPE_CODE_TO_EDGE.get(typeCode) ?? "auxiliary";
}

function parseLine(line) {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    return null;
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 5) {
    return null;
  }

  const typeToken = Number.parseInt(tokens[0], 10);
  const x0 = toNumber(tokens[1]);
  const y0 = toNumber(tokens[2]);
  const x1 = toNumber(tokens[3]);
  const y1 = toNumber(tokens[4]);

  if (![x0, y0, x1, y1].every(isFiniteNumber)) {
    return null;
  }

  return {
    type: normalizeEdgeType(typeToken),
    start: { x: x0, y: y0 },
    end: { x: x1, y: y1 },
  };
}

export function parseCp(source) {
  if (typeof source !== "string") {
    throw new TypeError("parseCp espera una cadena de texto");
  }

  const lines = source.split(/\r?\n/).map(parseLine).filter(Boolean);

  return { lines };
}

function formatNumber(value) {
  return Number(value).toString();
}

function serializeLine(line) {
  if (!line) {
    return null;
  }

  const typeCode = EDGE_TYPE_TO_CODE.get((line.type ?? "").toLowerCase());
  const start = line.start ?? {};
  const end = line.end ?? {};

  if (!Number.isFinite(typeCode)) {
    return null;
  }

  const coordinates = [start.x, start.y, end.x, end.y].map(toNumber);
  if (!coordinates.every(isFiniteNumber)) {
    return null;
  }

  return [typeCode, ...coordinates.map(formatNumber)].join(" ");
}

export function serializeCp({ lines } = {}) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return "";
  }

  return lines
    .map(serializeLine)
    .filter((entry) => typeof entry === "string" && entry.length > 0)
    .join("\n");
}
