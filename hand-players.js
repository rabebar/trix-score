(function exposeHandPlayers(root) {
  function normalizeCount(value) {
    const count = Number(value);
    return [2, 3, 4].includes(count) ? count : 4;
  }

  function active(players, count) {
    return players.slice(0, normalizeCount(count));
  }

  function canUsePartnership(count) {
    return normalizeCount(count) === 4;
  }

  function scoreCount(count, mode) {
    return mode === "partnership" && canUsePartnership(count)
      ? 2
      : normalizeCount(count);
  }

  const api = { normalizeCount, active, canUsePartnership, scoreCount };
  root.HandPlayers = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
