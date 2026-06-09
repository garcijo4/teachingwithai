(function () {
  "use strict";

  const STORAGE_KEY = "teaching-with-ai-progress-v1";
  const listeners = new Set();

  function read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (error) {
      return {};
    }
  }

  function write(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    listeners.forEach((listener) => listener(state));
  }

  function isComplete(id) {
    return Boolean(read()[id]);
  }

  function setComplete(id, complete) {
    const state = read();
    if (complete) {
      state[id] = true;
      state._last = id;
    } else {
      delete state[id];
    }
    write(state);
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    listeners.forEach((listener) => listener({}));
  }

  function percent(ids) {
    if (!ids.length) return 0;
    const state = read();
    const complete = ids.filter((id) => state[id]).length;
    return Math.round((complete / ids.length) * 100);
  }

  function onChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  window.CourseProgress = { read, isComplete, setComplete, reset, percent, onChange };
})();
