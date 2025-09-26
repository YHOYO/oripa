import { createDocumentStore } from "../state/documentStore.js";
import { createToolRegistry } from "../ui/toolRegistry.js";
import { createHistoryTimeline } from "../ui/historyTimeline.js";
import { createCanvasPresenter } from "../rendering/canvasPresenter.js";
import { createToolController } from "../tools/toolController.js";
import { createSelectTool } from "../tools/selectTool.js";
import { createSegmentTool } from "../tools/segmentTool.js";
import { createMoveTool } from "../tools/moveTool.js";
import { createScaleTool } from "../tools/scaleTool.js";
import { createPerpendicularTool } from "../tools/perpendicularTool.js";
import { createBisectorTool } from "../tools/bisectorTool.js";
import { createSymmetryTool } from "../tools/symmetryTool.js";
import { createSelectionInspector } from "../ui/selectionInspector.js";

export function createApplication({ canvas, toolList, historyList, selectionPanel }) {
  const documentStore = createDocumentStore();
  const historyTimeline = createHistoryTimeline();
  const canvasPresenter = createCanvasPresenter({ canvas, documentStore });
  const toolController = createToolController({ canvas, documentStore });
  const selectionInspector = createSelectionInspector({ documentStore });

  const toolDefinitions = [
    createSelectTool({ documentStore }),
    createMoveTool({ documentStore }),
    createScaleTool({ documentStore }),
    createSymmetryTool({ documentStore }),
    createBisectorTool({ documentStore }),
    createPerpendicularTool({ documentStore }),
    createSegmentTool({ documentStore }),
  ];

  toolController.registerTools(toolDefinitions);

  const toolRegistry = createToolRegistry({
    tools: toolDefinitions.map(({ id, label, shortcut }) => ({
      id,
      label,
      shortcut,
    })),
    onSelect: (toolId) => {
      toolController.activateTool(toolId);
    },
  });

  toolController.onActiveToolChange((toolId) => {
    toolRegistry.setActiveTool(toolId);
  });

  function initialize() {
    toolRegistry.mount(toolList);
    historyTimeline.mount(historyList);
    selectionInspector.mount(selectionPanel);

    documentStore.subscribe(canvasPresenter.render);
    documentStore.subscribe(historyTimeline.render);
    documentStore.subscribe(selectionInspector.render);

    documentStore.bootstrapEmptyDocument();
    const initialToolId = toolDefinitions[0]?.id;
    if (initialToolId) {
      toolController.activateTool(initialToolId);
    }
  }

  return {
    initialize,
  };
}
