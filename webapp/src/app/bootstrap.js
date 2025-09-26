import { createApplication } from "./createApplication.js";
import { createPhaseIndicator } from "./phaseIndicator.js";

const PHASE_NAME = "Phase 3 · Motor de plegado";

document.addEventListener("DOMContentLoaded", () => {
  const app = createApplication({
    canvas: document.getElementById("cp-canvas"),
    toolList: document.getElementById("tool-list"),
    historyList: document.getElementById("history-list"),
    selectionPanel: document.getElementById("selection-panel"),
    diagnosticsPanel: document.getElementById("folding-diagnostics"),
    persistencePanel: document.getElementById("persistence-panel"),
    clipboardPanel: document.getElementById("clipboard-panel"),
    documentTabs: document.getElementById("document-tabs"),
  });

  const updatePhaseLabel = createPhaseIndicator({
    element: document.getElementById("app-phase-indicator"),
  });

  updatePhaseLabel(PHASE_NAME);

  app.initialize();
});
