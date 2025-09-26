export function createPhaseIndicator({ element }) {
  if (!element) {
    throw new Error("Phase indicator element is required");
  }

  return function updatePhaseLabel(label) {
    element.textContent = label;
  };
}
