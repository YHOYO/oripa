export function createToolRegistry({ tools = [], onSelect } = {}) {
  let listElement = null;
  let activeToolId = null;

  function mount(element) {
    listElement = element;
    listElement.classList.add("tool-list");
    render();
  }

  function render() {
    if (!listElement) return;

    const items = tools.length > 0 ? tools.map(createToolItem) : [createPlaceholderItem()];
    listElement.replaceChildren(...items);
  }

  function createToolItem(tool) {
    const item = document.createElement("li");
    item.dataset.toolId = tool.id;
    item.setAttribute("role", "button");
    item.tabIndex = 0;
    item.classList.toggle("active", tool.id === activeToolId);

    const label = document.createElement("span");
    label.textContent = tool.label;

    const shortcut = document.createElement("kbd");
    shortcut.textContent = tool.shortcut ?? "";

    item.append(label, shortcut);

    item.addEventListener("click", (event) => {
      event.preventDefault();
      selectTool(tool.id);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectTool(tool.id);
      }
    });

    return item;
  }

  function createPlaceholderItem() {
    const item = document.createElement("li");
    item.textContent = "Toolbox pendiente de implementación";
    item.classList.add("placeholder");
    return item;
  }

  function selectTool(toolId) {
    if (toolId === activeToolId) {
      return;
    }

    activeToolId = toolId;
    render();
    onSelect?.(toolId);
  }

  function setActiveTool(toolId) {
    if (toolId === activeToolId) {
      return;
    }

    activeToolId = toolId;
    if (listElement) {
      render();
    }
  }

  return {
    mount,
    render,
    setActiveTool,
  };
}
