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

export function createPersistenceControls({ documentStore, canvas }) {
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
  const canvasElement = canvas ?? null;

  function createTimestampedFileName(extension) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return `oripa-pattern-${timestamp}.${extension}`;
  }

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

  function downloadBlob(blob, format) {
    const BlobCtor = globalThis?.Blob;
    const URLCtor = globalThis?.URL;

    if (!BlobCtor || !URLCtor) {
      throw new Error("Blob o URL no disponibles en este navegador");
    }

    const url = URLCtor.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.style.display = "none";
    anchor.href = url;
    anchor.download = createTimestampedFileName(format);
    statusElement?.parentElement?.appendChild(anchor);
    anchor.click();
    anchor.remove();
    revokeUrlLater(url);
  }

  function handleFileExportClick(format) {
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
      downloadBlob(blob, format);
      setStatus(`Patrón exportado como .${format}.`, "success");
    } catch {
      setStatus(`Error al exportar el patrón actual (.${format}).`, "error");
    }
  }

  function canvasToBlob(targetCanvas, mimeType) {
    return new Promise((resolve, reject) => {
      if (!targetCanvas) {
        reject(new Error("Canvas no disponible para exportación"));
        return;
      }

      if (typeof targetCanvas.toBlob === "function") {
        targetCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("El canvas devolvió un blob vacío"));
          }
        }, mimeType);
        return;
      }

      if (typeof targetCanvas.toDataURL === "function") {
        try {
          const dataUrl = targetCanvas.toDataURL(mimeType);
          const fetchFn = globalThis?.fetch;
          if (typeof fetchFn === "function") {
            fetchFn(dataUrl)
              .then((response) => response.blob())
              .then(resolve)
              .catch(() => reject(new Error("No fue posible convertir el data URL a blob")));
            return;
          }

          const base64 = dataUrl.split(",")[1];
          if (!base64) {
            reject(new Error("El data URL generado es inválido"));
            return;
          }

          const atobFn = globalThis?.atob;
          if (typeof atobFn !== "function") {
            reject(new Error("El entorno no permite decodificar el data URL"));
            return;
          }

          const binary = atobFn(base64);
          const length = binary.length;
          const bytes = new Uint8Array(length);
          for (let index = 0; index < length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
          }
          const BlobCtor = globalThis?.Blob;
          if (!BlobCtor) {
            reject(new Error("El entorno no soporta blobs"));
            return;
          }
          resolve(new BlobCtor([bytes], { type: mimeType }));
        } catch (error) {
          reject(error);
        }
        return;
      }

      reject(new Error("El canvas no soporta exportación a blob"));
    });
  }

  async function handleImageExportClick(format) {
    try {
      const mimeType = getMimeType(format);
      if (!mimeType) {
        setStatus(`Formato de imagen .${format} no soportado.`, "error");
        return;
      }

      const blob = await canvasToBlob(canvasElement, mimeType);
      downloadBlob(blob, format);
      setStatus(`Imagen exportada como .${format}.`, "success");
    } catch (error) {
      setStatus(error?.message ?? `Error al exportar la imagen del patrón (.${format}).`, "error");
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
    if (format === "png") {
      return "image/png";
    }
    if (format === "jpg" || format === "jpeg") {
      return "image/jpeg";
    }
    return "application/xml";
  }

  function createExportButton(label, format, handler = handleFileExportClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "persistence-export";
    button.textContent = label;
    button.addEventListener("click", () => handler(format));
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
    const exportPngButton = createExportButton("Exportar PNG", "png", handleImageExportClick);
    const exportJpgButton = createExportButton("Exportar JPG", "jpg", handleImageExportClick);

    actions.append(
      exportOpxButton,
      exportCpButton,
      exportFoldButton,
      exportPngButton,
      exportJpgButton,
    );

    statusElement = document.createElement("p");
    statusElement.className = "persistence-status";
    statusElement.dataset.state = "idle";
    statusElement.setAttribute("role", "status");
    statusElement.setAttribute("aria-live", "polite");
    statusElement.textContent =
      "Importa archivos .opx/.cp o exporta el patrón actual (.opx/.cp/.fold/PNG/JPG).";

    wrapper.append(importLabel, actions, statusElement);

    container.replaceChildren(wrapper);
  }

  return {
    mount,
  };
}
