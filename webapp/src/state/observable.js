export function createObservable() {
  const listeners = new Set();

  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error("listener must be a function");
    }

    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function emit(value) {
    listeners.forEach((listener) => listener(value));
  }

  return {
    subscribe,
    emit,
  };
}
