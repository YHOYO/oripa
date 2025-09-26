function isReadableFile(file) {
  const FileCtor = globalThis?.File;
  return FileCtor && file instanceof FileCtor && typeof file.text === "function";
}

export function createPersistenceControls({ documentStore }) {
  if (
    !documentStore ||
    typeof documentStore.importFromOpx !== "function" ||
    typeof documentStore.exportToOpx !== "function"
  ) {
    throw new Error("documentStore debe exponer importFromOpx y exportToOpx");
  }

  let statusElement = null;
  let downloadLink = null;

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

    setStatus(`Importando ${file.name}…`, "loading");

    try {
      const contents = await file.text();
      documentStore.importFromOpx(contents);
      setStatus(`Se importó "${file.name}" correctamente.`, "success");
    } catch {
      setStatus("Error al importar el archivo .opx.", "error");
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

  function handleExportClick() {
    const BlobCtor = globalThis?.Blob;
    const URLCtor = globalThis?.URL;

    if (!BlobCtor || !URLCtor) {
      setStatus("El navegador no soporta exportar archivos .opx.", "error");
      return;
    }

    try {
      const xmlContents = documentStore.exportToOpx();
      const blob = new BlobCtor([xmlContents], { type: "application/xml" });
      const url = URLCtor.createObjectURL(blob);

      if (!downloadLink) {
        downloadLink = document.createElement("a");
        downloadLink.style.display = "none";
        downloadLink.setAttribute("download", "pattern.opx");
        statusElement?.parentElement?.appendChild(downloadLink);
      }

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      downloadLink.href = url;
      downloadLink.download = `oripa-pattern-${timestamp}.opx`;
      downloadLink.click();
      revokeUrlLater(url);
      setStatus("Patrón exportado como .opx.", "success");
    } catch {
      setStatus("Error al exportar el patrón actual.", "error");
    }
  }

  function mount(container) {
    if (!container) {
      throw new Error("Se requiere un contenedor para montar los controles de persistencia");
    }

    const wrapper = document.createElement("div");
    wrapper.className = "persistence-controls";

    const importLabel = document.createElement("label");
    importLabel.className = "persistence-import";
    importLabel.textContent = "Importar .opx";

    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = ".opx,.xml,application/xml,text/xml";
    importInput.addEventListener("change", handleImportChange);
    importLabel.appendChild(importInput);

    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.className = "persistence-export";
    exportButton.textContent = "Exportar .opx";
    exportButton.addEventListener("click", handleExportClick);

    statusElement = document.createElement("p");
    statusElement.className = "persistence-status";
    statusElement.dataset.state = "idle";
    statusElement.setAttribute("role", "status");
    statusElement.setAttribute("aria-live", "polite");
    statusElement.textContent =
      "Selecciona un archivo .opx para importar o exporta el patrón actual.";

    wrapper.append(importLabel, exportButton, statusElement);

    container.replaceChildren(wrapper);
  }

  return {
    mount,
  };
}
