export function createHistoryTimeline() {
  let listElement = null;

  function mount(element) {
    listElement = element;
    render([]);
  }

  function render(doc) {
    if (!listElement) return;
    const history = Array.isArray(doc?.history) ? doc.history : [];

    if (history.length === 0) {
      listElement.replaceChildren(createPlaceholderItem("Sin acciones registradas"));
      return;
    }

    listElement.replaceChildren(
      ...history.map((entry) => {
        const item = document.createElement("li");
        item.textContent = entry.label;
        item.dataset.historyId = entry.id;
        return item;
      }),
    );
  }

  function createPlaceholderItem(message) {
    const item = document.createElement("li");
    item.textContent = message;
    item.classList.add("placeholder");
    return item;
  }

  return {
    mount,
    render,
  };
}
