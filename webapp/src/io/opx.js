const EDGE_TYPE_FROM_OPX = {
  0: "auxiliary",
  1: "border",
  2: "mountain",
  3: "valley",
  4: "auxiliary",
  9: "border",
};

const EDGE_TYPE_TO_OPX = {
  auxiliary: 0,
  border: 1,
  mountain: 2,
  valley: 3,
};

export function parseOpx(xmlSource) {
  if (typeof xmlSource !== "string") {
    throw new TypeError("OPX source must be a string");
  }

  const trimmed = xmlSource.trim();
  if (trimmed.length === 0) {
    return { lines: [], metadata: {} };
  }

  const linesSectionMatch = trimmed.match(
    /<void\s+property="lines">[\s\S]*?<array\s+class="oripa\.OriLineProxy"[^>]*>([\s\S]*?)<\/array>[\s\S]*?<\/void>/i,
  );

  if (!linesSectionMatch) {
    return { lines: [], metadata: {} };
  }

  const linesSection = linesSectionMatch[1];
  const objectPattern = /<object\s+class="oripa\.OriLineProxy">([\s\S]*?)<\/object>/gi;
  const matches = Array.from(linesSection.matchAll(objectPattern));

  const lines = matches
    .map((match) => {
      const body = match[1];
      const typeValue = readNumericProperty(body, "type");
      const x0 = readNumericProperty(body, "x0");
      const y0 = readNumericProperty(body, "y0");
      const x1 = readNumericProperty(body, "x1");
      const y1 = readNumericProperty(body, "y1");

      if ([typeValue, x0, y0, x1, y1].some((value) => value === null)) {
        return null;
      }

      const type = EDGE_TYPE_FROM_OPX[typeValue] ?? "auxiliary";

      return {
        start: { x: x0, y: y0 },
        end: { x: x1, y: y1 },
        type,
      };
    })
    .filter(Boolean);

  return { lines, metadata: {} };
}

export function serializeOpx({ lines } = {}) {
  const safeLines = Array.isArray(lines) ? lines : [];
  const length = safeLines.length;
  const header =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<java version="1.8.0" class="java.beans.XMLDecoder">\n' +
    ' <object class="oripa.DataSet">\n' +
    '  <void property="lines">\n' +
    `   <array class="oripa.OriLineProxy" length="${length}">\n`;

  const body = safeLines.map((line, index) => serializeLine(line, index)).join("");

  const footer = "   </array>\n" + "  </void>\n" + " </object>\n" + "</java>\n";

  return header + body + footer;
}

function serializeLine(line, index) {
  const start = line?.start ?? {};
  const end = line?.end ?? {};
  const type = typeof line?.type === "string" ? line.type.toLowerCase() : "auxiliary";
  const typeCode = EDGE_TYPE_TO_OPX[type] ?? EDGE_TYPE_TO_OPX.auxiliary;

  const x0 = formatNumber(start.x);
  const y0 = formatNumber(start.y);
  const x1 = formatNumber(end.x);
  const y1 = formatNumber(end.y);

  return (
    `    <void index="${index}">\n` +
    '     <object class="oripa.OriLineProxy">\n' +
    '      <void property="type">\n' +
    `       <int>${typeCode}</int>\n` +
    "      </void>\n" +
    '      <void property="x0">\n' +
    `       <double>${x0}</double>\n` +
    "      </void>\n" +
    '      <void property="x1">\n' +
    `       <double>${x1}</double>\n` +
    "      </void>\n" +
    '      <void property="y0">\n' +
    `       <double>${y0}</double>\n` +
    "      </void>\n" +
    '      <void property="y1">\n' +
    `       <double>${y1}</double>\n` +
    "      </void>\n" +
    "     </object>\n" +
    "    </void>\n"
  );
}

function readNumericProperty(body, property) {
  const pattern = new RegExp(
    `<void\\s+property=\\"${property}\\">[\\s\\S]*?<([a-z]+)>\\s*([-+0-9.eE]+)\\s*<\\/\\1>[\\s\\S]*?<\\/void>`,
    "i",
  );

  const match = body.match(pattern);
  if (!match) {
    return null;
  }

  const value = Number(match[2]);
  return Number.isFinite(value) ? value : null;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const rounded = Math.abs(value) < 1e-9 ? 0 : value;
  const formatted = Number(rounded.toFixed(10));
  return stripTrailingZeros(formatted);
}

function stripTrailingZeros(number) {
  const text = String(number);
  if (!text.includes(".")) {
    return text;
  }

  return text.replace(/\.0+$/, "").replace(/(\.[0-9]*?)0+$/, "$1");
}
