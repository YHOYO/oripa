export function createDocumentTabs({ documentStore }) {
  if (
    !documentStore ||
    typeof documentStore.subscribeToDocuments !== "function" ||
    typeof documentStore.createNewDocument !== "function" ||
    typeof documentStore.setActiveDocument !== "function"
  ) {
    throw new Error(
      "documentStore must expose subscribeToDocuments, createNewDocument and setActiveDocument",
    );
  }

  let container = null;
  let listElement = null;
  let createButton = null;
  let renameForm = null;
  let renameInput = null;
  let renameButton = null;
  let summaryElement = null;
  let unsubscribe = null;
  let projectState = { documents: [], activeDocumentId: null };
  const renameInputId = `document-tabs-rename-${Math.random().toString(36).slice(2)}`;

  function mount(element) {
    if (!element) {
      throw new Error("A container element is required to mount the document tabs");
    }

    container = element;
    container.classList.add("document-tabs");

    const header = document.createElement("div");
    header.className = "document-tabs__header";

    listElement = document.createElement("ul");
    listElement.className = "document-tabs__list";
    listElement.setAttribute("role", "tablist");
    header.appendChild(listElement);

    createButton = document.createElement("button");
    createButton.type = "button";
    createButton.className = "document-tabs__new";
    createButton.textContent = "Nuevo documento";
    createButton.addEventListener("click", handleCreateDocument);
    header.appendChild(createButton);

    renameForm = document.createElement("form");
    renameForm.className = "document-tabs__rename";
    renameForm.addEventListener("submit", handleRenameSubmit);

    const label = document.createElement("label");
    label.className = "document-tabs__rename-label";
    label.htmlFor = renameInputId;
    label.textContent = "Nombre del documento";

    renameInput = document.createElement("input");
    renameInput.type = "text";
    renameInput.id = renameInputId;
    renameInput.placeholder = "Nuevo nombre";
    renameInput.autocomplete = "off";
    renameInput.spellcheck = false;

    renameButton = document.createElement("button");
    renameButton.type = "submit";
    renameButton.className = "document-tabs__rename-action";
    renameButton.textContent = "Renombrar";

    renameForm.append(label, renameInput, renameButton);

    summaryElement = document.createElement("p");
    summaryElement.className = "document-tabs__summary";

    container.replaceChildren(header, renameForm, summaryElement);

    unsubscribe = documentStore.subscribeToDocuments(handleProjectUpdate);

    if (typeof documentStore.getProjectState === "function") {
      handleProjectUpdate(documentStore.getProjectState());
    } else {
      render();
    }
  }

  function handleProjectUpdate(snapshot) {
    if (!snapshot) {
      projectState = { documents: [], activeDocumentId: null };
    } else {
      projectState = {
        documents: Array.isArray(snapshot.documents) ? snapshot.documents : [],
        activeDocumentId: snapshot.activeDocumentId ?? null,
      };
    }

    render();
  }

  function render() {
    if (!container || !listElement) {
      return;
    }

    const documents = projectState.documents;
    const activeId = projectState.activeDocumentId;
    const canClose = documents.length > 1;

    if (documents.length === 0) {
      const placeholder = document.createElement("li");
      placeholder.className = "document-tabs__placeholder";
      placeholder.textContent = "Sin documentos activos";
      listElement.replaceChildren(placeholder);
    } else {
      const items = documents.map((doc) => createTabItem(doc, doc.id === activeId, canClose));
      listElement.replaceChildren(...items);
    }

    if (renameInput && renameButton) {
      if (!activeId) {
        renameInput.value = "";
        renameInput.disabled = true;
        renameButton.disabled = true;
      } else {
        const activeDoc = documents.find((doc) => doc.id === activeId);
        renameInput.value = activeDoc?.name ?? "";
        renameInput.disabled = false;
        renameButton.disabled = false;
      }
    }

    if (summaryElement) {
      if (documents.length === 0) {
        summaryElement.textContent = "Crea un documento para comenzar a trabajar.";
      } else {
        const totalEdges = documents.reduce((sum, doc) => sum + (doc.edgeCount ?? 0), 0);
        const docLabel = documents.length === 1 ? "documento" : "documentos";
        const edgeLabel = totalEdges === 1 ? "segmento" : "segmentos";
        summaryElement.textContent = `${documents.length} ${docLabel} · ${totalEdges} ${edgeLabel}`;
      }
    }
  }

  function createTabItem(document, isActive, allowClose) {
    const item = document.createElement("li");
    item.className = "document-tabs__item";
    if (isActive) {
      item.classList.add("is-active");
    }

    const tabButton = document.createElement("button");
    tabButton.type = "button";
    tabButton.className = "document-tabs__tab";
    tabButton.textContent = document.name || "Sin título";
    tabButton.dataset.documentId = document.id;
    tabButton.setAttribute("role", "tab");
    tabButton.setAttribute("aria-selected", isActive ? "true" : "false");
    tabButton.addEventListener("click", () => {
      documentStore.setActiveDocument(document.id);
    });

    item.appendChild(tabButton);

    if (allowClose) {
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "document-tabs__close";
      closeButton.setAttribute("aria-label", `Cerrar ${document.name}`);
      closeButton.innerHTML = "&times;";
      closeButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        documentStore.closeDocument(document.id);
      });
      item.appendChild(closeButton);
    }

    return item;
  }

  function handleCreateDocument() {
    documentStore.createNewDocument();
  }

  function handleRenameSubmit(event) {
    event.preventDefault();
    if (!renameInput || !projectState.activeDocumentId) {
      return;
    }

    const value = renameInput.value.trim();
    if (value.length === 0) {
      return;
    }

    documentStore.renameDocument(projectState.activeDocumentId, value);
  }

  function destroy() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (createButton) {
      createButton.removeEventListener("click", handleCreateDocument);
    }
    if (renameForm) {
      renameForm.removeEventListener("submit", handleRenameSubmit);
    }
    container = null;
    listElement = null;
    createButton = null;
    renameForm = null;
    renameInput = null;
    renameButton = null;
    summaryElement = null;
  }

  return {
    mount,
    destroy,
  };
}
