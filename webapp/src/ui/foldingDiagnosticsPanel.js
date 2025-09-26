const RAD_TO_DEG = 180 / Math.PI;

function formatKawasakiStatus(kawasaki) {
  if (!kawasaki?.applicable) {
    return "Kawasaki: no aplica (grado impar).";
  }

  const deviation = Number.isFinite(kawasaki.deviation)
    ? `${(kawasaki.deviation * RAD_TO_DEG).toFixed(2)}°`
    : "–";

  if (kawasaki.satisfied) {
    return `Kawasaki: OK (Δ ${deviation}).`;
  }

  return `Kawasaki: incumplido (Δ ${deviation}).`;
}

function formatMaekawaStatus(maekawa) {
  if (!maekawa?.applicable) {
    return "Maekawa: no aplica (grado impar).";
  }

  const deviation = Number.isFinite(maekawa.deviation) ? maekawa.deviation.toFixed(2) : "–";

  const counts = `M=${maekawa.mountainCount ?? 0}, V=${maekawa.valleyCount ?? 0}`;

  if (maekawa.satisfied) {
    return `Maekawa: OK (${counts}, Δ ${deviation}).`;
  }

  return `Maekawa: incumplido (${counts}, Δ ${deviation}).`;
}

function isIssue(report) {
  const kawasakiIssue = Boolean(report?.kawasaki?.applicable && !report.kawasaki.satisfied);
  const maekawaIssue = Boolean(report?.maekawa?.applicable && !report.maekawa.satisfied);
  return kawasakiIssue || maekawaIssue;
}

export function createFoldingDiagnosticsPanel({ documentStore }) {
  if (!documentStore) {
    throw new Error("documentStore is required to create the folding diagnostics panel");
  }

  let rootElement = null;
  let summaryElement = null;
  let listElement = null;

  function mount(element) {
    rootElement = element;
    rootElement.classList.add("folding-diagnostics");
    rootElement.replaceChildren();

    summaryElement = document.createElement("p");
    summaryElement.className = "folding-diagnostics__summary";
    rootElement.appendChild(summaryElement);

    listElement = document.createElement("ul");
    listElement.className = "folding-diagnostics__list";
    rootElement.appendChild(listElement);

    render();
  }

  function render() {
    if (!rootElement || !summaryElement || !listElement) {
      return;
    }

    const report = documentStore.getLocalFlatFoldabilityReport();
    const applicable = report.filter(
      (entry) => entry.kawasaki?.applicable || entry.maekawa?.applicable,
    );
    const issues = applicable.filter(isIssue);

    if (applicable.length === 0) {
      summaryElement.textContent = "Sin vértices con teoremas aplicables.";
    } else if (issues.length === 0) {
      summaryElement.textContent = `Todos los ${applicable.length} vértices aplicables cumplen Kawasaki y Maekawa.`;
    } else {
      summaryElement.textContent = `${issues.length} de ${applicable.length} vértices presentan desviaciones.`;
    }

    listElement.replaceChildren();

    if (issues.length === 0) {
      const item = document.createElement("li");
      item.className = "folding-diagnostics__empty";
      item.textContent = "No se detectaron desviaciones locales.";
      listElement.appendChild(item);
      return;
    }

    issues.forEach((entry) => {
      const item = document.createElement("li");
      item.className = "folding-diagnostics__issue";
      item.dataset.vertexId = entry.vertexId ?? "";

      const header = document.createElement("h3");
      header.className = "folding-diagnostics__vertex";
      const idLabel = entry.vertexId ? `Vértice ${entry.vertexId}` : "Vértice";
      header.textContent = `${idLabel} · grado ${entry.degree}`;
      item.appendChild(header);

      const kawasaki = document.createElement("p");
      kawasaki.className = "folding-diagnostics__detail";
      kawasaki.textContent = formatKawasakiStatus(entry.kawasaki);
      item.appendChild(kawasaki);

      const maekawa = document.createElement("p");
      maekawa.className = "folding-diagnostics__detail";
      maekawa.textContent = formatMaekawaStatus(entry.maekawa);
      item.appendChild(maekawa);

      listElement.appendChild(item);
    });
  }

  return {
    mount,
    render,
  };
}
