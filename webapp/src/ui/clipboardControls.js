const STATUS_EMPTY = "Portapapeles vacío";

export function createClipboardControls({ documentStore }) {
  if (!documentStore) {
    throw new Error("documentStore is required to create clipboard controls");
  }

  let rootElement = null;
  let statusElement = null;
  let copyButton = null;
  let cutButton = null;
  let pasteButton = null;

  function mount(element) {
    rootElement = element;
    rootElement.classList.add("clipboard-controls");
    rootElement.replaceChildren();

    const description = document.createElement("p");
    description.className = "clipboard-status";
    rootElement.appendChild(description);
    statusElement = description;

    const actions = document.createElement("div");
    actions.className = "clipboard-actions";

    copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "clipboard-action";
    copyButton.textContent = "Copiar selección";
    copyButton.title = "Copiar selección (Ctrl+C)";
    copyButton.addEventListener("click", () => {
      documentStore.copySelectedEdges();
    });

    cutButton = document.createElement("button");
    cutButton.type = "button";
    cutButton.className = "clipboard-action";
    cutButton.textContent = "Cortar selección";
    cutButton.title = "Cortar selección (Ctrl+X)";
    cutButton.addEventListener("click", () => {
      documentStore.cutSelectedEdges();
    });

    pasteButton = document.createElement("button");
    pasteButton.type = "button";
    pasteButton.className = "clipboard-action primary";
    pasteButton.textContent = "Pegar";
    pasteButton.title = "Pegar (Ctrl+V)";
    pasteButton.addEventListener("click", () => {
      documentStore.pasteClipboard();
    });

    actions.append(copyButton, cutButton, pasteButton);
    rootElement.appendChild(actions);

    render(documentStore.getDocument());
  }

  function render(doc) {
    if (!statusElement) {
      return;
    }

    const selectionCount = doc?.selection?.edges?.length ?? 0;
    const clipboard = documentStore.getClipboardSummary();
    const clipboardCount = clipboard?.count ?? 0;

    if (copyButton) {
      copyButton.disabled = selectionCount === 0;
    }
    if (cutButton) {
      cutButton.disabled = selectionCount === 0;
    }
    if (pasteButton) {
      pasteButton.disabled = clipboardCount === 0;
    }

    if (clipboardCount === 0) {
      statusElement.textContent = STATUS_EMPTY;
      return;
    }

    const segmentsLabel = `${clipboardCount} segmento${clipboardCount === 1 ? "" : "s"} en el portapapeles`;
    let timestampLabel = "";
    if (clipboard?.updatedAt) {
      const parsed = new Date(clipboard.updatedAt);
      if (!Number.isNaN(parsed.getTime())) {
        const formatted = parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        timestampLabel = ` · actualizado ${formatted}`;
      }
    }

    statusElement.textContent = segmentsLabel + timestampLabel;
  }

  return {
    mount,
    render,
  };
}
