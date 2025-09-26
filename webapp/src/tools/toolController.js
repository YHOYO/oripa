const DEFAULT_CURSOR = "default";

export function createToolController({ canvas, documentStore }) {
  if (!canvas) {
    throw new Error("canvas is required to initialize the tool controller");
  }

  const tools = new Map();
  const shortcutIndex = new Map();
  const listeners = new Set();

  let activeToolId = null;
  let isPointerDown = false;
  let activePointerId = null;

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerCancel);
  canvas.addEventListener("lostpointercapture", handlePointerCancel);
  document.addEventListener("keydown", handleKeydown);

  function registerTools(definitions) {
    definitions.forEach(registerTool);
  }

  function registerTool(tool) {
    if (!tool?.id) {
      throw new Error("tool definitions must include an id");
    }

    tools.set(tool.id, tool);

    if (tool.shortcut) {
      shortcutIndex.set(tool.shortcut.toUpperCase(), tool.id);
    }
  }

  function activateTool(toolId) {
    if (!tools.has(toolId) || activeToolId === toolId) {
      return;
    }

    const previousTool = tools.get(activeToolId);
    previousTool?.onCancel?.();
    previousTool?.deactivate?.();

    if (isPointerDown && activePointerId !== null) {
      if (canvas.hasPointerCapture?.(activePointerId)) {
        canvas.releasePointerCapture(activePointerId);
      }
    }

    isPointerDown = false;
    activePointerId = null;

    activeToolId = toolId;

    const currentTool = tools.get(activeToolId);
    canvas.style.cursor = currentTool?.cursor ?? DEFAULT_CURSOR;
    currentTool?.activate?.();

    listeners.forEach((listener) => listener(activeToolId));
  }

  function onActiveToolChange(listener) {
    if (typeof listener === "function") {
      listeners.add(listener);
    }

    return () => {
      listeners.delete(listener);
    };
  }

  function buildToolEvent(event) {
    const point = translatePoint(event);
    return {
      point,
      originalEvent: event,
      isPointerDown,
    };
  }

  function translatePoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width === 0 ? 1 : canvas.width / rect.width;
    const scaleY = rect.height === 0 ? 1 : canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function getActiveTool() {
    return tools.get(activeToolId) ?? null;
  }

  function handlePointerDown(event) {
    const tool = getActiveTool();
    if (!tool) {
      return;
    }

    isPointerDown = true;
    event.preventDefault();

    if (canvas.setPointerCapture) {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Ignore pointer capture failures (e.g., unsupported platforms).
      }
    }

    activePointerId = event.pointerId;
    tool.onPointerDown?.({ ...buildToolEvent(event), documentStore });
  }

  function handlePointerMove(event) {
    const tool = getActiveTool();
    if (!tool) {
      return;
    }

    tool.onPointerMove?.({ ...buildToolEvent(event), documentStore });
  }

  function handlePointerUp(event) {
    const tool = getActiveTool();
    if (!tool) {
      return;
    }

    event.preventDefault();

    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    tool.onPointerUp?.({ ...buildToolEvent(event), documentStore });
    isPointerDown = false;
    if (activePointerId === event.pointerId) {
      activePointerId = null;
    }
  }

  function handlePointerCancel(event) {
    const tool = getActiveTool();
    if (!tool) {
      return;
    }

    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    tool.onCancel?.({ ...buildToolEvent(event), documentStore });
    isPointerDown = false;
    if (activePointerId === event.pointerId) {
      activePointerId = null;
    }
  }

  function handleKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    const key = event.key?.toUpperCase?.();
    if (!key) {
      return;
    }

    const toolId = shortcutIndex.get(key);
    if (!toolId) {
      return;
    }

    activateTool(toolId);
    event.preventDefault();
  }

  return {
    registerTool,
    registerTools,
    activateTool,
    onActiveToolChange,
  };
}
