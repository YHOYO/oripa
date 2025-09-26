const EDGE_TYPE_OPTIONS = [
  { value: "mountain", label: "Montaña" },
  { value: "valley", label: "Valle" },
  { value: "border", label: "Borde" },
  { value: "auxiliary", label: "Auxiliar" },
];

export function createSelectionInspector({ documentStore }) {
  if (!documentStore) {
    throw new Error("documentStore is required to create the selection inspector");
  }

  let rootElement = null;
  const inputs = new Map();
  let infoElement = null;

  function mount(element) {
    rootElement = element;
    rootElement.classList.add("selection-inspector");
    rootElement.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = "Selección";
    title.id = "selection-panel-title";
    rootElement.appendChild(title);

    infoElement = document.createElement("p");
    infoElement.className = "selection-summary";
    rootElement.appendChild(infoElement);

    const fieldset = document.createElement("fieldset");
    fieldset.className = "selection-types";
    fieldset.setAttribute("aria-labelledby", "selection-panel-title");

    const legend = document.createElement("legend");
    legend.textContent = "Tipo de pliegue";
    fieldset.appendChild(legend);

    EDGE_TYPE_OPTIONS.forEach(({ value, label }) => {
      const optionId = `selection-type-${value}`;

      const wrapper = document.createElement("label");
      wrapper.className = "selection-type-option";
      wrapper.setAttribute("for", optionId);

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "selection-type";
      input.id = optionId;
      input.value = value;
      input.disabled = true;
      input.addEventListener("change", () => {
        if (!input.checked) {
          return;
        }
        documentStore.setSelectedEdgesType(value);
      });

      const text = document.createElement("span");
      text.textContent = label;

      wrapper.append(input, text);
      fieldset.appendChild(wrapper);
      inputs.set(value, input);
    });

    rootElement.appendChild(fieldset);
    render(documentStore.getDocument());
  }

  function render(doc) {
    if (!rootElement || !infoElement) {
      return;
    }

    const selectedIds = doc?.selection?.edges ?? [];
    const total = selectedIds.length;

    if (total === 0) {
      infoElement.textContent = "Sin segmentos seleccionados";
      inputs.forEach((input) => {
        input.checked = false;
        input.disabled = true;
      });
      return;
    }

    infoElement.textContent = `${total} segmento${total === 1 ? "" : "s"} seleccionados`;

    const edgesById = new Map((doc?.edges ?? []).map((edge) => [edge.id, edge]));
    let currentType = null;
    for (const edgeId of selectedIds) {
      const edge = edgesById.get(edgeId);
      if (!edge) {
        continue;
      }
      const type = edge.type ?? "auxiliary";
      if (currentType === null) {
        currentType = type;
      } else if (currentType !== type) {
        currentType = "mixed";
        break;
      }
    }

    inputs.forEach((input, type) => {
      input.disabled = false;
      if (currentType === "mixed") {
        input.checked = false;
        input.indeterminate = false;
        return;
      }

      input.indeterminate = false;
      input.checked = type === currentType;
    });

    if (currentType === "mixed") {
      infoElement.textContent += " (tipos mezclados)";
    }
  }

  return {
    mount,
    render,
  };
}
