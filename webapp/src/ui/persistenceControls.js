function isReadableFile(file) {
  const FileCtor = globalThis?.File;
  return FileCtor && file instanceof FileCtor && typeof file.text === "function";
}

function getFormatFromFileName(name) {
  if (typeof name !== "string") {
    return "opx";
  }

  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!match) {
    return "opx";
  }

  const extension = match[1];
  if (extension === "cp") {
    return "cp";
  }

  return "opx";
}

export function createPersistenceControls({ documentStore }) {
  if (
    !documentStore ||
    typeof documentStore.importFromOpx !== "function" ||
    typeof documentStore.exportToOpx !== "function" ||
    typeof documentStore.importFromCp !== "function" ||
    typeof documentStore.exportToCp !== "function" ||
    typeof documentStore.exportToFold !== "function"
  ) {
    throw new Error(
      "documentStore debe exponer importFromOpx, importFromCp, exportToOpx, exportToCp y exportToFold",
    );
  }

  let statusElement = null;

  function setStatus(message, state = "idle") {
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.dataset.state = state;
  }

  async function handleImportChange(event) {
    const input = event.currentTarget;
    const [file] = input.files ?? [];

    if (!isReadableFile(file)) {
      input.value = "";
      return;
    }

    const format = getFormatFromFileName(file.name);
    setStatus(`Importando ${file.name}…`, "loading");

    try {
      const contents = await file.text();
      if (format === "cp") {
        documentStore.importFromCp(contents);
      } else {
        documentStore.importFromOpx(contents);
      }
      setStatus(`Se importó "${file.name}" correctamente (.${format}).`, "success");
    } catch {
      setStatus(`Error al importar el archivo .${format}.`, "error");
    } finally {
      input.value = "";
    }
  }

  function revokeUrlLater(url) {
    const URLCtor = globalThis?.URL;
    if (!URLCtor) {
      return;
    }

    window.setTimeout(() => {
      URLCtor.revokeObjectURL(url);
    }, 1000);
  }

  function handleExportClick(format) {
    const BlobCtor = globalThis?.Blob;
    const URLCtor = globalThis?.URL;

    if (!BlobCtor || !URLCtor) {
      setStatus(`El navegador no soporta exportar archivos .${format}.`, "error");
      return;
    }

    try {
      const contents = selectExporter(format)();
      const mimeType = getMimeType(format);
      const blob = new BlobCtor([contents], { type: mimeType });
      const url = URLCtor.createObjectURL(blob);

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      const anchor = document.createElement("a");
      anchor.style.display = "none";
      anchor.href = url;
      anchor.download = `oripa-pattern-${timestamp}.${format}`;
      statusElement?.parentElement?.appendChild(anchor);
      anchor.click();
      anchor.remove();
      revokeUrlLater(url);
      setStatus(`Patrón exportado como .${format}.`, "success");
    } catch {
      setStatus(`Error al exportar el patrón actual (.${format}).`, "error");
    }
  }

  function selectExporter(format) {
    if (format === "cp") {
      return () => documentStore.exportToCp();
    }
    if (format === "fold") {
      return () => documentStore.exportToFold();
    }
    return () => documentStore.exportToOpx();
  }

  function getMimeType(format) {
    if (format === "cp") {
      return "text/plain";
    }
    if (format === "fold") {
      return "application/json";
    }
    return "application/xml";
  }

  function createExportButton(label, format) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "persistence-export";
    button.textContent = label;
    button.addEventListener("click", () => handleExportClick(format));
    return button;
  }

  function mount(container) {
    if (!container) {
      throw new Error("Se requiere un contenedor para montar los controles de persistencia");
    }

    const wrapper = document.createElement("div");
    wrapper.className = "persistence-controls";

    const importLabel = document.createElement("label");
    importLabel.className = "persistence-import";
    importLabel.textContent = "Importar .opx/.cp";

    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = ".opx,.cp,.xml,application/xml,text/xml";
    importInput.addEventListener("change", handleImportChange);
    importLabel.appendChild(importInput);

    const actions = document.createElement("div");
    actions.className = "persistence-actions";

    const exportOpxButton = createExportButton("Exportar .opx", "opx");
    const exportCpButton = createExportButton("Exportar .cp", "cp");
    const exportFoldButton = createExportButton("Exportar .fold", "fold");

    actions.append(exportOpxButton, exportCpButton, exportFoldButton);

    statusElement = document.createElement("p");
    statusElement.className = "persistence-status";
    statusElement.dataset.state = "idle";
    statusElement.setAttribute("role", "status");
    statusElement.setAttribute("aria-live", "polite");
    statusElement.textContent =
      "Selecciona un archivo .opx/.cp para importar o exporta el patrón actual (.opx/.cp/.fold).";

    wrapper.append(importLabel, actions, statusElement);

    container.replaceChildren(wrapper);
  }

  return {
    mount,
  };
}
